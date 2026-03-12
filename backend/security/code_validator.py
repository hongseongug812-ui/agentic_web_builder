"""
코드 보안 검증기
================
생성된 코드에서 위험한 패턴을 탐지합니다.
모든 검사는 정적(결정론적)이며 LLM 호출 없음.

검사 항목:
  - 금지된 JS/Python 패턴 (eval, innerHTML 등)
  - 허용되지 않은 외부 CDN 도메인
  - 허용되지 않은 npm 패키지
  - 환경 변수 직접 노출
"""

import logging
import re
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# ── 금지 패턴 ──────────────────────────────────────────────
BLOCKED_PATTERNS: list[tuple[str, str]] = [
    # JS 코드 실행
    (r"\beval\s*\(", "eval() 사용 금지"),
    (r"new\s+Function\s*\(", "Function 생성자 금지"),
    (r"setTimeout\s*\(\s*['\"]", "setTimeout 문자열 실행 금지"),
    (r"setInterval\s*\(\s*['\"]", "setInterval 문자열 실행 금지"),
    # DOM XSS
    (r"\.innerHTML\s*=", "innerHTML 직접 할당 금지"),
    (r"\.outerHTML\s*=", "outerHTML 직접 할당 금지"),
    (r"document\.write\s*\(", "document.write() 금지"),
    (r"\.insertAdjacentHTML\s*\(", "insertAdjacentHTML() 금지"),
    # Node.js / 서버 위험
    (r"\bchild_process\b", "child_process 모듈 금지"),
    (r"\bexec\s*\(", "exec() 실행 금지"),
    (r"\bspawn\s*\(", "spawn() 실행 금지"),
    (r"\bexecSync\s*\(", "execSync() 실행 금지"),
    # 환경 변수 직접 노출
    (r"process\.env\.[A-Z_]{4,}", "환경 변수 클라이언트 노출 주의"),
    # 파이썬 위험 패턴
    (r"\bos\.system\s*\(", "os.system() 금지"),
    (r"\bsubprocess\b", "subprocess 모듈 금지"),
    (r"\b__import__\s*\(", "__import__() 동적 임포트 금지"),
    (r"\bpickle\.loads\s*\(", "pickle.loads() 역직렬화 금지"),
    # 외부 스크립트 동적 삽입
    (r"createElement\s*\(\s*['\"]script['\"]", "동적 스크립트 삽입 금지"),
    (r"src\s*=\s*['\"]javascript:", "javascript: URI 금지"),
]

# ── CDN 허용 도메인 화이트리스트 ──────────────────────────────
ALLOWED_CDN_DOMAINS: set[str] = {
    "cdn.jsdelivr.net",
    "unpkg.com",
    "cdnjs.cloudflare.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "ajax.googleapis.com",
    "cdn.tailwindcss.com",
    "cdn.jsdelivr.net",
    "stackpath.bootstrapcdn.com",
    "maxcdn.bootstrapcdn.com",
}

# ── npm 패키지 허용 목록 ──────────────────────────────────────
ALLOWED_NPM_PACKAGES: set[str] = {
    "react",
    "react-dom",
    "next",
    "typescript",
    "tailwindcss",
    "postcss",
    "autoprefixer",
    "@tailwindcss/forms",
    "@tailwindcss/typography",
    "lucide-react",
    "framer-motion",
    "zustand",
    "axios",
    "swr",
    "@tanstack/react-query",
    "date-fns",
    "clsx",
    "class-variance-authority",
    "zod",
    "react-hook-form",
    "@hookform/resolvers",
    "recharts",
    "react-icons",
    "next-themes",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-toast",
    "@radix-ui/react-tabs",
    "@radix-ui/react-accordion",
    "embla-carousel-react",
    "react-intersection-observer",
    "sharp",
}

# CDN URL 패턴
_CDN_URL_PATTERN = re.compile(
    r'(?:src|href)\s*=\s*["\']https?://([^/"\']+)', re.IGNORECASE
)

# npm import 패턴 (import x from "pkg" / require("pkg") / import "pkg")
_NPM_IMPORT_PATTERN = re.compile(
    r'(?:from|import|require)\s*(?:\(?\s*)?["\']([^"\'./][^"\']*)["\']', re.IGNORECASE
)


@dataclass
class ValidationResult:
    passed: bool
    violations: list[dict] = field(default_factory=list)
    warnings: list[dict] = field(default_factory=list)

    def add_violation(self, rule: str, detail: str, line: Optional[int] = None):
        self.violations.append({"rule": rule, "detail": detail, "line": line})
        self.passed = False

    def add_warning(self, rule: str, detail: str, line: Optional[int] = None):
        self.warnings.append({"rule": rule, "detail": detail, "line": line})


class CodeValidator:
    """생성된 코드 정적 검증기."""

    def validate(self, code: str, filename: str = "") -> ValidationResult:
        """단일 코드 문자열 검증."""
        result = ValidationResult(passed=True)
        lines = code.splitlines()

        # 1) 금지 패턴 검사
        for pattern, reason in BLOCKED_PATTERNS:
            for i, line in enumerate(lines, 1):
                if re.search(pattern, line):
                    result.add_violation(
                        rule="blocked_pattern",
                        detail=f"{reason} — {filename}:{i}: {line.strip()[:120]}",
                        line=i,
                    )

        # 2) CDN 도메인 검사
        for match in _CDN_URL_PATTERN.finditer(code):
            domain = match.group(1).lower()
            if domain not in ALLOWED_CDN_DOMAINS:
                result.add_violation(
                    rule="cdn_domain",
                    detail=f"허용되지 않은 CDN 도메인: {domain} (파일: {filename})",
                )

        # 3) npm 패키지 검사 (JS/TS 파일에만)
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext in ("js", "ts", "jsx", "tsx", "mjs"):
            for match in _NPM_IMPORT_PATTERN.finditer(code):
                pkg = match.group(1).split("/")[0]  # scope 패키지: @radix-ui/react-... → @radix-ui
                if pkg.startswith("@"):
                    # @scope/name 형식
                    parts = match.group(1).split("/")
                    pkg = "/".join(parts[:2]) if len(parts) >= 2 else parts[0]
                if pkg not in ALLOWED_NPM_PACKAGES:
                    result.add_warning(
                        rule="npm_package",
                        detail=f"미검증 npm 패키지: '{pkg}' (파일: {filename}) — 허용 목록에 없음",
                    )

        return result

    def validate_many(self, files: list[dict]) -> ValidationResult:
        """여러 파일 검증 (파일 목록: [{'path': ..., 'code': ...}])."""
        combined = ValidationResult(passed=True)
        for f in files:
            path = f.get("path", "unknown")
            code = f.get("code", "")
            r = self.validate(code, path)
            combined.violations.extend(r.violations)
            combined.warnings.extend(r.warnings)
            if not r.passed:
                combined.passed = False
        return combined


# 모듈 레벨 싱글턴
_validator = CodeValidator()


def validate_code(files: list[dict]) -> ValidationResult:
    """편의 함수: 파일 목록 검증."""
    return _validator.validate_many(files)
