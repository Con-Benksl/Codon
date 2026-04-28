"""Designer Copilot service backed by an OpenAI-compatible LLM."""
from __future__ import annotations

import json
import logging
import uuid
from typing import Any, Dict, Iterable, List, Optional

from pydantic import ValidationError

from app.schemas.designer import (
    CopilotAction,
    CopilotResponse,
    CopilotWarning,
    EnvironmentVector,
)
from app.services import llm_client

logger = logging.getLogger(__name__)

ACTION_TYPES = {
    "apply_environment",
    "select_mission",
    "select_chassis",
    "select_protein",
    "select_edit_plan",
    "run_simulation",
    "rollback_to_step",
    "explain",
    "compare",
}

MUTATING_ACTIONS = {
    "apply_environment",
    "select_mission",
    "select_chassis",
    "select_protein",
    "select_edit_plan",
    "run_simulation",
    "rollback_to_step",
}

SYSTEM_PROMPT = """\
You are Codon Designer Copilot for a synthetic biology design workspace.

Return only JSON matching this shape:
{
  "message": "assistant text",
  "actions": [
    {
      "id": "stable-id",
      "type": "apply_environment | select_mission | select_chassis | select_protein | select_edit_plan | run_simulation | rollback_to_step | explain | compare",
      "label": "short button title",
      "description": "one sentence",
      "payload": {},
      "preview": ["short changed-state preview"],
      "requiresConfirmation": true
    }
  ],
  "suggested_prompts": ["next user prompt"],
  "warnings": [{"level": "info | warning | danger", "message": "short warning", "code": "optional_code"}]
}

Rules:
- The user can write freely, but every Designer state mutation must be represented as an explicit action.
- Do not claim a state change already happened. The user applies actions.
- Use only IDs that appear in available_context for chassis, protein, and edit-plan selections.
- Use only known mission IDs for select_mission.
- apply_environment must include a full 9-field EnvironmentVector.
- explain and compare should not mutate state. Put the explanatory prose in payload.assistant_message.
- Prefer Chinese if the user writes Chinese; otherwise use English.
- Keep output concise and practical.
"""

MARS_SURFACE_ENVIRONMENT = {
    "temperature": -63,
    "ionizing_radiation": 230,
    "uv_flux": 110,
    "pressure": 0.6,
    "ph": 8.3,
    "salinity": 1.5,
    "water_activity": 0.05,
    "oxygen": 0.0013,
    "temp_diurnal_range": 100,
}


def _text_in(message: str, keywords: Iterable[str]) -> bool:
    text = message.lower()
    return any(keyword.lower() in text for keyword in keywords)


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def _list_context(context: Dict[str, Any], *keys: str) -> List[Dict[str, Any]]:
    for key in keys:
        value = context.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def _id_set(items: Iterable[Dict[str, Any]]) -> set[str]:
    return {str(item.get("id")) for item in items if item.get("id")}


def _mission_ids(context: Dict[str, Any]) -> set[str]:
    return _id_set(_list_context(context, "mission_presets", "missions"))


def _choose_mission_id(message: str, mission_ids: set[str]) -> Optional[str]:
    ordered = [
        (["oxygen", "o2", "产氧", "固碳", "carbon"], "mission_oxygen_carbon_fixation"),
        (["metal", "重金属", "铅", "镉", "汞"], "mission_heavy_metal_uptake"),
        (["plastic", "塑料", "pet"], "mission_plastic_degradation"),
        (["acid", "ph", "酸", "中和"], "mission_acid_neutralization"),
        (["film", "biofilm", "生物膜", "固土"], "mission_biofilm_soil_stabilization"),
    ]
    for keywords, mission_id in ordered:
        if mission_id in mission_ids and _text_in(message, keywords):
            return mission_id
    fallback = "mission_nitrogen_fixation_soil"
    if fallback in mission_ids:
        return fallback
    return sorted(mission_ids)[0] if mission_ids else None


def _warning(level: str, message: str, code: str) -> CopilotWarning:
    return CopilotWarning(level=level, message=message, code=code)  # type: ignore[arg-type]


