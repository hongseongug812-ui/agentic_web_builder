"""
파이프라인 에러 핸들러
======================
Phase 2-3: 3등급 에러 분류 + safe_llm_call() 자동 재시도

ErrorSeverity:
  RETRYABLE — 파싱 실패, 타임아웃 → 자동 재시도 후 예외
  DEGRADED  — 토론 실패 → None 반환 + agent_warning 브로드캐스트
  FATAL     — 코드 생성 실패 → pipeline_error 브로드캐스트 + 예외
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any, Awaitable, Callable, Optional

from fastapi import HTTPException

logger = logging.getLogger(__name__)


class ErrorSeverity(Enum):
    RETRYABLE = "retryable"
    DEGRADED = "degraded"
    FATAL = "fatal"


@dataclass
class PipelineError:
    severity: ErrorSeverity
    agent: str
    stage: str
    message: str
    detail: Optional[str] = None
    retry_count: int = 0


async def safe_llm_call(
    fn: Callable[[], Awaitable[Any]],
    agent: str,
    stage: str,
    severity: ErrorSeverity = ErrorSeverity.RETRYABLE,
    retries: int = 2,
    manager=None,
) -> Any:
    """
    LLM 호출을 안전하게 래핑합니다.

    - RETRYABLE: 자동 재시도 → 소진 시 HTTPException 전파
    - DEGRADED:  실패 시 None 반환 + agent_warning 브로드캐스트
    - FATAL:     실패 시 pipeline_error 브로드캐스트 + HTTPException 전파
    """
    last_error: Optional[Exception] = None

    for attempt in range(1, retries + 1):
        try:
            return await fn()
        except Exception as e:
            last_error = e
            is_last = attempt >= retries

            if not is_last:
                reason = e.detail if isinstance(e, HTTPException) else str(e)
                logger.warning("[%s/%s] 재시도 %d/%d: %s", agent, stage, attempt, retries, reason)
                if manager:
                    await manager.broadcast("agent_retry", {
                        "agent": agent,
                        "stage": stage,
                        "attempt": attempt,
                        "max_attempts": retries,
                        "reason": str(reason)[:200],
                    })

    # 모든 재시도 소진
    err_msg = last_error.detail if isinstance(last_error, HTTPException) else str(last_error)

    if severity == ErrorSeverity.DEGRADED:
        logger.warning("[%s/%s] DEGRADED — 건너뜀: %s", agent, stage, err_msg)
        if manager:
            await manager.broadcast("agent_warning", {
                "agent": agent,
                "stage": stage,
                "message": f"{stage} 실패 — 이 단계를 건너뜁니다",
                "detail": str(err_msg)[:200],
            })
        return None

    elif severity == ErrorSeverity.FATAL:
        logger.error("[%s/%s] FATAL: %s", agent, stage, err_msg)
        if manager:
            await manager.broadcast("pipeline_error", {
                "agent": agent,
                "stage": stage,
                "message": f"치명적 오류: {str(err_msg)[:200]}",
                "actions": ["retry", "change_provider"],
            })
        if isinstance(last_error, HTTPException):
            raise last_error
        raise HTTPException(status_code=502, detail=f"{stage} 실패: {err_msg}")

    else:  # RETRYABLE exhausted
        if isinstance(last_error, HTTPException):
            raise last_error
        raise HTTPException(status_code=502, detail=f"{stage} 실패: {err_msg}")
