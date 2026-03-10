"""
프리뷰 서버 + Vercel 배포
===========================
생성된 코드를 라이브 프리뷰로 서빙하고, Vercel API로 원클릭 배포합니다.

/api/preview/start  — 생성된 파일 → HTML로 조립 → 라이브 프리뷰 URL 반환
/api/preview/stop   — 프리뷰 정리
/api/deploy/vercel  — Vercel API로 즉시 배포 → 라이브 URL 반환
"""

import hashlib
import json
import logging
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["preview-deploy"])

# ──────────────────────────────────────────────
# 프리뷰 저장소
# ──────────────────────────────────────────────
_preview_dir: Optional[Path] = None
_preview_files: list[dict] = []


class PreviewRequest(BaseModel):
    """프리뷰 요청 — 생성된 파일 목록"""
    files: list[dict] = Field(..., description="[{path, code, language}]")
    framework: str = Field(default="Next.js 14")
    title: str = Field(default="Generated Preview")


class DeployRequest(BaseModel):
    """Vercel 배포 요청"""
    files: list[dict] = Field(..., description="[{path, code, language}]")
    project_name: str = Field(default="agentic-preview")
    framework: str = Field(default="Next.js 14")


class DeployResponse(BaseModel):
    url: str
    deployment_id: str
    status: str


# ──────────────────────────────────────────────
# 코드 → HTML 변환 (프리뷰용)
# ──────────────────────────────────────────────
def _build_preview_html(files: list[dict], title: str) -> str:
    """
    생성된 React/Next.js 코드를 단일 HTML로 조립합니다.
    실제 Next.js 서버 없이도 브라우저에서 바로 프리뷰 가능하도록
    React CDN + Babel Standalone으로 렌더링합니다.
    """

    # TSX/JSX 파일들에서 컴포넌트 코드 추출
    component_codes = []
    css_codes = []

    for f in files:
        code = f.get("code", "")
        lang = f.get("language", "")
        path = f.get("path", "")

        if lang in ("css", "scss") or path.endswith(".css"):
            css_codes.append(code)
        elif lang in ("tsx", "jsx", "typescript", "javascript") or path.endswith((".tsx", ".jsx", ".ts", ".js")):
            # import 문 제거 (CDN에서 로드하므로)
            cleaned = re.sub(r'^import\s+.*?[\'";]\s*$', '', code, flags=re.MULTILINE)
            # export default 를 window 할당으로 변환
            cleaned = re.sub(r'export\s+default\s+function\s+(\w+)', r'function \1', cleaned)
            cleaned = re.sub(r'export\s+default\s+', '', cleaned)
            # "use client" 제거
            cleaned = cleaned.replace('"use client"', '').replace("'use client'", '')
            component_codes.append(cleaned)

    all_css = "\n".join(css_codes)
    all_components = "\n\n".join(component_codes)

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }}
        {all_css}
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" data-type="module">
        const {{ useState, useEffect, useRef, useCallback }} = React;

        {all_components}

        // 마지막으로 정의된 함수형 컴포넌트를 찾아 렌더링
        const root = ReactDOM.createRoot(document.getElementById('root'));

        // 페이지 컴포넌트 찾기 (Home, Page, App, Main, Default 순서)
        const PageComponent = typeof Home !== 'undefined' ? Home
            : typeof Page !== 'undefined' ? Page
            : typeof App !== 'undefined' ? App
            : typeof Main !== 'undefined' ? Main
            : typeof Default !== 'undefined' ? Default
            : () => React.createElement('div', {{
                style: {{ padding: '2rem', textAlign: 'center', color: '#666' }}
            }}, '프리뷰를 로드할 수 없습니다.');

        root.render(React.createElement(PageComponent));
    </script>
