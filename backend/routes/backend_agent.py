"""
Backend 에이전트 라우터
========================
PM 기획서의 API/DB 설계를 받아 백엔드 코드를 생성합니다.
"""

import json

from fastapi import APIRouter, HTTPException

from models import ProjectPlan, FrontendCode
from llm_provider import get_llm_provider, parse_llm_json

router = APIRouter(prefix="/api/agents", tags=["agents"])

GENERATE_SYSTEM_PROMPT = """\
너는 시니어 백엔드 개발자야.
확정된 PM 기획서(API 엔드포인트 + DB 스키마)를 바탕으로 FastAPI + SQLAlchemy 코드를 생성해.

반드시 아래 JSON 형식으로만 응답해라:
{
  "framework": "FastAPI",
  "files": [
    { "path": "backend/main.py", "code": "코드 내용", "language": "python" },
    { "path": "backend/models.py", "code": "코드 내용", "language": "python" },
    { "path": "backend/routes/example.py", "code": "코드 내용", "language": "python" }
  ],
  "summary": "생성된 백엔드 코드 설명"
}
"""


@router.post("/backend/generate", response_model=FrontendCode)
async def generate_backend_code(plan: ProjectPlan, provider: str = "gemini"):
    """확정된 기획서로 백엔드 코드 생성"""
    llm = get_llm_provider(provider)
    prompt = (
        f"다음 기획서의 API 엔드포인트와 DB 스키마를 바탕으로 백엔드 코드를 생성해줘:\n"
        f"{json.dumps(plan.model_dump(), ensure_ascii=False, indent=2)}"
    )

    try:
        raw_text = await llm.generate(GENERATE_SYSTEM_PROMPT, prompt)
        data = parse_llm_json(raw_text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"BE 코드 생성 실패: {str(e)}")

    return FrontendCode(**data)
