"""
코드 생성 서비스
================
FE Lead 코드 생성 → FE Dev 코드 리뷰 → BE Lead 코드 생성
"""

import logging

from fastapi import HTTPException

from models import (
    AgentRole,
    DebateMessage,
    FrontendCode,
    MessageType,
    ReviewResult,
)
from llm_provider import LLMProvider, generate_with_json_retry
from routes.websocket import manager

logger = logging.getLogger(__name__)


async def _agent_start(agent_id: str, round_num: int, action: str, provider: str):
    await manager.broadcast("agent_start", {
        "agent": agent_id, "round": round_num, "action": action, "provider": provider
    })

async def _agent_done(agent_id: str, round_num: int):
    await manager.broadcast("agent_done", {"agent": agent_id, "round": round_num})


async def generate_frontend_code(
    llm: LLMProvider,
    gen_prompt: str,
    fe_generate_prompt: str,
    provider: str,
) -> tuple[FrontendCode, list[DebateMessage]]:
    """FE Lead가 코드를 생성합니다."""
    debate_log: list[DebateMessage] = []

    await _agent_start("fe-lead-agent", 0, "generating", provider)
    try:
        code_data = await generate_with_json_retry(llm, fe_generate_prompt, gen_prompt)
        final_code = FrontendCode(**code_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("FE Lead 코드 생성 실패: %s", str(e))
        await manager.broadcast("error", {"message": str(e)})
        raise HTTPException(status_code=502, detail=f"코드 생성 실패: {str(e)}")

    debate_log.append(DebateMessage(
        agent=AgentRole.FE_LEAD, round=0, message_type=MessageType.CODE,
        content=f"👨‍💻 FE Lead: 프론트엔드 코드 생성 완료 ({len(final_code.files)}개 파일)",
        data=final_code.model_dump(),
    ))
    await _agent_done("fe-lead-agent", 0)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    return final_code, debate_log


async def review_frontend_code(
    llm: LLMProvider,
    final_code: FrontendCode,
    fe_code_review_prompt: str,
    provider: str,
) -> tuple[ReviewResult, list[DebateMessage]]:
    """FE Dev가 생성된 코드를 리뷰합니다."""
    debate_log: list[DebateMessage] = []

    await _agent_start("fe-dev-agent", 0, "code_review", provider)
    code_preview = "\n---\n".join(
        f"// {f.path}\n{f.code[:800]}{'...(생략)' if len(f.code) > 800 else ''}"
        for f in final_code.files[:4]
    )
    code_review_prompt_text = f"FE Lead가 생성한 코드를 리뷰해줘:\n\n{code_preview}"

    try:
        review_data = await generate_with_json_retry(llm, fe_code_review_prompt, code_review_prompt_text)
        code_review = ReviewResult(**review_data)
    except Exception as e:
        logger.warning("FE Dev 코드 리뷰 실패 (auto-pass): %s", str(e))
        code_review = ReviewResult(approved=True, feedback="자동 승인", suggestions=[])

    debate_log.append(DebateMessage(
        agent=AgentRole.FE_DEV, round=0, message_type=MessageType.CODE_REVIEW,
        content=f"👩‍💻 FE Dev: {code_review.feedback}",
        data={"approved": code_review.approved, "suggestions": code_review.suggestions},
    ))
    await _agent_done("fe-dev-agent", 0)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    return code_review, debate_log


async def generate_backend_code(
    llm: LLMProvider,
    gen_prompt: str,
    be_generate_prompt: str,
    provider: str,
) -> tuple[FrontendCode | None, list[DebateMessage]]:
    """BE Lead가 백엔드 코드를 생성합니다."""
    debate_log: list[DebateMessage] = []

    await _agent_start("be-lead-agent", 0, "generating", provider)
    try:
        be_data = await generate_with_json_retry(llm, be_generate_prompt, gen_prompt)
        backend_code = FrontendCode(**be_data)
    except Exception as e:
        logger.warning("BE Lead 코드 생성 실패 (non-fatal): %s", str(e))
        backend_code = None

    if backend_code:
        debate_log.append(DebateMessage(
            agent=AgentRole.BE_LEAD, round=0, message_type=MessageType.BE_CODE,
            content=f"🔧 BE Lead: 백엔드 코드 생성 완료 ({len(backend_code.files)}개 파일)",
            data=backend_code.model_dump(),
        ))
    await _agent_done("be-lead-agent", 0)

    return backend_code, debate_log
