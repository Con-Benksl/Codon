"""Designer 6-step 流程路由（Phase 2：接入真实 service 层）。"""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.design import Design
from app.models.designer_session import DesignerSession
from app.models.project import Project
from app.models.user import User
from app.schemas.designer import (
    AckResponse,
    ChassisCandidate,
    CopilotRequest,
    CopilotResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    DesignReportResponse,
    DesignerSessionState,
    EditPlanCandidate,
    EnvironmentPreset,
    EnvironmentVector,
    MissionPreset,
    ProteinCandidate,
    ReportExportResponse,
    RollbackRequest,
    SimulationResult,
    SimulationStep,
    SubmitChassisRequest,
    SubmitEditPlanRequest,
    SubmitEnvironmentRequest,
    SubmitMissionRequest,
    SubmitProteinRequest,
)
from app.services import (
    biotype_service,
    design_report_service,
    designer_copilot_service,
    edit_plan_service,
    protein_service,
    simulation_service,
)
from app.services.auth_service import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()


# ======================================================================
# 数据加载（presets / 查找 chassis & protein 详情）
# ======================================================================

_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def _load_json(filename: str) -> List[Dict[str, Any]]:
    path = _DATA_DIR / filename
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to load %s: %s", filename, exc)
    return []


_ENVIRONMENTS_RAW = _load_json("extreme_environments.json")
_MISSIONS_RAW = _load_json("missions.json")
_CHASSIS_RAW = _load_json("extremophile_chassis.json")
_PROTEINS_RAW = _load_json("function_proteins.json")

_CHASSIS_BY_ID: Dict[str, Dict[str, Any]] = {c.get("id", ""): c for c in _CHASSIS_RAW}
_PROTEIN_BY_ID: Dict[str, Dict[str, Any]] = {p.get("id", ""): p for p in _PROTEINS_RAW}


# ======================================================================
# Helpers
# ======================================================================

