"""Designer 6-step 流程路由（Phase 2：接入真实 service 层）。"""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.designer_session import DesignerSession
from app.models.user import User
from app.schemas.designer import (
    AckResponse,
    ChassisCandidate,
    CopilotRequest,
    CopilotResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    DesignerSessionState,
    EditPlanCandidate,
    EnvironmentPreset,
    EnvironmentVector,
    MissionPreset,
    ProteinCandidate,
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
        current_step=session.current_step,
        environment=env,
        mission_id=session.mission_id,
        chassis_id=session.chassis_id,
        protein_id=session.protein_id,
        edit_plan=plan,
        simulation_result=sim,
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
    session = DesignerSession(
        user_id=current_user.id,
        project_id=payload.project_id,
        current_step=1,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return CreateSessionResponse(sid=session.id)


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
    db.commit()

    env_dict: Dict[str, Any] = session.environment_json or {}
    try:
        candidates = biotype_service.recommend_chassis(env_dict, payload.mission_id, top_n=6)
    except Exception as exc:  # noqa: BLE001
        logger.exception("recommend_chassis failed: %s", exc)
        candidates = []
    return [ChassisCandidate(**c) for c in candidates]


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
    db.commit()

    mission_id = session.mission_id or ""
    try:
        candidates = await protein_service.recommend_proteins(
            payload.chassis_id, mission_id, top_n=5
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("recommend_proteins failed: %s", exc)
        candidates = []
    return [ProteinCandidate(**c) for c in candidates]


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
    db.commit()

    chassis = _CHASSIS_BY_ID.get(session.chassis_id or "", {})
    protein = _PROTEIN_BY_ID.get(payload.protein_id, {})
    try:
        plans = await edit_plan_service.generate_edit_plans(chassis, protein)
    except Exception as exc:  # noqa: BLE001
        logger.exception("generate_edit_plans failed: %s", exc)
        plans = []
    return [EditPlanCandidate(**p) for p in plans]


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
    if step <= 3:
        session.chassis_id = None
    if step <= 4:
        session.protein_id = None
    if step <= 5:
        session.edit_plan_json = None
    if step <= 6:
        session.simulation_result_json = None
    session.current_step = step
    db.commit()
    db.refresh(session)
    return _session_to_state(session)