def _fallback_response(
    message: str,
    designer_state: Dict[str, Any],
    available_context: Dict[str, Any],
    reason: str,
) -> CopilotResponse:
    actions: List[CopilotAction] = []
    mission_ids = _mission_ids(available_context)
    chassis_candidates = _list_context(
        available_context, "chassis_candidates", "chassisCandidates"
    )
    protein_candidates = _list_context(
        available_context, "protein_candidates", "proteinCandidates"
    )
    edit_plan_candidates = _list_context(
        available_context, "edit_plan_candidates", "editPlanCandidates"
    )

    if not designer_state.get("environment") or _text_in(message, ["mars", "火星", "martian"]):
        actions.append(
            CopilotAction(
                id=_new_id("action-env"),
                type="apply_environment",
                label="应用火星表面环境",
                description="使用低温、低压、高 UV、低水活度的火星表面预设。",
                payload={
                    "environment": MARS_SURFACE_ENVIRONMENT,
                    "preset_id": "env_mars_surface",
                    "source": "preset",
                },
                preview=["temperature -63°C", "pressure 0.6 kPa", "water activity 0.05"],
                requiresConfirmation=True,
            )
        )

    if not designer_state.get("mission_id"):
        mission_id = _choose_mission_id(message, mission_ids)
        if mission_id:
            actions.append(
                CopilotAction(
                    id=_new_id("action-mission"),
                    type="select_mission",
                    label="选择匹配目标的任务",
                    description="先确认任务目标，再生成底盘候选。",
                    payload={"mission_id": mission_id},
                    preview=[mission_id],
                    requiresConfirmation=True,
                )
            )
    elif not designer_state.get("chassis_id") and chassis_candidates:
        top = chassis_candidates[0]
        actions.append(
            CopilotAction(
                id=_new_id("action-chassis"),
                type="select_chassis",
                label=f"选择 {top.get('scientific_name') or top.get('id')}",
                description=str(top.get("recommendation_reason") or "使用当前最高匹配底盘候选。"),
                payload={"chassis_id": top["id"]},
                preview=[
                    f"match {float(top.get('match_score', 0)) * 100:.0f}%",
                    str(top.get("genetic_tractability", "")),
                ],
                requiresConfirmation=True,
            )
        )
    elif not designer_state.get("protein_id") and protein_candidates:
        top = protein_candidates[0]
        actions.append(
            CopilotAction(
                id=_new_id("action-protein"),
                type="select_protein",
                label=f"选择 {top.get('name') or top.get('id')}",
                description=str(top.get("llm_explanation") or "使用当前最匹配功能蛋白。"),
                payload={"protein_id": top["id"]},
                preview=[str(top.get("ec_number", "")), str(top.get("source_organism", ""))],
                requiresConfirmation=True,
            )
        )
    elif not designer_state.get("edit_plan_id") and edit_plan_candidates:
        preferred = next(
            (plan for plan in edit_plan_candidates if plan.get("has_kill_switch")),
            edit_plan_candidates[0],
        )
        actions.append(
            CopilotAction(
                id=_new_id("action-edit-plan"),
                type="select_edit_plan",
                label=f"选择 {preferred.get('target_gene') or preferred.get('id')} 编辑方案",
                description=str(preferred.get("strategy") or "使用当前工程化编辑方案。"),
                payload={"edit_plan_id": preferred["id"]},
                preview=[
                    "包含 kill-switch" if preferred.get("has_kill_switch") else "缺少 kill-switch",
                    str(preferred.get("metabolic_burden", "")),
                ],
                requiresConfirmation=True,
            )
        )
    elif designer_state.get("edit_plan_id") and not designer_state.get("simulation_steps"):
        actions.append(
            CopilotAction(
                id=_new_id("action-simulate"),
                type="run_simulation",
                label="运行模拟验证",
                description="使用当前结构化设计运行现有模拟流程。",
                payload={},
                preview=["population", "env target", "nutrient"],
                requiresConfirmation=True,
            )
        )

    if _text_in(message, ["why", "explain", "解释", "为什么", "风险"]):
        actions.append(
            CopilotAction(
                id=_new_id("action-explain"),
                type="explain",
                label="解释当前设计状态",
                description="不改变设计状态，只补充可读解释。",
                payload={
                    "assistant_message": "当前设计应优先检查环境胁迫、候选匹配度和编辑方案的生物安全约束。",
                    "subject_type": "simulation",
                },
                preview=[],
                requiresConfirmation=False,
            )
        )

    return CopilotResponse(
        message=(
            "我暂时使用本地规则整理了可确认动作。"
            if reason
            else "我把你的目标整理成下面这些可确认动作。"
        ),
        actions=actions,
        suggested_prompts=["比较候选风险", "解释当前设计状态", "运行模拟验证"],
        warnings=[_warning("info", reason, "local_fallback")] if reason else [],
    )


