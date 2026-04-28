"""蛋白推荐服务 — 按任务类别筛选并用 LLM 生成解释。

输入：
- chassis_id: 用户已选底盘
- mission_id: 任务 id

输出：
- ProteinCandidate 兼容 dict 列表（top_n 条），含 LLM 解释（失败降级）
"""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.services import gene_db_client, llm_client

logger = logging.getLogger(__name__)

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "function_proteins.json"

try:
    with open(_DATA_PATH, "r", encoding="utf-8") as f:
        PROTEIN_DATA: List[Dict[str, Any]] = json.load(f)
except Exception as exc:  # noqa: BLE001
    logger.error("Failed to load function_proteins.json: %s", exc)
    PROTEIN_DATA = []

_UNIPROT_DESC_CACHE: Dict[str, Optional[str]] = {}
_PROTEIN_EXPLANATION_CACHE: Dict[str, str] = {}


# ---------- mission → 蛋白筛选关键词 ----------

_MISSION_PROTEIN_KEYWORDS: Dict[str, List[str]] = {
    "mission_oxygen_carbon_fixation": [
        "rubisco", "carbonic", "carboxylase", "photosystem", "fdh", "codh", "carbon",
    ],
    "mission_nitrogen_fixation_soil": [
        "nitrogenase", "nif", "glutamine", "nitrogen",
    ],
    "mission_heavy_metal_uptake": [
        "metal", "merc", "metallothionein", "cadr", "smtA", "arsenate", "reductase",
    ],
    "mission_radionuclide_immobilization": [
        "reductase", "uranyl", "phytochelatin", "cytochrome", "metal", "reca", "sod", "catalase",
    ],
    "mission_radioactive_fixation": [
        "reductase", "reca", "sod", "catalase", "dsup", "mn-sod", "uranyl",
    ],
    "mission_acid_neutralization": [
        "carbonic", "urease", "decarboxylase", "buffer",
    ],
    "mission_plastic_degradation": [
        "petase", "mhetase", "esterase", "cutinase", "lipase", "hydrolase",
    ],
    "mission_oil_spill_remediation": [
        "alkane", "monooxygenase", "p450", "alma", "hydrocarbon",
    ],
    "mission_organochlorine_degradation": [
        "dehalogenase", "linA", "lin", "cyp", "p450",
    ],
    "mission_phosphate_release": [
        "phosphatase", "phytase", "gluconate",
    ],
    "mission_biofilm_soil_stabilization": [
        "eps", "exopolysaccharide", "epsE", "biofilm", "curli",
    ],
}


def _score_protein_for_mission(protein: Dict[str, Any], mission_id: str) -> float:
    keywords = _MISSION_PROTEIN_KEYWORDS.get(mission_id, [])
    if not keywords:
        return 0.5
    text_parts = [
        str(protein.get("name", "")),
        str(protein.get("source_organism", "")),
        str(protein.get("llm_explanation", "")),
        str(protein.get("ec_number", "")),
        str(protein.get("id", "")),
    ]
    haystack = " ".join(text_parts).lower()
    hits = sum(1 for kw in keywords if kw.lower() in haystack)
    return min(1.0, hits / 2.0)


def _ensure_kinetics(k: Any) -> Dict[str, float]:
    if not isinstance(k, dict):
        k = {}
    return {
        "kcat": float(k.get("kcat") or 0.0),
        "km": float(k.get("km") or 0.0),
        "optimal_temp": float(k.get("optimal_temp") or 25.0),
        "optimal_ph": float(k.get("optimal_ph") or 7.0),
    }


def _ensure_effect_vector(v: Any) -> Dict[str, float]:
    if not isinstance(v, dict):
        v = {}
    return {
        "co2_delta": float(v.get("co2_delta") or 0.0),
        "o2_delta": float(v.get("o2_delta") or 0.0),
        "organics_delta": float(v.get("organics_delta") or 0.0),
        "toxin_delta": float(v.get("toxin_delta") or 0.0),
        "ph_buffer": float(v.get("ph_buffer") or 0.0),
        "heavy_metal_fix": float(v.get("heavy_metal_fix") or 0.0),
    }


async def _fetch_uniprot_description(uniprot_id: str) -> Optional[str]:
    """从 UniProt 拉取蛋白功能描述（失败返回 None）。"""
    if not uniprot_id:
        return None
    if uniprot_id in _UNIPROT_DESC_CACHE:
        return _UNIPROT_DESC_CACHE[uniprot_id]
    try:
        data = await gene_db_client.fetch_uniprot_entry(uniprot_id)
        if not data:
            _UNIPROT_DESC_CACHE[uniprot_id] = None
            return None
        # 尝试从 comments[functions] 提取描述
        comments = data.get("comments") or []
        for c in comments:
            if c.get("commentType") == "FUNCTION":
                texts = c.get("texts") or []
                if texts:
                    desc = str(texts[0].get("value", ""))[:400]
                    _UNIPROT_DESC_CACHE[uniprot_id] = desc
                    return desc
        # 退化：用蛋白推荐名
        rec_name = (
            data.get("proteinDescription", {})
            .get("recommendedName", {})
            .get("fullName", {})
            .get("value")
        )
        desc = str(rec_name) if rec_name else None
        _UNIPROT_DESC_CACHE[uniprot_id] = desc
        return desc
    except Exception as exc:  # noqa: BLE001
        logger.warning("UniProt fetch failed for %s: %s", uniprot_id, exc)
        _UNIPROT_DESC_CACHE[uniprot_id] = None
        return None


