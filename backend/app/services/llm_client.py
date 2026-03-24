"""LLM 客户端 — 封装中转 API 调用（OpenAI 兼容格式）"""

import json
import logging
from typing import Any, Dict, Optional

from openai import AsyncOpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: Optional[AsyncOpenAI] = None


def get_llm_client() -> AsyncOpenAI:
    """获取单例 LLM 客户端"""
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )
    return _client


async def chat_completion(
    system_prompt: str,
    user_message: str,
    *,
    response_format: Optional[Dict[str, Any]] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
) -> str:
    """发送聊天请求，返回文本响应"""
    settings = get_settings()
    client = get_llm_client()

    kwargs: Dict[str, Any] = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature if temperature is not None else settings.LLM_TEMPERATURE,
        "max_tokens": max_tokens or settings.LLM_MAX_TOKENS,
    }

    if response_format is not None:
        kwargs["response_format"] = response_format

    logger.info("LLM request: model=%s, prompt_len=%d", settings.LLM_MODEL, len(user_message))

    response = await client.chat.completions.create(**kwargs)
    content = response.choices[0].message.content or ""

    logger.info("LLM response: tokens=%s", response.usage)
    return content


async def chat_completion_json(
    system_prompt: str,
    user_message: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """发送聊天请求，返回解析后的 JSON dict"""
    raw = await chat_completion(
        system_prompt,
        user_message,
        response_format={"type": "json_object"},
        **kwargs,
    )
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.error("LLM 返回的 JSON 解析失败: %s", raw[:500])
        return {"error": "JSON parse failed", "raw_response": raw[:1000]}
