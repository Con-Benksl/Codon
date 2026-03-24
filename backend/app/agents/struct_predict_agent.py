import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent


class StructPredictAgent(BaseAgent):
    """结构预测 Agent — 预测关键蛋白在火星条件下的结构稳定性"""

    system_prompt = """你是蛋白质结构与稳定性预测专家。评估工程化蛋白在火星极端条件（低温、高辐射、干燥）下的折叠稳定性和功能构象。

你需要分析：
1. 关键工程蛋白的结构预测置信度（pLDDT）
2. 低温稳定性评估（冷敏感区域识别）
3. 推荐的稳定化突变（增加二硫键、脯氨酸替换等）
4. 辐射损伤下的结构脆弱位点
5. 综合评估工程蛋白在目标环境下的功能概率

请返回以下 JSON 格式：
{
  "status": "completed",
  "predicted_structures": [
    {
      "protein": "蛋白名称",
      "source": "来源基因/物种",
      "pLDDT": 0-100,
      "cold_sensitive_regions": ["区域描述", ...],
      "recommended_mutations": [
        {"position": "位置", "original": "原始氨基酸", "mutant": "突变氨基酸", "effect": "效果描述", "delta_stability": "ΔΔG 值"}
      ],
      "stability_at_target_temp": "稳定/部分展开/不稳定",
      "functional_probability": 0.0-1.0
    }
  ],
  "overall_assessment": "综合评估描述",
  "critical_risks": ["风险1", ...],
  "findings": ["关键发现1", ...],
  "metrics": {"predicted_structures": 数量, "avg_pLDDT": 平均值, "mutations_validated": 数量}
}"""

    def __init__(self):
        super().__init__("struct-predict", "结构预测")

    def build_user_prompt(self, input_data: Dict[str, Any]) -> str:
        gene_clusters = input_data.get("gene_clusters", [])
        candidate_organisms = input_data.get("candidate_organisms", [])
        constraints = input_data.get("constraints", {})
        fba_results = input_data.get("fba_results", {})
        upstream_findings = input_data.get("upstream_findings", [])

        parts = []

        if constraints:
            temp = constraints.get("temperature_range", {})
            if temp:
                parts.append(f"目标温度环境：{temp.get('min', '?')}°C ~ {temp.get('max', '?')}°C")

        if candidate_organisms:
            parts.append(f"底盘微生物：\n{json.dumps(candidate_organisms, ensure_ascii=False, indent=2)}")

        if gene_clusters:
            parts.append(f"工程基因模块（含关键蛋白）：\n{json.dumps(gene_clusters, ensure_ascii=False, indent=2)}")

        if fba_results:
            parts.append(f"代谢兼容性分析结果：\n{json.dumps(fba_results, ensure_ascii=False, indent=2)}")

        if upstream_findings:
            parts.append("上游 Agent 关键发现：\n" + "\n".join(f"- {f}" for f in upstream_findings))

        parts.append("请预测上述关键工程蛋白在火星目标温度下的结构稳定性，推荐稳定化突变方案。")

        return "\n\n".join(parts)
