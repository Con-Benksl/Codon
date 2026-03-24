"""LLM 客户端 — 封装中转 API 调用（OpenAI 兼容格式）"""

import asyncio
import json
import logging
import re
from typing import Any, Dict, Optional

import httpx
from openai import AsyncOpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: Optional[AsyncOpenAI] = None

REQUEST_TIMEOUT = 180
MAX_RETRIES = 2
RETRY_DELAY = 3


def get_llm_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
            timeout=httpx.Timeout(REQUEST_TIMEOUT, connect=30),
            max_retries=0,
        )
    return _client


async def close_llm_client() -> None:
    """关闭连接池（在 app shutdown 时调用）"""
    global _client
    if _client is not None:
        await _client.close()
        _client = None


async def chat_completion(
    system_prompt: str,
    user_message: str,
    *,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
) -> str:
    """发送聊天请求，返回文本响应（带重试）"""
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

    last_error: Optional[Exception] = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            logger.info(
                "LLM request (attempt %d/%d): model=%s, prompt_len=%d",
                attempt + 1, MAX_RETRIES + 1, settings.LLM_MODEL, len(user_message),
            )
            response = await client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content or ""
            logger.info("LLM response: tokens=%s", response.usage)
            return content

        except Exception as e:
            last_error = e
            logger.warning("LLM request failed (attempt %d/%d): %s", attempt + 1, MAX_RETRIES + 1, e)
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY * (attempt + 1))

    raise last_error  # type: ignore[misc]


def _extract_json(text: str) -> Optional[str]:
    """从 LLM 响应中提取 JSON — 支持 ```json 代码块或裸 JSON"""
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        return text[start:end + 1]
    return None


async def chat_completion_json(
    system_prompt: str,
    user_message: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """发送聊天请求，返回解析后的 JSON dict"""
    json_instruction = "\n\n重要：请只返回 JSON 对象，不要包含任何其他文字说明。"
    raw = await chat_completion(system_prompt + json_instruction, user_message, **kwargs)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    extracted = _extract_json(raw)
    if extracted:
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            pass

    logger.error("LLM 返回的 JSON 解析失败: %s", raw[:500])
    return {"error": "JSON parse failed", "raw_response": raw[:1000]}
