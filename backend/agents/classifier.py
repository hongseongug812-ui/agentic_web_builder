"""
입력 분류기
===========
사용자 입력을 3가지로 분류:
  slot_edit   — 기존 슬롯 값 변경 (비용: $0, IR 직접 수정)
  style_edit  — 스타일 토큰 변경 (비용: $0, CSS 변수만 업데이트)
  structure   — 구조/기능 변경 (비용: $0.50~, 에이전트 파이프라인)

1단계: 규칙 기반 매칭 (LLM 무호출, ~0ms)
2단계: LLM 분류 (규칙 미매칭 시, Claude Haiku 또는 기본 provider)
"""

import json
import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# 1단계: 규칙 기반 패턴
# ─────────────────────────────────────────────

SLOT_EDIT_PATTERNS = [
    # 텍스트 변경
    r"제목.{0,10}(바꿔|변경|수정|고쳐)",
    r"텍스트.{0,10}(바꿔|변경|수정)",
    r"문구.{0,10}(바꿔|변경|수정)",
    r"버튼.{0,10}(글자|텍스트|문구|이름).{0,10}(바꿔|변경)",
    r"이름.{0,10}(바꿔|변경|고쳐)",
    r"(슬로건|tagline|캐치프레이즈).{0,10}(바꿔|변경)",
    r"(에|으로|로)\s+바꿔",
    r"(change|update|set|modify).{0,20}(title|text|button|name|label)",
    r"title.{0,10}(change|update|set)",
    # 이미지 변경
    r"이미지.{0,10}(바꿔|변경|교체|수정)",
    r"사진.{0,10}(바꿔|변경|교체)",
    r"로고.{0,10}(바꿔|변경|교체)",
    r"(change|replace|update).{0,10}(image|photo|logo|picture)",
    # 링크/이메일 변경
    r"(링크|URL|url|주소).{0,10}(바꿔|변경)",
    r"(이메일|email|전화|phone).{0,10}(바꿔|변경|수정)",
    # 리스트 항목 변경
    r"메뉴.{0,10}(항목|추가|제거|바꿔)",
    r"(feature|기능).{0,10}(항목|텍스트).{0,10}(바꿔|변경)",
]

STYLE_EDIT_PATTERNS = [
    # 색상
    r"(색|색상|컬러).{0,10}(바꿔|변경|고쳐)",
    r"(빨간|파란|초록|노란|검은|하얀|보라|주황|분홍|회색|남색)(색|으로|으로 바꿔|빛)",
    r"(red|blue|green|yellow|black|white|purple|orange|pink|gray|navy)",
    r"#[0-9a-fA-F]{3,6}",
    r"배경.{0,10}(색|어둡|밝|바꿔|변경)",
    r"(다크|라이트|어둡|밝).{0,10}(모드|테마|배경)",
    r"(primary|secondary|accent).{0,10}(color|색)",
    # 폰트
    r"(폰트|글꼴|글씨).{0,10}(바꿔|변경|크게|작게)",
    r"(font|typography).{0,10}(change|update)",
    r"(Inter|Noto|Pretendard|Roboto|Lato).{0,10}(폰트|으로)",
    # 여백/크기
    r"(여백|패딩|마진).{0,10}(넓|좁|크|작|바꿔|변경)",
    r"(padding|margin|spacing).{0,10}(increase|decrease|change)",
    r"(크게|작게|넓게|좁게).{0,10}(만들어|해줘|바꿔)",
    # 모서리
    r"(모서리|border.?radius|둥글|각지).{0,10}(바꿔|변경)",
]

STRUCTURE_KEYWORDS = [
    r"(추가|넣어|만들어|생성).{0,20}(섹션|페이지|기능|컴포넌트)",
    r"(섹션|페이지|기능|컴포넌트).{0,10}(추가|삭제|제거|넣어|만들어)",
    r"(FAQ|갤러리|후기|가격|요금|연락처|소개).{0,10}(추가|섹션|페이지)",
    r"(add|create|insert|delete|remove).{0,20}(section|page|feature|component)",
    r"새로운.{0,10}(페이지|섹션|기능)",
    r"(영어|한국어|다국어|번역).{0,10}(버전|지원)",
    r"(예약|결제|로그인|회원가입|쇼핑|장바구니).{0,10}(기능|시스템)",
    r"레이아웃.{0,10}(바꿔|변경|수정)",
    r"(전체|완전히|다시).{0,10}(바꿔|변경|리디자인|새로)",
]


def rule_based_classify(user_input: str) -> Optional[dict]:
    """규칙 기반 분류. 확실한 경우만 반환, 불확실하면 None."""
    text = user_input.lower()

    # 구조 변경은 높은 우선순위로 체크
    for pattern in STRUCTURE_KEYWORDS:
        if re.search(pattern, text, re.IGNORECASE):
            logger.debug("규칙 분류: structure — 패턴: %s", pattern)
            return {
                "category": "structure",
                "target_component": None,
                "target_slot": None,
                "new_value": None,
                "style_key": None,
                "confidence": 0.85,
                "method": "rule",
            }

    # 스타일 변경
    for pattern in STYLE_EDIT_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            logger.debug("규칙 분류: style_edit — 패턴: %s", pattern)
            style_key = _extract_style_key(text)
            return {
                "category": "style_edit",
                "target_component": None,
                "target_slot": None,
                "new_value": _extract_color_value(text),
                "style_key": style_key,
                "confidence": 0.80,
                "method": "rule",
            }

    # 슬롯 수정
    for pattern in SLOT_EDIT_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            logger.debug("규칙 분류: slot_edit — 패턴: %s", pattern)
            component, slot = _extract_slot_target(text)
            return {
                "category": "slot_edit",
                "target_component": component,
                "target_slot": slot,
                "new_value": _extract_quoted_value(text),
                "style_key": None,
                "confidence": 0.75,
                "method": "rule",
            }

    return None  # 규칙 미매칭


