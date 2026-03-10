"""
분석 API 라우터
================
세션 추적, 사용자 평가, 통계, 인기 조합 조회
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from services.analytics_db import (
    create_session,
    complete_session,
    add_rating,
    get_popular_templates,
    get_popular_colors,
    get_top_rated_combos,
    get_popular_features,
    get_session_stats,
    get_learning_insights,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ── 요청 모델 ──

class TrackSessionRequest(BaseModel):
    template_id: str = ""
    style_id: str = ""
    color_name: str = ""
    features: list[str] = []
    sections: list[str] = []
    design_tokens: dict = {}
    animation_level: str = "subtle"
    provider: str = "gemini"
    prompt_text: str = ""
    prompt_mode: str = "auto"

class CompleteSessionRequest(BaseModel):
    session_id: int
    total_files: int = 0
    qa_score: int = 7
    generation_time_ms: int = 0
    status: str = "completed"

class RatingRequest(BaseModel):
    session_id: int
    score: int = Field(ge=1, le=5)
    feedback: str = ""
    liked_aspects: list[str] = []
    disliked_aspects: list[str] = []


# ── 엔드포인트 ──

@router.post("/track")
async def track_session(request: TrackSessionRequest):
    """생성 시작 시 세션을 기록합니다."""
    session_id = create_session(
        template_id=request.template_id,
        style_id=request.style_id,
        color_name=request.color_name,
        features=request.features,
        sections=request.sections,
        design_tokens=request.design_tokens,
        animation_level=request.animation_level,
        provider=request.provider,
        prompt_text=request.prompt_text,
        prompt_mode=request.prompt_mode,
    )
    return {"session_id": session_id, "status": "tracked"}


@router.post("/complete")
async def complete_session_endpoint(request: CompleteSessionRequest):
    """생성 완료/실패 시 세션 상태를 업데이트합니다."""
    complete_session(
        session_id=request.session_id,
        total_files=request.total_files,
        qa_score=request.qa_score,
        generation_time_ms=request.generation_time_ms,
        status=request.status,
    )
    return {"status": "updated"}


@router.post("/rate")
async def rate_session(request: RatingRequest):
    """사용자가 생성 결과를 평가합니다."""
    add_rating(
        session_id=request.session_id,
        score=request.score,
        feedback=request.feedback,
        liked_aspects=request.liked_aspects,
        disliked_aspects=request.disliked_aspects,
    )
    return {"status": "rated"}


@router.get("/stats")
async def get_stats():
    """전체 통계를 반환합니다."""
    return get_session_stats()


@router.get("/popular/templates")
async def popular_templates():
    """인기 템플릿을 반환합니다."""
    return get_popular_templates()


@router.get("/popular/colors")
async def popular_colors():
    """인기 색상을 반환합니다."""
    return get_popular_colors()


@router.get("/popular/combos")
async def popular_combos():
    """높은 평점을 받은 조합을 반환합니다."""
    return get_top_rated_combos()


@router.get("/popular/features")
async def popular_features():
    """자주 쓰이는 기능 조합을 반환합니다."""
    return get_popular_features()


@router.get("/insights")
async def learning_insights():
    """학습 인사이트 — 프롬프트 개선에 활용할 데이터"""
    return get_learning_insights()
