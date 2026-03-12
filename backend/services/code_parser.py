"""
LLM 코드 출력 파서
==================
<file> 태그 기반 XML 파싱 + 마크다운 코드블록 폴백.
JSON 파싱 대비 10배 안정적이고 escape 오류 없음.

파싱 우선순위:
  1. <file path="..."> 태그 (권장 출력 형식)
  2. 마크다운 코드블록 ```tsx filename```
  3. 전체를 단일 파일로 처리 (최후 폴백)

특수 파서:
  parse_review_tag()  — QA <review>{...}</review>
  parse_changes_tag() — Lite CTO <changes>{...}</changes>
"""

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# 확장자 → 언어 매핑
_EXT_TO_LANG: dict[str, str] = {
    "tsx": "tsx", "ts": "typescript", "jsx": "jsx", "js": "javascript",
    "css": "css", "scss": "css", "py": "python", "html": "html",
    "json": "json", "md": "markdown", "txt": "text", "yaml": "yaml",
    "yml": "yaml", "env": "text", "toml": "toml", "sh": "bash",
}


@dataclass
class ParsedFile:
    path: str
    content: str
    language: str = field(default="text")

    @property
    def code(self) -> str:
        """FrontendCode 모델 호환 alias"""
        return self.content

    def to_dict(self) -> dict:
        return {"path": self.path, "code": self.content, "language": self.language}


def _lang_from_path(path: str, hint: str = "") -> str:
    """파일 경로 또는 힌트에서 언어 추론."""
    if hint and hint in _EXT_TO_LANG:
        return _EXT_TO_LANG[hint]
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    return _EXT_TO_LANG.get(ext, "text")


# ──────────────────────────────────────────────
# 1차: <file> XML 태그 파서
# ──────────────────────────────────────────────

# path + language 둘 다 있는 경우
_FILE_PATTERN_FULL = re.compile(
    r'<file\s+path="([^"]+)"\s+language="([^"]+)">(.*?)</file>',
    re.DOTALL,
)
# path만 있는 경우 (language 없음)
_FILE_PATTERN_PATH_ONLY = re.compile(
    r'<file\s+path="([^"]+)">(.*?)</file>',
    re.DOTALL,
)
# language + path 순서가 바뀐 경우
_FILE_PATTERN_LANG_FIRST = re.compile(
    r'<file\s+language="([^"]+)"\s+path="([^"]+)">(.*?)</file>',
    re.DOTALL,
)


def parse_file_tags(llm_output: str) -> list[ParsedFile]:
    """
    <file path="..." language="...">...</file> 태그 파싱.
    language 속성은 선택사항 (없으면 확장자에서 추론).
    """
    files: list[ParsedFile] = []
    seen: set[str] = set()

    # 시도 1: path + language
    for m in _FILE_PATTERN_FULL.finditer(llm_output):
        path, lang, content = m.group(1), m.group(2), m.group(3)
        if path not in seen:
            seen.add(path)
            files.append(ParsedFile(path=path, content=content.strip("\n").rstrip(), language=lang))

    if files:
        return files

    # 시도 2: language + path (순서 바뀜)
    for m in _FILE_PATTERN_LANG_FIRST.finditer(llm_output):
        lang, path, content = m.group(1), m.group(2), m.group(3)
        if path not in seen:
            seen.add(path)
            files.append(ParsedFile(path=path, content=content.strip("\n").rstrip(), language=lang))

    if files:
        return files

    # 시도 3: path만 있는 경우
    for m in _FILE_PATTERN_PATH_ONLY.finditer(llm_output):
        path, content = m.group(1), m.group(2)
        if path not in seen:
            seen.add(path)
            files.append(ParsedFile(
                path=path,
                content=content.strip("\n").rstrip(),
                language=_lang_from_path(path),
            ))

    return files


# ──────────────────────────────────────────────
# 2차: 마크다운 코드블록 폴백
# ──────────────────────────────────────────────

# ```tsx src/app/page.tsx 또는 ``` + // filename
_MD_BLOCK_PATTERN = re.compile(
    r'```(\w+)?\s*(?://\s*)?(\S+\.\w+)?\n(.*?)```',
    re.DOTALL,
)


