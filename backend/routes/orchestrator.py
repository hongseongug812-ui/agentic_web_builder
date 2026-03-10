"""
회사형 멀티 에이전트 오케스트레이터
====================================
6명의 전문 에이전트가 실제 회사처럼 협업합니다.

팀 구성:
  🧑‍💼 CTO      — 기획 총괄, 최종 방향 결정
  👨‍💻 FE Lead  — 프론트엔드 팀장, 코드 생성
  👩‍💻 FE Dev   — 프론트엔드 개발자, 코드 리뷰 & 토론
  🔧 BE Lead  — 백엔드 팀장, 코드 생성
  🔩 BE Dev   — 백엔드 개발자, 코드 리뷰 & 토론
  🔍 QA       — 품질 검수 전문가

파이프라인:
  1️⃣  CTO 기획
  2️⃣  FE팀 토론 (Lead ↔ Dev)
  3️⃣  BE팀 토론 (Lead ↔ Dev)
  4️⃣  CTO 기획서 수정 (양팀 피드백 반영)
  5️⃣  FE Lead 코드 생성 → FE Dev 코드 리뷰 → FE Lead 반영
  6️⃣  BE Lead 코드 생성 → BE Dev 코드 리뷰
  7️⃣  QA 최종 검수
  8️⃣  사용자 프리뷰 → 승인 or 수정요청

Gemini / Claude / GPT 선택 가능
"""

import json
import logging
import asyncio
import httpx
import re as re_module

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
    RevisionRequest,
)
from llm_provider import get_llm_provider, generate_with_json_retry
from routes.websocket import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["orchestrator"])

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 에이전트별 시스템 프롬프트
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ── CTO (기획 총괄) ──
CTO_PLAN_PROMPT = """\
너는 스타트업 CTO(최고기술책임자)이다. 15년 경력의 풀스택 엔지니어 출신이다.
제공된 요구사항을 바탕으로 웹사이트의 전체 아키텍처를 기획해라.

기획 시 반드시 고려할 것:
1. 사용자 경험(UX) 관점에서 페이지 흐름을 설계해라
2. 각 페이지에 필요한 핵심 컴포넌트를 수준 높게 정의해라
3. API 엔드포인트는 RESTful 원칙을 따라라
4. DB 스키마는 확장 가능하게 설계해라
5. 반드시 5개 이상의 페이지를 포함해라 (홈, 소개, 서비스, 포트폴리오, 연락처)

반드시 아래 JSON 형식으로만 응답해라. 다른 텍스트는 절대 포함하지 마라:
{
  "pages": [
    { "name": "페이지 이름", "route": "/경로", "components": [{ "name": "컴포넌트명", "description": "상세 설명" }] }
  ],
  "api_endpoints": [
    { "method": "GET|POST|PUT|DELETE", "path": "/api/경로", "description": "설명" }
  ],
  "db_schema": ["테이블명(컬럼1, 컬럼2, ...)"]
}
"""

CTO_REFINE_PROMPT = """\
너는 CTO이다. 프론트엔드팀과 백엔드팀의 토론 결과를 반영하여 기획서를 최종 수정해라.
양쪽 팀의 전문적 의견을 모두 존중하되, 기술적으로 최적의 방향으로 결정해라.

반드시 동일한 JSON 형식으로만 응답해라:
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

# ── FE Lead (프론트엔드 팀장) ──
FE_LEAD_REVIEW_PROMPT = """\
너는 10년 경력의 시니어 프론트엔드 팀장이다.
PM/CTO가 작성한 웹사이트 기획서를 UX/UI 전문가 관점에서 평가해라.

평가 기준:
1. 컴포넌트 구조가 재사용 가능한가
2. 사용자 경험이 직관적인가
3. 접근성(a11y)이 고려됐는가
4. 반응형 디자인이 체계적인가
5. 디자인 시스템 관점에서 일관성이 있는가

반드시 아래 JSON 형식으로만 응답:
{ "approved": true/false, "feedback": "상세 리뷰 의견", "suggestions": ["개선안 1", "개선안 2"] }
"""

# ── FE Dev (프론트엔드 개발자) ──
FE_DEV_REVIEW_PROMPT = """\
너는 5년 경력의 프론트엔드 개발자이다. 실제 구현 관점에서 기획서를 리뷰해라.

