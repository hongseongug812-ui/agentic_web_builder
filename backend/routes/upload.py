"""
이미지 업로드 라우트
====================
사용자가 웹사이트에 포함시킬 이미지를 업로드합니다.
업로드된 파일은 backend/uploads/ 에 저장되고 /uploads/{filename} 으로 접근 가능합니다.
"""

import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["upload"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """이미지 파일을 업로드하고 접근 가능한 URL을 반환합니다."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="파일명이 없습니다.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"허용되지 않는 파일 형식입니다. ({', '.join(ALLOWED_EXTENSIONS)}만 가능)",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기가 5MB를 초과합니다.")

    unique_name = f"{uuid.uuid4().hex[:12]}.{ext}"
    save_path = UPLOAD_DIR / unique_name
    save_path.write_bytes(content)

    logger.info("📸 이미지 업로드 완료: %s → %s (%d bytes)", file.filename, unique_name, len(content))

    return {
        "filename": unique_name,
        "original_name": file.filename,
        "url": f"/uploads/{unique_name}",
        "size": len(content),
    }


@router.delete("/upload-image/{filename}")
async def delete_image(filename: str):
    """업로드된 이미지를 삭제합니다."""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    file_path.unlink()
    logger.info("🗑️ 이미지 삭제: %s", filename)
    return {"status": "deleted", "filename": filename}
