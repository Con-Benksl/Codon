import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent


class GeneFuncAgent(BaseAgent):
    """基因功能映射 Agent — 将环境需求映射到功能基因模块"""

    system_prompt = """你是合成生物学与基因功能注释专家。根据火星环境约束和候选底盘微生物，识别需要引入或强化的功能基因模块。

你需要：
1. 将每项环境挑战映射到对应的功能基因/操纵子
2. 评估基因在候选底盘中的兼容性
3. 推荐基因来源物种
4. 标注可能的基因冲突或表达干扰

请返回以下 JSON 格式：
{
  "status": "completed",
  "gene_clusters": [
    {
      "name": "操纵子/基因簇名称",
      "function": "功能描述",
      "target_challenge": "对应的环境挑战",
      "genes": ["gene1", "gene2", ...],
      "source_organism": "基因来源物种",
      "transfer_method": "水平转移/同源重组/质粒载体",
      "compatibility_score": 0.0-1.0,
      "notes": "备注"
    }
  ],
  "recommended_gene_cassette": "推荐的模块化基因盒设计",
  "potential_conflicts": ["潜在冲突1", ...],
  "findings": ["关键发现1", ...],
  "metrics": {"mapped_clusters": 数量, "annotation_coverage": 0.0-1.0}
}"""

    def __init__(self):
        super().__init__("gene-func", "基因功能映射")

    def build_user_prompt(self, input_data: Dict[str, Any]) -> str:
        constraints = input_data.get("constraints", {})
        candidates = input_data.get("candidate_organisms", [])
        upstream_findings = input_data.get("upstream_findings", [])

        parts = []

        if constraints:
            parts.append(f"环境约束：\n{json.dumps(constraints, ensure_ascii=False, indent=2)}")

        if candidates:
            parts.append(f"候选底盘微生物：\n{json.dumps(candidates, ensure_ascii=False, indent=2)}")

        if upstream_findings:
            parts.append("上游 Agent 关键发现：\n" + "\n".join(f"- {f}" for f in upstream_findings))

        parts.append("请为每项环境挑战映射对应的功能基因模块，并推荐模块化基因盒设计方案。")

        return "\n\n".join(parts)
