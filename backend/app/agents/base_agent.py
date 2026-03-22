from abc import ABC, abstractmethod
from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Agent 基类"""

    def __init__(self, agent_id: str, agent_name: str):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.logger = logging.getLogger(f"agent.{agent_id}")

    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """执行 Agent 逻辑"""
        pass

    def validate_input(self, input_data: Dict[str, Any], required_fields: List[str]) -> None:
        """验证输入数据"""
        missing_fields = [field for field in required_fields if field not in input_data]
        if missing_fields:
            raise ValueError(f"缺少必需字段: {', '.join(missing_fields)}")

    def log_progress(self, message: str, level: str = "info"):
        """记录进度日志"""
        log_entry = {
            "time": datetime.utcnow().isoformat(),
            "message": message,
            "level": level
        }
        self.logger.info(f"[{self.agent_id}] {message}")
        return log_entry
