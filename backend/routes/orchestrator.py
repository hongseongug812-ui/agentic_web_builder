"""
오케스트레이터 — 멀티 에이전트 토론 루프
==========================================
PM ↔ FE 에이전트가 토론하며 최적의 기획서를 도출하고,
합의 후 최종 코드를 생성합니다.

Gemini / Claude / GPT 선택 가능 (프론트에서 provider 지정)

✅ generate_with_json_retry로 JSON 파싱 안정성 확보
✅ 시스템 프롬프트 모듈 레벨 정의
✅ 로깅 추가
"""

import json
import logging

from fastapi import APIRouter, HTTPException

from models import (
    AgentRole,
    DebateMessage,
    FrontendCode,
    MessageType,
    OrchestrateRequest,
    OrchestrateResponse,
    ProjectPlan,
    ReviewResult,
)
from llm_provider import get_llm_provider, generate_with_json_retry
from routes.websocket import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["orchestrator"])


# ──────────────────────────────────────────────
# 시스템 프롬프트 (모듈 레벨)
# ──────────────────────────────────────────────
PM_SYSTEM_PROMPT = """\
너는 시니어 풀스택 PM이다.
제공된 요구사항을 바탕으로 반드시 아래 JSON 형식으로만 응답해라.
다른 텍스트는 절대 포함하지 마라. 오직 유효한 JSON만 출력해라.

{
  "pages": [
    { "name": "페이지 이름", "route": "/경로", "components": [{ "name": "컴포넌트명", "description": "설명" }] }
  ],
  "api_endpoints": [
    { "method": "GET|POST|PUT|DELETE", "path": "/api/경로", "description": "설명" }
  ],
  "db_schema": ["테이블명(컬럼1, 컬럼2, ...)"]
}
"""

PM_REFINE_SYSTEM_PROMPT = """\
너는 시니어 풀스택 PM이다.
프론트엔드 개발자의 리뷰 피드백을 반영하여 기획서를 수정해라.
반드시 동일한 JSON 형식으로만 응답해라.

{
  "pages": [
    { "name": "페이지 이름", "route": "/경로", "components": [{ "name": "컴포넌트명", "description": "설명" }] }
  ],
  "api_endpoints": [
    { "method": "GET|POST|PUT|DELETE", "path": "/api/경로", "description": "설명" }
  ],
  "db_schema": ["테이블명(컬럼1, 컬럼2, ...)"]
}
"""

FE_REVIEW_SYSTEM_PROMPT = """\
너는 10년 경력의 시니어 프론트엔드 개발자이자 테크 리드야.
PM이 작성한 웹사이트 기획서를 기술적 관점에서 리뷰해.

평가 기준:
1. 컴포넌트 구조가 합리적인가
2. 라우팅이 적절한가
3. API 설계가 RESTful한가
4. 성능과 UX 관점에서 빠진 부분이 없는가

1라운드에서는 반드시 개선점을 찾아 approved: false로 응답해.
2라운드 이후에는 기획서가 충분히 좋으면 approved: true로 응답해.

반드시 아래 JSON 형식으로만 응답해라:
{ "approved": true/false, "feedback": "리뷰 의견", "suggestions": ["개선안 1", "개선안 2"] }
"""

FE_GENERATE_SYSTEM_PROMPT = """\
너는 시니어 프론트엔드 개발자야.
확정된 PM 기획서를 바탕으로 Next.js 14 + Tailwind CSS 코드를 생성해.

반드시 아래 JSON 형식으로만 응답해라:
{
  "framework": "Next.js 14",
  "files": [{ "path": "src/app/page.tsx", "code": "코드 내용", "language": "tsx" }],
  "summary": "생성된 코드 설명"
}
"""

BE_GENERATE_SYSTEM_PROMPT = """\
너는 시니어 백엔드 개발자야.
확정된 PM 기획서의 API 엔드포인트와 DB 스키마를 바탕으로 FastAPI + SQLAlchemy 코드를 생성해.

반드시 아래 JSON 형식으로만 응답해라:
{
  "framework": "FastAPI",
  "files": [
    { "path": "backend/main.py", "code": "코드 내용", "language": "python" }
  ],
  "summary": "생성된 백엔드 코드 설명"
}
"""


