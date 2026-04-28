"""AI 对话接口 — 用户可与 Martian Biolab AI 助手实时对话"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.llm_client import chat_completion, is_llm_configured

router = APIRouter()

SYSTEM_PROMPT = """\
你是 Martian Biolab AI 的内置科研助手，专注于火星合成生物学研究平台。
你可以帮助用户：
- 设计适合火星极端环境（高氯酸盐、UV 辐射、低温、低压）的微生物代谢路径
- 分析辐射耐受（D. radiodurans）、光合菌（Chroococcidiopsis）等候选菌株特性
- 解释 SBOL 2.3、GenBank、多智能体编排管线的工作原理
- 讨论合成基因回路设计、FBA 通量分析、蒙特卡洛仿真结果
- 解读页面上显示的 Agent 运行结果和验证报告
用户用中文提问时用中文回答，用英文提问时用英文回答。保持专业、简洁、有帮助。\
"""


class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None  # 当前页面的上下文信息（可选）


class ChatReply(BaseModel):
    reply: str


@router.post("/", response_model=ChatReply)
async def chat(payload: ChatMessage):
    """与 Martian Biolab AI 助手对话"""
    if not is_llm_configured():
        return ChatReply(
            reply="LLM_API_KEY 尚未配置。请在后端环境变量中设置 LLM_API_KEY、LLM_BASE_URL 和 LLM_MODEL 后重试。"
        )

    system = SYSTEM_PROMPT
    if payload.context:
        system += f"\n\n[当前页面上下文]\n{payload.context}"

    try:
        reply = await chat_completion(
            system,
            payload.message,
            max_tokens=800,
            temperature=0.7,
        )
    except Exception as exc:  # noqa: BLE001
        reply = f"LLM 调用失败：{exc}"
    return ChatReply(reply=reply)
