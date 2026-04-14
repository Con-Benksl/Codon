"""底盘推荐服务 — 基于环境向量与任务的 Pareto 多目标排序。

输入：
- env: 9 维环境向量 dict
- mission_id: 任务 id（用于关键词与 chassis metabolic_traits 匹配）

输出：
- 排序后的 ChassisCandidate 兼容 dict 列表（top_n 条）
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------- 数据加载（模块级常量，进程启动时一次性加载） ----------

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "extremophile_chassis.json"

try:
    with open(_DATA_PATH, "r", encoding="utf-8") as f:
        CHASSIS_DATA: List[Dict[str, Any]] = json.load(f)
except Exception as exc:  # noqa: BLE001
    logger.error("Failed to load extremophile_chassis.json: %s", exc)
    CHASSIS_DATA = []


# ---------- 9 维环境维度 ----------

_ENV_DIMS = (
    "temperature",
    "ionizing_radiation",
    "uv_flux",
    "pressure",
    "ph",
    "salinity",
    "water_activity",
    "oxygen",
    "temp_diurnal_range",
)

# 每个维度的"典型量级"，用于超出 tolerance 时归一化扣分
_DIM_SCALE = {
    "temperature": 60.0,
    "ionizing_radiation": 5000.0,
    "uv_flux": 100.0,
    "pressure": 50000.0,
    "ph": 5.0,
    "salinity": 15.0,
    "water_activity": 0.5,
    "oxygen": 21.0,
    "temp_diurnal_range": 50.0,
}

_TRACTABILITY_MAP = {
    "high": 1.0,
    "medium": 0.6,
    "low": 0.3,
}

# 任务 id → 关键词列表，用于与 chassis.metabolic_traits 文本匹配
_MISSION_KEYWORDS: Dict[str, List[str]] = {
    "mission_oxygen_carbon_fixation": [
        "photoautotroph", "photosynthesis", "carbon", "oxygenic", "cyanobacteria",
    ],
    "mission_nitrogen_fixation_soil": [
        "nitrogen", "diazotroph", "nitrogen-fixing", "soil",
    ],
    "mission_heavy_metal_uptake": [
        "metal", "heavy", "biosorption", "reductase", "metalloprotein",
    ],
    "mission_radionuclide_immobilization": [
        "radiation", "radioresistant", "metal", "reduction", "u(vi)", "actinide",
    ],
    # 别名兼容
    "mission_radioactive_fixation": [
        "radiation", "radioresistant", "metal", "reduction", "actinide",
    ],
    "mission_acid_neutralization": [
        "acidophile", "alkaliphile", "ph", "buffer", "acid",
    ],
    "mission_plastic_degradation": [
        "degradation", "esterase", "hydrolase", "plastic", "secretome",
    ],
    "mission_oil_spill_remediation": [
        "hydrocarbon", "oil", "alkane", "degradation", "heterotroph",
    ],
    "mission_organochlorine_degradation": [
        "dehalogen", "chlorinated", "anaerobe", "degradation",
    ],
    "mission_phosphate_release": [
        "phosphate", "solubiliz", "acid", "soil",
    ],
    "mission_biofilm_soil_stabilization": [
        "biofilm", "eps", "exopolysaccharide", "endolithic", "desiccation",
    ],
}


# ---------- 评分函数 ----------

def _score_tolerance(env: Dict[str, float], tolerance: Dict[str, Dict[str, float]]) -> float:
    """9 维耐受度匹配（0-1）。

    每维：
    - env 值在 [min, max] 内 → 1.0
    - 超出 → 1.0 - min(1.0, 距离 / 维度量级)
    - 缺失数据 → 0.5（保守中值）
    """
    if not tolerance:
        return 0.0
    total = 0.0
    valid = 0
    for dim in _ENV_DIMS:
        rng = tolerance.get(dim)
        if not isinstance(rng, dict):
            total += 0.5
            valid += 1
            continue
        lo = float(rng.get("min", 0.0))
        hi = float(rng.get("max", 0.0))
        v = float(env.get(dim, (lo + hi) / 2))
        if lo <= v <= hi:
            score = 1.0
        else:
            distance = (lo - v) if v < lo else (v - hi)
            scale = _DIM_SCALE.get(dim, 1.0) or 1.0
            score = max(0.0, 1.0 - distance / scale)
        total += score
        valid += 1
    return total / valid if valid else 0.0


def _score_tractability(chassis: Dict[str, Any]) -> float:
    raw = str(chassis.get("genetic_tractability", "")).strip().lower()
    return _TRACTABILITY_MAP.get(raw, 0.5)


def _score_mission(chassis: Dict[str, Any], mission_id: str) -> float:
    keywords = _MISSION_KEYWORDS.get(mission_id, [])
    if not keywords:
        return 0.5
    haystack_parts: List[str] = []
    traits = chassis.get("metabolic_traits") or []
    if isinstance(traits, list):
        haystack_parts.extend(str(t) for t in traits)
    key_genes = chassis.get("key_genes") or []
    if isinstance(key_genes, list):
        haystack_parts.extend(str(g) for g in key_genes)
    haystack_parts.append(str(chassis.get("chassis_status", "")))
    haystack = " ".join(haystack_parts).lower()
    if not haystack:
        return 0.0
    hits = sum(1 for kw in keywords if kw.lower() in haystack)
    # 归一化：命中 >=3 个即满分
    return min(1.0, hits / 3.0)


def _build_recommendation_reason(
    chassis: Dict[str, Any],
    tol_score: float,
    eng_score: float,
    mission_score: float,
) -> str:
    """生成中文一句话推荐理由。"""
    base = chassis.get("recommendation_reason") or ""
    name = chassis.get("common_name") or chassis.get("scientific_name") or "底盘"
    metrics = (
        f"环境匹配 {tol_score:.0%}、可工程化 {eng_score:.0%}、任务相关 {mission_score:.0%}"
    )
    if base:
        return f"{base}（{metrics}）"
    return f"{name}：{metrics}"


def _ensure_tolerance_shape(tolerance: Dict[str, Any]) -> Dict[str, Dict[str, float]]:
    """schema 要求 9 维全部存在；缺失维度补 0/0。"""
    safe: Dict[str, Dict[str, float]] = {}
    for dim in _ENV_DIMS:
        rng = tolerance.get(dim) if isinstance(tolerance, dict) else None
        if isinstance(rng, dict):
            safe[dim] = {
                "min": float(rng.get("min", 0.0)),
                "max": float(rng.get("max", 0.0)),
            }
        else:
            safe[dim] = {"min": 0.0, "max": 0.0}
    return safe


# ---------- 公共 API ----------

def recommend_chassis(
    env: Dict[str, float],
    mission_id: str,
    top_n: int = 6,
) -> List[Dict[str, Any]]:
    """对 CHASSIS_DATA 做三维 Pareto 加权排序，返回前 top_n 条 ChassisCandidate dict。"""
    if not CHASSIS_DATA:
        return []

    scored: List[Dict[str, Any]] = []
    for chassis in CHASSIS_DATA:
        try:
            tol = chassis.get("tolerance") or {}
            tol_score = _score_tolerance(env, tol)
            eng_score = _score_tractability(chassis)
            mission_score = _score_mission(chassis, mission_id)

            # 加权 0.5 / 0.3 / 0.2
            match_score = 0.5 * tol_score + 0.3 * eng_score + 0.2 * mission_score
            match_score = round(max(0.0, min(1.0, match_score)), 4)

            candidate = {
                "id": chassis.get("id", ""),
                "scientific_name": chassis.get("scientific_name", ""),
                "common_name": chassis.get("common_name", ""),
                "ncbi_taxid": str(chassis.get("ncbi_taxid", "")),
                "tolerance": _ensure_tolerance_shape(tol),
                "chassis_status": chassis.get("chassis_status", "unknown"),
                "genetic_tractability": chassis.get("genetic_tractability", "medium"),
                "match_score": match_score,
                "recommendation_reason": _build_recommendation_reason(
                    chassis, tol_score, eng_score, mission_score
                ),
            }
            scored.append(candidate)
        except Exception as exc:  # noqa: BLE001
            logger.warning("scoring chassis %s failed: %s", chassis.get("id"), exc)
            continue

    scored.sort(key=lambda c: c["match_score"], reverse=True)
    return scored[:top_n]
