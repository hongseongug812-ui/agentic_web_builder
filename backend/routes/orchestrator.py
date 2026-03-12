"""
회사형 멀티 에이전트 오케스트레이터 (리팩토링 버전)
====================================================
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

프롬프트: prompts/ 디렉토리
서비스: services/ 디렉토리
"""

import json
import logging
import re as re_module
import time

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel as PydanticBaseModel

from models import (
    AgentRole,
    DebateMessage,
    FrontendCode,
    MessageType,
    OrchestrateRequest,
    OrchestrateResponse,
    ProjectPlan,
    RevisionRequest,
)
from llm_provider import get_llm_provider, generate_with_json_retry
from routes.websocket import manager
from agents.classifier import classify_input
from security import sanitize_user_input, validate_code, InjectionDetectedError

# ── 프롬프트 모듈 ──
from prompts.cto_prompts import CTO_PLAN_PROMPT, CTO_REFINE_PROMPT
from prompts.fe_prompts import (
    FE_LEAD_REVIEW_PROMPT,
    FE_DEV_REVIEW_PROMPT,
    FE_LEAD_GENERATE_PROMPT,
    FE_DEV_CODE_REVIEW_PROMPT,
)
from prompts.be_prompts import (
    BE_LEAD_REVIEW_PROMPT,
    BE_DEV_REVIEW_PROMPT,
    BE_LEAD_GENERATE_PROMPT,
)
from prompts.qa_prompts import QA_REVIEW_PROMPT
from prompts.revision_prompts import REVISION_PROMPT, URL_ANALYZE_PROMPT
from prompts.cross_team_prompts import (
    FE_TO_BE_SYNC_PROMPT,
    BE_TO_FE_SYNC_PROMPT,
    FE_CONFIRM_CONTRACT_PROMPT,
)