def _normalize_action(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    action_type = raw.get("type")
    if action_type not in ACTION_TYPES:
        return None
    payload = raw.get("payload")
    if not isinstance(payload, dict):
        payload = {}
    return {
        "id": str(raw.get("id") or _new_id(f"action-{action_type}")),
        "type": action_type,
        "label": str(raw.get("label") or action_type),
        "description": raw.get("description"),
        "payload": payload,
        "preview": [str(item) for item in raw.get("preview", []) if item is not None]
        if isinstance(raw.get("preview"), list)
        else [],
        "requiresConfirmation": bool(
            raw.get(
                "requiresConfirmation",
                raw.get("requires_confirmation", action_type in MUTATING_ACTIONS),
            )
        ),
        "disabledReason": raw.get("disabledReason") or raw.get("disabled_reason"),
    }


def _sanitize_action(
    action: Dict[str, Any],
    designer_state: Dict[str, Any],
    available_context: Dict[str, Any],
) -> Optional[CopilotAction]:
    normalized = _normalize_action(action)
    if normalized is None:
        return None

    action_type = normalized["type"]
    payload = normalized["payload"]
    mission_ids = _mission_ids(available_context)
    chassis_ids = _id_set(
        _list_context(available_context, "chassis_candidates", "chassisCandidates")
    )
    protein_ids = _id_set(
        _list_context(available_context, "protein_candidates", "proteinCandidates")
    )
    edit_plan_ids = _id_set(
        _list_context(available_context, "edit_plan_candidates", "editPlanCandidates")
    )

    if action_type == "apply_environment":
        try:
            env = EnvironmentVector(**payload.get("environment", {})).model_dump()
        except ValidationError:
            return None
        normalized["payload"] = {
            "environment": env,
            "preset_id": payload.get("preset_id"),
            "source": payload.get("source") if payload.get("source") in {"preset", "custom"} else "custom",
        }
    elif action_type == "select_mission":
        mission_id = str(payload.get("mission_id") or "")
        if mission_id not in mission_ids:
            return None
        normalized["payload"] = {"mission_id": mission_id}
    elif action_type == "select_chassis":
        chassis_id = str(payload.get("chassis_id") or "")
        if chassis_id not in chassis_ids:
            return None
        normalized["payload"] = {"chassis_id": chassis_id}
    elif action_type == "select_protein":
        protein_id = str(payload.get("protein_id") or "")
        if protein_id not in protein_ids:
            return None
        normalized["payload"] = {"protein_id": protein_id}
    elif action_type == "select_edit_plan":
        edit_plan_id = str(payload.get("edit_plan_id") or "")
        if edit_plan_id not in edit_plan_ids:
            return None
        normalized["payload"] = {"edit_plan_id": edit_plan_id}
    elif action_type == "run_simulation":
        if not designer_state.get("edit_plan_id"):
            return None
        normalized["payload"] = {}
    elif action_type == "rollback_to_step":
        try:
            step = int(payload.get("step"))
        except (TypeError, ValueError):
            return None
        if step < 1 or step > 6:
            return None
        normalized["payload"] = {"step": step}
    elif action_type == "explain":
        assistant_message = str(payload.get("assistant_message") or "").strip()
        if not assistant_message:
            return None
        normalized["payload"] = {
            "assistant_message": assistant_message,
            "subject_type": payload.get("subject_type"),
            "subject_id": payload.get("subject_id"),
        }
        normalized["requiresConfirmation"] = False
    elif action_type == "compare":
        assistant_message = str(payload.get("assistant_message") or "").strip()
        entity_type = payload.get("entity_type")
        ids = payload.get("ids") if isinstance(payload.get("ids"), list) else []
        if not assistant_message or entity_type not in {"mission", "chassis", "protein", "edit_plan"}:
            return None
        normalized["payload"] = {
            "assistant_message": assistant_message,
            "entity_type": entity_type,
            "ids": [str(item) for item in ids],
            "criteria": payload.get("criteria") if isinstance(payload.get("criteria"), list) else [],
        }
        normalized["requiresConfirmation"] = False

    try:
        return CopilotAction(**normalized)
    except ValidationError as exc:
        logger.warning("invalid copilot action dropped: %s", exc)
        return None


def _sanitize_response(
    result: Dict[str, Any],
    designer_state: Dict[str, Any],
    available_context: Dict[str, Any],
) -> CopilotResponse:
    raw_actions = result.get("actions")
    actions: List[CopilotAction] = []
    dropped = 0
    if isinstance(raw_actions, list):
        for raw_action in raw_actions:
            if not isinstance(raw_action, dict):
                dropped += 1
                continue
            action = _sanitize_action(raw_action, designer_state, available_context)
            if action is None:
                dropped += 1
                continue
            actions.append(action)

    warnings: List[CopilotWarning] = []
    raw_warnings = result.get("warnings")
    if isinstance(raw_warnings, list):
        for raw_warning in raw_warnings[:4]:
            if not isinstance(raw_warning, dict):
                continue
            level = raw_warning.get("level")
            if level not in {"info", "warning", "danger"}:
                level = "info"
            warnings.append(
                CopilotWarning(
                    level=level,
                    message=str(raw_warning.get("message") or ""),
                    code=raw_warning.get("code"),
                )
            )
    if dropped:
        warnings.append(
            CopilotWarning(
                level="warning",
                message=f"{dropped} 个 LLM action 因 payload 不匹配当前 Designer 状态已被忽略。",
                code="action_sanitized",
            )
        )

    suggested_prompts = result.get("suggested_prompts")
    prompts = (
        [str(item) for item in suggested_prompts[:4] if item]
        if isinstance(suggested_prompts, list)
        else []
    )

    message = str(result.get("message") or "").strip()
    if not message:
        message = "我整理了下面这些可确认动作。"

    return CopilotResponse(
        message=message,
        actions=actions,
        suggested_prompts=prompts,
        warnings=warnings,
    )


async def generate_designer_copilot_response(
    message: str,
    designer_state: Dict[str, Any],
    available_context: Dict[str, Any],
) -> CopilotResponse:
    """Generate a structured Copilot response, falling back locally if needed."""
    if not llm_client.is_llm_configured():
        return _fallback_response(
            message,
            designer_state,
            available_context,
            "LLM_API_KEY 尚未配置，已使用本地规则兜底。",
        )

    user_payload = {
        "user_message": message,
        "designer_state": designer_state,
        "available_context": available_context,
    }
    try:
        result = await llm_client.chat_completion_json(
            SYSTEM_PROMPT,
            json.dumps(user_payload, ensure_ascii=False, default=str),
            max_tokens=1600,
            temperature=0.25,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("designer copilot LLM call failed: %s", exc)
        return _fallback_response(
            message,
            designer_state,
            available_context,
            f"LLM 调用失败，已使用本地规则兜底：{exc}",
        )

    if result.get("error"):
        return _fallback_response(
            message,
            designer_state,
            available_context,
            "LLM 返回格式无法解析，已使用本地规则兜底。",
        )

    return _sanitize_response(result, designer_state, available_context)
