"""
에이전트별 컨텍스트 매니저
==========================
Phase 2-4: 스마트 컨텍스트 — 에이전트별 토큰 예산 내에서
필요한 정보만 조립. QA에게 전체 코드를 한 번에 주지 않고
파일 우선순위에 따라 예산 내로 포함.

토큰 계산: tiktoken(cl100k_base) → 없으면 글자 수 / 4 근사치
"""

import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

# tiktoken 지연 임포트 (없으면 근사치 폴백)
_tiktoken_enc = None


def _count_tokens(text: str) -> int:
    """토큰 수 계산. tiktoken 없으면 글자 수 / 4 근사치."""
    global _tiktoken_enc
    if _tiktoken_enc is None:
        try:
            import tiktoken
            _tiktoken_enc = tiktoken.get_encoding("cl100k_base")
        except ImportError:
            _tiktoken_enc = False  # 사용 불가 마킹

    if _tiktoken_enc and _tiktoken_enc is not False:
        return len(_tiktoken_enc.encode(text))
    # 근사치: 영어 ~4자/토큰, 한국어 ~2자/토큰 → 평균 ~3자/토큰
    return max(1, len(text) // 3)


# ──────────────────────────────────────────────
# 에이전트별 토큰 예산
# ──────────────────────────────────────────────
@dataclass
class ContextBudget:
    """에이전트별 입력 토큰 예산"""
    max_input_tokens: int     # 총 입력 토큰 상한
    reserved_for_system: int  # 시스템 프롬프트용 (차감)
    reserved_for_output: int  # 출력 예약 (정보용, LLM max_tokens와 별개)

    @property
    def available(self) -> int:
        return self.max_input_tokens - self.reserved_for_system


BUDGETS: dict[str, ContextBudget] = {
    "cto":        ContextBudget(max_input_tokens=8_000,  reserved_for_system=2_000, reserved_for_output=4_000),
    "fe_lead":    ContextBudget(max_input_tokens=12_000, reserved_for_system=2_000, reserved_for_output=8_000),
    "be_lead":    ContextBudget(max_input_tokens=12_000, reserved_for_system=2_000, reserved_for_output=8_000),
    "fe_dev":     ContextBudget(max_input_tokens=6_000,  reserved_for_system=1_500, reserved_for_output=3_000),
    "be_dev":     ContextBudget(max_input_tokens=6_000,  reserved_for_system=1_500, reserved_for_output=3_000),
    "qa":         ContextBudget(max_input_tokens=10_000, reserved_for_system=2_000, reserved_for_output=3_000),
    "classifier": ContextBudget(max_input_tokens=2_000,  reserved_for_system=500,   reserved_for_output=500),
}

# QA가 코드를 살펴볼 때 우선시하는 파일 패턴 (낮을수록 우선)
_QA_FILE_PRIORITY: dict[str, int] = {
    "page.tsx": 0, "page.ts": 0,
    "layout.tsx": 1, "layout.ts": 1,
    "index.tsx": 2, "index.ts": 2,
    "route.ts": 3, "api/": 3,
    "component": 5,
    "globals.css": 7,
}


class ContextManager:
    """에이전트별 토큰 예산 기반 컨텍스트 조립기."""

    # ── 공개 API ──────────────────────────────

    def count_tokens(self, text: str) -> int:
        return _count_tokens(text)

    def truncate_to_budget(self, text: str, max_tokens: int, suffix: str = "\n\n[... 토큰 제한으로 생략됨]") -> str:
        """텍스트를 max_tokens 이내로 잘라냅니다."""
        if _count_tokens(text) <= max_tokens:
            return text
        # 이진 탐색으로 최적 자르기 위치 찾기
        lo, hi = 0, len(text)
        while lo < hi - 1:
            mid = (lo + hi) // 2
            if _count_tokens(text[:mid]) <= max_tokens:
                lo = mid
            else:
                hi = mid
        return text[:lo] + suffix

    def build_plan_summary(self, plan_json: str, max_tokens: int = 800) -> str:
        """기획서 JSON → 요약본 (CTO/QA 컨텍스트에 삽입용)."""
        return self.truncate_to_budget(plan_json, max_tokens, suffix="\n[기획서 생략됨]")

    def build_ir_summary(self, ir: dict) -> str:
        """IR 전체 대신 구조 요약 (~150 토큰)."""
        pages = ir.get("pages", [])
        page_lines = []
        for page in pages:
            components = [c.get("type", "?") for c in page.get("components", [])]
            page_lines.append(f"  {page.get('route', '/')} : {', '.join(components)}")

        style = ir.get("styleTokens", {})
        colors = style.get("colors", {})
        fonts = style.get("fonts", {})
        return (
            "페이지 구조:\n"
            + "\n".join(page_lines or ["  / : (없음)"])
            + f"\n메인 색상: {colors.get('primary', 'N/A')}"
            + f"\n폰트: {fonts.get('heading', 'N/A')}"
        )

    def build_qa_context(
        self,
        plan_json: str,
        fe_files: list[dict],
        be_files: Optional[list[dict]] = None,
        user_prompt: str = "",
        code_review_feedback: str = "",
    ) -> str:
        """
        QA 전용 컨텍스트 조립.
        파일을 중요도 순으로 정렬한 뒤 토큰 예산 내에서 포함.
        전체 코드를 한 방에 넣지 않아 'Lost in the middle' 방지.
        """
        budget = BUDGETS["qa"]
        available = budget.available
        parts: list[str] = []
        used = 0

        # 1. 기획 요약 (우선 포함)
        plan_summary = self.build_plan_summary(plan_json, max_tokens=600)
        parts.append(f"기획서 요약:\n{plan_summary}")
        used += _count_tokens(parts[-1])

        # 2. 사용자 요구사항 (디자인 토큰 포함 시)
        if user_prompt and ("디자인 시스템" in user_prompt or "컬러 팔레트" in user_prompt):
            req_text = f"사용자 디자인 요구사항 (반영 확인!):\n{user_prompt[:800]}"
            req_tokens = _count_tokens(req_text)
            if used + req_tokens <= available:
                parts.append(req_text)
                used += req_tokens

        # 3. 코드 리뷰 피드백
        if code_review_feedback:
            review_text = f"FE Dev 코드 리뷰:\n{code_review_feedback[:400]}"
            review_tokens = _count_tokens(review_text)
            if used + review_tokens <= available:
                parts.append(review_text)
                used += review_tokens

        # 4. FE 파일 (우선순위 순)
        skipped: list[str] = []
        sorted_fe = self._prioritize_files(fe_files)
        for f in sorted_fe:
            path = f.get("path", "unknown")
            code = f.get("code", f.get("content", ""))
            file_text = f"// {path}\n{code}"
            file_tokens = _count_tokens(file_text)
            if used + file_tokens <= available:
                parts.append(file_text)
                used += file_tokens
            else:
                # 예산 초과: 이 파일은 경로만 표시
                skipped.append(path)

        # 5. BE 파일 (있으면, 남은 예산으로)
        if be_files:
            for f in be_files[:3]:  # BE는 최대 3개
                path = f.get("path", "unknown")
                code = f.get("code", f.get("content", ""))
                file_text = f"# {path}\n{code}"
                file_tokens = _count_tokens(file_text)
                if used + file_tokens <= available:
                    parts.append(file_text)
                    used += file_tokens
                else:
                    skipped.append(path)

        if skipped:
            parts.append(f"(토큰 예산 초과로 미포함 파일: {', '.join(skipped)})")

        logger.info(
            "QA 컨텍스트 조립 완료 — 사용 토큰: %d/%d, 스킵: %d개",
            used, available, len(skipped),
        )

        return "\n\n---\n\n".join(parts)

    # ── 내부 헬퍼 ─────────────────────────────

    def _file_priority(self, path: str) -> int:
        for pattern, score in _QA_FILE_PRIORITY.items():
            if pattern in path:
                return score
        return 10

    def _prioritize_files(self, files: list[dict]) -> list[dict]:
        return sorted(files, key=lambda f: self._file_priority(f.get("path", "")))


# 싱글턴
_ctx_manager: Optional[ContextManager] = None


def get_context_manager() -> ContextManager:
    global _ctx_manager
    if _ctx_manager is None:
        _ctx_manager = ContextManager()
    return _ctx_manager
