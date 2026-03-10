"""
Pydantic 모델 정의
==================
멀티 에이전트 토론 시스템의 요청/응답 스키마를 정의합니다.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ──────────────────────────────────────────────
# 공통 Enum
# ──────────────────────────────────────────────
class AgentRole(str, Enum):
    PM = "pm"
    FRONTEND = "frontend"
    BACKEND = "backend"


class MessageType(str, Enum):
    PLAN = "plan"           # PM이 기획서 제출
    REVIEW = "review"       # FE가 기획서 리뷰
    REVISION = "revision"   # PM이 수정안 제출
    APPROVAL = "approval"   # FE가 승인
    CODE = "code"           # FE가 코드 생성
    BE_CODE = "be_code"     # BE가 코드 생성


ALLOWED_PROVIDERS = {"gemini", "claude", "gpt"}


# ──────────────────────────────────────────────
# 요청 모델
# ──────────────────────────────────────────────
class ProjectRequest(BaseModel):
    """프론트엔드에서 보내는 텍스트 프롬프트"""
    prompt: str = Field(..., min_length=1, max_length=10000, description="프로젝트 요구사항 프롬프트")

    @field_validator("prompt")
    @classmethod
    def prompt_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("프롬프트는 공백만으로 구성될 수 없습니다.")
        return v.strip()


class OrchestrateRequest(BaseModel):
    """오케스트레이터 요청"""
    prompt: str = Field(..., min_length=1, max_length=10000)
    max_rounds: int = Field(default=3, ge=1, le=5, description="최대 토론 라운드 수")
    provider: str = Field(default="gemini", description="LLM 프로바이더: gemini, claude, gpt")

    @field_validator("prompt")
    @classmethod
    def prompt_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("프롬프트는 공백만으로 구성될 수 없습니다.")
        return v.strip()

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        v = v.lower()
        if v not in ALLOWED_PROVIDERS:
            raise ValueError(f"지원하지 않는 프로바이더: {v}. 가능: {ALLOWED_PROVIDERS}")
        return v


# ──────────────────────────────────────────────
# PM 에이전트 출력
# ──────────────────────────────────────────────
class PageComponent(BaseModel):
    name: str
    description: str = ""


class PageSpec(BaseModel):
    name: str
    route: str
    components: list[PageComponent]


class ApiEndpointSpec(BaseModel):
    method: str
    path: str
    description: str


class ProjectPlan(BaseModel):
    """PM 에이전트가 반환하는 기획서"""
    pages: list[PageSpec]
    api_endpoints: list[ApiEndpointSpec]
    db_schema: list[str]


# ──────────────────────────────────────────────
# FE 에이전트 출력
# ──────────────────────────────────────────────
class ReviewResult(BaseModel):
    """FE 에이전트의 리뷰 결과"""
    approved: bool
    feedback: str
    suggestions: list[str] = []


class GeneratedFile(BaseModel):
    """생성된 코드 파일"""
    path: str
    code: str
    language: str = "tsx"


class FrontendCode(BaseModel):
    """FE 에이전트의 최종 코드 출력"""
    framework: str = "Next.js 14"
    files: list[GeneratedFile]
    summary: str = ""


# ──────────────────────────────────────────────
# 토론 메시지
# ──────────────────────────────────────────────
class DebateMessage(BaseModel):
    """토론 한 턴"""
    agent: AgentRole
    round: int
    message_type: MessageType
    content: str
    data: Optional[dict] = None


# ──────────────────────────────────────────────
# 오케스트레이터 응답
# ──────────────────────────────────────────────
class OrchestrateResponse(BaseModel):
    """전체 토론 결과"""
    plan: Optional[ProjectPlan] = None
    code: Optional[FrontendCode] = None
    backend_code: Optional[FrontendCode] = None
    debate_log: list[DebateMessage] = []
    total_rounds: int = 0
    status: str = "completed"