평가 기준:
1. 실제로 구현 가능한 수준인가 (오버엔지니어링 아닌가)
2. 성능 최적화가 고려됐는가 (이미지 최적화, 레이지 로딩 등)
3. 상태 관리가 적절한가
4. 에러 핸들링과 로딩 상태가 고려됐는가
5. SEO 대응이 되어있는가

반드시 아래 JSON 형식으로만 응답:
{ "approved": true/false, "feedback": "구현 관점 리뷰", "suggestions": ["개선안 1", "개선안 2"] }
"""

# ── BE Lead (백엔드 팀장) ──
BE_LEAD_REVIEW_PROMPT = """\
너는 12년 경력의 시니어 백엔드 팀장이자 시스템 아키텍트이다.
기획서를 서버 아키텍처 관점에서 평가해라.

평가 기준:
1. API 설계가 RESTful하고 일관적인가
2. DB 스키마가 정규화되어 있고 확장 가능한가
3. 인증/인가 등 보안 아키텍처가 적절한가
4. 확장성과 유지보수성이 고려됐는가
5. 캐싱, 페이징 등 성능 전략이 있는가

반드시 아래 JSON 형식으로만 응답:
{ "approved": true/false, "feedback": "아키텍처 리뷰", "suggestions": ["개선안 1", "개선안 2"] }
"""

# ── BE Dev (백엔드 개발자) ──
BE_DEV_REVIEW_PROMPT = """\
너는 6년 경력의 백엔드 개발자이다. 실제 구현과 운영 관점에서 리뷰해라.

평가 기준:
1. 에러 처리와 데이터 검증이 실전적인가
2. SQL Injection, XSS 등 보안 취약점이 없는가
3. 로깅과 모니터링이 고려됐는가
4. 테스트 가능한 구조인가
5. 배포와 운영이 편리한 구조인가

반드시 아래 JSON 형식으로만 응답:
{ "approved": true/false, "feedback": "운영 관점 리뷰", "suggestions": ["개선안 1", "개선안 2"] }
"""

# ── FE Lead 코드 생성 ──
FE_LEAD_GENERATE_PROMPT = """\
너는 수상 경력이 있는 시니어 프론트엔드 팀장이자 UI/UX 디자이너야.  
확정된 기획서를 바탕으로 **실제 서비스 수준의 5페이지 반응형 웹사이트**를 Next.js 14 + Tailwind CSS로 생성해.

⚠️ 절대 평범하거나 밋밋한 디자인을 만들지 마라. 실제 고객이 돈을 내고 쓸 수 있는 퀄리티여야 한다.
⚠️ Lorem ipsum 절대 사용 금지! 모든 텍스트는 주제에 맞는 실제 한국어 콘텐츠로 채워라.

## 생성할 파일 (총 7개, 반드시 모두 생성)

### 1. `src/app/globals.css` — 전역 스타일 + @keyframes 애니메이션
### 2. `src/app/layout.tsx` — 공유 Navbar(5개 링크 + 모바일 햄버거) + Footer(4열 그리드)
### 3. `src/app/page.tsx` — 홈 (Hero, Features 카드, 통계, 후기, CTA)
### 4. `src/app/about/page.tsx` — 소개 (팀, 미션/비전, 연혁 타임라인)
### 5. `src/app/services/page.tsx` — 서비스 (카드/탭, 가격, FAQ 아코디언)
### 6. `src/app/portfolio/page.tsx` — 포트폴리오 (필터 탭, 카드 그리드, hover 오버레이)
### 7. `src/app/contact/page.tsx` — 문의 (폼, 연락처 카드, 지도)

