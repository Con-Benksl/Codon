from typing import Any, Dict

from app.agents.base_agent import BaseAgent


class CircuitDesignAgent(BaseAgent):
    """回路设计 Agent — 设计合成基因逻辑回路"""

    system_prompt = """你是合成生物学回路设计专家。根据功能基因模块和环境感应需求，设计基因逻辑回路。

你需要：
1. 为每个环境响应设计感应-执行回路（Sensor → Actuator）
2. 选择合适的逻辑门类型（Toggle Switch、AND/OR 门、振荡器等）
3. 选择启动子、核糖开关、终止子等调控元件
4. 确保回路正交性（互不干扰）
5. 设计安全开关（Kill Switch）防止生态逃逸

请返回以下 JSON 格式：
{
  "status": "completed",
  "logic_gates": [
    {
      "name": "回路名称",
      "type": "Toggle Switch / AND Gate / OR Gate / Oscillator",
      "sensor": "感应元件描述",
      "actuator": "执行模块描述",
      "components": ["元件1", "元件2"],
      "response_time": "响应时间",
      "orthogonality_score": 0.0-1.0,
      "notes": "设计理由"
    }
  ],
  "kill_switch": {"type": "类型描述", "mechanism": "机制描述", "reliability": 0.0-1.0},
  "overall_orthogonality": 0.0-1.0,
  "findings": ["关键发现1"],
  "metrics": {"logic_gates_designed": 数量, "simulation_pass_rate": 0.0-1.0}
}"""

    def __init__(self):
        super().__init__("circuit-design", "回路设计")

    def build_user_prompt(self, input_data: Dict[str, Any]) -> str:
        return self._build_prompt([
            ("环境约束", input_data.get("constraints")),
            ("功能基因模块", input_data.get("gene_clusters")),
            ("上游 Agent 关键发现", input_data.get("upstream_findings")),
            ("", "请为上述基因模块设计环境感应与响应的逻辑回路，并设计安全开关。"),
        ])
