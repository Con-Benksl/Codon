import json
import asyncio
from abc import ABC, abstractmethod
from typing import Any, Dict, List
from datetime import datetime
import logging

from app.config import get_settings
from app.services.llm_client import chat_completion_json

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Agent 基类 — 每个 Agent 通过 LLM 进行推理，输出结构化 JSON"""

    agent_id: str = ""
    agent_name: str = ""
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
            timeout_seconds = float(get_settings().AGENT_EXECUTE_TIMEOUT_SECONDS)
            result = await asyncio.wait_for(
                chat_completion_json(
                    system_prompt=self.system_prompt,
                    user_message=user_prompt,
                ),
                timeout=timeout_seconds,
            )
        except asyncio.TimeoutError:
            error = f"Agent timed out after {timeout_seconds:g} seconds"
            self.log_progress(error, level="error")
            return {"status": "failed", "error": error, "findings": [], "metrics": {}}
        except Exception as e:
            self.log_progress(f"LLM 调用失败: {e}", level="error")
            return {"status": "failed", "error": str(e), "findings": [], "metrics": {}}

        result.setdefault("status", "completed")
        result.setdefault("findings", [])
        result.setdefault("metrics", {})

        self.log_progress(f"执行完成，findings 数量: {len(result.get('findings', []))}")
        return result

    def validate_input(self, input_data: Dict[str, Any], required_fields: List[str]) -> None:
        missing = [f for f in required_fields if f not in input_data]
        if missing:
            raise ValueError(f"缺少必需字段: {', '.join(missing)}")

    def log_progress(self, message: str, level: str = "info") -> None:
        log_func = getattr(self.logger, level, self.logger.info)
        log_func("[%s] %s", self.agent_id, message)

    @staticmethod
    def _build_prompt(sections: List[tuple]) -> str:
        """将多个 (label, data) 段落拼接为 prompt。

        data 为 dict/list 时自动 JSON 序列化；为 str 时直接使用；
        为 list[str] 时格式化为项目符号列表。
        """
        parts = []
        for label, data in sections:
            if data is None:
                continue
            if isinstance(data, str):
                if data:
                    parts.append(f"{label}：{data}" if label else data)
            elif isinstance(data, list):
                if data:
                    if all(isinstance(i, str) for i in data):
                        formatted = "\n".join(f"- {i}" for i in data)
                    else:
                        formatted = json.dumps(data, ensure_ascii=False, indent=2)
                    parts.append(f"{label}：\n{formatted}" if label else formatted)
            elif isinstance(data, dict):
                if data:
                    parts.append(
                        f"{label}：\n{json.dumps(data, ensure_ascii=False, indent=2)}"
                        if label else json.dumps(data, ensure_ascii=False, indent=2)
                    )
        return "\n\n".join(parts)
