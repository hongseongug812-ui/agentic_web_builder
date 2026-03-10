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
    vercel_token: Optional[str] = Field(default=None, description="사용자가 직접 입력한 Vercel 토큰")


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
    React CDN + Babel Standalone으로 브라우저에서 바로 프리뷰 가능.
    멀티페이지 지원: 해시 라우터로 여러 페이지 컴포넌트를 전환합니다.
    """
    component_codes = []
    css_codes = []
    component_names = []
    # 라우트 맵: { "/": "HomePage", "/about": "AboutPage", ... }
    route_map: dict[str, str] = {}

    for f in files:
        code = f.get("code", "")
        lang = f.get("language", "")
        path = f.get("path", "")

        if lang in ("css", "scss") or path.endswith(".css"):
            # @tailwind 디렉티브 제거 (CDN으로 이미 로드)
            cleaned_css = re.sub(r'@tailwind\s+\w+;', '', code)
            # @apply 디렉티브를 간단히 처리
            cleaned_css = re.sub(r'@apply\s+[^;]+;', '', cleaned_css)
            css_codes.append(cleaned_css)
        elif lang in ("tsx", "jsx", "typescript", "javascript") or path.endswith((".tsx", ".jsx", ".ts", ".js")):
            # import 문 제거 (CDN에서 로드하므로)
            cleaned = re.sub(r'^import\s+.*?[\'";]\s*$', '', code, flags=re.MULTILINE)
            # "use client" / "use server" 제거
            cleaned = cleaned.replace('"use client"', '').replace("'use client'", '')
            cleaned = cleaned.replace('"use server"', '').replace("'use server'", '')

            # 컴포넌트 이름 추출 (export default function Xxx / export default Xxx / const Xxx)
            m = re.search(r'export\s+default\s+function\s+(\w+)', cleaned)
            comp_name = None
            if m:
                comp_name = m.group(1)
                component_names.append(comp_name)
            elif re.search(r'export\s+default\s+(\w+)\s*;?\s*$', cleaned, re.MULTILINE):
                m2 = re.search(r'export\s+default\s+(\w+)\s*;?\s*$', cleaned, re.MULTILINE)
                if m2:
                    comp_name = m2.group(1)
                    component_names.append(comp_name)

            # 함수/컴포넌트 정의에서도 이름 추출
            for fm in re.finditer(r'(?:function|const)\s+(\w+)\s*(?:=\s*\(|\()', cleaned):
                name = fm.group(1)
                if name[0].isupper() and name not in component_names:
                    component_names.append(name)

            # 경로 기반 라우팅 매핑
            if comp_name and "layout" not in path.lower():
                if path.endswith("page.tsx") or path.endswith("page.jsx"):
                    # src/app/page.tsx → /
                    # src/app/about/page.tsx → /about
                    parts = path.replace("\\", "/").split("/")
                    try:
                        app_idx = parts.index("app")
                        route_parts = [p for p in parts[app_idx+1:] if p not in ("page.tsx", "page.jsx")]
                        route = "/" + "/".join(route_parts) if route_parts else "/"
                        route_map[route] = comp_name
                    except ValueError:
                        route_map["/"] = comp_name

            # export 키워드 제거 (CDN 모드에서 전역 함수로 사용)
            cleaned = re.sub(r'export\s+default\s+function\s+(\w+)', r'function \1', cleaned)
            cleaned = re.sub(r'export\s+default\s+', '', cleaned)
            cleaned = re.sub(r'export\s+(?:function|const|let|var)\s+', lambda m: m.group(0).replace('export ', ''), cleaned)
            cleaned = re.sub(r'^export\s+\{[^}]*\}\s*;?\s*$', '', cleaned, flags=re.MULTILINE)

            # TypeScript 타입 어노테이션 간단 제거
            cleaned = re.sub(r':\s*React\.\w+(?:<[^>]*>)?', '', cleaned)
            cleaned = re.sub(r':\s*(?:string|number|boolean|any|void)\b', '', cleaned)

            component_codes.append(cleaned)

    all_css = "\n".join(css_codes)
    all_components = "\n\n".join(component_codes)

    # 라우트 맵 JSON
    route_map_json = json.dumps(route_map, ensure_ascii=False)

    # Layout 컴포넌트 이름 찾기
    layout_names = [n for n in component_names if 'layout' in n.lower() or n == 'RootLayout' or n == 'Layout']
    layout_comp = layout_names[0] if layout_names else None

    # 렌더링할 fallback 컴포넌트 결정
    priority = ['Home', 'HomePage', 'Page', 'App', 'Main', 'Index', 'Default', 'Landing', 'LandingPage']
    render_component = None
    for p in priority:
        if p in component_names:
            render_component = p
            break
    if not render_component and component_names:
        render_component = component_names[0]

    component_check = " || ".join(
        [f"typeof {name} !== 'undefined' && {name}" for name in (component_names or ['Home', 'Page', 'App'])]
    ) or "null"

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Inter', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }}
        {all_css}
    </style>
    <script>
        // a 태그 클릭을 해시 라우팅으로 전환
        document.addEventListener('click', function(e) {{
            var link = e.target.closest('a');
            if (link && link.getAttribute('href')) {{
                var href = link.getAttribute('href');
                if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('http')) {{
                    e.preventDefault();
                    window.location.hash = href === '/' ? '/' : href;
                }}
            }}
        }});
    </script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" data-type="module">
        const {{ useState, useEffect, useRef, useCallback, Fragment }} = React;

        // next/image 등 Next.js 전용 컴포넌트 폴리필
        const Image = (props) => React.createElement('img', {{...props, src: props.src || ''}});
        const Link = (props) => React.createElement('a', {{...props, href: props.href || '#'}}, props.children);

        {all_components}

        // 해시 라우터
        const ROUTE_MAP = {route_map_json};

        function AppRouter() {{
            const [currentPath, setCurrentPath] = useState('/');

            useEffect(() => {{
                function onHash() {{
                    const hash = window.location.hash.replace('#', '') || '/';
                    setCurrentPath(hash);
                }}
                window.addEventListener('hashchange', onHash);
                onHash();
                return () => window.removeEventListener('hashchange', onHash);
            }}, []);

            // 현재 경로에 해당하는 컴포넌트 찾기
            const compName = ROUTE_MAP[currentPath];
            let PageComp = null;
            try {{
                PageComp = compName ? eval(compName) : null;
            }} catch(e) {{}}

            if (!PageComp) {{
                // fallback: 첫 번째 페이지 렌더
                PageComp = {component_check};
            }}

            const pageElement = PageComp ? React.createElement(PageComp) : null;

            // Layout으로 감쌀 수 있으면 감싸기
            {"const LayoutComp = typeof " + layout_comp + " !== 'undefined' ? " + layout_comp + " : null;" if layout_comp else "const LayoutComp = null;"}
            if (LayoutComp) {{
                return React.createElement(LayoutComp, null, pageElement);
            }}
            return pageElement;
        }}

        // 렌더링
        const root = ReactDOM.createRoot(document.getElementById('root'));
        try {{
            root.render(React.createElement(AppRouter));
        }} catch (e) {{
            root.render(React.createElement('div', {{
                style: {{ padding: '2rem', color: '#c00' }}
            }}, '렌더링 에러: ' + e.message));
        }}
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
    # 사용자 입력 토큰 우선, 없으면 env 변수 사용
    token = req.vercel_token or os.getenv("VERCEL_TOKEN")
    if not token:
        raise HTTPException(
            status_code=400,
            detail="Vercel 토큰을 입력해주세요. 배포 버튼 옆 🔑 아이콘을 클릭하세요.",
        )

    if not req.files:
        raise HTTPException(status_code=400, detail="배포할 파일이 없습니다.")

    # ── 정적 HTML로 배포 (빌드 과정 없음 — 100% 배포 성공) ──
    # AI 생성 코드를 프리뷰와 동일한 HTML로 조립하여 배포
    preview_html = _build_preview_html(req.files, req.project_name)

    vercel_files = [
        {
            "file": "index.html",
            "data": preview_html,
        },
    ]

    # 원본 소스 코드도 /source/ 폴더에 포함 (참조용, framework 감지 파일 제외)
    _skip_files = {"package.json", "next.config.js", "tsconfig.json", "tailwind.config.js", "postcss.config.js"}
    for f in req.files:
        if f["path"] not in _skip_files:
            vercel_files.append({
                "file": f"source/{f['path']}",
                "data": f["code"],
            })

    # 2) Vercel API 호출 — framework: null (정적 사이트)
    deploy_payload = {
        "name": req.project_name,
        "files": vercel_files,
        "projectSettings": {
            "framework": None,
            "buildCommand": "",
            "outputDirectory": ".",
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
