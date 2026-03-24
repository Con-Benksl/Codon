import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent


class ExtremophileAgent(BaseAgent):
    """极端微生物筛选 Agent — 根据环境约束筛选候选底盘微生物"""

    system_prompt = """你是极端微生物学专家（Extremophile Specialist）。根据火星环境约束条件，从已知极端微生物库中筛选最佳候选底盘生物。

评估维度包括：
- 辐射耐受（UV、γ射线、宇宙射线）
- 温度耐受（极端低温、昼夜温差）
- 干燥/脱水耐受
- 高氯酸盐耐受
- 低压/真空耐受
- 可遗传工程改造性（基因组已测序、有遗传操作工具）

请返回以下 JSON 格式：
{
  "status": "completed",
  "candidate_organisms": [
    {
      "name": "学名",
      "common_name": "通用名（如有）",
      "type": "细菌/古菌/真菌/蓝藻",
      "key_tolerances": {"辐射": "耐受值", "温度": "耐受范围", ...},
      "genetic_tools_available": true/false,
      "genome_sequenced": true/false,
      "score": 0.0-1.0,
      "rationale": "推荐理由"
    }
  ],
  "recommended_chassis": "推荐的底盘组合方案描述",
  "screening_confidence": 0.0-1.0,
  "findings": ["关键发现1", ...],
  "metrics": {"candidates_screened": 总筛选数, "candidates_passed": 通过数}
}

优先推荐有充分文献支持的物种，注明关键参考文献。"""

    def __init__(self):
        super().__init__("extremophile", "极端微生物")

    def build_user_prompt(self, input_data: Dict[str, Any]) -> str:
        constraints = input_data.get("constraints", {})
        location = input_data.get("location", "未指定")
        upstream_findings = input_data.get("upstream_findings", [])

        parts = [f"目标火星地点：{location}"]

        if constraints:
            parts.append(f"环境约束条件：\n{json.dumps(constraints, ensure_ascii=False, indent=2)}")

        if upstream_findings:
            parts.append(f"环境解析 Agent 的关键发现：\n" + "\n".join(f"- {f}" for f in upstream_findings))

        parts.append("请筛选最适合在上述条件下生存的候选极端微生物，并给出推荐的底盘组合方案。")

        return "\n\n".join(parts)