def parse_markdown_codeblocks(llm_output: str) -> list[ParsedFile]:
    """
    마크다운 코드블록에서 파일 추출.
    ```tsx
    // src/app/page.tsx
    ... 코드 ...
    ```
    형식을 파싱합니다.
    """
    files: list[ParsedFile] = []
    seen: set[str] = set()

    for i, m in enumerate(_MD_BLOCK_PATTERN.finditer(llm_output)):
        lang_hint = m.group(1) or ""
        filename = m.group(2) or ""
        content = m.group(3).strip()

        # 코드 첫 줄에 파일경로 힌트가 있을 수 있음 (// src/app/page.tsx)
        if not filename and content:
            first_line = content.split("\n")[0].strip()
            path_match = re.match(r'^(?://|#)\s*(\S+\.\w+)', first_line)
            if path_match:
                filename = path_match.group(1)
                content = "\n".join(content.split("\n")[1:]).strip()

        if not filename:
            filename = f"generated_{i}.{lang_hint or 'tsx'}"

        if filename not in seen and content:
            seen.add(filename)
            files.append(ParsedFile(
                path=filename,
                content=content,
                language=_lang_from_path(filename, lang_hint),
            ))

    return files


# ──────────────────────────────────────────────
# 메인: 3단계 폴백 파서
# ──────────────────────────────────────────────

def parse_with_fallback(llm_output: str, default_filename: str = "output.tsx") -> list[ParsedFile]:
    """
    1차: <file> XML 태그 파싱
    2차: 마크다운 코드블록 파싱
    3차: 전체를 단일 파일로 처리

    Returns:
        ParsedFile 리스트 (항상 1개 이상)
    """
    # 1차 시도: XML 태그
    files = parse_file_tags(llm_output)
    if files:
        logger.info("코드 파싱 성공 (XML 태그) — %d개 파일", len(files))
        return files

    # 2차 시도: 마크다운 코드블록
    files = parse_markdown_codeblocks(llm_output)
    if files:
        logger.info("코드 파싱 성공 (마크다운 폴백) — %d개 파일", len(files))
        return files

    # 3차 폴백: 전체를 단일 파일로
    logger.warning("XML/마크다운 파싱 실패 — 전체를 단일 파일로 처리")
    cleaned = re.sub(r"```\w*\n?|```", "", llm_output).strip()
    return [ParsedFile(
        path=default_filename,
        content=cleaned,
        language=_lang_from_path(default_filename),
    )]


def parsed_files_to_dict(files: list[ParsedFile]) -> dict:
    """ParsedFile 리스트를 FrontendCode 호환 dict로 변환."""
    # framework 추론
    has_tsx = any(f.path.endswith((".tsx", ".ts", ".jsx")) for f in files)
    has_py = any(f.path.endswith(".py") for f in files)
    framework = "FastAPI" if has_py and not has_tsx else "Next.js 14"

    return {
        "framework": framework,
        "files": [f.to_dict() for f in files],
        "summary": f"{len(files)}개 파일 생성 완료",
    }


# ──────────────────────────────────────────────
# 특수 파서: <review>, <changes> 태그
# ──────────────────────────────────────────────

def parse_review_tag(llm_output: str) -> Optional[dict]:
    """
    QA 에이전트의 <review>...</review> 태그에서 JSON 파싱.
    실패 시 raw JSON 파싱 시도.
    """
    # 1차: <review> 태그
    m = re.search(r'<review>(.*?)</review>', llm_output, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 2차: 전체에서 JSON 객체 추출
    m2 = re.search(r'\{[\s\S]*"passed"[\s\S]*\}', llm_output)
    if m2:
        try:
            return json.loads(m2.group())
        except json.JSONDecodeError:
            pass

    logger.warning("QA <review> 태그 파싱 실패")
    return None


def parse_changes_tag(llm_output: str) -> Optional[dict]:
    """
    Lite CTO의 <changes>...</changes> 태그에서 JSON 파싱.
    """
    m = re.search(r'<changes>(.*?)</changes>', llm_output, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 폴백: 전체 JSON 추출
    m2 = re.search(r'\{[\s\S]*"add_components"[\s\S]*\}', llm_output)
    if m2:
        try:
            return json.loads(m2.group())
        except json.JSONDecodeError:
            pass

    return None
