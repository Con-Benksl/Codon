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


def get_llm_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        request_timeout = float(settings.LLM_REQUEST_TIMEOUT_SECONDS)
        _client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
            timeout=httpx.Timeout(request_timeout, connect=request_timeout),
            max_retries=0,
        )
    return _client


def is_llm_configured() -> bool:
    """Return whether runtime configuration has enough data to call the LLM."""
    settings = get_settings()
    return bool(settings.LLM_API_KEY.strip() and settings.LLM_MODEL.strip())


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
    retry_attempts = max(0, int(settings.LLM_RETRY_ATTEMPTS))
    total_attempts = retry_attempts + 1
    request_timeout = float(settings.LLM_REQUEST_TIMEOUT_SECONDS)
    base_delay = max(0.0, float(settings.LLM_RETRY_BASE_DELAY_SECONDS))

    for attempt in range(total_attempts):
        try:
            logger.info(
                "LLM request (attempt %d/%d): model=%s, prompt_len=%d",
                attempt + 1, total_attempts, settings.LLM_MODEL, len(user_message),
            )
            response = await asyncio.wait_for(
                client.chat.completions.create(**kwargs),
                timeout=request_timeout,
            )
            content = response.choices[0].message.content or ""
            logger.info("LLM response: tokens=%s", response.usage)
            return content

        except Exception as e:
            last_error = e
            logger.warning("LLM request failed (attempt %d/%d): %s", attempt + 1, total_attempts, e)
            if attempt < retry_attempts:
                await asyncio.sleep(base_delay * (2 ** attempt))

    raise last_error  # type: ignore[misc]


def _parse_json_object(text: str) -> Optional[Dict[str, Any]]:
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _find_last_json_object(text: str) -> Optional[str]:
    decoder = json.JSONDecoder()
    latest: Optional[str] = None
    for index, char in enumerate(text):
        if char != "{":
            continue
        try:
            parsed, end = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            latest = text[index:index + end]
    return latest


def _extract_json(text: str) -> Optional[str]:
    """从 LLM 响应中提取 JSON — 支持 ```json 代码块或裸 JSON"""
    code_blocks = [
        match.group(1).strip()
        for match in re.finditer(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    ]
    for block in reversed(code_blocks):
        if _parse_json_object(block) is not None:
            return block

    without_reasoning = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)
    candidate = _find_last_json_object(without_reasoning)
    if candidate:
        return candidate

    candidate = _find_last_json_object(text)
    if candidate:
        return candidate
    return None


async def chat_completion_json(
    system_prompt: str,
    user_message: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """发送聊天请求，返回解析后的 JSON dict"""
    json_instruction = "\n\n重要：请只返回 JSON 对象，不要包含任何其他文字说明。"
    raw = await chat_completion(system_prompt + json_instruction, user_message, **kwargs)

    parsed = _parse_json_object(raw)
    if parsed is not None:
        return parsed

    extracted = _extract_json(raw)
    if extracted:
        parsed = _parse_json_object(extracted)
        if parsed is not None:
            return parsed

    logger.error("LLM 返回的 JSON 解析失败: %s", raw[:500])
    return {"error": "JSON parse failed", "raw_response": raw[:1000]}