def _get_session(db: Session, sid: int, user: User) -> DesignerSession:
    session = (
        db.query(DesignerSession)
        .filter(DesignerSession.id == sid, DesignerSession.user_id == user.id)
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def _get_owned_project(db: Session, project_id: int, user: User) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == user.id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _get_owned_design(db: Session, project_id: int, design_id: int, user: User) -> Design:
    project = _get_owned_project(db, project_id, user)
    design = (
        db.query(Design)
        .filter(Design.id == design_id, Design.project_id == project.id)
        .first()
    )
    if design is None:
        raise HTTPException(status_code=404, detail="Design not found")
    return design


def _latest_design_for_project(db: Session, project_id: int) -> Optional[Design]:
    latest_at = func.coalesce(Design.updated_at, Design.created_at)
    return (
        db.query(Design)
        .filter(Design.project_id == project_id)
        .order_by(latest_at.desc(), Design.id.desc())
        .first()
    )


def _latest_session_for_design(db: Session, design_id: int, user: User) -> Optional[DesignerSession]:
    return (
        db.query(DesignerSession)
        .filter(DesignerSession.design_id == design_id, DesignerSession.user_id == user.id)
        .order_by(
            DesignerSession.updated_at.desc(),
            DesignerSession.created_at.desc(),
            DesignerSession.id.desc(),
        )
        .first()
    )


def _create_default_design(db: Session, project: Project) -> Design:
    name = f"{project.name} Design" if project.name else "Default Design"
    design = Design(project_id=project.id, name=name)
    db.add(design)
    db.flush()
    return design


def _create_session_for_design(
    db: Session,
    design: Design,
    user: User,
) -> DesignerSession:
    session = DesignerSession(
        user_id=user.id,
        project_id=design.project_id,
        design_id=design.id,
        current_step=1,
    )
    db.add(session)
    db.flush()
    return session


def _get_or_create_session_for_design(
    db: Session,
    design: Design,
    user: User,
) -> DesignerSession:
    session = _latest_session_for_design(db, design.id, user)
    if session is not None:
        return session
    return _create_session_for_design(db, design, user)


def _get_or_create_default_design_session(
    db: Session,
    project: Project,
    user: User,
) -> DesignerSession:
    design = _latest_design_for_project(db, project.id)
    if design is None:
        design = _create_default_design(db, project)
    return _get_or_create_session_for_design(db, design, user)


def _parse_candidate_list(raw: Any, schema: Any) -> List[Any]:
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return []
    if not isinstance(raw, list):
        return []
    parsed: List[Any] = []
    for item in raw:
        if not isinstance(item, dict):
            return []
        try:
            parsed.append(schema(**item))
        except Exception:
            return []
    return parsed


def _session_to_state(session: DesignerSession) -> DesignerSessionState:
    env = None
    if session.environment_json:
        try:
            env = EnvironmentVector(**session.environment_json)
        except Exception:
            env = None
    plan = None
    if session.edit_plan_json:
        try:
            plan = EditPlanCandidate(**session.edit_plan_json)
        except Exception:
            plan = None
    sim = None
    if session.simulation_result_json:
        try:
            sim = SimulationResult(**session.simulation_result_json)
        except Exception:
            sim = None
    return DesignerSessionState(
        id=session.id,
        project_id=session.project_id,
        design_id=session.design_id,
        project_name=getattr(session.project, "name", None),
        design_name=getattr(session.design, "name", None),
        current_step=session.current_step,
        environment=env,
        mission_id=session.mission_id,
        chassis_id=session.chassis_id,
        protein_id=session.protein_id,
        chassis_candidates=_parse_candidate_list(
            session.chassis_candidates_json,
            ChassisCandidate,
        ),
        protein_candidates=_parse_candidate_list(
            session.protein_candidates_json,
            ProteinCandidate,
        ),
        edit_plan_candidates=_parse_candidate_list(
            session.edit_plan_candidates_json,
            EditPlanCandidate,
        ),
        edit_plan=plan,
        simulation_result=sim,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


def _report_to_response(report: Any) -> DesignReportResponse:
    return DesignReportResponse(
        id=report.id,
        project_id=report.project_id,
        design_id=report.design_id,
        title=report.title,
        status=report.status,
        summary=report.summary,
        sections=report.sections_json or {},
        source_session_id=report.source_session_id,
        version=report.version,
        markdown=design_report_service.render_markdown(report),
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


def _report_export_to_response(export: Any) -> ReportExportResponse:
    return ReportExportResponse(
        id=export.id,
        report_id=export.report_id,
        project_id=export.project_id,
        design_id=export.design_id,
        format=export.format,
        status=export.status,
        filename=export.filename,
        file_path_or_url=export.file_path_or_url,
        content_snapshot=export.content_snapshot,
        report_version=export.report_version,
        created_at=export.created_at,
    )


# ======================================================================
# Routes
# ======================================================================

@router.post("/sessions", response_model=CreateSessionResponse)
def create_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> CreateSessionResponse:
    project_id = payload.project_id
    if payload.design_id is not None:
        design_project_id = project_id
        if design_project_id is None:
            design = (
                db.query(Design)
                .join(Project, Design.project_id == Project.id)
                .filter(Design.id == payload.design_id, Project.owner_id == current_user.id)
                .first()
            )
            if design is None:
                raise HTTPException(status_code=404, detail="Design not found")
        else:
            design = _get_owned_design(db, design_project_id, payload.design_id, current_user)
        try:
            session = _get_or_create_session_for_design(db, design, current_user)
            db.commit()
            db.refresh(session)
        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception("create designer session failed: %s", exc)
            raise HTTPException(status_code=500, detail="Designer session create failed") from exc
        return CreateSessionResponse(sid=session.id)

    if project_id is not None:
        project = _get_owned_project(db, project_id, current_user)
        try:
            session = _get_or_create_default_design_session(db, project, current_user)
            db.commit()
            db.refresh(session)
        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception("create designer session failed: %s", exc)
            raise HTTPException(status_code=500, detail="Designer session create failed") from exc
        return CreateSessionResponse(sid=session.id)

    session = DesignerSession(
        user_id=current_user.id,
        project_id=project_id,
        current_step=1,
    )
    try:
        db.add(session)
        db.commit()
        db.refresh(session)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("create designer session failed: %s", exc)
        raise HTTPException(status_code=500, detail="Designer session create failed") from exc
    return CreateSessionResponse(sid=session.id)


@router.get("/projects/{project_id}/designs/default/session", response_model=DesignerSessionState)
def get_default_design_session(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DesignerSessionState:
    project = _get_owned_project(db, project_id, current_user)
    try:
        session = _get_or_create_default_design_session(db, project, current_user)
        db.commit()
        db.refresh(session)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("create designer session failed: %s", exc)
        raise HTTPException(status_code=500, detail="Designer session create failed") from exc
    return _session_to_state(session)


@router.get("/projects/{project_id}/designs/{design_id}/session", response_model=DesignerSessionState)
def get_design_session(
    project_id: int,
    design_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DesignerSessionState:
    design = _get_owned_design(db, project_id, design_id, current_user)
    try:
        session = _get_or_create_session_for_design(db, design, current_user)
        db.commit()
        db.refresh(session)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("create designer session failed: %s", exc)
        raise HTTPException(status_code=500, detail="Designer session create failed") from exc
    return _session_to_state(session)


@router.get("/presets/environments", response_model=List[EnvironmentPreset])
def list_environment_presets(
    current_user: User = Depends(get_current_active_user),
) -> List[EnvironmentPreset]:
    out: List[EnvironmentPreset] = []
    for raw in _ENVIRONMENTS_RAW:
        try:
            out.append(EnvironmentPreset(**raw))
        except Exception as exc:  # noqa: BLE001
            logger.warning("invalid env preset %s: %s", raw.get("id"), exc)
    return out


@router.get("/presets/missions", response_model=List[MissionPreset])
def list_mission_presets(
    current_user: User = Depends(get_current_active_user),
) -> List[MissionPreset]:
    out: List[MissionPreset] = []
    for raw in _MISSIONS_RAW:
        try:
            out.append(MissionPreset(**raw))
        except Exception as exc:  # noqa: BLE001
            logger.warning("invalid mission preset %s: %s", raw.get("id"), exc)
    return out


@router.post("/sessions/{sid}/environment", response_model=AckResponse)
def submit_environment(
    sid: int,
    payload: SubmitEnvironmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AckResponse:
    session = _get_session(db, sid, current_user)
    session.environment_json = payload.environment.model_dump()
    session.current_step = max(session.current_step, 2)
    design_report_service.update_report_from_session(db, session, current_user)
    db.commit()
    return AckResponse(ok=True, current_step=session.current_step)


@router.post("/sessions/{sid}/mission", response_model=List[ChassisCandidate])
def submit_mission(
    sid: int,
    payload: SubmitMissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[ChassisCandidate]:
    session = _get_session(db, sid, current_user)
    session.mission_id = payload.mission_id
    session.current_step = max(session.current_step, 3)

    env_dict: Dict[str, Any] = session.environment_json or {}
    try:
        candidates = biotype_service.recommend_chassis(env_dict, payload.mission_id, top_n=6)
    except Exception as exc:  # noqa: BLE001
        logger.exception("recommend_chassis failed: %s", exc)
        candidates = []
    parsed = [ChassisCandidate(**c) for c in candidates]
    session.chassis_candidates_json = [c.model_dump() for c in parsed]
    session.chassis_id = None
    session.protein_id = None
    session.protein_candidates_json = None
    session.edit_plan_candidates_json = None
    session.edit_plan_json = None
    session.simulation_result_json = None
    design_report_service.update_report_from_session(db, session, current_user)
    db.commit()
    return parsed


@router.post("/sessions/{sid}/chassis", response_model=List[ProteinCandidate])
async def submit_chassis(
    sid: int,
    payload: SubmitChassisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[ProteinCandidate]:
    session = _get_session(db, sid, current_user)
    session.chassis_id = payload.chassis_id
    session.current_step = max(session.current_step, 4)

    mission_id = session.mission_id or ""
    try:
        candidates = await protein_service.recommend_proteins(
            payload.chassis_id, mission_id, top_n=5
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("recommend_proteins failed: %s", exc)
        candidates = []
    parsed = [ProteinCandidate(**c) for c in candidates]
    session.protein_candidates_json = [c.model_dump() for c in parsed]
    session.protein_id = None
    session.edit_plan_candidates_json = None
    session.edit_plan_json = None
    session.simulation_result_json = None
    design_report_service.update_report_from_session(db, session, current_user)
    db.commit()
    return parsed


@router.post("/sessions/{sid}/protein", response_model=List[EditPlanCandidate])
async def submit_protein(
    sid: int,
    payload: SubmitProteinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[EditPlanCandidate]:
    session = _get_session(db, sid, current_user)
    session.protein_id = payload.protein_id
    session.current_step = max(session.current_step, 5)

    chassis = _CHASSIS_BY_ID.get(session.chassis_id or "", {})
    protein = _PROTEIN_BY_ID.get(payload.protein_id, {})
    try:
        plans = await edit_plan_service.generate_edit_plans(chassis, protein)
    except Exception as exc:  # noqa: BLE001
        logger.exception("generate_edit_plans failed: %s", exc)
        plans = []
    parsed = [EditPlanCandidate(**p) for p in plans]
    session.edit_plan_candidates_json = [p.model_dump() for p in parsed]
    session.edit_plan_json = None
    session.simulation_result_json = None
    design_report_service.update_report_from_session(db, session, current_user)
    db.commit()
    return parsed


@router.post("/sessions/{sid}/edit-plan", response_model=AckResponse)
async def submit_edit_plan(
    sid: int,
    payload: SubmitEditPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AckResponse:
    session = _get_session(db, sid, current_user)
    chassis = _CHASSIS_BY_ID.get(session.chassis_id or "", {})
    protein = _PROTEIN_BY_ID.get(session.protein_id or "", {})

    chosen: Optional[Dict[str, Any]] = None
    if payload.edit_plan is not None and payload.edit_plan.id == payload.edit_plan_id:
        chosen = payload.edit_plan.model_dump()
    else:
        try:
            plans = await edit_plan_service.generate_edit_plans(chassis, protein)
            chosen = next((p for p in plans if p.get("id") == payload.edit_plan_id), None)
            if chosen is None and plans:
                chosen = plans[0]
        except Exception as exc:  # noqa: BLE001
            logger.warning("re-generate plans failed in submit_edit_plan: %s", exc)

    if chosen is not None:
        # 通过 schema 校验后再写库
        try:
            session.edit_plan_json = EditPlanCandidate(**chosen).model_dump()
        except Exception as exc:  # noqa: BLE001
            logger.warning("edit plan schema validation failed: %s", exc)
            session.edit_plan_json = chosen

    session.current_step = max(session.current_step, 6)
    design_report_service.update_report_from_session(db, session, current_user)
    db.commit()
    return AckResponse(ok=True, current_step=session.current_step)


@router.post("/sessions/{sid}/simulate")
async def simulate_session(
    sid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = _get_session(db, sid, current_user)
    sid_fixed = session.id

    chassis = _CHASSIS_BY_ID.get(session.chassis_id or "", {})
    protein = _PROTEIN_BY_ID.get(session.protein_id or "", {})
    env_dict: Dict[str, Any] = session.environment_json or {}

    total_steps = 200
    try:
        all_steps = simulation_service.simulate(chassis, protein, env_dict, steps=total_steps)
    except Exception as exc:  # noqa: BLE001
        logger.exception("simulation_service.simulate failed: %s", exc)
        all_steps = []

    async def event_stream():
        steps_accum: List[SimulationStep] = []
        for i, raw in enumerate(all_steps):
            try:
                step = SimulationStep(**raw)
            except Exception:
                step = SimulationStep(time=0.0, population=0.0, env_target=0.0, nutrient=0.0)
            steps_accum.append(step)
            payload = json.dumps(
                {"index": i, "total": total_steps, "step": step.model_dump()},
                ensure_ascii=False,
            )
            yield f"event: message\ndata: {payload}\n\n"
            await asyncio.sleep(0.05)

        # 写回 DB
        result = SimulationResult(
            steps=steps_accum,
            notes="ODE simulation: logistic growth coupled with Michaelis-Menten product accumulation.",
        )
        db_session = (
            db.query(DesignerSession).filter(DesignerSession.id == sid_fixed).first()
        )
        if db_session is not None:
            db_session.simulation_result_json = result.model_dump()
            db_session.current_step = 6
            design_report_service.update_report_from_session(db, db_session, current_user)
            db.commit()

        done_payload = json.dumps({"status": "completed", "sid": sid_fixed}, ensure_ascii=False)
        yield f"event: done\ndata: {done_payload}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/sessions/{sid}", response_model=DesignerSessionState)
def get_session_state(
    sid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DesignerSessionState:
    session = _get_session(db, sid, current_user)
    return _session_to_state(session)


@router.get("/sessions/{sid}/report", response_model=DesignReportResponse)
def get_session_report(
    sid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DesignReportResponse:
    session = _get_session(db, sid, current_user)
    report = design_report_service.get_report_for_session(db, session)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return _report_to_response(report)


@router.post("/sessions/{sid}/report/exports/markdown", response_model=ReportExportResponse)
def export_session_report_markdown(
    sid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ReportExportResponse:
    session = _get_session(db, sid, current_user)
    report = design_report_service.get_report_for_session(db, session)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    export = design_report_service.create_markdown_export(db, report)
    db.commit()
    db.refresh(export)
    return _report_export_to_response(export)


@router.post("/sessions/{sid}/copilot", response_model=CopilotResponse)
async def designer_copilot(
    sid: int,
    payload: CopilotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> CopilotResponse:
    session = _get_session(db, sid, current_user)
    state = _session_to_state(session).model_dump(mode="json")
    frontend_state = payload.designer_state or {}
    if frontend_state:
        state.update(frontend_state)
    state["current_step"] = payload.current_step or state.get("current_step") or 1
    if state.get("edit_plan") and not state.get("edit_plan_id"):
        edit_plan = state.get("edit_plan")
        if isinstance(edit_plan, dict):
            state["edit_plan_id"] = edit_plan.get("id")

    available_context = dict(payload.available_context or {})
    available_context.setdefault("environment_presets", _ENVIRONMENTS_RAW)
    available_context.setdefault("mission_presets", _MISSIONS_RAW)

    return await designer_copilot_service.generate_designer_copilot_response(
        payload.message,
        state,
        available_context,
    )


@router.post("/sessions/{sid}/rollback", response_model=DesignerSessionState)
def rollback_session(
    sid: int,
    payload: RollbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DesignerSessionState:
    session = _get_session(db, sid, current_user)
    step = payload.step
    if step <= 1:
        session.environment_json = None
    if step <= 2:
        session.mission_id = None
        session.chassis_candidates_json = None
    if step <= 3:
        session.chassis_id = None
        session.protein_candidates_json = None
    if step <= 4:
        session.protein_id = None
        session.edit_plan_candidates_json = None
    if step <= 5:
        session.edit_plan_json = None
    if step <= 6:
        session.simulation_result_json = None
    session.current_step = step
    if session.project_id is not None and session.design_id is not None:
        design_report_service.update_report_from_session(db, session, current_user)
    db.commit()
    db.refresh(session)
    return _session_to_state(session)
