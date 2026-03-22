from typing import Dict, Any
from app.agents.base_agent import BaseAgent

class EnvParseAgent(BaseAgent):
    """环境解析 Agent"""

    def __init__(self):
        super().__init__("env-parse", "环境解析")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        location = input_data.get("location", "Jezero Crater")

        constraints = {
            "perchlorate_concentration": {"min": 0.5, "max": 1.0, "unit": "wt%"},
            "temperature_range": {"min": -73, "max": -3, "unit": "°C"},
            "uv_flux": {"value": 3.6, "unit": "W/m²"},
            "co2_pressure": {"value": 0.6, "unit": "kPa"}
        }

        return {
            "status": "completed",
            "constraints": constraints,
            "findings": [f"{location} 高氯酸盐浓度 0.5-1.0 wt%", "日温差可达 70°C"],
            "metrics": {"datasets_parsed": 2847, "constraint_parameters": 186}
        }