async def _llm_explain(
    protein: Dict[str, Any],
    chassis_id: str,
    mission_id: str,
    uniprot_desc: Optional[str],
) -> str:
    """调 LLM 生成 80 字中文 explanation；失败降级。"""
    fallback = (uniprot_desc or protein.get("llm_explanation") or "")[:80]
    cache_key = "|".join(
        [
            str(protein.get("id") or ""),
            chassis_id,
            mission_id,
            str(uniprot_desc or ""),
        ]
    )
    if cache_key in _PROTEIN_EXPLANATION_CACHE:
        return _PROTEIN_EXPLANATION_CACHE[cache_key]

    settings = get_settings()
    if not settings.LLM_PROTEIN_EXPLANATIONS_ENABLED or not llm_client.is_llm_configured():
        _PROTEIN_EXPLANATION_CACHE[cache_key] = fallback
        return fallback

    try:
        system_prompt = (
            "你是合成生物学专家。根据给定的蛋白信息、底盘和任务，"
            "用一句中文（80 字以内）解释为何此蛋白适合该任务，必须基于事实。"
        )
        user_msg = json.dumps(
            {
                "protein_name": protein.get("name"),
                "ec_number": protein.get("ec_number"),
                "source_organism": protein.get("source_organism"),
                "kinetics": protein.get("kinetics"),
                "uniprot_description": uniprot_desc,
                "chassis_id": chassis_id,
                "mission_id": mission_id,
            },
            ensure_ascii=False,
        )
        text = await llm_client.chat_completion(
            system_prompt=system_prompt,
            user_message=user_msg,
            temperature=0.3,
            max_tokens=200,
        )
        text = (text or "").strip()
        if not text:
            _PROTEIN_EXPLANATION_CACHE[cache_key] = fallback
            return fallback
        explanation = text[:120]
        _PROTEIN_EXPLANATION_CACHE[cache_key] = explanation
        return explanation
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM explain failed for protein %s: %s", protein.get("id"), exc)
        _PROTEIN_EXPLANATION_CACHE[cache_key] = fallback
        return fallback


def _to_candidate(protein: Dict[str, Any], explanation: str) -> Dict[str, Any]:
    return {
        "id": protein.get("id", ""),
        "name": protein.get("name", ""),
        "ec_number": protein.get("ec_number", ""),
        "source_organism": protein.get("source_organism", ""),
        "uniprot_id": protein.get("uniprot_id", ""),
        "kinetics": _ensure_kinetics(protein.get("kinetics")),
        "expected_effect_vector": _ensure_effect_vector(protein.get("expected_effect_vector")),
        "llm_explanation": explanation,
        "brenda_url": protein.get("brenda_url", ""),
        "uniprot_url": protein.get("uniprot_url", ""),
    }


async def recommend_proteins(
    chassis_id: str,
    mission_id: str,
    top_n: int = 5,
) -> List[Dict[str, Any]]:
    """返回 top_n 个蛋白候选（含 LLM explanation）。"""
    if not PROTEIN_DATA:
        return []

    # 1) 按任务关键词打分排序
    scored = [
        (p, _score_protein_for_mission(p, mission_id)) for p in PROTEIN_DATA
    ]
    scored.sort(key=lambda x: x[1], reverse=True)

    # 取前 top_n（如果全 0，至少返回前 top_n 个）
    selected = [p for p, _ in scored[:top_n]]

    settings = get_settings()
    enrich_with_llm = settings.LLM_PROTEIN_EXPLANATIONS_ENABLED and llm_client.is_llm_configured()

    if not enrich_with_llm:
        return [_to_candidate(p, (p.get("llm_explanation") or "")[:120]) for p in selected]

    # 2) 可选：并发拉 UniProt + LLM 解释
    async def enrich(p: Dict[str, Any]) -> Dict[str, Any]:
        uniprot_id = p.get("uniprot_id", "")
        desc = await _fetch_uniprot_description(uniprot_id)
        explanation = await _llm_explain(p, chassis_id, mission_id, desc)
        return _to_candidate(p, explanation)

    try:
        candidates = await asyncio.gather(*(enrich(p) for p in selected))
        return list(candidates)
    except Exception as exc:  # noqa: BLE001
        logger.warning("enrich proteins failed: %s", exc)
        return [_to_candidate(p, (p.get("llm_explanation") or "")[:80]) for p in selected]
