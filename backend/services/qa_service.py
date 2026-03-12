"""
QA 검수 서비스
==============
Phase 2-2: <review> 태그 파싱 (generate_with_json_retry 의존성 제거)
Phase 03: Auto-Pass 제거 — LLM 호출 실패 시 예외를 던짐
"""

import logging

from fastapi import HTTPException

from models import (
    AgentRole,
    DebateMessage,
    MessageType,
)
from llm_provider import LLMProvider
from services.code_parser import parse_review_tag
from routes.websocket import manager

logger = logging.getLogger(__name__)


async def run_qa_review(
    llm: LLMProvider,
    qa_prompt: str,
    qa_review_system_prompt: str,
    qa_attempt: int,
    qa_max_attempts: int,
    provider: str,
) -> tuple[bool, int, str, list[str], list[str], list[DebateMessage]]:
    """
    QA 에이전트가 코드를 검수합니다.

    Phase 2-2: LLM 텍스트 모드 + <review> 태그 파싱
    Phase 03: LLM 실패 시 auto-pass 없이 예외 전파

    Returns:
        (passed, score, feedback, issues, improvements, debate_log)
    """
    debate_log: list[DebateMessage] = []

    await manager.broadcast("agent_start", {
        "agent": "qa-agent", "round": 0, "action": "qa_review", "provider": provider,
    })

    try:
        # Phase 2-2: JSON 강제 모드 아닌 텍스트 모드로 호출 (<review> 태그 파싱)
        raw_text = await llm.generate(qa_review_system_prompt, qa_prompt, force_json=False)
        qa_data = parse_review_tag(raw_text)

        if qa_data is None:
            # <review> 파싱 실패 → JSON 모드로 재시도
            logger.warning("QA <review> 파싱 실패, JSON 모드 재시도")
            from llm_provider import generate_with_json_retry
            qa_data = await generate_with_json_retry(llm, qa_review_system_prompt, qa_prompt)

        qa_passed = qa_data.get("passed", False)
        qa_score = qa_data.get("overall_score", 5)
        qa_feedback = qa_data.get("feedback", "")
        qa_issues = qa_data.get("issues", [])
        qa_improvements = qa_data.get("improvements", [])

    except HTTPException:
        await manager.broadcast("agent_done", {"agent": "qa-agent", "round": 0})
        raise
    except Exception as e:
        await manager.broadcast("agent_done", {"agent": "qa-agent", "round": 0})
        logger.error("QA 검수 실패: %s", str(e))
        raise HTTPException(status_code=502, detail=f"QA 검수 실패: {str(e)}")

    effective_passed = qa_passed
    qa_msg_type = MessageType.QA_PASS if effective_passed else MessageType.QA_FAIL

    debate_log.append(DebateMessage(
        agent=AgentRole.QA, round=0, message_type=qa_msg_type,
        content=f"🔍 QA: [검수 {qa_attempt}차 — 점수: {qa_score}/10] {qa_feedback}",
        data={
            "passed": effective_passed,
            "score": qa_score,
            "issues": qa_issues,
            "improvements": qa_improvements,
        },
    ))
    await manager.broadcast("agent_done", {"agent": "qa-agent", "round": 0})
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    return qa_passed, qa_score, qa_feedback, qa_issues, qa_improvements, debate_log
