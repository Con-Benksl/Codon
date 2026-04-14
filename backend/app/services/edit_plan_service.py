"""编辑方案生成服务 — 调 LLM 生成 3-5 个工程化方案。"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from app.services import gene_db_client, llm_client

logger = logging.getLogger(__name__)


def _safe_str(v: Any, default: str = "") -> str:
    if v is None:
        return default
    return str(v)


async def _fetch_sequence_length(uniprot_id: str) -> Optional[int]:
    if not uniprot_id:
        return None
    try:
        data = await gene_db_client.fetch_uniprot_entry(uniprot_id)
        if not data:
            return None
        seq = data.get("sequence") or {}
        length = seq.get("length")
        if isinstance(length, int):
            return length
    except Exception as exc:  # noqa: BLE001
        logger.warning("UniProt seq length fetch failed for %s: %s", uniprot_id, exc)
    return None


def _normalize_plan(plan: Dict[str, Any], idx: int, source_id: str) -> Dict[str, Any]:
    """把 LLM 输出的 plan dict 强制对齐到 EditPlanCandidate schema。"""
    refs_raw = plan.get("references") or []
    refs: List[str] = []
    if isinstance(refs_raw, list):
        for r in refs_raw:
            if isinstance(r, str):
                refs.append(r)
            elif isinstance(r, dict):
                # {label, url} → "label (url)"
                label = _safe_str(r.get("label"), "")
                url = _safe_str(r.get("url"), "")
                if label and url:
                    refs.append(f"{label} ({url})")
                elif url:
                    refs.append(url)
                elif label:
                    refs.append(label)

    return {
        "id": _safe_str(plan.get("id"), f"plan_llm_{idx}"),
        "target_gene": _safe_str(plan.get("target_gene"), "unknown"),
        "source": _safe_str(plan.get("source"), source_id),
        "strategy": _safe_str(plan.get("strategy"), "异源过表达"),
        "delivery_vector": _safe_str(plan.get("delivery_vector"), "pBBR1MCS-2"),
        "promoter": _safe_str(plan.get("promoter"), "J23119"),
        "codon_optimization_note": _safe_str(plan.get("codon_optimization_note"), "按底盘密码子优化"),
        "metabolic_burden": _safe_str(plan.get("metabolic_burden"), "medium"),
        "has_kill_switch": bool(plan.get("has_kill_switch", False)),
        "references": refs,
    }


def _fallback_plan(chassis: Dict[str, Any], protein: Dict[str, Any]) -> Dict[str, Any]:
    uniprot_id = _safe_str(protein.get("uniprot_id"), "")
    refs: List[str] = []
    if uniprot_id:
        refs.append(f"UniProt {uniprot_id} (https://www.uniprot.org/uniprotkb/{uniprot_id})")
    doi = _safe_str(protein.get("reference_doi"), "")
    if doi:
        refs.append(f"DOI {doi}")
    return {
        "id": "plan_fallback_overexp",
        "target_gene": _safe_str(protein.get("name"), "target"),
        "source": _safe_str(protein.get("id"), ""),
        "strategy": "异源过表达（保底方案）",
        "delivery_vector": "pBBR1MCS-2",
        "promoter": "J23119（强组成型）",
        "codon_optimization_note": f"按 {chassis.get('scientific_name', '底盘')} 密码子使用频率优化",
        "metabolic_burden": "medium",
        "has_kill_switch": True,
        "references": refs,
    }


async def generate_edit_plans(
    chassis: Dict[str, Any],
    protein: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """调 LLM 生成 3-5 个候选方案；失败时返回 1 个保底方案。"""
    if not protein:
        return [_fallback_plan(chassis or {}, {})]

    uniprot_id = _safe_str(protein.get("uniprot_id"), "")
    seq_length = await _fetch_sequence_length(uniprot_id)

    system_prompt = (
        "你是合成生物学元件设计专家。给定底盘和异源蛋白，请输出 3-5 个具体可执行的工程化方案。"
        "每个方案必须使用真实的质粒名（如 pBBR1MCS-2、pET28a、pSEVA251、pHT01 等）和真实的启动子"
        "（如 J23119、Plac、PrhaB、T7、PspoIIE 等）。"
        "返回 JSON 对象，键 plans 为方案数组，每个元素必须包含字段："
        "id, target_gene, source, strategy, delivery_vector, promoter, codon_optimization_note, "
        "metabolic_burden(low/medium/high), has_kill_switch(bool), references(数组，每项为字符串或 {label,url})。"
    )
    user_payload = {
        "chassis": {
            "id": chassis.get("id"),
            "scientific_name": chassis.get("scientific_name"),
            "genetic_tractability": chassis.get("genetic_tractability"),
            "engineering_tools": chassis.get("engineering_tools"),
        },
        "protein": {
            "id": protein.get("id"),
            "name": protein.get("name"),
            "ec_number": protein.get("ec_number"),
            "source_organism": protein.get("source_organism"),
            "uniprot_id": uniprot_id,
            "sequence_length": seq_length,
            "kinetics": protein.get("kinetics"),
        },
    }

    try:
        result = await llm_client.chat_completion_json(
            system_prompt=system_prompt,
            user_message=json.dumps(user_payload, ensure_ascii=False),
            temperature=0.4,
            max_tokens=1500,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM edit plan generation failed: %s", exc)
        return [_fallback_plan(chassis, protein)]

    if not isinstance(result, dict) or "error" in result:
        logger.warning("LLM edit plan returned error / non-dict: %s", str(result)[:200])
        return [_fallback_plan(chassis, protein)]

    plans_raw = result.get("plans") or result.get("edit_plans") or []
    if not isinstance(plans_raw, list) or not plans_raw:
        return [_fallback_plan(chassis, protein)]

    source_id = _safe_str(protein.get("id"), "")
    normalized = []
    for i, p in enumerate(plans_raw):
        if isinstance(p, dict):
            normalized.append(_normalize_plan(p, i + 1, source_id))
    if not normalized:
        return [_fallback_plan(chassis, protein)]
    return normalized[:5]