@router.post("/orchestrate", response_model=OrchestrateResponse)
async def orchestrate(request: OrchestrateRequest):
    """
    멀티 에이전트 토론 루프를 실행합니다.
    request body의 provider(gemini/claude/gpt) 선택 가능.
    """
    provider = request.provider
    debate_log: list[DebateMessage] = []
    current_plan: ProjectPlan | None = None
    final_code: FrontendCode | None = None
    max_rounds = request.max_rounds

    llm = get_llm_provider(provider)
    logger.info("오케스트레이션 시작 — provider=%s, max_rounds=%d", provider, max_rounds)

    for round_num in range(1, max_rounds + 1):
        # ─── PM 단계 ───
        action = "planning" if round_num == 1 else "revising"
        await manager.broadcast("agent_start", {
            "agent": "pm-agent",
            "round": round_num,
            "action": action,
            "provider": provider,
        })

        if round_num == 1:
            try:
                pm_data = await generate_with_json_retry(llm, PM_SYSTEM_PROMPT, request.prompt)
                current_plan = ProjectPlan(**pm_data)
            except HTTPException:
                raise
            except Exception as e:
                logger.error("PM 에이전트 실패 (Round %d): %s", round_num, str(e))
                await manager.broadcast("error", {"message": str(e)})
                raise HTTPException(status_code=502, detail=f"PM 에이전트 실패: {str(e)}")

            debate_log.append(DebateMessage(
                agent=AgentRole.PM,
                round=round_num,
                message_type=MessageType.PLAN,
                content="초안 기획서를 작성했습니다.",
                data=current_plan.model_dump(),
            ))
        else:
            last_review = debate_log[-1]
            suggestions = []
            if last_review.data:
                suggestions = last_review.data.get("suggestions", [])
            refinement_prompt = (
                f"기존 기획서:\n{json.dumps(current_plan.model_dump(), ensure_ascii=False, indent=2)}\n\n"
                f"프론트엔드 개발자 피드백:\n{last_review.content}\n"
                f"제안사항: {json.dumps(suggestions, ensure_ascii=False)}\n\n"
                f"위 피드백을 반영하여 기획서를 수정해줘."
            )
            try:
                pm_data = await generate_with_json_retry(llm, PM_REFINE_SYSTEM_PROMPT, refinement_prompt)
                current_plan = ProjectPlan(**pm_data)
            except HTTPException:
                raise
            except Exception as e:
                logger.error("PM 수정 실패 (Round %d): %s", round_num, str(e))
                await manager.broadcast("error", {"message": str(e)})
                raise HTTPException(status_code=502, detail=f"PM 수정 실패: {str(e)}")

            debate_log.append(DebateMessage(
                agent=AgentRole.PM,
                round=round_num,
                message_type=MessageType.REVISION,
                content="피드백을 반영하여 기획서를 수정했습니다.",
                data=current_plan.model_dump(),
            ))

        await manager.broadcast("agent_done", {"agent": "pm-agent", "round": round_num})
        await manager.broadcast("debate_message", debate_log[-1].model_dump())

        # ─── FE 리뷰 단계 ───
        await manager.broadcast("agent_start", {
            "agent": "frontend-agent",
            "round": round_num,
            "action": "reviewing",
            "provider": provider,
        })

        review_prompt = (
            f"라운드 {round_num} - 다음 PM 기획서를 리뷰해줘:\n"
            f"{json.dumps(current_plan.model_dump(), ensure_ascii=False, indent=2)}"
        )
        try:
            review_data = await generate_with_json_retry(llm, FE_REVIEW_SYSTEM_PROMPT, review_prompt)
            review = ReviewResult(**review_data)
        except HTTPException:
            raise
        except Exception as e:
            logger.error("FE 리뷰 실패 (Round %d): %s", round_num, str(e))
            await manager.broadcast("error", {"message": str(e)})
            raise HTTPException(status_code=502, detail=f"FE 리뷰 실패: {str(e)}")

        msg_type = MessageType.APPROVAL if review.approved else MessageType.REVIEW
        debate_log.append(DebateMessage(
            agent=AgentRole.FRONTEND,
            round=round_num,
            message_type=msg_type,
            content=review.feedback,
            data={"approved": review.approved, "suggestions": review.suggestions},
        ))

        await manager.broadcast("agent_done", {"agent": "frontend-agent", "round": round_num})
        await manager.broadcast("debate_message", debate_log[-1].model_dump())

        if review.approved:
            break

    # ─── FE 코드 생성 ───
    await manager.broadcast("agent_start", {
        "agent": "frontend-agent",
        "round": 0,
        "action": "generating",
        "provider": provider,
    })

    gen_prompt = (
        f"다음 확정된 기획서를 바탕으로 코드를 생성해줘:\n"
        f"{json.dumps(current_plan.model_dump(), ensure_ascii=False, indent=2)}"
    )
    try:
        code_data = await generate_with_json_retry(llm, FE_GENERATE_SYSTEM_PROMPT, gen_prompt)
        final_code = FrontendCode(**code_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("FE 코드 생성 실패: %s", str(e))
        await manager.broadcast("error", {"message": str(e)})
        raise HTTPException(status_code=502, detail=f"코드 생성 실패: {str(e)}")

    debate_log.append(DebateMessage(
        agent=AgentRole.FRONTEND,
        round=0,
        message_type=MessageType.CODE,
        content=final_code.summary or "프론트엔드 코드 생성 완료",
        data=final_code.model_dump(),
    ))

    await manager.broadcast("agent_done", {"agent": "frontend-agent", "round": 0})

    # ─── BE 코드 생성 ───
    await manager.broadcast("agent_start", {
        "agent": "backend-agent",
        "round": 0,
        "action": "generating",
        "provider": provider,
    })

    backend_code = None
    try:
        be_data = await generate_with_json_retry(llm, BE_GENERATE_SYSTEM_PROMPT, gen_prompt)
        backend_code = FrontendCode(**be_data)
    except Exception as e:
        # BE 실패는 치명적이지 않음 — FE 코드는 이미 생성됨
        logger.warning("BE 코드 생성 실패 (non-fatal): %s", str(e))
        backend_code = None

    if backend_code:
        debate_log.append(DebateMessage(
            agent=AgentRole.BACKEND,
            round=0,
            message_type=MessageType.BE_CODE,
            content=backend_code.summary or "백엔드 코드 생성 완료",
            data=backend_code.model_dump(),
        ))

    await manager.broadcast("agent_done", {"agent": "backend-agent", "round": 0})
    await manager.broadcast("pipeline_complete", {"status": "completed"})

    total_rounds = max(m.round for m in debate_log) if debate_log else 0
    logger.info("오케스트레이션 완료 — total_rounds=%d, files=%d",
                total_rounds, len(final_code.files) if final_code else 0)

    return OrchestrateResponse(
        plan=current_plan,
        code=final_code,
        backend_code=backend_code,
        debate_log=debate_log,
        total_rounds=total_rounds,
        status="completed",
    )
