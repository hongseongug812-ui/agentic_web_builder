"""
프롬프트 인젝션 방어
====================
사용자 입력에서 프롬프트 인젝션 시도를 탐지하고 차단합니다.
안전한 입력은 XML 태그로 격리하여 LLM 프롬프트에 삽입합니다.
"""

import logging
import re

logger = logging.getLogger(__name__)


class InjectionDetectedError(ValueError):
    """프롬프트 인젝션이 탐지되었을 때 발생."""
    pass


# ── 인젝션 탐지 패턴 ───────────────────────────────────────────
INJECTION_PATTERNS: list[tuple[str, str]] = [
    # 역할 재정의 시도
    (r"(?i)ignore\s+(all\s+)?previous\s+instructions?", "이전 지시 무시 패턴"),
    (r"(?i)forget\s+(all\s+)?previous", "이전 내용 삭제 패턴"),
    (r"(?i)you\s+are\s+now\s+(?:a|an)\s+\w+", "역할 재정의 패턴"),
    (r"(?i)act\s+as\s+(?:a|an)\s+(?:different|new|evil|jailbreak)", "역할 전환 패턴"),
    (r"(?i)pretend\s+(you\s+are|to\s+be)", "역할 가장 패턴"),
    (r"(?i)your\s+new\s+(role|persona|instructions?|rules?)\s+is", "새 역할 주입 패턴"),
    # 시스템 프롬프트 탈취 시도
    (r"(?i)reveal\s+(your\s+)?(system\s+)?prompt", "시스템 프롬프트 노출 요청"),
    (r"(?i)show\s+(me\s+)?(your\s+)?(initial|original|system)\s+(prompt|instructions?)", "초기 프롬프트 요청"),
    (r"(?i)what\s+(are|were)\s+your\s+(original\s+)?instructions?", "지시 확인 요청"),
    (r"(?i)print\s+(your\s+)?(full\s+)?system\s+prompt", "시스템 프롬프트 출력 요청"),
    # 경계 탈출 시도
    (r"(?i)</?(system|assistant|human|user|instruction)\s*>", "XML 태그 삽입"),
    (r"\[INST\]|\[/INST\]", "Llama 명령 태그 삽입"),
    (r"<\|im_start\|>|<\|im_end\|>", "ChatML 태그 삽입"),
    (r"(?i)###\s*(system|instruction|prompt)", "마크다운 시스템 헤더"),
    # 악의적 코드 삽입 유도
    (r"(?i)write\s+(code\s+to\s+)?(steal|exfiltrate|hack|exploit)", "악의적 코드 요청"),
    (r"(?i)delete\s+all\s+(files?|data|database)", "데이터 삭제 유도"),
    (r"(?i)send\s+(all\s+)?(data|credentials?|passwords?)\s+to", "데이터 유출 유도"),
    # DAN / jailbreak 키워드
    (r"(?i)\bDAN\b.*mode", "DAN 모드 패턴"),
    (r"(?i)jailbreak", "탈옥 시도"),
    (r"(?i)developer\s+mode", "개발자 모드 전환 시도"),
    (r"(?i)override\s+(safety|restrictions?|guidelines?)", "안전장치 우회 시도"),
]

# 컴파일된 패턴 캐시
_COMPILED_PATTERNS = [(re.compile(p), desc) for p, desc in INJECTION_PATTERNS]

# 최대 허용 입력 길이
MAX_INPUT_LENGTH = 2000


def detect_injection(text: str) -> list[str]:
    """
    인젝션 패턴 탐지. 발견된 위반 목록 반환 (빈 목록이면 안전).
    """
    violations: list[str] = []
    for pattern, description in _COMPILED_PATTERNS:
        if pattern.search(text):
            violations.append(description)
    return violations


def sanitize_user_input(text: str) -> str:
    """
    사용자 입력을 검증하고 XML 태그로 격리합니다.

    - 길이 초과 → 잘라냄 (경고)
    - 인젝션 탐지 → InjectionDetectedError 발생
    - 안전한 입력 → <user_website_request>...</user_website_request> 래핑

    Returns:
        격리된 입력 문자열 (LLM 프롬프트에 직접 삽입 가능)

    Raises:
        InjectionDetectedError: 인젝션 시도가 탐지된 경우
    """
    if not text or not text.strip():
        return "<user_website_request></user_website_request>"

    # 1) 길이 제한
    if len(text) > MAX_INPUT_LENGTH:
        logger.warning("사용자 입력 길이 초과 (%d자) — %d자로 잘라냄", len(text), MAX_INPUT_LENGTH)
        text = text[:MAX_INPUT_LENGTH] + "..."

    # 2) 인젝션 탐지
    violations = detect_injection(text)
    if violations:
        logger.warning("프롬프트 인젝션 탐지: %s", violations)
        raise InjectionDetectedError(
            f"보안 위반 탐지: {', '.join(violations)}"
        )

    # 3) XML 특수문자 이스케이프 (태그 내 내용이 파싱 오염되지 않도록)
    safe_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    return f"<user_website_request>\n{safe_text}\n</user_website_request>"
