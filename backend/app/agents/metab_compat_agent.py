from typing import Any, Dict

from app.agents.base_agent import BaseAgent


class MetabCompatAgent(BaseAgent):
    """代谢兼容性 Agent — 验证工程化代谢途径与宿主的兼容性"""

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
        return self._build_prompt([
            ("底盘微生物", input_data.get("candidate_organisms")),
            ("引入的基因模块", input_data.get("gene_clusters")),
            ("设计的逻辑回路", input_data.get("logic_gates")),
            ("环境约束", input_data.get("constraints")),
            ("上游 Agent 关键发现", input_data.get("upstream_findings")),
            ("", "请分析上述工程化代谢途径与宿主代谢网络的兼容性，评估毒性中间体风险，并给出优化建议。"),
        ])
