"""
Frontend 에이전트 라우터
========================
PM 기획서를 기술 관점에서 리뷰하고, 최종 코드를 생성합니다.
Gemini / Claude / GPT 선택 가능.
"""

from fastapi import APIRouter, HTTPException
import json

from models import ProjectPlan, ReviewResult, FrontendCode
from llm_provider import get_llm_provider, parse_llm_json

router = APIRouter(prefix="/api/agents", tags=["agents"])

REVIEW_SYSTEM_PROMPT = """\
너는 10년 경력의 시니어 프론트엔드 개발자이자 테크 리드야.
PM이 작성한 웹사이트 기획서를 기술적 관점에서 리뷰해.

평가 기준:
1. 컴포넌트 구조가 합리적인가
2. 라우팅이 적절한가
3. API 설계가 RESTful한가
4. 성능과 UX 관점에서 빠진 부분이 없는가

반드시 아래 JSON 형식으로만 응답해라:
{ "approved": true/false, "feedback": "리뷰 의견", "suggestions": ["개선안 1", "개선안 2"] }
"""

GENERATE_SYSTEM_PROMPT = """\
너는 시니어 프론트엔드 개발자야.
확정된 PM 기획서를 바탕으로 Next.js 14 + Tailwind CSS 코드를 생성해.

반드시 아래 JSON 형식으로만 응답해라:
{
  "framework": "Next.js 14",
  "files": [{ "path": "src/app/page.tsx", "code": "코드 내용", "language": "tsx" }],
  "summary": "생성된 코드 설명"
}
"""


@router.post("/frontend/review", response_model=ReviewResult)
async def review_plan(plan: ProjectPlan, provider: str = "gemini"):
    """PM 기획서를 기술적 관점에서 리뷰"""
    llm = get_llm_provider(provider)
    prompt = f"다음 PM 기획서를 리뷰해줘:\n{json.dumps(plan.model_dump(), ensure_ascii=False, indent=2)}"

    try:
        raw_text = await llm.generate(REVIEW_SYSTEM_PROMPT, prompt)
        data = parse_llm_json(raw_text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"리뷰 실패: {str(e)}")

    return ReviewResult(**data)


@router.post("/frontend/generate", response_model=FrontendCode)
async def generate_code(plan: ProjectPlan, provider: str = "gemini"):
    """확정된 기획서로 코드 생성"""
    llm = get_llm_provider(provider)
    prompt = f"다음 기획서를 바탕으로 코드를 생성해줘:\n{json.dumps(plan.model_dump(), ensure_ascii=False, indent=2)}"

    try:
        raw_text = await llm.generate(GENERATE_SYSTEM_PROMPT, prompt)
        data = parse_llm_json(raw_text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"코드 생성 실패: {str(e)}")

    return FrontendCode(**data)
