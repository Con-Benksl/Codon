from abc import ABC, abstractmethod
from typing import Any, Dict, List
from datetime import datetime
import logging

from app.services.llm_client import chat_completion_json

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Agent 基类 — 每个 Agent 通过 LLM 进行推理，输出结构化 JSON"""

    agent_id: str = ""
    agent_name: str = ""

    # 子类覆盖：定义角色的 system prompt
    system_prompt: str = "You are a helpful assistant."

    def __init__(self, agent_id: str, agent_name: str):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.logger = logging.getLogger(f"agent.{agent_id}")

    @abstractmethod
    def build_user_prompt(self, input_data: Dict[str, Any]) -> str:
        """子类实现：将 input_data 组装为发送给 LLM 的 user message"""
        ...

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """执行 Agent：构建 prompt → 调用 LLM → 返回结构化结果"""
        self.log_progress("开始执行")

        user_prompt = self.build_user_prompt(input_data)
        self.log_progress(f"prompt 构建完成，长度 {len(user_prompt)} 字符")

        try:
            result = await chat_completion_json(
                system_prompt=self.system_prompt,
                user_message=user_prompt,
            )
        except Exception as e:
            self.log_progress(f"LLM 调用失败: {e}", level="error")
            return {
                "status": "failed",
                "error": str(e),
                "findings": [],
                "metrics": {},
            }

        # 确保返回标准字段
        result.setdefault("status", "completed")
        result.setdefault("findings", [])
        result.setdefault("metrics", {})

        self.log_progress(f"执行完成，findings 数量: {len(result.get('findings', []))}")
        return result

    def validate_input(self, input_data: Dict[str, Any], required_fields: List[str]) -> None:
        """验证输入数据"""
        missing_fields = [field for field in required_fields if field not in input_data]
        if missing_fields:
            raise ValueError(f"缺少必需字段: {', '.join(missing_fields)}")

    def log_progress(self, message: str, level: str = "info"):
        """记录进度日志"""
        log_func = getattr(self.logger, level, self.logger.info)
        log_func("[%s] %s", self.agent_id, message)
        return {
            "time": datetime.utcnow().isoformat(),
            "message": message,
            "level": level,
        }
