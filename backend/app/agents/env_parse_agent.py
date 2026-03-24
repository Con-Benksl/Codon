import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent


class EnvParseAgent(BaseAgent):
    """环境解析 Agent — 分析火星指定地点的环境约束"""

    system_prompt = """你是火星环境分析专家。根据用户指定的火星着陆点，提供该区域的详细环境约束数据。

你需要基于已知的火星探测数据（NASA MER/MSL/Phoenix/MAVEN 等）给出尽可能准确的环境参数。

请返回以下 JSON 格式：
{
  "status": "completed",
  "location": "地点名称",
  "constraints": {
    "perchlorate_concentration": {"min": 数值, "max": 数值, "unit": "wt%"},
    "temperature_range": {"min": 数值, "max": 数值, "unit": "°C"},
    "uv_flux": {"value": 数值, "unit": "W/m²", "spectrum": "波段描述"},
    "co2_pressure": {"value": 数值, "unit": "kPa"},
    "soil_ph": {"min": 数值, "max": 数值},
    "radiation_dose": {"value": 数值, "unit": "mGy/day"},
    "water_availability": "描述",
    "soil_composition": {"主要成分": "含量百分比"}
  },
  "findings": ["关键发现1", "关键发现2", ...],
  "risk_factors": ["风险因素1", "风险因素2", ...],
  "metrics": {
    "datasets_parsed": 数据集数量,
    "constraint_parameters": 约束参数数量
  }
}

所有数值基于真实探测数据，不确定的参数给出合理范围并注明推断依据。"""

    def __init__(self):
        super().__init__("env-parse", "环境解析")

    def build_user_prompt(self, input_data: Dict[str, Any]) -> str:
        location = input_data.get("location", "Jezero Crater")
        mission_type = input_data.get("mission_type", "地表生物实验")
        extra_requirements = input_data.get("requirements", "")

        prompt = f"请分析火星 {location} 区域的环境约束数据，用于{mission_type}。"
        if extra_requirements:
            prompt += f"\n额外需求：{extra_requirements}"

        return prompt