# ── 서비스 모듈 ──
from services.debate_service import run_fe_team_debate, run_be_team_debate, run_cto_refine, run_cross_team_sync
from services.code_generation_service import generate_frontend_code, review_frontend_code, generate_backend_code
from services.qa_service import run_qa_review
from services.prompt_builder import (
    build_fe_generation_prompt,
    build_be_generation_prompt,
    build_qa_prompt,
    build_revision_prompt,
)
from services.analytics_db import (
    create_session,
    complete_session,
    build_learning_context,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["orchestrator"])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 헬퍼
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
    start_time_ms = int(time.time() * 1000)

    # ── 보안: 프롬프트 인젝션 방어 ──────────────────────────────
    try:
        safe_prompt = sanitize_user_input(request.prompt)
    except InjectionDetectedError as e:
        logger.warning("프롬프트 인젝션 차단: %s", str(e))
        await manager.broadcast("error", {"message": "보안 위반: 허용되지 않은 입력이 탐지되었습니다."})
        raise HTTPException(status_code=400, detail=f"보안 위반: {str(e)}")

    # 세션 추적 시작
    session_id = 0
    try:
        session_id = create_session(
            template_id=getattr(request, 'template_id', ''),
            style_id=getattr(request, 'style_id', ''),
            color_name=getattr(request, 'color_name', ''),
            features=getattr(request, 'features', []),
            sections=getattr(request, 'sections', []),
            design_tokens=getattr(request, 'design_tokens', {}),
            animation_level=getattr(request, 'animation_level', 'subtle'),
            provider=provider,
            prompt_text=request.prompt,
            prompt_mode=getattr(request, 'prompt_mode', 'auto'),
        )
    except Exception as e:
        logger.warning("세션 추적 실패 (non-fatal): %s", str(e))

    # ═══════════════════════════════════════════
    # PHASE 1: CTO 기획
    # ═══════════════════════════════════════════
    await _agent_start("cto-agent", 1, "planning", provider)
    try:
        pm_data = await generate_with_json_retry(llm, CTO_PLAN_PROMPT, safe_prompt)
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

    # ═══════════════════════════════════════════
    # PHASE 2~4: 토론 라운드 (서비스 호출)
    # ═══════════════════════════════════════════
    for round_num in range(1, max_rounds + 1):
        plan_json = json.dumps(current_plan.model_dump(), ensure_ascii=False, indent=2)
        review_prompt = f"라운드 {round_num} - 다음 기획서를 리뷰해줘:\n{plan_json}"

        # FE팀 토론
        fe_lead_review, fe_dev_review, fe_log = await run_fe_team_debate(
            llm, review_prompt, round_num, provider,
            FE_LEAD_REVIEW_PROMPT, FE_DEV_REVIEW_PROMPT,
        )
        debate_log.extend(fe_log)

        # BE팀 토론
        be_lead_review, be_dev_review, be_log = await run_be_team_debate(
            llm, review_prompt, round_num, provider,
            BE_LEAD_REVIEW_PROMPT, BE_DEV_REVIEW_PROMPT,
        )
        debate_log.extend(be_log)

        # 합의 체크
        all_approved = all([
            fe_lead_review.approved, fe_dev_review.approved,
            be_lead_review.approved, be_dev_review.approved
        ])

        if all_approved:
            logger.info("4명 모두 승인 (Round %d) — 코드 생성 단계로", round_num)
            break

        # CTO 수정
        refined_plan, cto_log = await run_cto_refine(
            llm, plan_json,
            fe_lead_review, fe_dev_review, be_lead_review, be_dev_review,
            round_num, provider, CTO_REFINE_PROMPT,
        )
        debate_log.extend(cto_log)
        if refined_plan:
            current_plan = refined_plan
        else:
            break

    # ═══════════════════════════════════════════
    # PHASE 4.5: FE↔BE 크로스팀 싱크 (코드 생성 전 API 계약 합의)
    # ═══════════════════════════════════════════
    plan_json = json.dumps(current_plan.model_dump(), ensure_ascii=False, indent=2)

    api_contract, cross_team_log = await run_cross_team_sync(
        llm, plan_json, provider,
        FE_TO_BE_SYNC_PROMPT, BE_TO_FE_SYNC_PROMPT, FE_CONFIRM_CONTRACT_PROMPT,
    )
    debate_log.extend(cross_team_log)

    # API 계약 정보를 코드 생성 프롬프트에 추가
    contract_context = ""
    if api_contract:
        contract_context = (
            f"\n\n━━━ FE↔BE 합의된 API 계약 ━━━\n"
            f"{json.dumps(api_contract, ensure_ascii=False, indent=2)}\n"
            f"위 API 계약에 맞춰서 코드를 생성해라.\n"
        )

    # ═══════════════════════════════════════════
    # PHASE 5~7: 코드 생성 + 리뷰 + QA (서비스 호출)
    # ═══════════════════════════════════════════
    qa_max_attempts = 2

    # 학습 컨텍스트: 과거 사용자 선호도 데이터
    learning_ctx = ""
    try:
        learning_ctx = build_learning_context()
        if learning_ctx:
            logger.info("학습 컨텍스트 주입 (%d자)", len(learning_ctx))
    except Exception as e:
        logger.warning("학습 컨텍스트 생성 실패 (non-fatal): %s", str(e))

    combined_context = contract_context + ("\n" + learning_ctx if learning_ctx else "")

    for qa_attempt in range(1, qa_max_attempts + 1):
        # FE 코드 생성 — prompt_builder로 사용자 디자인 토큰 + API 계약 주입
        fe_gen_prompt = build_fe_generation_prompt(plan_json, request.prompt + combined_context)
        final_code, fe_gen_log = await generate_frontend_code(
            llm, fe_gen_prompt, FE_LEAD_GENERATE_PROMPT, provider,
        )
        debate_log.extend(fe_gen_log)

        # FE 코드 리뷰
        code_review, fe_review_log = await review_frontend_code(
            llm, final_code, FE_DEV_CODE_REVIEW_PROMPT, provider,
        )
        debate_log.extend(fe_review_log)

        # BE 코드 생성 — API 계약 주입
        be_gen_prompt = build_be_generation_prompt(plan_json, request.prompt + combined_context)
        backend_code, be_gen_log = await generate_backend_code(
            llm, be_gen_prompt, BE_LEAD_GENERATE_PROMPT, provider,
        )
        debate_log.extend(be_gen_log)

        # QA 검수
        fe_code_preview = "\n---\n".join(
            f"// {f.path}\n{f.code[:500]}{'...(생략)' if len(f.code) > 500 else ''}"
            for f in (final_code.files if final_code else [])[:3]
        )
        be_code_preview = "\n---\n".join(
            f"# {f.path}\n{f.code[:500]}{'...(생략)' if len(f.code) > 500 else ''}"
            for f in (backend_code.files if backend_code else [])[:3]
        )
        qa_prompt = build_qa_prompt(
            plan_json, fe_code_preview, len(final_code.files) if final_code else 0,
            be_code_preview, len(backend_code.files) if backend_code else 0,
            code_review.feedback, request.prompt,
        )
        qa_passed, qa_score, _, _, _, qa_log = await run_qa_review(
            llm, qa_prompt, QA_REVIEW_PROMPT, qa_attempt, qa_max_attempts, provider,
        )
        debate_log.extend(qa_log)

        if qa_passed or qa_attempt >= qa_max_attempts:
            break
        logger.info("QA 미통과 (점수: %d/10) — 코드 재생성", qa_score)

    # ── 보안: 생성된 코드 정적 검증 ──────────────────────────────
    all_files = []
    if final_code:
        all_files.extend(f.model_dump() for f in final_code.files)
    if backend_code:
        all_files.extend(f.model_dump() for f in backend_code.files)

    if all_files:
        code_validation = validate_code(all_files)
        if not code_validation.passed:
            logger.warning("코드 보안 검증 실패 — 위반 %d건", len(code_validation.violations))
            await manager.broadcast("security_violations", {
                "violations": code_validation.violations,
                "warnings": code_validation.warnings,
            })
            # 위반이 있어도 파이프라인은 계속 진행 (경고로 처리)
        elif code_validation.warnings:
            logger.info("코드 보안 경고 %d건", len(code_validation.warnings))
            await manager.broadcast("security_warnings", {"warnings": code_validation.warnings})

    # 결과 저장
    _last_result = {
        "plan": current_plan,
        "code": final_code,
        "backend_code": backend_code,
        "provider": provider,
        "session_id": session_id,
    }

    # 세션 완료 추적
    elapsed_ms = int(time.time() * 1000) - start_time_ms
    try:
        total_files = (len(final_code.files) if final_code else 0) + (len(backend_code.files) if backend_code else 0)
        complete_session(
            session_id=session_id,
            total_files=total_files,
            qa_score=qa_score if 'qa_score' in dir() else 7,
            generation_time_ms=elapsed_ms,
            status="completed",
        )
    except Exception as e:
        logger.warning("세션 완료 추적 실패 (non-fatal): %s", str(e))

    await manager.broadcast("pipeline_complete", {"status": "completed", "session_id": session_id})

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
# 사용자 수정 요청
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/revise")
async def revise_code(request: RevisionRequest):
    """사용자가 라이브 프리뷰 확인 후 수정 요청을 보냅니다."""
    global _last_result

    if not _last_result.get("code"):
        raise HTTPException(status_code=400, detail="수정할 코드가 없습니다. 먼저 생성을 실행하세요.")

    provider = request.provider or _last_result.get("provider", "gpt")
    llm = get_llm_provider(provider)
    existing_code = _last_result["code"]

    # 보안: 수정 요청 인젝션 검사
    try:
        safe_feedback = sanitize_user_input(request.feedback)
    except InjectionDetectedError as e:
        logger.warning("수정 요청 인젝션 차단: %s", str(e))
        raise HTTPException(status_code=400, detail=f"보안 위반: {str(e)}")

    await manager.broadcast("agent_start", {
        "agent": "fe-lead-agent", "round": 0, "action": "revising", "provider": provider
    })

    code_summary = "\n".join(f"[{f.path}] ({len(f.code)}자)" for f in existing_code.files)
    code_preview = "\n---\n".join(
        f"// {f.path}\n{f.code[:1000]}{'...' if len(f.code) > 1000 else ''}"
        for f in existing_code.files[:4]
    )
    revision_prompt = build_revision_prompt(
        code_summary, code_preview, len(existing_code.files), safe_feedback,
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
# 입력 분류기
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class ClassifyRequest(PydanticBaseModel):
    text: str
    current_ir: dict = {}
    provider: str = "gpt"


@router.post("/classify")
async def classify_user_input(request: ClassifyRequest):
    """
    사용자 입력을 분류합니다.
    반환: { category, target_component, target_slot, new_value, style_key, confidence, method }
    - slot_edit   → IR 슬롯 직접 수정 (LLM 무호출)
    - style_edit  → styleTokens 수정 (LLM 무호출)
    - structure   → 에이전트 파이프라인 실행 필요
    """
    try:
        llm = get_llm_provider(request.provider)
        result = await classify_input(request.text, request.current_ir, llm)
        logger.info("분류 결과: %s (confidence=%.2f, method=%s)",
                    result["category"], result.get("confidence", 0), result.get("method", "?"))

        # 분류기 에이전트 상태 브로드캐스트
        await manager.broadcast("agent_start", {
            "agent": "classifier-agent", "round": 0, "action": "classifying", "provider": request.provider
        })
        await manager.broadcast("debate_message", {
            "agent": "classifier",
            "round": 0,
            "message_type": result["category"],
            "content": f"🔍 분류기: '{result['category']}' 경로 선택 (신뢰도 {result.get('confidence', 0):.0%}, 방법: {result.get('method', '?')})",
            "data": result,
        })
        await manager.broadcast("agent_done", {"agent": "classifier-agent", "round": 0})
        return result
    except Exception as e:
        logger.error("분류 오류: %s", str(e))
        return {
            "category": "structure",
            "target_component": None,
            "target_slot": None,
            "new_value": None,
            "style_key": None,
            "confidence": 0.5,
            "method": "error_fallback",
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 참고 웹사이트 URL 분석
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class AnalyzeUrlRequest(PydanticBaseModel):
    url: str
    provider: str = "gpt"

@router.post("/analyze-url")
async def analyze_url(request: AnalyzeUrlRequest):
    """참고 웹사이트 URL을 분석하여 비슷한 사이트를 만들기 위한 프롬프트를 생성합니다."""
    url = request.url
    if not url.startswith("http"):
        url = "https://" + url

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            html = resp.text[:15000]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL을 가져올 수 없습니다: {str(e)}")

    title_match = re_module.search(r'<title[^>]*>(.*?)</title>', html, re_module.IGNORECASE | re_module.DOTALL)
    title = title_match.group(1).strip() if title_match else "Unknown"

    meta_desc = ""
    meta_match = re_module.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', html, re_module.IGNORECASE)
    if meta_match:
        meta_desc = meta_match.group(1)

    nav_links = re_module.findall(r'<a[^>]*href=["\'][^"\']*["\'][^>]*>([^<]{1,50})</a>', html)
    nav_links = [l.strip() for l in nav_links[:15] if l.strip()]

    headings = re_module.findall(r'<h[1-3][^>]*>(.*?)</h[1-3]>', html, re_module.IGNORECASE | re_module.DOTALL)
    headings = [re_module.sub(r'<[^>]+>', '', h).strip() for h in headings[:10]]

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
    except Exception:
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
