"""
통합 LLM 프로바이더
====================
Gemini, Claude, GPT를 하나의 인터페이스로 통합합니다.

✅ 비동기 SDK 사용 (이벤트 루프 블로킹 방지)
✅ JSON 재시도 로직
✅ 타임아웃 처리

사용 방법:
    provider = get_llm_provider("gemini")  # or "claude", "gpt"
    text = await provider.generate(system_prompt, user_prompt)
"""

import asyncio
import json
import logging
import os
import re
from abc import ABC, abstractmethod

from fastapi import HTTPException

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# 지원 모델 목록
# ──────────────────────────────────────────────
AVAILABLE_MODELS = {
    "gemini": {
        "name": "Gemini 2.5 Pro",
        "model_id": "gemini-2.5-pro-preview-05-06",
        "env_key": "GEMINI_API_KEY",
        "icon": "✨",
    },
    "claude": {
        "name": "Claude 3.5 Sonnet",
        "model_id": "claude-3-5-sonnet-20241022",
        "env_key": "ANTHROPIC_API_KEY",
        "icon": "🟠",
    },
    "gpt": {
        "name": "GPT-4o",
        "model_id": "gpt-4o",
        "env_key": "OPENAI_API_KEY",
        "icon": "🟢",
    },
}

# LLM 호출 타임아웃 (초)
LLM_TIMEOUT = 300
# JSON 파싱 재시도 횟수
MAX_JSON_RETRIES = 2


# ──────────────────────────────────────────────
# 추상 기본 클래스
# ──────────────────────────────────────────────
class LLMProvider(ABC):
    """LLM 프로바이더 공통 인터페이스"""

    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        """시스템 프롬프트 + 사용자 프롬프트로 텍스트 생성"""
        ...


# ──────────────────────────────────────────────
# Gemini 프로바이더
# ──────────────────────────────────────────────
class GeminiProvider(LLMProvider):
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        import google.generativeai as genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY가 설정되지 않았습니다.")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name=AVAILABLE_MODELS["gemini"]["model_id"],
            system_instruction=system_prompt,
        )

        # Gemini SDK는 동기적이므로 run_in_executor로 Non-blocking 처리
        loop = asyncio.get_event_loop()
        try:
            response = await asyncio.wait_for(
                loop.run_in_executor(None, model.generate_content, user_prompt),
                timeout=LLM_TIMEOUT,
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail=f"Gemini 응답 타임아웃 ({LLM_TIMEOUT}초)")

        return response.text


# ──────────────────────────────────────────────
# Claude 프로바이더 (비동기 SDK)
# ──────────────────────────────────────────────
class ClaudeProvider(LLMProvider):
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        import anthropic

        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY가 설정되지 않았습니다.")

        # ✅ AsyncAnthropic 사용 — 이벤트 루프 블로킹 방지
        client = anthropic.AsyncAnthropic(api_key=api_key)
        try:
            message = await asyncio.wait_for(
                client.messages.create(
                    model=AVAILABLE_MODELS["claude"]["model_id"],
                    max_tokens=4096,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}],
                ),
                timeout=LLM_TIMEOUT,
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail=f"Claude 응답 타임아웃 ({LLM_TIMEOUT}초)")

        return message.content[0].text


# ──────────────────────────────────────────────
# GPT 프로바이더 (비동기 SDK)
# ──────────────────────────────────────────────
class GPTProvider(LLMProvider):
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        from openai import AsyncOpenAI

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY가 설정되지 않았습니다.")

        # ✅ AsyncOpenAI 사용 — 이벤트 루프 블로킹 방지
        client = AsyncOpenAI(api_key=api_key)
        try:
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=AVAILABLE_MODELS["gpt"]["model_id"],
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.7,
                ),
                timeout=LLM_TIMEOUT,
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail=f"GPT 응답 타임아웃 ({LLM_TIMEOUT}초)")

        return response.choices[0].message.content or ""


# ──────────────────────────────────────────────
# 팩토리 함수
# ──────────────────────────────────────────────
_providers = {
    "gemini": GeminiProvider,
    "claude": ClaudeProvider,
    "gpt": GPTProvider,
}


def get_llm_provider(provider_name: str = "gemini") -> LLMProvider:
    """프로바이더 이름으로 LLM 인스턴스 반환"""
    provider_name = provider_name.lower()
    if provider_name not in _providers:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 모델: {provider_name}. 사용 가능: {list(_providers.keys())}",
        )
    return _providers[provider_name]()


def get_available_providers() -> list[dict]:
    """설정된 API 키가 있는 프로바이더 목록 반환"""
    result = []
    for key, info in AVAILABLE_MODELS.items():
        env_val = os.getenv(info["env_key"], "")
        configured = bool(env_val) and not env_val.startswith("your_")
        result.append({
            "id": key,
            "name": info["name"],
            "icon": info["icon"],
            "configured": configured,
        })
    return result


def parse_llm_json(raw_text: str) -> dict:
    """LLM 응답에서 JSON 추출 (마크다운 코드블록 처리, 다중 전략)"""
    # 전략 1: 코드블록 제거 후 파싱
    cleaned = re.sub(r"```(?:json)?\s*", "", raw_text)
    cleaned = cleaned.strip().rstrip("`")
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 전략 2: 첫 번째 { ... } 블록 추출
    match = re.search(r"\{[\s\S]*\}", raw_text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # 전략 3: 줄바꿈 이스케이프 수정 후 재시도
    fixed = raw_text.replace("\\n", "\n").replace("\\'", "'")
    cleaned2 = re.sub(r"```(?:json)?\s*", "", fixed).strip().rstrip("`")
    try:
        return json.loads(cleaned2)
    except json.JSONDecodeError:
        pass

    logger.error("JSON 파싱 실패 — 원본: %s", raw_text[:500])
    raise HTTPException(
        status_code=502,
        detail="AI 응답을 JSON으로 파싱할 수 없습니다. 다시 시도해주세요.",
    )


async def generate_with_json_retry(
    provider: LLMProvider,
    system_prompt: str,
    user_prompt: str,
    retries: int = MAX_JSON_RETRIES,
) -> dict:
    """LLM 호출 + JSON 파싱을 재시도하는 헬퍼 함수"""
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            raw = await provider.generate(system_prompt, user_prompt)
            return parse_llm_json(raw)
        except HTTPException as e:
            if e.status_code == 502 and attempt < retries:
                # JSON 파싱 실패 → 재시도
                logger.warning("JSON 파싱 실패 (시도 %d/%d), 재시도...", attempt, retries)
                last_error = e
                continue
            raise
        except Exception as e:
            last_error = e
            if attempt < retries:
                logger.warning("LLM 호출 실패 (시도 %d/%d): %s", attempt, retries, str(e))
                continue
            raise

    raise last_error or HTTPException(status_code=502, detail="LLM 호출 실패")
