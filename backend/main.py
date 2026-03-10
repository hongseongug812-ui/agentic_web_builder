"""
Agentic Web Builder — Backend Server
=====================================
멀티 에이전트 토론 시스템 (PM, FE, BE) + 멀티 LLM (Gemini/Claude/GPT)

✅ 구조화된 로깅
✅ 향상된 Health Check (uptime, 버전, 프로바이더 상태)
✅ 요청 크기 제한
✅ 기본 Rate Limiting
"""

import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env", override=True)

# ──────────────────────────────────────────────
# 구조화된 로깅 설정
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("agentic-web-builder")

# ──────────────────────────────────────────────
# 서버 시작 시간 (uptime 계산용)
# ──────────────────────────────────────────────
SERVER_START_TIME = time.time()
VERSION = "1.0.0"


# ──────────────────────────────────────────────
# Rate Limiter (in-memory, 분당 요청 수 제한)
# ──────────────────────────────────────────────
class RateLimiter:
    """간단한 슬라이딩 윈도우 Rate Limiter"""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        # 윈도우 밖의 오래된 요청 제거
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < self.window
        ]
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        self.requests[client_ip].append(now)
        return True


rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

from routes.pm_agent import router as pm_router
from routes.frontend_agent import router as fe_router
from routes.backend_agent import router as be_router
from routes.orchestrator import router as orchestrator_router
from routes.websocket import router as ws_router
from routes.export import router as export_router
from routes.preview_deploy import router as preview_router
from llm_provider import get_available_providers


# ──────────────────────────────────────────────
# Lifespan (서버 시작/종료 이벤트)
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Agentic Web Builder v%s 시작", VERSION)
    providers = get_available_providers()
    configured = [p["name"] for p in providers if p["configured"]]
    if configured:
        logger.info("✅ 활성 프로바이더: %s", ", ".join(configured))
    else:
        logger.warning("⚠️ 활성 API 키 없음! .env 파일에 API 키를 설정하세요.")
    yield
    logger.info("🛑 서버 종료")


app = FastAPI(
    title="Agentic Web Builder API",
    description="멀티 에이전트 토론 기반 웹 빌더 (PM/FE/BE + Gemini/Claude/GPT)",
    version=VERSION,
    lifespan=lifespan,
)

# ──────────────────────────────────────────────
# CORS (동적 origins)
# ──────────────────────────────────────────────
import os
_cors_origins = ["http://localhost:3000", "http://localhost:3001"]
_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url:
    _cors_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


# ──────────────────────────────────────────────
# Rate Limiting 미들웨어
# ──────────────────────────────────────────────
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # /health, /ws, /docs는 제외
    if request.url.path in ("/health", "/docs", "/openapi.json") or request.url.path.startswith("/ws"):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.is_allowed(client_ip):
        logger.warning("⛔ Rate limit 초과: %s → %s", client_ip, request.url.path)
        return JSONResponse(
            status_code=429,
            content={"detail": "요청이 너무 많습니다. 1분 뒤에 다시 시도해주세요."},
        )
    return await call_next(request)


# ──────────────────────────────────────────────
# 요청 크기 제한 미들웨어
# ──────────────────────────────────────────────
MAX_BODY_SIZE = 1_000_000  # 1MB

@app.middleware("http")
async def body_size_limiter(request: Request, call_next):
    if request.method in ("POST", "PUT"):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"detail": "요청 본문이 너무 큽니다 (최대 1MB)."},
            )
    return await call_next(request)


# ──────────────────────────────────────────────
# 향상된 Health Check
# ──────────────────────────────────────────────
@app.get("/health")
async def health_check():
    uptime = time.time() - SERVER_START_TIME
    hours, remainder = divmod(int(uptime), 3600)
    minutes, seconds = divmod(remainder, 60)

    providers = get_available_providers()
    active_count = sum(1 for p in providers if p["configured"])

    return {
        "status": "ok",
        "version": VERSION,
        "uptime": f"{hours}h {minutes}m {seconds}s",
        "providers": {
            "total": len(providers),
            "active": active_count,
            "list": [p["id"] for p in providers if p["configured"]],
        },
        "endpoints": 12,
    }


# ──────────────────────────────────────────────
# 프로바이더 목록
# ──────────────────────────────────────────────
@app.get("/api/providers")
async def list_providers():
    return get_available_providers()


# ──────────────────────────────────────────────
# 라우터 등록
# ──────────────────────────────────────────────
app.include_router(pm_router)
app.include_router(fe_router)
app.include_router(be_router)
app.include_router(orchestrator_router)
app.include_router(ws_router)
app.include_router(export_router)
app.include_router(preview_router)


# ──────────────────────────────────────────────
# 글로벌 예외 핸들러
# ──────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s — %s %s", str(exc), request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요."},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