</body>
</html>"""


# ──────────────────────────────────────────────
# 프리뷰 서버 엔드포인트
# ──────────────────────────────────────────────
@router.post("/preview/start")
async def start_preview(req: PreviewRequest):
    """생성된 코드로 프리뷰 서버를 시작합니다."""
    global _preview_dir, _preview_files

    if not req.files:
        raise HTTPException(status_code=400, detail="파일이 없습니다.")

    # 이전 프리뷰 정리
    if _preview_dir and _preview_dir.exists():
        shutil.rmtree(_preview_dir, ignore_errors=True)

    # 임시 디렉토리에 파일 저장
    _preview_dir = Path(tempfile.mkdtemp(prefix="agb_preview_"))
    _preview_files = req.files

    # 각 파일을 디스크에 저장
    for f in req.files:
        file_path = _preview_dir / f["path"]
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(f["code"], encoding="utf-8")

    # 통합 HTML 프리뷰 생성
    preview_html = _build_preview_html(req.files, req.title)
    index_path = _preview_dir / "index.html"
    index_path.write_text(preview_html, encoding="utf-8")

    logger.info("프리뷰 시작: %d개 파일 → %s", len(req.files), _preview_dir)

    return {
        "status": "running",
        "url": "/api/preview/render",
        "file_count": len(req.files),
        "preview_id": hashlib.md5(str(_preview_dir).encode()).hexdigest()[:8],
    }


@router.get("/preview/render", response_class=HTMLResponse)
async def render_preview():
    """프리뷰 HTML을 반환합니다 (iframe에서 사용)."""
    global _preview_dir

    if not _preview_dir:
        return HTMLResponse(
            content="<html><body style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666'>"
                    "<p>프리뷰가 시작되지 않았습니다. 먼저 코드를 생성하세요.</p></body></html>",
            status_code=200,
        )

    index_path = _preview_dir / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="프리뷰 파일을 찾을 수 없습니다.")

    return HTMLResponse(content=index_path.read_text(encoding="utf-8"))


@router.post("/preview/stop")
async def stop_preview():
    """프리뷰를 중지하고 임시 파일을 정리합니다."""
    global _preview_dir, _preview_files

    if _preview_dir and _preview_dir.exists():
        shutil.rmtree(_preview_dir, ignore_errors=True)

    _preview_dir = None
    _preview_files = []
    return {"status": "stopped"}


# ──────────────────────────────────────────────
# Vercel 배포 엔드포인트
# ──────────────────────────────────────────────
VERCEL_API = "https://api.vercel.com"


@router.post("/deploy/vercel", response_model=DeployResponse)
async def deploy_to_vercel(req: DeployRequest):
    """Vercel API로 생성된 코드를 즉시 배포합니다."""
    token = os.getenv("VERCEL_TOKEN")
    if not token:
        raise HTTPException(
            status_code=400,
            detail="VERCEL_TOKEN이 설정되지 않았습니다. backend/.env에 추가해주세요.",
        )

    if not req.files:
        raise HTTPException(status_code=400, detail="배포할 파일이 없습니다.")

    # Vercel Deploy API v13 — 파일 기반 배포
    # 1) 파일 목록 구성
    vercel_files = []

    # package.json 추가 (없으면 생성)
    has_package = any(f["path"] == "package.json" for f in req.files)
    if not has_package:
        vercel_files.append({
            "file": "package.json",
            "data": json.dumps({
                "name": req.project_name,
                "version": "1.0.0",
                "private": True,
                "scripts": {"dev": "next dev", "build": "next build", "start": "next start"},
                "dependencies": {
                    "next": "14.0.0",
                    "react": "^18",
                    "react-dom": "^18",
                },
            }, indent=2),
        })

    # 생성된 파일 추가
    for f in req.files:
        vercel_files.append({
            "file": f["path"],
            "data": f["code"],
        })

    # 2) Vercel API 호출
    deploy_payload = {
        "name": req.project_name,
        "files": vercel_files,
        "projectSettings": {
            "framework": "nextjs",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{VERCEL_API}/v13/deployments",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=deploy_payload,
            )

            if resp.status_code not in (200, 201):
                error_detail = resp.json().get("error", {}).get("message", resp.text[:200])
                logger.error("Vercel 배포 실패: %s", error_detail)
                raise HTTPException(
                    status_code=resp.status_code,
                    detail=f"Vercel 배포 실패: {error_detail}",
                )

            data = resp.json()
            deploy_url = f"https://{data.get('url', '')}"
            deploy_id = data.get("id", "")

            logger.info("✅ Vercel 배포 성공: %s (ID: %s)", deploy_url, deploy_id)

            return DeployResponse(
                url=deploy_url,
                deployment_id=deploy_id,
                status="deployed",
            )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Vercel API 타임아웃")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("배포 호출 실패: %s", str(e))
        raise HTTPException(status_code=502, detail=f"배포 실패: {str(e)}")
