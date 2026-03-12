"""
프롬프트 빌더 서비스
====================
사용자가 선택한 디자인 토큰(템플릿, 색상, 애니메이션 등)을
FE Lead 코드 생성 프롬프트에 동적으로 주입합니다.

이 서비스가 핵심:
  프론트엔드 generatePrompt()의 풍부한 디자인 정보를
  백엔드 FE_LEAD_GENERATE_PROMPT에 합쳐서
  LLM이 사용자 의도를 정확히 반영한 코드를 생성하게 합니다.
"""

import logging

from prompts.fe_prompts import FE_LEAD_GENERATE_PROMPT

logger = logging.getLogger(__name__)

# Phase 04: 컨텍스트 압축 — 토큰 40% 절감
_PLAN_MAX_CHARS = 3000   # 기획서 최대 길이
_PREVIEW_MAX_CHARS = 300  # 파일 미리보기 최대 길이 (파일당)
_USER_PROMPT_MAX_CHARS = 2000  # 사용자 프롬프트 최대 길이


def _truncate(text: str, max_chars: int, suffix: str = "...(생략)") -> str:
    """텍스트를 max_chars로 잘라냅니다."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + suffix


def build_fe_generation_prompt(
    plan_json: str,
    user_prompt: str,
) -> str:
    """
    FE Lead 코드 생성용 최종 프롬프트를 조합합니다.

    Args:
        plan_json: CTO 기획서 JSON 문자열
        user_prompt: 프론트엔드에서 generatePrompt()로 생성된 사용자 요구사항

    Returns:
        FE Lead에게 전달할 완성된 프롬프트
    """
    # 사용자 프롬프트에서 디자인 정보 추출
    has_design_system = "디자인 시스템" in user_prompt or "컬러 팔레트" in user_prompt
    has_animation = "애니메이션" in user_prompt
    has_sections = "페이지 섹션" in user_prompt

    # Phase 04: 기획서 압축
    plan_json_truncated = _truncate(plan_json, _PLAN_MAX_CHARS)
    user_prompt_truncated = _truncate(user_prompt, _USER_PROMPT_MAX_CHARS)

    prompt_parts = [
        f"다음 확정된 기획서를 바탕으로 코드를 생성해줘:\n{plan_json_truncated}",
    ]

    if has_design_system or has_animation or has_sections:
        prompt_parts.append(
            f"\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"## 🎨 사용자 디자인 요구사항 (반드시 준수!)\n\n"
            f"아래는 사용자가 직접 선택한 디자인 설정입니다.\n"
            f"기획서보다 이 디자인 요구사항을 우선시해서 코드에 정확히 반영해라:\n\n"
            f"{user_prompt_truncated}"
        )
    else:
        prompt_parts.append(
            f"\n\n## 사용자 요구사항:\n{user_prompt_truncated}"
        )

    logger.info(
        "FE 프롬프트 빌드 완료 — 디자인시스템=%s, 애니메이션=%s, 섹션=%s",
        has_design_system, has_animation, has_sections,
    )

    return "\n".join(prompt_parts)


def build_be_generation_prompt(plan_json: str, user_prompt: str) -> str:
    """BE Lead 코드 생성용 프롬프트를 조합합니다. (Phase 04: 압축 적용)"""
    return (
        f"다음 확정된 기획서를 바탕으로 백엔드 코드를 생성해줘:\n{_truncate(plan_json, _PLAN_MAX_CHARS)}\n\n"
        f"## 사용자 요구사항:\n{_truncate(user_prompt, _USER_PROMPT_MAX_CHARS)}"
    )


def build_qa_prompt(
    plan_json: str,
    fe_code_preview: str,
    fe_file_count: int,
    be_code_preview: str,
    be_file_count: int,
    code_review_feedback: str,
    user_prompt: str,
) -> str:
    """
    QA 검수용 프롬프트를 조합합니다.
    """
    parts = [
        f"기획서:\n{plan_json}\n",
        f"=== 프론트엔드 코드 ({fe_file_count}개 파일) ===\n{fe_code_preview}\n",
        f"=== 백엔드 코드 ({be_file_count}개 파일) ===\n{be_code_preview}\n",
        f"=== FE Dev 코드 리뷰 결과 ===\n{code_review_feedback}\n",
    ]

    # 사용자 디자인 요구사항을 QA에게도 전달
    if "디자인 시스템" in user_prompt or "컬러 팔레트" in user_prompt:
        parts.append(
            f"=== 사용자 디자인 요구사항 (이것이 반영됐는지 확인!) ===\n"
            f"{user_prompt[:2000]}\n"
        )

    parts.append("위 코드가 기획서와 사용자 요구사항을 완전히 구현했는지 최종 검수해줘.")

    return "\n\n".join(parts)


def build_revision_prompt(
    existing_code_summary: str,
    existing_code_preview: str,
    file_count: int,
    user_feedback: str,
) -> str:
    """
    사용자 수정 요청 프롬프트를 조합합니다.
    """
    return (
        f"=== 기존 코드 ({file_count}개 파일) ===\n"
        f"{existing_code_summary}\n\n{existing_code_preview}\n\n"
        f"=== 사용자 수정 요청 ===\n{user_feedback}\n\n"
        f"위 수정 요청을 반영하여 전체 코드를 수정해줘. "
        f"반드시 7개 파일 모두 포함해야 해."
    )
