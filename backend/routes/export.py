"""
파일 내보내기 라우터
====================
생성된 코드를 ZIP 파일로 압축하여 다운로드합니다.
"""

import io
import zipfile

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["export"])


class ExportFile(BaseModel):
    path: str
    code: str
    language: str = "tsx"


class ExportRequest(BaseModel):
    project_name: str = "my-project"
    files: list[ExportFile]


@router.post("/export/zip")
async def export_zip(request: ExportRequest):
    """생성된 코드를 ZIP으로 내보내기"""
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in request.files:
            zf.writestr(f.path, f.code)

        # README 자동 생성
        readme = f"# {request.project_name}\n\n"
        readme += "이 프로젝트는 Agentic Web Builder에 의해 자동 생성되었습니다.\n\n"
        readme += "## 파일 구조\n\n"
        for f in request.files:
            readme += f"- `{f.path}` ({f.language})\n"
        zf.writestr("README.md", readme)

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={request.project_name}.zip",
        },
    )
