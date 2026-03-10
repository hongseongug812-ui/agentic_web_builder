"""
Pydantic 모델 정의
==================
회사형 멀티 에이전트 토론 시스템의 요청/응답 스키마를 정의합니다.

에이전트 구성:
- CTO: 기획 총괄
- FE_LEAD + FE_DEV: 프론트엔드 팀 (2인 토론)
- BE_LEAD + BE_DEV: 백엔드 팀 (2인 토론)
- QA: 품질 검수
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ──────────────────────────────────────────────
# 공통 Enum
# ──────────────────────────────────────────────
class AgentRole(str, Enum):
    CTO = "cto"
    FE_LEAD = "fe-lead"
    FE_DEV = "fe-dev"
    BE_LEAD = "be-lead"
    BE_DEV = "be-dev"
    QA = "qa"
    # 이전 호환
    PM = "pm"
    FRONTEND = "frontend"
    BACKEND = "backend"


class MessageType(str, Enum):
    PLAN = "plan"               # CTO가 기획서 제출
    REVIEW = "review"           # 리뷰 의견
    BE_REVIEW = "be_review"     # BE 리뷰 의견
    REVISION = "revision"       # CTO가 수정안 제출
    APPROVAL = "approval"       # 승인
    CODE = "code"               # FE 코드 생성
    BE_CODE = "be_code"         # BE 코드 생성
    FE_DEBATE = "fe_debate"     # FE팀 내부 토론
    BE_DEBATE = "be_debate"     # BE팀 내부 토론
    CODE_REVIEW = "code_review" # 코드 리뷰
    CROSS_TEAM = "cross_team"   # FE↔BE 크로스팀 소통
    QA_PASS = "qa_pass"         # QA 검수 통과
    QA_FAIL = "qa_fail"         # QA 검수 실패
    USER_FEEDBACK = "user_feedback"  # 사용자 피드백


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


class RevisionRequest(BaseModel):
    """사용자 수정 요청"""
    feedback: str = Field(..., min_length=1, max_length=5000, description="사용자 수정 요청사항")
    provider: str = Field(default="gpt")


# ──────────────────────────────────────────────
# PM(CTO) 에이전트 출력
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
    """CTO 에이전트가 반환하는 기획서"""
    pages: list[PageSpec]
    api_endpoints: list[ApiEndpointSpec]
    db_schema: list[str]


# ──────────────────────────────────────────────
# 코드 에이전트 출력
# ──────────────────────────────────────────────
class ReviewResult(BaseModel):
    """리뷰 결과"""
    approved: bool
    feedback: str
    suggestions: list[str] = []


class GeneratedFile(BaseModel):
    """생성된 코드 파일"""
    path: str
    code: str
    language: str = "tsx"


class FrontendCode(BaseModel):
    """코드 에이전트의 최종 코드 출력"""
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