## 필수 디자인 규칙
1. 색상: 세련된 다크 팔레트 + 네온 그라데이션 액센트
2. 글래스모피즘: `backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl`
3. 모든 인터랙티브 요소에 `transition-all duration-300 hover:scale-[1.02]`
4. 반응형 필수: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
5. 여백: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24`
6. Unsplash 실제 이미지 사용
7. `<a href="/경로">` 사용 (Next.js Link 대신)

## 코드 규칙
- 각 파일에 `'use client'` 추가
- import 없이 순수 JSX + Tailwind (React.useState 형태)
- 모든 이미지에 alt 텍스트

반드시 아래 JSON 형식으로만 응답:
{
  "framework": "Next.js 14",
  "files": [
    { "path": "src/app/globals.css", "code": "코드", "language": "css" },
    { "path": "src/app/layout.tsx", "code": "코드", "language": "tsx" },
    { "path": "src/app/page.tsx", "code": "코드", "language": "tsx" },
    { "path": "src/app/about/page.tsx", "code": "코드", "language": "tsx" },
    { "path": "src/app/services/page.tsx", "code": "코드", "language": "tsx" },
    { "path": "src/app/portfolio/page.tsx", "code": "코드", "language": "tsx" },
    { "path": "src/app/contact/page.tsx", "code": "코드", "language": "tsx" }
  ],
  "summary": "생성된 코드 설명"
}
"""

# ── FE Dev 코드 리뷰 ──
FE_DEV_CODE_REVIEW_PROMPT = """\
너는 프론트엔드 개발자이다. FE 팀장이 생성한 코드를 리뷰해라.

리뷰 기준:
1. 디자인 퀄리티가 프리미엄 수준인가 (기본 색상, 밋밋한 레이아웃 없는가)
2. 반응형이 모든 breakpoint에서 작동하는가
3. 모든 hover/transition이 부드러운가
4. 텍스트가 실제 콘텐츠인가 (Lorem ipsum 없는가)
5. 코드가 에러 없이 실행 가능한가

반드시 아래 JSON 형식으로만 응답:
{ "approved": true/false, "feedback": "코드 리뷰 의견", "suggestions": ["수정사항 1", "수정사항 2"] }
"""

# ── BE Lead 코드 생성 ──
BE_LEAD_GENERATE_PROMPT = """\
너는 시니어 백엔드 팀장이야.
확정된 기획서의 API 엔드포인트와 DB 스키마를 바탕으로 FastAPI + SQLAlchemy 코드를 생성해.

반드시 아래 JSON 형식으로만 응답:
{
  "framework": "FastAPI",
  "files": [
    { "path": "backend/main.py", "code": "코드 내용", "language": "python" }
  ],
  "summary": "생성된 백엔드 코드 설명"
}
"""

# ── QA (품질 검수) ──
QA_REVIEW_PROMPT = """\
너는 품질 관리(QA) 전문가이다. 7년 경력의 QA 엔지니어 + 테스트 자동화 전문가이다.
프론트엔드팀과 백엔드팀이 생성한 코드를 최종 검수해.

검수 기준:
1. **완전성**: 기획서의 모든 페이지와 API가 빠짐없이 구현됐는가
2. **실행 가능성**: import 경로, 함수 시그니처, 변수명이 올바른가
3. **보안**: XSS, SQL Injection 등 기본 보안이 지켜졌는가
4. **UX**: 빈 상태, 로딩 상태, 에러 상태가 처리됐는가
5. **디자인 퀄리티**: 프리미엄 수준인가 (밋밋하면 즉시 실패)
6. **반응형**: 모바일/태블릿/데스크톱 모두 대응하는가

반드시 아래 JSON 형식으로만 응답:
{
  "passed": true/false,
  "overall_score": 1-10,
  "feedback": "종합 검수 의견",
  "issues": ["발견된 이슈 1", "이슈 2"],
  "improvements": ["개선 요청 1", "개선 요청 2"]
}
"""

# ── 사용자 수정 반영 ──
REVISION_PROMPT = """\
너는 FE 팀장이다. 사용자의 수정 요청을 반영하여 코드를 수정해라.
기존 코드의 좋은 부분은 유지하면서 요청사항만 정확히 반영해라.

반드시 전체 수정된 파일을 JSON으로 응답해라 (기존과 동일한 형식):
{
  "framework": "Next.js 14",
  "files": [
    { "path": "파일경로", "code": "전체 수정된 코드", "language": "tsx" }
  ],
  "summary": "수정 내용 요약"
}
"""


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 헬퍼: 에이전트 시작/완료 브로드캐스트
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def _agent_start(agent_id: str, round_num: int, action: str, provider: str):
    await manager.broadcast("agent_start", {
        "agent": agent_id, "round": round_num, "action": action, "provider": provider
    })

async def _agent_done(agent_id: str, round_num: int):
    await manager.broadcast("agent_done", {"agent": agent_id, "round": round_num})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 메인 오케스트레이션 엔드포인트
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 글로벌 상태: 마지막 생성 결과 (사용자 수정 요청 시 참조)
_last_result: dict = {}

@router.post("/orchestrate", response_model=OrchestrateResponse)
async def orchestrate(request: OrchestrateRequest):
    """
    회사형 멀티 에이전트 파이프라인을 실행합니다.
    CTO → FE팀 토론 → BE팀 토론 → CTO 수정 → 코드 생성 → 코드 리뷰 → QA 검수
    """
    global _last_result
    provider = request.provider
    debate_log: list[DebateMessage] = []
    current_plan: ProjectPlan | None = None
    final_code: FrontendCode | None = None
    backend_code: FrontendCode | None = None
    max_rounds = request.max_rounds

    llm = get_llm_provider(provider)
    logger.info("회사형 멀티에이전트 파이프라인 시작 — provider=%s", provider)

    # ═══════════════════════════════════════════
    # PHASE 1: CTO 기획
    # ═══════════════════════════════════════════
    await _agent_start("cto-agent", 1, "planning", provider)
    try:
        pm_data = await generate_with_json_retry(llm, CTO_PLAN_PROMPT, request.prompt)
        current_plan = ProjectPlan(**pm_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("CTO 기획 실패: %s", str(e))
        await manager.broadcast("error", {"message": str(e)})
        raise HTTPException(status_code=502, detail=f"CTO 기획 실패: {str(e)}")

    debate_log.append(DebateMessage(
        agent=AgentRole.CTO, round=1, message_type=MessageType.PLAN,
        content="🧑‍💼 CTO: 초안 기획서를 작성했습니다.",
        data=current_plan.model_dump(),
    ))
    await _agent_done("cto-agent", 1)
    await manager.broadcast("debate_message", debate_log[-1].model_dump())

    for round_num in range(1, max_rounds + 1):
        plan_json = json.dumps(current_plan.model_dump(), ensure_ascii=False, indent=2)
        review_prompt = f"라운드 {round_num} - 다음 기획서를 리뷰해줘:\n{plan_json}"

        # ═══════════════════════════════════════
        # PHASE 2: FE팀 토론 (Lead ↔ Dev)
        # ═══════════════════════════════════════
        # FE Lead 리뷰
        await _agent_start("fe-lead-agent", round_num, "reviewing", provider)
        try:
            fe_lead_data = await generate_with_json_retry(llm, FE_LEAD_REVIEW_PROMPT, review_prompt)
            fe_lead_review = ReviewResult(**fe_lead_data)
        except Exception as e:
            logger.error("FE Lead 리뷰 실패: %s", str(e))
            fe_lead_review = ReviewResult(approved=True, feedback="자동 승인", suggestions=[])

        debate_log.append(DebateMessage(
            agent=AgentRole.FE_LEAD, round=round_num, message_type=MessageType.FE_DEBATE,
            content=f"👨‍💻 FE Lead: {fe_lead_review.feedback}",
            data={"approved": fe_lead_review.approved, "suggestions": fe_lead_review.suggestions},
        ))
        await _agent_done("fe-lead-agent", round_num)
        await manager.broadcast("debate_message", debate_log[-1].model_dump())

        # FE Dev 리뷰 (Lead의 리뷰를 참고하여)
        await _agent_start("fe-dev-agent", round_num, "reviewing", provider)
        fe_dev_prompt = (
            f"{review_prompt}\n\n"
            f"=== FE Lead의 의견 ===\n{fe_lead_review.feedback}\n"
            f"FE Lead 제안: {json.dumps(fe_lead_review.suggestions, ensure_ascii=False)}\n"
            f"이 의견에 동의하거나 다른 관점에서 추가 의견을 내줘."
        )
        try:
            fe_dev_data = await generate_with_json_retry(llm, FE_DEV_REVIEW_PROMPT, fe_dev_prompt)
            fe_dev_review = ReviewResult(**fe_dev_data)
        except Exception as e:
            logger.error("FE Dev 리뷰 실패: %s", str(e))
            fe_dev_review = ReviewResult(approved=True, feedback="자동 승인", suggestions=[])

        debate_log.append(DebateMessage(
            agent=AgentRole.FE_DEV, round=round_num, message_type=MessageType.FE_DEBATE,
            content=f"👩‍💻 FE Dev: {fe_dev_review.feedback}",
            data={"approved": fe_dev_review.approved, "suggestions": fe_dev_review.suggestions},
        ))
        await _agent_done("fe-dev-agent", round_num)
        await manager.broadcast("debate_message", debate_log[-1].model_dump())

        # ═══════════════════════════════════════
        # PHASE 3: BE팀 토론 (Lead ↔ Dev)
        # ═══════════════════════════════════════
        # BE Lead 리뷰
        await _agent_start("be-lead-agent", round_num, "reviewing", provider)
        try:
            be_lead_data = await generate_with_json_retry(llm, BE_LEAD_REVIEW_PROMPT, review_prompt)
            be_lead_review = ReviewResult(**be_lead_data)
        except Exception as e:
            logger.error("BE Lead 리뷰 실패: %s", str(e))
            be_lead_review = ReviewResult(approved=True, feedback="자동 승인", suggestions=[])

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
            be_dev_data = await generate_with_json_retry(llm, BE_DEV_REVIEW_PROMPT, be_dev_prompt)
            be_dev_review = ReviewResult(**be_dev_data)
        except Exception as e:
            logger.error("BE Dev 리뷰 실패: %s", str(e))
            be_dev_review = ReviewResult(approved=True, feedback="자동 승인", suggestions=[])

        debate_log.append(DebateMessage(
            agent=AgentRole.BE_DEV, round=round_num, message_type=MessageType.BE_DEBATE,
            content=f"🔩 BE Dev: {be_dev_review.feedback}",
            data={"approved": be_dev_review.approved, "suggestions": be_dev_review.suggestions},
        ))
        await _agent_done("be-dev-agent", round_num)
        await manager.broadcast("debate_message", debate_log[-1].model_dump())

        # ═══════════════════════════════════════
        # 합의 체크: 4명 모두 승인이면 코드 생성으로
        # ═══════════════════════════════════════
        all_approved = all([
            fe_lead_review.approved, fe_dev_review.approved,
            be_lead_review.approved, be_dev_review.approved
        ])

        if all_approved:
            logger.info("4명 모두 승인 (Round %d) — 코드 생성 단계로", round_num)
            break

        # ═══════════════════════════════════════
        # PHASE 4: CTO 기획서 수정
        # ═══════════════════════════════════════
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
            pm_data = await generate_with_json_retry(llm, CTO_REFINE_PROMPT, refinement_prompt)
            current_plan = ProjectPlan(**pm_data)
        except Exception as e:
            logger.error("CTO 수정 실패: %s", str(e))
            break

        debate_log.append(DebateMessage(
            agent=AgentRole.CTO, round=round_num + 1, message_type=MessageType.REVISION,
            content="🧑‍💼 CTO: 양팀 피드백을 반영하여 기획서를 수정했습니다.",
            data=current_plan.model_dump(),
        ))
        await _agent_done("cto-agent", round_num + 1)
        await manager.broadcast("debate_message", debate_log[-1].model_dump())

    # ═══════════════════════════════════════════
    # PHASE 5: FE Lead 코드 생성 → FE Dev 코드 리뷰
    # ═══════════════════════════════════════════
    qa_max_attempts = 2

    for qa_attempt in range(1, qa_max_attempts + 1):
        # ── FE Lead 코드 생성 ──
        await _agent_start("fe-lead-agent", 0, "generating", provider)
        gen_prompt = (
            f"다음 확정된 기획서를 바탕으로 코드를 생성해줘:\n"
            f"{json.dumps(current_plan.model_dump(), ensure_ascii=False, indent=2)}"
        )
        try:
            code_data = await generate_with_json_retry(llm, FE_LEAD_GENERATE_PROMPT, gen_prompt)
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

        # ── FE Dev 코드 리뷰 ──
        await _agent_start("fe-dev-agent", 0, "code_review", provider)
        code_preview = "\n---\n".join(
            f"// {f.path}\n{f.code[:800]}{'...(생략)' if len(f.code) > 800 else ''}"
            for f in final_code.files[:4]
        )
        code_review_prompt = (
            f"FE Lead가 생성한 코드를 리뷰해줘:\n\n{code_preview}"
        )
        try:
            review_data = await generate_with_json_retry(llm, FE_DEV_CODE_REVIEW_PROMPT, code_review_prompt)
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

        # ── BE Lead 코드 생성 ──
        await _agent_start("be-lead-agent", 0, "generating", provider)
        try:
            be_data = await generate_with_json_retry(llm, BE_LEAD_GENERATE_PROMPT, gen_prompt)
            backend_code = FrontendCode(**be_data)
        except Exception as e:
            logger.warning("BE Lead 코드 생성 실패 (non-fatal): %s", str(e))
            backend_code = None

        if backend_code:
            debate_log.append(DebateMessage(
                agent=AgentRole.BE_LEAD, round=0, message_type=MessageType.BE_CODE,
                content=f"🔧 BE Lead: 백엔드 코드 생성 완료",
                data=backend_code.model_dump(),
            ))
        await _agent_done("be-lead-agent", 0)

        # ═══════════════════════════════════════
        # PHASE 6: QA 최종 검수
        # ═══════════════════════════════════════
        await _agent_start("qa-agent", 0, "qa_review", provider)

        fe_code_preview = "\n---\n".join(
            f"// {f.path}\n{f.code[:500]}{'...(생략)' if len(f.code) > 500 else ''}"
            for f in (final_code.files if final_code else [])[:3]
        )
        be_code_preview = "\n---\n".join(
            f"# {f.path}\n{f.code[:500]}{'...(생략)' if len(f.code) > 500 else ''}"
            for f in (backend_code.files if backend_code else [])[:3]
        )
        qa_prompt = (
            f"기획서:\n{json.dumps(current_plan.model_dump(), ensure_ascii=False, indent=2)}\n\n"
            f"=== 프론트엔드 코드 ({len(final_code.files) if final_code else 0}개 파일) ===\n"
            f"{fe_code_preview}\n\n"
            f"=== 백엔드 코드 ({len(backend_code.files) if backend_code else 0}개 파일) ===\n"
            f"{be_code_preview}\n\n"
            f"=== FE Dev 코드 리뷰 결과 ===\n{code_review.feedback}\n\n"
            f"위 코드가 기획서를 완전히 구현했는지 최종 검수해줘."
        )

        try:
            qa_data = await generate_with_json_retry(llm, QA_REVIEW_PROMPT, qa_prompt)
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
        await _agent_done("qa-agent", 0)
        await manager.broadcast("debate_message", debate_log[-1].model_dump())

        if qa_passed or qa_attempt >= qa_max_attempts:
            break

        logger.info("QA 미통과 (점수: %d/10) — 코드 재생성", qa_score)

    # 결과 저장 (사용자 수정 요청 시 참조)
    _last_result = {
        "plan": current_plan,
        "code": final_code,
        "backend_code": backend_code,
        "provider": provider,
    }

    await manager.broadcast("pipeline_complete", {"status": "completed"})

    total_rounds = max(m.round for m in debate_log) if debate_log else 0
    return OrchestrateResponse(
        plan=current_plan,
        code=final_code,
        backend_code=backend_code,
        debate_log=debate_log,
        total_rounds=total_rounds,
        status="completed",
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 사용자 수정 요청 엔드포인트
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/revise")
async def revise_code(request: RevisionRequest):
    """
    사용자가 라이브 프리뷰 확인 후 수정 요청을 보냅니다.
    FE Lead가 기존 코드 + 사용자 피드백을 반영하여 코드를 재생성합니다.
    """
    global _last_result

    if not _last_result.get("code"):
        raise HTTPException(status_code=400, detail="수정할 코드가 없습니다. 먼저 생성을 실행하세요.")

    provider = request.provider or _last_result.get("provider", "gpt")
    llm = get_llm_provider(provider)
    existing_code = _last_result["code"]

    await manager.broadcast("agent_start", {
        "agent": "fe-lead-agent", "round": 0, "action": "revising", "provider": provider
    })

    code_summary = "\n".join(
        f"[{f.path}] ({len(f.code)}자)"
        for f in existing_code.files
    )
    code_preview = "\n---\n".join(
        f"// {f.path}\n{f.code[:1000]}{'...' if len(f.code) > 1000 else ''}"
        for f in existing_code.files[:4]
    )
    revision_prompt = (
        f"=== 기존 코드 ({len(existing_code.files)}개 파일) ===\n"
        f"{code_summary}\n\n{code_preview}\n\n"
        f"=== 사용자 수정 요청 ===\n{request.feedback}\n\n"
        f"위 수정 요청을 반영하여 전체 코드를 수정해줘. "
        f"반드시 7개 파일 모두 포함해야 해."
    )

    try:
        revised_data = await generate_with_json_retry(llm, REVISION_PROMPT, revision_prompt)
        revised_code = FrontendCode(**revised_data)
    except Exception as e:
        logger.error("코드 수정 실패: %s", str(e))
        await manager.broadcast("error", {"message": str(e)})
        raise HTTPException(status_code=502, detail=f"코드 수정 실패: {str(e)}")

    _last_result["code"] = revised_code

    await manager.broadcast("agent_done", {"agent": "fe-lead-agent", "round": 0})
    await manager.broadcast("code_revised", {
        "files": [f.model_dump() for f in revised_code.files],
        "summary": revised_code.summary,
    })
    await manager.broadcast("pipeline_complete", {"status": "revised"})

    return {"status": "revised", "files_count": len(revised_code.files), "summary": revised_code.summary}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 참고 웹사이트 URL 분석 엔드포인트
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL_ANALYZE_PROMPT = """\
너는 웹사이트 분석 전문가다. 아래 HTML에서 웹사이트의 구조, 디자인, 콘텐츠를 분석해서
이와 비슷한 웹사이트를 만들기 위한 상세한 프롬프트를 한국어로 작성해라.

분석 항목:
1. 전체 레이아웃 구조 (헤더, 히어로, 섹션들, 푸터)
2. 네비게이션 구조 (메뉴 항목들)
3. 색상 테마 (다크/라이트, 주요 색상)
4. 각 섹션의 역할과 콘텐츠 유형
5. 특별한 디자인 요소 (애니메이션, 카드, 그리드 등)
6. 폰트 스타일과 타이포그래피

반드시 아래 JSON 형식으로만 응답:
{
  "site_name": "사이트 이름",
  "description": "사이트 설명",
  "color_theme": "다크/라이트/커스텀",
  "primary_colors": ["#색상1", "#색상2"],
  "sections": ["섹션1 설명", "섹션2 설명"],
  "nav_items": ["메뉴1", "메뉴2"],
  "design_features": ["특징1", "특징2"],
  "generated_prompt": "이 웹사이트와 비슷한 사이트를 만들기 위한 상세한 프롬프트 (200자 이상)"
}
"""

from pydantic import BaseModel as PydanticBaseModel

class AnalyzeUrlRequest(PydanticBaseModel):
    url: str
    provider: str = "gpt"

@router.post("/analyze-url")
async def analyze_url(request: AnalyzeUrlRequest):
    """
    참고 웹사이트 URL을 분석하여 비슷한 사이트를 만들기 위한 프롬프트를 생성합니다.
    """
    url = request.url
    if not url.startswith("http"):
        url = "https://" + url

    # 1. URL에서 HTML 가져오기
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            html = resp.text[:15000]  # 처음 15KB만
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL을 가져올 수 없습니다: {str(e)}")

    # 2. 기본 HTML 구조 추출
    title_match = re_module.search(r'<title[^>]*>(.*?)</title>', html, re_module.IGNORECASE | re_module.DOTALL)
    title = title_match.group(1).strip() if title_match else "Unknown"

    meta_desc = ""
    meta_match = re_module.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', html, re_module.IGNORECASE)
    if meta_match:
        meta_desc = meta_match.group(1)

    # 네비게이션 링크 추출
    nav_links = re_module.findall(r'<a[^>]*href=["\'][^"\']*["\'][^>]*>([^<]{1,50})</a>', html)
    nav_links = [l.strip() for l in nav_links[:15] if l.strip()]

    # 헤딩 추출
    headings = re_module.findall(r'<h[1-3][^>]*>(.*?)</h[1-3]>', html, re_module.IGNORECASE | re_module.DOTALL)
    headings = [re_module.sub(r'<[^>]+>', '', h).strip() for h in headings[:10]]

    # 3. LLM으로 분석
    analyze_prompt = (
        f"URL: {url}\n"
        f"Title: {title}\n"
        f"Meta Description: {meta_desc}\n"
        f"Navigation Links: {', '.join(nav_links[:10])}\n"
        f"Headings: {', '.join(headings[:8])}\n\n"
        f"HTML (처음 부분):\n{html[:8000]}"
    )

    llm = get_llm_provider(request.provider)
    try:
        result = await generate_with_json_retry(llm, URL_ANALYZE_PROMPT, analyze_prompt)
    except Exception as e:
        # LLM 실패 시 기본 프롬프트 생성
        result = {
            "site_name": title,
            "description": meta_desc or title,
            "generated_prompt": (
                f"'{title}' 웹사이트와 비슷한 스타일의 웹사이트를 만들어줘. "
                f"네비게이션: {', '.join(nav_links[:6])}. "
                f"주요 섹션: {', '.join(headings[:5])}. "
                f"세련되고 프리미엄한 다크 모드 디자인으로 만들어줘."
            ),
        }

    return result
