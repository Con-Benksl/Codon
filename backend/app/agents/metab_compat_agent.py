import logging
from typing import Any, Dict, Optional

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


def _run_fba_analysis(organisms: Any, constraints: Any) -> Optional[Dict[str, Any]]:
    """
    使用 COBRApy 对 E. coli core 模型做 FBA 基准分析，
    再模拟火星条件（低氧、高氯酸盐压力）下的代谢通量变化。
    """
    try:
        import cobra
        from cobra.io import load_model

        model = load_model("e_coli_core")  # COBRApy 内置模型

        baseline_solution = model.optimize()
        baseline_biomass = float(baseline_solution.objective_value) if baseline_solution.status == "optimal" else None

        # 模拟火星低氧条件：限制 O₂ 摄入
        mars_results = {}
        with model:
            o2_rxn = model.reactions.get_by_id("EX_o2_e")
            o2_rxn.lower_bound = -2.0  # 火星大气 O₂ 极低，正常值 -20
            sol_low_o2 = model.optimize()
            mars_results["low_o2_biomass"] = float(sol_low_o2.objective_value) if sol_low_o2.status == "optimal" else 0.0
            mars_results["low_o2_status"] = sol_low_o2.status

        # 模拟高氯酸盐压力：假设增加 ATP 维护负荷（perchlorate detox 消耗能量）
        with model:
            atpm_rxn = model.reactions.get_by_id("ATPM")
            atpm_rxn.lower_bound = atpm_rxn.lower_bound * 1.5  # 增加 50% ATP 维护
            sol_perchlorate = model.optimize()
            mars_results["perchlorate_stress_biomass"] = float(sol_perchlorate.objective_value) if sol_perchlorate.status == "optimal" else 0.0

        # 计算代谢负担
        mars_biomass = mars_results["low_o2_biomass"]
        metabolic_burden = round(1.0 - (mars_biomass / baseline_biomass), 3) if baseline_biomass and baseline_biomass > 0 else None

        return {
            "model_id": model.id,
            "model_reactions": len(model.reactions),
            "model_metabolites": len(model.metabolites),
            "baseline_biomass_flux": round(baseline_biomass, 4) if baseline_biomass else None,
            "mars_low_o2_biomass_flux": round(mars_results["low_o2_biomass"], 4),
            "mars_perchlorate_stress_biomass_flux": round(mars_results["perchlorate_stress_biomass"], 4),
            "metabolic_burden_ratio": metabolic_burden,
            "note": "基于 E. coli core 模型的 FBA 基准；实际底盘需替换为对应物种模型",
        }

    except ImportError:
        logger.warning("COBRApy 未安装，跳过 FBA 计算")
        return None
    except Exception as e:
        logger.warning("FBA 分析失败: %s", e)
        return None


class MetabCompatAgent(BaseAgent):
    """代谢兼容性 Agent — 验证工程化代谢途径与宿主的兼容性（COBRApy FBA 增强）"""

    system_prompt = """你是代谢工程与通量平衡分析（FBA）专家。评估引入外源基因模块后对宿主代谢网络的影响。

你需要分析：
1. 外源代谢途径与宿主原生代谢网络的兼容性
2. 碳/氮/能量通量的重分配
3. 毒性中间产物的积累风险
4. ATP/NAD(P)H 等辅因子平衡
5. 理论生物量产率和倍增时间

请返回以下 JSON 格式：
{
  "status": "completed",
  "fba_results": {
    "biomass_flux": 数值, "biomass_flux_unit": "h⁻¹",
    "atp_yield": 数值, "doubling_time_hours": 数值,
    "carbon_efficiency": 0.0-1.0,
    "redox_balance": {"nad_ratio": 数值, "status": "balanced/imbalanced"}
  },
  "toxic_intermediates": [{"name": "化合物名", "concentration_risk": "低/中/高", "mitigation": "缓解策略"}],
  "pathway_conflicts": [{"pathway1": "途径1", "pathway2": "途径2", "conflict_type": "描述", "resolution": "解决方案"}],
  "optimization_suggestions": ["建议1"],
  "findings": ["关键发现1"],
  "metrics": {"metabolic_reactions": 数量, "fba_solutions": 可行解数量}
}"""

    def __init__(self):
        super().__init__("metab-compat", "代谢兼容性")

    def build_user_prompt(self, input_data: Dict[str, Any]) -> str:
        organisms = input_data.get("candidate_organisms")
        constraints = input_data.get("constraints")

        self.log_progress("COBRApy FBA 分析启动")
        fba_data = _run_fba_analysis(organisms, constraints)
        if fba_data:
            self.log_progress(
                f"FBA 完成: baseline={fba_data.get('baseline_biomass_flux')}, "
                f"mars_low_o2={fba_data.get('mars_low_o2_biomass_flux')}"
            )

        return self._build_prompt([
            ("底盘微生物", organisms),
            ("引入的基因模块", input_data.get("gene_clusters")),
            ("设计的逻辑回路", input_data.get("logic_gates")),
            ("环境约束", constraints),
            ("COBRApy FBA 基准计算结果（真实数据）", fba_data if fba_data else "COBRApy 未运行，请基于理论估算"),
            ("上游 Agent 关键发现", input_data.get("upstream_findings")),
            ("", "请基于上述 COBRApy FBA 数据，分析工程化代谢途径与宿主代谢网络的兼容性，评估毒性中间体风险，并给出优化建议。重点关注火星低氧条件和高氯酸盐压力对代谢通量的影响。"),
        ])
