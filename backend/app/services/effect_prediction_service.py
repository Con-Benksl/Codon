"""效应预测服务 — 给 simulation_service 提供 ODE 初始参数。

公式（教学级简化）：
- rate_per_cell = kcat * expression_level
- env_factor = exp( - ((T - T_opt) / sigma_T)^2 ) * exp( - ((pH - pH_opt) / sigma_ph)^2 )
- effective_rate = rate_per_cell * env_factor
"""
from __future__ import annotations

import logging
import math
from typing import Any, Dict

logger = logging.getLogger(__name__)

_DEFAULT_EXPRESSION_LEVEL = 1e-6  # mol/cell · s^-1（启发式）
_SIGMA_TEMP = 15.0
_SIGMA_PH = 1.5


def _safe_float(v: Any, default: float = 0.0) -> float:
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (TypeError, ValueError):
        return default


def _gaussian(x: float, mu: float, sigma: float) -> float:
    if sigma <= 0:
        return 1.0
    return math.exp(-((x - mu) / sigma) ** 2)


def predict_effect(
    protein: Dict[str, Any],
    chassis: Dict[str, Any],
    env: Dict[str, Any],
) -> Dict[str, float]:
    """估算单细胞-单位时间产物速率 + 环境衰减系数。"""
    kinetics = protein.get("kinetics") or {}
    kcat = _safe_float(kinetics.get("kcat"), 1.0)
    optimal_temp = _safe_float(kinetics.get("optimal_temp"), 30.0)
    optimal_ph = _safe_float(kinetics.get("optimal_ph"), 7.0)

    env_temp = _safe_float(env.get("temperature"), optimal_temp)
    env_ph = _safe_float(env.get("ph"), optimal_ph)

    env_factor = _gaussian(env_temp, optimal_temp, _SIGMA_TEMP) * _gaussian(
        env_ph, optimal_ph, _SIGMA_PH
    )
    env_factor = max(0.0, min(1.0, env_factor))

    expression = _DEFAULT_EXPRESSION_LEVEL
    rate_per_cell = max(0.0, kcat) * expression
    effective_rate = rate_per_cell * env_factor

    eff = protein.get("expected_effect_vector") or {}
    co2_d = _safe_float(eff.get("co2_delta"), 0.0)
    o2_d = _safe_float(eff.get("o2_delta"), 0.0)
    org_d = _safe_float(eff.get("organics_delta"), 0.0)

    return {
        "co2_delta_rate": effective_rate * co2_d,
        "o2_delta_rate": effective_rate * o2_d,
        "organics_delta_rate": effective_rate * org_d,
        "env_factor": env_factor,
        "expression_assumption": expression,
        "rate_per_cell": rate_per_cell,
        "effective_rate": effective_rate,
    }
