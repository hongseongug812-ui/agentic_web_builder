"""
토론 서비스
===========
FE팀 토론 (Lead ↔ Dev) 및 BE팀 토론 (Lead ↔ Dev)을 실행합니다.
"""

import json
import logging
from typing import Optional

from models import (
    AgentRole,
    DebateMessage,
    MessageType,
    ProjectPlan,
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


async def run_fe_team_debate(
    llm: LLMProvider,
    review_prompt: str,
    round_num: int,
    provider: str,
    fe_lead_review_prompt: str,
    fe_dev_review_prompt: str,
) -> tuple[ReviewResult, ReviewResult, list[DebateMessage]]:
    """FE팀 토론: Lead 리뷰 → Dev 리뷰 (Lead 의견 참고)"""
    debate_log: list[DebateMessage] = []

    # FE Lead 리뷰
    await _agent_start("fe-lead-agent", round_num, "reviewing", provider)
    try:
        fe_lead_data = await generate_with_json_retry(llm, fe_lead_review_prompt, review_prompt)
        fe_lead_review = ReviewResult(**fe_lead_data)
    except Exception as e:
        logger.error("FE Lead 리뷰 실패: %s", str(e))
        await manager.broadcast("agent_warning", {
            "agent": "fe-lead-agent", "stage": "fe_review",
            "message": "FE Lead 리뷰 실패 — 미승인으로 처리", "detail": str(e)[:200],
        })
        fe_lead_review = ReviewResult(approved=False, feedback=f"리뷰 실패: {str(e)[:100]}", suggestions=[])

    debate_log.append(DebateMessage(
        agent=AgentRole.FE_LEAD, round=round_num, message_type=MessageType.FE_DEBATE,
        content=f"👨‍💻 FE Lead: {fe_lead_review.feedback}",
        data={"approved": fe_lead_review.approved, "suggestions": fe_lead_review.suggestions},
    ))
    await _agent_done("fe-lead-agent", round_num)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    # FE Dev 리뷰
    await _agent_start("fe-dev-agent", round_num, "reviewing", provider)
    fe_dev_prompt = (
        f"{review_prompt}\n\n"
        f"=== FE Lead의 의견 ===\n{fe_lead_review.feedback}\n"
        f"FE Lead 제안: {json.dumps(fe_lead_review.suggestions, ensure_ascii=False)}\n"
        f"이 의견에 동의하거나 다른 관점에서 추가 의견을 내줘."
    )
    try:
        fe_dev_data = await generate_with_json_retry(llm, fe_dev_review_prompt, fe_dev_prompt)
        fe_dev_review = ReviewResult(**fe_dev_data)
    except Exception as e:
        logger.error("FE Dev 리뷰 실패: %s", str(e))
        await manager.broadcast("agent_warning", {
            "agent": "fe-dev-agent", "stage": "fe_review",
            "message": "FE Dev 리뷰 실패 — 미승인으로 처리", "detail": str(e)[:200],
        })
        fe_dev_review = ReviewResult(approved=False, feedback=f"리뷰 실패: {str(e)[:100]}", suggestions=[])

    debate_log.append(DebateMessage(
        agent=AgentRole.FE_DEV, round=round_num, message_type=MessageType.FE_DEBATE,
        content=f"👩‍💻 FE Dev: {fe_dev_review.feedback}",
        data={"approved": fe_dev_review.approved, "suggestions": fe_dev_review.suggestions},
    ))
    await _agent_done("fe-dev-agent", round_num)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    return fe_lead_review, fe_dev_review, debate_log


async def run_be_team_debate(
    llm: LLMProvider,
    review_prompt: str,
    round_num: int,
    provider: str,
    be_lead_review_prompt: str,
    be_dev_review_prompt: str,
) -> tuple[ReviewResult, ReviewResult, list[DebateMessage]]:
    """BE팀 토론: Lead 리뷰 → Dev 리뷰 (Lead 의견 참고)"""
    debate_log: list[DebateMessage] = []

    # BE Lead 리뷰
    await _agent_start("be-lead-agent", round_num, "reviewing", provider)
    try:
        be_lead_data = await generate_with_json_retry(llm, be_lead_review_prompt, review_prompt)
        be_lead_review = ReviewResult(**be_lead_data)
    except Exception as e:
        logger.error("BE Lead 리뷰 실패: %s", str(e))
        await manager.broadcast("agent_warning", {
            "agent": "be-lead-agent", "stage": "be_review",
            "message": "BE Lead 리뷰 실패 — 미승인으로 처리", "detail": str(e)[:200],
        })
        be_lead_review = ReviewResult(approved=False, feedback=f"리뷰 실패: {str(e)[:100]}", suggestions=[])

    debate_log.append(DebateMessage(
        agent=AgentRole.BE_LEAD, round=round_num, message_type=MessageType.BE_DEBATE,
        content=f"🔧 BE Lead: {be_lead_review.feedback}",
        data={"approved": be_lead_review.approved, "suggestions": be_lead_review.suggestions},
    ))
    await _agent_done("be-lead-agent", round_num)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    # BE Dev 리뷰
    await _agent_start("be-dev-agent", round_num, "reviewing", provider)
    be_dev_prompt = (
        f"{review_prompt}\n\n"
        f"=== BE Lead의 의견 ===\n{be_lead_review.feedback}\n"
        f"BE Lead 제안: {json.dumps(be_lead_review.suggestions, ensure_ascii=False)}\n"
        f"이 의견에 동의하거나 다른 관점에서 추가 의견을 내줘."
    )
    try:
        be_dev_data = await generate_with_json_retry(llm, be_dev_review_prompt, be_dev_prompt)
        be_dev_review = ReviewResult(**be_dev_data)
    except Exception as e:
        logger.error("BE Dev 리뷰 실패: %s", str(e))
        await manager.broadcast("agent_warning", {
            "agent": "be-dev-agent", "stage": "be_review",
            "message": "BE Dev 리뷰 실패 — 미승인으로 처리", "detail": str(e)[:200],
        })
        be_dev_review = ReviewResult(approved=False, feedback=f"리뷰 실패: {str(e)[:100]}", suggestions=[])

    debate_log.append(DebateMessage(
        agent=AgentRole.BE_DEV, round=round_num, message_type=MessageType.BE_DEBATE,
        content=f"🔩 BE Dev: {be_dev_review.feedback}",
        data={"approved": be_dev_review.approved, "suggestions": be_dev_review.suggestions},
    ))
    await _agent_done("be-dev-agent", round_num)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    return be_lead_review, be_dev_review, debate_log


async def run_cto_refine(
    llm: LLMProvider,
    plan_json: str,
    fe_lead_review: ReviewResult,
    fe_dev_review: ReviewResult,
    be_lead_review: ReviewResult,
    be_dev_review: ReviewResult,
    round_num: int,
    provider: str,
    cto_refine_prompt: str,
) -> tuple[Optional[ProjectPlan], list[DebateMessage]]:
    """CTO가 양팀 피드백을 반영하여 기획서를 수정합니다."""
    debate_log: list[DebateMessage] = []

    await _agent_start("cto-agent", round_num + 1, "revising", provider)

    all_suggestions = (
        fe_lead_review.suggestions + fe_dev_review.suggestions +
        be_lead_review.suggestions + be_dev_review.suggestions
    )
    refinement_prompt = (
        f"기존 기획서:\n{plan_json}\n\n"
        f"=== FE Lead 피드백 ===\n{fe_lead_review.feedback}\n"
        f"=== FE Dev 피드백 ===\n{fe_dev_review.feedback}\n"
        f"=== BE Lead 피드백 ===\n{be_lead_review.feedback}\n"
        f"=== BE Dev 피드백 ===\n{be_dev_review.feedback}\n"
        f"=== 전체 제안사항 ===\n{json.dumps(all_suggestions, ensure_ascii=False)}\n\n"
        f"위 4명의 피드백을 모두 반영하여 기획서를 수정해줘."
    )

    try:
        pm_data = await generate_with_json_retry(llm, cto_refine_prompt, refinement_prompt)
        current_plan = ProjectPlan(**pm_data)
    except Exception as e:
        logger.error("CTO 수정 실패: %s", str(e))
        await _agent_done("cto-agent", round_num + 1)
        await manager.broadcast("agent_warning", {
            "agent": "cto-agent", "stage": "cto_refine",
            "message": "CTO 기획서 수정 실패 — 이전 기획서를 유지합니다", "detail": str(e)[:200],
        })
        return None, debate_log

    debate_log.append(DebateMessage(
        agent=AgentRole.CTO, round=round_num + 1, message_type=MessageType.REVISION,
        content="🧑‍💼 CTO: 양팀 피드백을 반영하여 기획서를 수정했습니다.",
        data=current_plan.model_dump(),
    ))
    await _agent_done("cto-agent", round_num + 1)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    return current_plan, debate_log


async def run_cross_team_sync(
    llm: LLMProvider,
    plan_json: str,
    provider: str,
    fe_to_be_prompt: str,
    be_to_fe_prompt: str,
    fe_confirm_prompt: str,
) -> tuple[dict, list[DebateMessage]]:
    """
    FE Lead ↔ BE Lead 크로스팀 싱크.
    코드 생성 전에 API 계약을 합의합니다.

    1단계: FE Lead → BE Lead (필요한 API 요청)
    2단계: BE Lead → FE Lead (API 계약 확정)
    3단계: FE Lead 최종 확인

    Returns:
        (api_contract, debate_log)
    """
    debate_log: list[DebateMessage] = []
    api_contract: dict = {}

    logger.info("크로스팀 싱크 시작 — FE↔BE API 계약 합의")

    # ── 1단계: FE Lead → BE에게 API 요청 ──
    await _agent_start("fe-lead-agent", 0, "cross_team_sync", provider)
    fe_request_prompt = (
        f"확정된 기획서:\n{plan_json}\n\n"
        f"위 기획서를 보고, 프론트에서 필요한 API를 백엔드 팀장에게 요청해줘."
    )
    try:
        fe_request_data = await generate_with_json_retry(llm, fe_to_be_prompt, fe_request_prompt)
    except Exception as e:
        logger.warning("FE→BE 요청 실패: %s", str(e))
        fe_request_data = {"summary": "API 요청 자동 생성 실패", "api_requests": []}

    debate_log.append(DebateMessage(
        agent=AgentRole.FE_LEAD, round=0, message_type=MessageType.CROSS_TEAM,
        content=f"👨‍💻 FE Lead → BE Lead: {fe_request_data.get('summary', 'API 요청 전달')}",
        data=fe_request_data,
    ))
    await _agent_done("fe-lead-agent", 0)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    # ── 2단계: BE Lead → FE에게 API 계약 확정 ──
    await _agent_start("be-lead-agent", 0, "cross_team_sync", provider)
    be_confirm_prompt = (
        f"기획서:\n{plan_json}\n\n"
        f"=== FE Lead의 API 요청 ===\n"
        f"{json.dumps(fe_request_data, ensure_ascii=False, indent=2)}\n\n"
        f"위 프론트 요청을 검토하고 최종 API 계약을 확정해줘."
    )
    try:
        be_contract_data = await generate_with_json_retry(llm, be_to_fe_prompt, be_confirm_prompt)
        api_contract = be_contract_data
    except Exception as e:
        logger.warning("BE→FE 계약 실패: %s", str(e))
        be_contract_data = {"summary": "API 계약 자동 확정", "confirmed_endpoints": []}
        api_contract = be_contract_data

    debate_log.append(DebateMessage(
        agent=AgentRole.BE_LEAD, round=0, message_type=MessageType.CROSS_TEAM,
        content=f"🔧 BE Lead → FE Lead: {be_contract_data.get('summary', 'API 계약 확정')}",
        data=be_contract_data,
    ))
    await _agent_done("be-lead-agent", 0)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    # ── 3단계: FE Lead 최종 확인 ──
    await _agent_start("fe-lead-agent", 0, "cross_team_confirm", provider)
    fe_confirm_user_prompt = (
        f"=== BE Lead가 확정한 API 계약 ===\n"
        f"{json.dumps(be_contract_data, ensure_ascii=False, indent=2)}\n\n"
        f"위 API 계약을 검토하고 수용 여부를 결정해줘."
    )
    try:
        fe_confirm_data = await generate_with_json_retry(llm, fe_confirm_prompt, fe_confirm_user_prompt)
    except Exception as e:
        logger.warning("FE 최종 확인 실패: %s", str(e))
        fe_confirm_data = {"accepted": True, "feedback": "자동 수용", "implementation_notes": []}

    debate_log.append(DebateMessage(
        agent=AgentRole.FE_LEAD, round=0, message_type=MessageType.CROSS_TEAM,
        content=f"👨‍💻 FE Lead: {'✅ API 계약 수용' if fe_confirm_data.get('accepted', True) else '⚠️ 추가 조율 필요'} — {fe_confirm_data.get('feedback', '')}",
        data=fe_confirm_data,
    ))
    await _agent_done("fe-lead-agent", 0)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    logger.info("크로스팀 싱크 완료 — API 계약 합의됨")

    return api_contract, debate_log
