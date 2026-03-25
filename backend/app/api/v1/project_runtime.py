import asyncio
import json
from pathlib import Path
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project_artifact import ProjectArtifact
from app.models.project_job import ProjectJob
from app.models.user import User
from app.schemas.project_runtime import (
    ArtifactUploadResponse,
    ProjectArtifactResponse,
    ProjectJobResponse,
    ProjectViewResponse,
    ViewRegenerateRequest,
)
from app.services.auth_service import get_current_active_user
from app.services.project_runtime_service import (
    VIEW_KEYS,
    build_view_response,
    create_project_job,
    ensure_project_access,
    guess_parser_type,
    run_artifact_job,
    run_view_regeneration_job,
    save_artifact_bytes,
    settings,
)

router = APIRouter()


@router.post("/{project_id}/artifacts", response_model=ArtifactUploadResponse)
async def upload_artifacts(
    project_id: int,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        project = ensure_project_access(db, project_id, current_user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")

    artifacts: List[ProjectArtifact] = []
    for upload in files:
        raw_bytes = await upload.read()
        if len(raw_bytes) > settings.MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=400, detail=f"{upload.filename} exceeds upload size limit")
        artifact = ProjectArtifact(
            project_id=project.id,
            uploaded_by=current_user.id,
            filename=upload.filename or "upload.bin",
            content_type=upload.content_type,
            file_ext=Path(upload.filename or "upload.bin").suffix.lower(),
            storage_path=save_artifact_bytes(project.id, upload.filename or "upload.bin", raw_bytes),
            size_bytes=len(raw_bytes),
            parser_type=guess_parser_type(upload.filename or ""),
            parse_status="pending",
            parse_summary_json={},
        )
        db.add(artifact)
        db.flush()
        artifacts.append(artifact)

    job = create_project_job(
        db,
        project_id=project.id,
        created_by=current_user.id,
        job_type="artifact_ingest",
        payload_json={"artifact_ids": [artifact.id for artifact in artifacts]},
    )
    db.commit()
    db.refresh(job)
    for artifact in artifacts:
        db.refresh(artifact)

    background_tasks.add_task(run_artifact_job, job.id)
    return {"job": job, "artifacts": artifacts}


@router.get("/{project_id}/artifacts", response_model=List[ProjectArtifactResponse])
async def list_artifacts(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        project = ensure_project_access(db, project_id, current_user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")
    return (
        db.query(ProjectArtifact)
        .filter(ProjectArtifact.project_id == project.id)
        .order_by(ProjectArtifact.created_at.desc(), ProjectArtifact.id.desc())
        .all()
    )


@router.get("/{project_id}/views/{view_key}", response_model=ProjectViewResponse)
async def get_project_view(
    project_id: int,
    view_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if view_key not in VIEW_KEYS:
        raise HTTPException(status_code=404, detail="Unsupported view")
    try:
        project = ensure_project_access(db, project_id, current_user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")
    return build_view_response(db, project, view_key)


@router.post("/{project_id}/views/regenerate", response_model=ProjectJobResponse)
async def regenerate_project_views(
    project_id: int,
    request: ViewRegenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        project = ensure_project_access(db, project_id, current_user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")

    view_keys = request.view_keys or VIEW_KEYS
    invalid = [key for key in view_keys if key not in VIEW_KEYS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unsupported views: {', '.join(invalid)}")

    job = create_project_job(
        db,
        project_id=project.id,
        created_by=current_user.id,
        job_type="view_regeneration",
        payload_json={"view_keys": view_keys},
    )
    db.commit()
    db.refresh(job)
    background_tasks.add_task(run_view_regeneration_job, job.id, view_keys)
    return job


@router.get("/{project_id}/jobs/{job_id}", response_model=ProjectJobResponse)
async def get_project_job(
    project_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        project = ensure_project_access(db, project_id, current_user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")

    job = (
        db.query(ProjectJob)
        .filter(ProjectJob.id == job_id, ProjectJob.project_id == project.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/{project_id}/jobs/{job_id}/events")
async def stream_project_job_events(
    project_id: int,
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        project = ensure_project_access(db, project_id, current_user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")

    job = (
        db.query(ProjectJob)
        .filter(ProjectJob.id == job_id, ProjectJob.project_id == project.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_stream():
        last_index = 0
        while True:
            db.expire_all()
            current_job = (
                db.query(ProjectJob)
                .filter(ProjectJob.id == job_id, ProjectJob.project_id == project.id)
                .first()
            )
            if current_job is None:
                yield "event: error\ndata: {\"message\":\"Job not found\"}\n\n"
                return

            events = list(current_job.events_json or [])
            while last_index < len(events):
                event = events[last_index]
                payload = json.dumps(event, ensure_ascii=False)
                yield f"event: message\ndata: {payload}\n\n"
                last_index += 1

            if current_job.status in {"completed", "failed"} and last_index >= len(events):
                done_payload = json.dumps(
                    {"status": current_job.status, "job_id": current_job.id},
                    ensure_ascii=False,
                )
                yield f"event: done\ndata: {done_payload}\n\n"
                return

            if await request.is_disconnected():
                return

            await asyncio.sleep(1)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
