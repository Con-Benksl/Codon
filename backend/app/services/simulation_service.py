"""ODE 仿真服务 — scipy solve_ivp 求解 3 状态变量耦合系统。

状态变量：
- N: 种群密度 (cell/mL)
- E: 环境目标参数（无量纲，0-1，例如 O2 分压归一化）
- S: 限制性养分（无量纲，1.0 起始）

ODE：
    dN/dt = r*N*(1 - N/K)*f(env) - d*N
    dE/dt = alpha*N*Vmax*S/(Km+S) - beta*(E - E0)
    dS/dt = -gamma*N*Vmax*S/(Km+S)
"""
from __future__ import annotations

import logging
import math
from typing import Any, Dict, List

import numpy as np

logger = logging.getLogger(__name__)

# ---------- 安全数值工具 ----------

def _safe_float(v: Any, default: float) -> float:
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (TypeError, ValueError):
        return default


def _env_match_factor(chassis: Dict[str, Any], env: Dict[str, Any]) -> float:
    """根据 chassis tolerance.temperature 与 env.temperature 匹配度估算生长系数。"""
    tol = (chassis or {}).get("tolerance") or {}
    temp_tol = tol.get("temperature") or {}
    lo = _safe_float(temp_tol.get("min"), -10.0)
    hi = _safe_float(temp_tol.get("max"), 45.0)
    t = _safe_float((env or {}).get("temperature"), (lo + hi) / 2)
    if lo <= t <= hi:
        return 1.0
    distance = (lo - t) if t < lo else (t - hi)
    return max(0.05, 1.0 - distance / 30.0)


def simulate(
    chassis: Dict[str, Any],
    protein: Dict[str, Any],
    env: Dict[str, Any],
    steps: int = 200,
) -> List[Dict[str, float]]:
    """求解 ODE 并返回 steps 个均匀采样点。"""
    # ---------- 参数提取（含安全默认） ----------
    kinetics = (protein or {}).get("kinetics") or {}
    kcat = _safe_float(kinetics.get("kcat"), 10.0)
    if kcat <= 0:
        kcat = 1.0
    km = _safe_float(kinetics.get("km"), 1.0)
    if km <= 0:
        km = 1.0

    env_factor = _env_match_factor(chassis, env)

    # 模型常数
    r0 = 0.6 * env_factor          # 内禀增长率 (1/h)
    K = 1e9                        # 承载力 (cell/mL)
    death = 0.02                   # 死亡率
    Vmax = kcat                    # 单细胞催化常数（直接用 kcat 量纲简化）
    alpha = 1e-11                  # N → E 转化效率（很小，因为 N 很大）
    beta = 0.05                    # E 自然回弹
    E0 = 0.0
    gamma = 1e-12                  # S 消耗系数

    # 初始状态
    N0 = 1e5
    E_init = 0.0
    S0 = 1.0

    t_start, t_end = 0.0, 48.0  # 48 小时
    t_eval = np.linspace(t_start, t_end, steps)

    def rhs(t: float, y: np.ndarray) -> List[float]:
        N, E, S = y
        N = max(0.0, N)
        S = max(0.0, S)
        mm = Vmax * S / (km + S) if (km + S) > 0 else 0.0
        dN = r0 * N * (1.0 - N / K) - death * N
        dE = alpha * N * mm - beta * (E - E0)
        dS = -gamma * N * mm
        return [dN, dE, dS]

    # ---------- 求解（lazy import scipy） ----------
    try:
        from scipy.integrate import solve_ivp  # type: ignore

        sol = solve_ivp(
            rhs,
            (t_start, t_end),
            [N0, E_init, S0],
            t_eval=t_eval,
            method="RK45",
            rtol=1e-4,
            atol=1e-6,
        )
        if not sol.success:
            raise RuntimeError(f"solve_ivp failed: {sol.message}")
        N_arr = sol.y[0]
        E_arr = sol.y[1]
        S_arr = sol.y[2]
    except Exception as exc:  # noqa: BLE001
        logger.warning("scipy ODE solve failed (%s), falling back to Euler", exc)
        N_arr, E_arr, S_arr = _euler_fallback(
            rhs, [N0, E_init, S0], t_start, t_end, steps
        )

    # 归一化 population 到 0-1（除以 K）便于前端绘图
    out: List[Dict[str, float]] = []
    for i in range(steps):
        N = float(N_arr[i])
        E = float(E_arr[i])
        S = float(S_arr[i])
        # NaN 防御
        if math.isnan(N) or math.isinf(N):
            N = 0.0
        if math.isnan(E) or math.isinf(E):
            E = 0.0
        if math.isnan(S) or math.isinf(S):
            S = 0.0
        out.append(
            {
                "time": round(float(t_eval[i]), 4),
                "population": round(max(0.0, N) / K, 6),
                "env_target": round(E, 6),
                "nutrient": round(max(0.0, S), 6),
            }
        )
    return out


def _euler_fallback(rhs, y0, t_start, t_end, steps):
    """无 scipy 时的简单显式 Euler 兜底。"""
    t_arr = np.linspace(t_start, t_end, steps)
    dt = (t_end - t_start) / max(1, steps - 1)
    N = np.zeros(steps)
    E = np.zeros(steps)
    S = np.zeros(steps)
    N[0], E[0], S[0] = y0
    for i in range(1, steps):
        dN, dE, dS = rhs(t_arr[i - 1], [N[i - 1], E[i - 1], S[i - 1]])
        N[i] = N[i - 1] + dN * dt
        E[i] = E[i - 1] + dE * dt
        S[i] = S[i - 1] + dS * dt
    return N, E, S
