"""
코드 생성 서비스
================
FE Lead 코드 생성 → FE Dev 코드 리뷰 → BE Lead 코드 생성

Phase 02: JSON → XML 태그 방식으로 전환 (파싱 안정성 10배↑)
Phase 03: Auto-Pass 제거 — 코드 리뷰 실패 시 경고만 (코드 생성 실패는 raise)
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
from llm_provider import LLMProvider, generate_with_json_retry, generate_code_xml
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
    """FE Lead가 XML 형식으로 코드를 생성합니다."""
    debate_log: list[DebateMessage] = []

    await _agent_start("fe-lead-agent", 0, "generating", provider)
    try:
        # Phase 02: XML 파싱 사용 (JSON 이스케이프 문제 해결)
        code_data = await generate_code_xml(llm, fe_generate_prompt, gen_prompt, framework="Next.js 14")
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
        data={"framework": final_code.framework, "file_count": len(final_code.files), "summary": final_code.summary},
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
    """FE Dev가 생성된 코드를 리뷰합니다. 실패해도 파이프라인은 계속됩니다."""
    debate_log: list[DebateMessage] = []

    await _agent_start("fe-dev-agent", 0, "code_review", provider)
    # Phase 04: 코드 미리보기 300자로 축소 (토큰 절감)
    code_preview = "\n---\n".join(
        f"// {f.path}\n{f.code[:300]}{'...(생략)' if len(f.code) > 300 else ''}"
        for f in final_code.files[:3]
    )
    code_review_prompt_text = f"FE Lead가 생성한 코드를 리뷰해줘:\n\n{code_preview}"

    try:
        review_data = await generate_with_json_retry(llm, fe_code_review_prompt, code_review_prompt_text)
        code_review = ReviewResult(**review_data)
    except Exception as e:
        # Phase 03: auto-pass 제거 → 경고만 (코드 리뷰는 non-critical)
        logger.warning("FE Dev 코드 리뷰 실패 (경고만, 파이프라인 계속): %s", str(e))
        code_review = ReviewResult(
            approved=False,
            feedback=f"코드 리뷰 실패 — 자동 건너뜀: {str(e)[:100]}",
            suggestions=[]
        )

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
    """BE Lead가 XML 형식으로 백엔드 코드를 생성합니다."""
    debate_log: list[DebateMessage] = []

    await _agent_start("be-lead-agent", 0, "generating", provider)
    try:
        # Phase 02: XML 파싱 사용
        be_data = await generate_code_xml(llm, be_generate_prompt, gen_prompt, framework="FastAPI")
        backend_code = FrontendCode(**be_data)
    except Exception as e:
        logger.warning("BE Lead 코드 생성 실패 (non-fatal): %s", str(e))
        backend_code = None

    if backend_code:
        debate_log.append(DebateMessage(
            agent=AgentRole.BE_LEAD, round=0, message_type=MessageType.BE_CODE,
            content=f"🔧 BE Lead: 백엔드 코드 생성 완료 ({len(backend_code.files)}개 파일)",
            data={"framework": backend_code.framework, "file_count": len(backend_code.files)},
        ))
    await _agent_done("be-lead-agent", 0)

    return backend_code, debate_log
