"""
PM 에이전트 라우터
==================
POST /api/agents/pm — Gemini/Claude/GPT를 통해 기획서 생성
"""

from fastapi import APIRouter, HTTPException

from models import ProjectPlan, ProjectRequest
from llm_provider import get_llm_provider, parse_llm_json

router = APIRouter(prefix="/api/agents", tags=["agents"])

SYSTEM_PROMPT = """\
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


@router.post("/pm", response_model=ProjectPlan)
async def run_pm_agent(request: ProjectRequest, provider: str = "gemini"):
    """프론트엔드 프롬프트를 받아 기획서를 생성 (모델 선택 가능)"""
    llm = get_llm_provider(provider)

    try:
        raw_text = await llm.generate(SYSTEM_PROMPT, request.prompt)
        plan_data = parse_llm_json(raw_text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {str(e)}")

    try:
        return ProjectPlan(**plan_data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"스키마 검증 실패: {str(e)}")