def _extract_quoted_value(text: str) -> Optional[str]:
    """따옴표 안의 값 추출."""
    match = re.search(r'["\']([^"\']{1,100})["\']', text)
    return match.group(1) if match else None


def _extract_color_value(text: str) -> Optional[str]:
    """hex 코드 추출."""
    match = re.search(r'#([0-9a-fA-F]{3,6})', text)
    if match:
        return f"#{match.group(1)}"
    color_map = {
        "빨간": "#ef4444", "파란": "#3b82f6", "초록": "#22c55e",
        "노란": "#eab308", "검은": "#000000", "하얀": "#ffffff",
        "보라": "#a855f7", "주황": "#f97316", "분홍": "#ec4899",
        "회색": "#6b7280", "남색": "#1e3a8a",
    }
    for ko, hex_val in color_map.items():
        if ko in text:
            return hex_val
    return None


def _extract_style_key(text: str) -> str:
    """스타일 키 추론."""
    if any(w in text for w in ["배경", "background"]):
        return "background"
    if any(w in text for w in ["primary", "메인", "주요"]):
        return "primary"
    if any(w in text for w in ["secondary", "보조"]):
        return "secondary"
    if any(w in text for w in ["폰트", "글꼴", "font"]):
        return "heading"
    if any(w in text for w in ["여백", "spacing", "간격"]):
        return "spacing"
    if any(w in text for w in ["모서리", "radius", "둥글"]):
        return "borderRadius"
    return "primary"


def _extract_slot_target(text: str) -> tuple[Optional[str], Optional[str]]:
    """컴포넌트와 슬롯 키 추론."""
    component = None
    slot = None

    if any(w in text for w in ["히어로", "hero", "메인 제목", "대표 제목"]):
        component = "Hero"
        slot = "title" if any(w in text for w in ["제목", "title"]) else "subtitle"
    elif any(w in text for w in ["네비", "nav", "메뉴", "로고"]):
        component = "Navbar"
        slot = "logo" if "로고" in text else "menuItems"
    elif any(w in text for w in ["푸터", "footer", "저작권", "copyright"]):
        component = "Footer"
        slot = "copyright"
    elif any(w in text for w in ["cta", "배너", "전환"]):
        component = "CTA"
        slot = "title"
    elif any(w in text for w in ["연락", "contact", "이메일", "email"]):
        component = "ContactForm"
        slot = "email"

    if slot is None:
        if any(w in text for w in ["제목", "title"]):
            slot = "title"
        elif any(w in text for w in ["버튼", "button", "cta"]):
            slot = "ctaText"
        elif any(w in text for w in ["부제목", "subtitle", "설명"]):
            slot = "subtitle"

    return component, slot


# ─────────────────────────────────────────────
# 2단계: LLM 분류
# ─────────────────────────────────────────────

async def llm_classify(user_input: str, current_ir: dict, llm) -> dict:
    """LLM으로 분류. 규칙 기반 미매칭 시 호출."""
    from prompts.classifier_prompt import CLASSIFIER_SYSTEM_PROMPT

    context = ""
    if current_ir:
        try:
            pages = current_ir.get("pages", [])
            comp_types = []
            for page in pages:
                for comp in page.get("components", []):
                    comp_types.append(f"{comp['type']}({comp['id']})")
            context = f"\n현재 IR 컴포넌트: {', '.join(comp_types[:12])}"
        except Exception:
            pass

    user_prompt = f"사용자 입력: {user_input}{context}"

    try:
        raw = await llm.generate(CLASSIFIER_SYSTEM_PROMPT, user_prompt)
        # JSON 파싱
        json_match = re.search(r'\{.*?\}', raw, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            result["method"] = "llm"
            return result
    except Exception as e:
        logger.warning("LLM 분류 실패: %s", str(e))

    # fallback: structure로 처리 (안전)
    return {
        "category": "structure",
        "target_component": None,
        "target_slot": None,
        "new_value": None,
        "style_key": None,
        "confidence": 0.5,
        "method": "fallback",
    }


# ─────────────────────────────────────────────
# 메인 분류 함수
# ─────────────────────────────────────────────

async def classify_input(user_input: str, current_ir: dict, llm=None) -> dict:
    """
    입력 분류 메인 함수.
    1. 규칙 기반 매칭 시도
    2. 실패 시 LLM 호출 (llm이 제공된 경우)
    3. llm이 없으면 "structure" fallback
    """
    # 빈 입력 처리
    if not user_input or not user_input.strip():
        return {
            "category": "structure",
            "target_component": None,
            "target_slot": None,
            "new_value": None,
            "style_key": None,
            "confidence": 1.0,
            "method": "empty",
        }

    # 1단계: 규칙 기반
    result = rule_based_classify(user_input)
    if result:
        return result

    # 2단계: LLM (제공된 경우)
    if llm:
        return await llm_classify(user_input, current_ir, llm)

    # 3단계: fallback
    logger.info("분류기 fallback → structure (LLM 없음)")
    return {
        "category": "structure",
        "target_component": None,
        "target_slot": None,
        "new_value": None,
        "style_key": None,
        "confidence": 0.5,
        "method": "fallback",
    }
