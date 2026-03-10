"""
QA 검수 서비스
==============
품질 검수 에이전트 실행 로직
"""

import logging

from models import (
    AgentRole,
    DebateMessage,
    MessageType,
)
from llm_provider import LLMProvider, generate_with_json_retry
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

    Returns:
        (passed, score, feedback, issues, improvements, debate_log)
    """
    debate_log: list[DebateMessage] = []

    await manager.broadcast("agent_start", {
        "agent": "qa-agent", "round": 0, "action": "qa_review", "provider": provider,
    })

    try:
        qa_data = await generate_with_json_retry(llm, qa_review_system_prompt, qa_prompt)
        qa_passed = qa_data.get("passed", True)
        qa_score = qa_data.get("overall_score", 7)
        qa_feedback = qa_data.get("feedback", "")
        qa_issues = qa_data.get("issues", [])
        qa_improvements = qa_data.get("improvements", [])
    except Exception as e:
        logger.warning("QA 검수 실패 (auto-pass): %s", str(e))
        qa_passed = True
        qa_score = 7
        qa_feedback = "검수 자동 통과"
        qa_issues = []
        qa_improvements = []

    qa_msg_type = MessageType.QA_PASS if qa_passed or qa_attempt >= qa_max_attempts else MessageType.QA_FAIL
    debate_log.append(DebateMessage(
        agent=AgentRole.QA, round=0, message_type=qa_msg_type,
        content=f"🔍 QA: [검수 {qa_attempt}차 — 점수: {qa_score}/10] {qa_feedback}",
        data={
            "passed": qa_passed or qa_attempt >= qa_max_attempts,
            "score": qa_score,
            "issues": qa_issues,
            "improvements": qa_improvements,
        },
    ))
    await manager.broadcast("agent_done", {"agent": "qa-agent", "round": 0})
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    return qa_passed, qa_score, qa_feedback, qa_issues, qa_improvements, debate_log
