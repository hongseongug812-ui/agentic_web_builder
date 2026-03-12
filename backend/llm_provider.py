"""
통합 LLM 프로바이더
====================
Gemini, Claude, GPT를 하나의 인터페이스로 통합합니다.

✅ 비동기 SDK 사용 (이벤트 루프 블로킹 방지)
✅ JSON 재시도 로직 (planning/review 호출용)
✅ XML 파싱 (코드 생성 호출용 — JSON 이스케이프 불필요)
✅ force_json=False → 코드 생성시 텍스트 모드
"""

import asyncio
import json
import logging
import os
import re
from abc import ABC, abstractmethod
from typing import Optional

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
MAX_JSON_RETRIES = 3


# ──────────────────────────────────────────────
# 추상 기본 클래스
# ──────────────────────────────────────────────
class LLMProvider(ABC):
    """LLM 프로바이더 공통 인터페이스"""

    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str, force_json: bool = True) -> str:
        """
        시스템 프롬프트 + 사용자 프롬프트로 텍스트 생성.
        force_json=True  → JSON 모드 강제 (planning/review 호출용)
        force_json=False → 텍스트 모드 (XML 코드 생성 호출용)
        """
        ...


# ──────────────────────────────────────────────
# Gemini 프로바이더
# ──────────────────────────────────────────────
class GeminiProvider(LLMProvider):
    async def generate(self, system_prompt: str, user_prompt: str, force_json: bool = True) -> str:
        import google.generativeai as genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY가 설정되지 않았습니다.")

        genai.configure(api_key=api_key)

        gen_config = genai.GenerationConfig(
            response_mime_type="application/json",
        ) if force_json else genai.GenerationConfig()

        model = genai.GenerativeModel(
            model_name=AVAILABLE_MODELS["gemini"]["model_id"],
            system_instruction=system_prompt,
            generation_config=gen_config,
        )

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
    async def generate(self, system_prompt: str, user_prompt: str, force_json: bool = True) -> str:
        import anthropic

        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY가 설정되지 않았습니다.")

        client = anthropic.AsyncAnthropic(api_key=api_key)

        # force_json=True → assistant prefill "{" 로 JSON 시작 강제
        # force_json=False → 일반 응답 (XML 코드 생성)
        if force_json:
            messages = [
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": "{"},
            ]
        else:
            messages = [{"role": "user", "content": user_prompt}]

        try:
            message = await asyncio.wait_for(
                client.messages.create(
                    model=AVAILABLE_MODELS["claude"]["model_id"],
                    max_tokens=8192,
                    system=system_prompt,
                    messages=messages,
                ),
                timeout=LLM_TIMEOUT,
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail=f"Claude 응답 타임아웃 ({LLM_TIMEOUT}초)")

        text = message.content[0].text
        return ("{" + text) if force_json else text


# ──────────────────────────────────────────────
# GPT 프로바이더 (비동기 SDK)
# ──────────────────────────────────────────────
class GPTProvider(LLMProvider):
    async def generate(self, system_prompt: str, user_prompt: str, force_json: bool = True) -> str:
        from openai import AsyncOpenAI

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY가 설정되지 않았습니다.")

        client = AsyncOpenAI(api_key=api_key)

        create_kwargs: dict = {
            "model": AVAILABLE_MODELS["gpt"]["model_id"],
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
        }
        if force_json:
            create_kwargs["response_format"] = {"type": "json_object"}

        try:
            response = await asyncio.wait_for(
                client.chat.completions.create(**create_kwargs),
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


# ──────────────────────────────────────────────
# JSON 파싱 유틸 (planning / review 호출용)
# ──────────────────────────────────────────────
def parse_llm_json(raw_text: str) -> dict:
    """LLM 응답에서 JSON 추출 (4단계 폴백 전략)"""
    # 전략 1: 코드블록 제거 후 파싱
    cleaned = re.sub(r"```(?:json)?\s*", "", raw_text).strip().rstrip("`")
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

    # 전략 3: 이스케이프 수정 후 재시도
    fixed = raw_text.replace("\\n", "\n").replace("\\'", "'")
    cleaned2 = re.sub(r"```(?:json)?\s*", "", fixed).strip().rstrip("`")
    try:
        return json.loads(cleaned2)
    except json.JSONDecodeError:
        pass

    # 전략 4: 중괄호 depth 추적으로 유효한 JSON 경계 찾기
    for start in range(len(raw_text)):
        if raw_text[start] == '{':
            depth = 0
            for end in range(start, len(raw_text)):
                if raw_text[end] == '{':
                    depth += 1
                elif raw_text[end] == '}':
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(raw_text[start:end + 1])
                        except json.JSONDecodeError:
                            break
            break

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
    """LLM 호출(JSON 모드) + 파싱 재시도"""
    last_error: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            raw = await provider.generate(system_prompt, user_prompt, force_json=True)
            return parse_llm_json(raw)
        except HTTPException as e:
            if e.status_code == 502 and attempt < retries:
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


# ──────────────────────────────────────────────
# XML 파싱 유틸 (코드 생성 호출용)
# ──────────────────────────────────────────────
def parse_xml_code_output(raw_text: str, framework: str = "Next.js 14") -> dict:
    """
    XML 태그 형식 코드 응답 파싱.

    LLM이 아래 형식으로 응답할 때 사용:
      <output framework="..." summary="...">
        <file path="src/app/page.tsx" language="tsx">
        ...코드...
        </file>
      </output>

    JSON 방식 대비 장점:
    - 코드 내 특수문자 이스케이프 불필요
    - 파싱 실패율 대폭 감소
    """
    files = []

    # <file path="..." language="...">...</file> 추출
    file_pattern = re.compile(
        r'<file\s+path="([^"]+)"\s+language="([^"]+)">(.*?)</file>',
        re.DOTALL,
    )
    for m in file_pattern.finditer(raw_text):
        path, language, code = m.group(1), m.group(2), m.group(3)
        # 앞뒤 공백/개행 정리
        code = code.strip("\n").rstrip()
        files.append({"path": path, "code": code, "language": language})

    # path/language 순서가 바뀐 경우도 처리
    if not files:
        alt_pattern = re.compile(
            r'<file\s+language="([^"]+)"\s+path="([^"]+)">(.*?)</file>',
            re.DOTALL,
        )
        for m in alt_pattern.finditer(raw_text):
            language, path, code = m.group(1), m.group(2), m.group(3)
            files.append({"path": path, "code": code.strip("\n").rstrip(), "language": language})

    # summary 추출
    summary_match = re.search(r'summary="([^"]*)"', raw_text)
    summary = summary_match.group(1) if summary_match else "코드 생성 완료"

    # framework 추출
    fw_match = re.search(r'framework="([^"]*)"', raw_text)
    fw = fw_match.group(1) if fw_match else framework

    if not files:
        logger.error("XML 코드 파싱 실패 — <file> 태그 없음. 원본: %s", raw_text[:500])
        raise HTTPException(
            status_code=502,
            detail="코드 생성 응답을 파싱할 수 없습니다. 다시 시도해주세요.",
        )

    return {"framework": fw, "files": files, "summary": summary}


async def generate_code_xml(
    provider: LLMProvider,
    system_prompt: str,
    user_prompt: str,
    framework: str = "Next.js 14",
    retries: int = 2,
) -> dict:
    """
    코드 생성 전용 LLM 호출 (텍스트 모드 + XML/마크다운 3단계 폴백 파싱).
    JSON 모드를 사용하지 않으므로 대용량 코드 생성에 최적화.
    """
    # 지연 임포트 (순환 의존성 방지)
    from services.code_parser import parse_with_fallback, parsed_files_to_dict

    last_error: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            raw = await provider.generate(system_prompt, user_prompt, force_json=False)

            # 3단계 폴백 파서 사용 (XML 태그 → 마크다운 블록 → 단일 파일)
            parsed = parse_with_fallback(raw)
            if not parsed:
                raise HTTPException(status_code=502, detail="코드 파싱 결과 없음")

            result = parsed_files_to_dict(parsed)
            result["framework"] = framework
            return result

        except HTTPException as e:
            if e.status_code == 502 and attempt < retries:
                logger.warning("코드 XML 파싱 실패 (시도 %d/%d), 재시도...", attempt, retries)
                last_error = e
                continue
            raise
        except Exception as e:
            last_error = e
            if attempt < retries:
                logger.warning("코드 생성 실패 (시도 %d/%d): %s", attempt, retries, str(e))
                continue
            raise

    raise last_error or HTTPException(status_code=502, detail="코드 생성 실패")
