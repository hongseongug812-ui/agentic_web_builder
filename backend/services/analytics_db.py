"""
분석 데이터베이스 — SQLite
==========================
사용자 세션, 프롬프트, 선호도를 추적하여
프롬프트 품질 향상에 활용합니다.

테이블:
  - sessions: 생성 세션 (템플릿, 색상, 기능 등)
  - ratings: 사용자 만족도 평가
  - popular_combos: 인기 조합 캐시 (집계 뷰)
"""

import sqlite3
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent / "analytics.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """데이터베이스 테이블 초기화"""
    conn = get_db()
    conn.executescript("""
        -- 생성 세션 기록
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            template_id TEXT,
            style_id TEXT,
            color_name TEXT,
            features TEXT,           -- JSON: ["로그인", "결제", ...]
            sections TEXT,           -- JSON: ["hero", "features", ...]
            design_tokens TEXT,      -- JSON: { font, radius, spacing, ... }
            animation_level TEXT,
            provider TEXT,           -- gpt / claude / gemini
            prompt_text TEXT,        -- 실제 전송된 프롬프트 (앞 3000자)
            prompt_mode TEXT,        -- auto / manual
            total_files INTEGER DEFAULT 0,
            qa_score INTEGER,
            generation_time_ms INTEGER,
            status TEXT DEFAULT 'started'  -- started / completed / failed
        );

        -- 사용자 평가
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
            feedback TEXT,
            liked_aspects TEXT,      -- JSON: ["디자인", "코드품질", ...]
            disliked_aspects TEXT,   -- JSON: ["속도", "레이아웃", ...]
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        -- 성공 패턴 인덱스
        CREATE INDEX IF NOT EXISTS idx_sessions_template ON sessions(template_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_color ON sessions(color_name);
        CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
        CREATE INDEX IF NOT EXISTS idx_ratings_score ON ratings(score);
    """)
    conn.commit()
    conn.close()
    logger.info("분석 DB 초기화 완료: %s", DB_PATH)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CRUD 함수
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_session(
    template_id: str,
    style_id: str,
    color_name: str,
    features: list[str],
    sections: list[str],
    design_tokens: dict,
    animation_level: str,
    provider: str,
    prompt_text: str,
    prompt_mode: str,
) -> int:
    """새 생성 세션을 기록하고 session_id를 반환합니다."""
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO sessions
        (template_id, style_id, color_name, features, sections,
         design_tokens, animation_level, provider, prompt_text, prompt_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            template_id, style_id, color_name,
            json.dumps(features, ensure_ascii=False),
            json.dumps(sections, ensure_ascii=False),
            json.dumps(design_tokens, ensure_ascii=False),
            animation_level, provider,
            prompt_text[:3000],  # 저장 공간 절약
            prompt_mode,
        )
    )
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    logger.info("세션 생성: #%d (template=%s, color=%s)", session_id, template_id, color_name)
    return session_id


def complete_session(
    session_id: int,
    total_files: int,
    qa_score: int,
    generation_time_ms: int,
    status: str = "completed",
):
    """세션 완료/실패 상태를 업데이트합니다."""
    conn = get_db()
    conn.execute(
        """UPDATE sessions
        SET total_files = ?, qa_score = ?, generation_time_ms = ?, status = ?
        WHERE id = ?""",
        (total_files, qa_score, generation_time_ms, status, session_id),
    )
    conn.commit()
    conn.close()


def add_rating(
    session_id: int,
    score: int,
    feedback: str = "",
    liked_aspects: list[str] | None = None,
    disliked_aspects: list[str] | None = None,
):
    """사용자 만족도 평가를 기록합니다."""
    conn = get_db()
    conn.execute(
        """INSERT INTO ratings (session_id, score, feedback, liked_aspects, disliked_aspects)
        VALUES (?, ?, ?, ?, ?)""",
        (
            session_id, score, feedback,
            json.dumps(liked_aspects or [], ensure_ascii=False),
            json.dumps(disliked_aspects or [], ensure_ascii=False),
        ),
    )
    conn.commit()
    conn.close()
    logger.info("평가 기록: 세션 #%d → 점수 %d/5", session_id, score)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 분석/학습 쿼리
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_popular_templates(limit: int = 5) -> list[dict]:
    """인기 템플릿 (사용 횟수 + 평균 평점)"""
    conn = get_db()
    rows = conn.execute("""
        SELECT
            s.template_id,
            COUNT(*) as usage_count,
            ROUND(AVG(r.score), 1) as avg_rating,
            COUNT(r.id) as rated_count
        FROM sessions s
        LEFT JOIN ratings r ON s.id = r.session_id
        WHERE s.status = 'completed'
        GROUP BY s.template_id
        ORDER BY usage_count DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_popular_colors(limit: int = 5) -> list[dict]:
    """인기 색상 (사용 횟수 + 평균 평점)"""
    conn = get_db()
    rows = conn.execute("""
        SELECT
            s.color_name,
            COUNT(*) as usage_count,
            ROUND(AVG(r.score), 1) as avg_rating
        FROM sessions s
        LEFT JOIN ratings r ON s.id = r.session_id
        WHERE s.status = 'completed' AND s.color_name IS NOT NULL
        GROUP BY s.color_name
        ORDER BY usage_count DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_top_rated_combos(min_rating: float = 4.0, limit: int = 10) -> list[dict]:
    """평점 높은 조합 (템플릿 + 색상 + 애니메이션)"""
    conn = get_db()
    rows = conn.execute("""
        SELECT
            s.template_id,
            s.color_name,
            s.animation_level,
            s.provider,
            ROUND(AVG(r.score), 1) as avg_rating,
            COUNT(r.id) as rated_count
        FROM sessions s
        INNER JOIN ratings r ON s.id = r.session_id
        WHERE s.status = 'completed'
        GROUP BY s.template_id, s.color_name, s.animation_level
        HAVING AVG(r.score) >= ? AND COUNT(r.id) >= 1
        ORDER BY avg_rating DESC, rated_count DESC
        LIMIT ?
    """, (min_rating, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_popular_features() -> list[dict]:
    """자주 쓰이는 기능 조합"""
    conn = get_db()
    rows = conn.execute("""
        SELECT features, COUNT(*) as cnt
        FROM sessions
        WHERE status = 'completed' AND features IS NOT NULL
        GROUP BY features
        ORDER BY cnt DESC
        LIMIT 10
    """).fetchall()
    conn.close()
    result = []
    for r in rows:
        try:
            result.append({"features": json.loads(r["features"]), "count": r["cnt"]})
        except json.JSONDecodeError:
            pass
    return result


def get_session_stats() -> dict:
    """전체 통계"""
    conn = get_db()
    row = conn.execute("""
        SELECT
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
            ROUND(AVG(CASE WHEN status = 'completed' THEN qa_score END), 1) as avg_qa_score,
            ROUND(AVG(CASE WHEN status = 'completed' THEN generation_time_ms END) / 1000.0, 1) as avg_gen_time_sec
        FROM sessions
    """).fetchone()

    rating_row = conn.execute("""
        SELECT
            COUNT(*) as total_ratings,
            ROUND(AVG(score), 1) as avg_user_score
        FROM ratings
    """).fetchone()

    conn.close()
    return {
        **dict(row),
        "total_ratings": rating_row["total_ratings"],
        "avg_user_score": rating_row["avg_user_score"],
    }


def get_learning_insights() -> dict:
    """
    학습 인사이트: 프롬프트 개선에 사용할 데이터를 반환합니다.
    - 가장 인기 있는 조합
    - 실패율 높은 패턴
    - 사용자가 좋아하는/싫어하는 측면
    """
    conn = get_db()

    # 인기 조합 (상위 3개)
    top_combos = conn.execute("""
        SELECT s.template_id, s.color_name, s.animation_level,
               ROUND(AVG(r.score), 1) as avg_rating
        FROM sessions s
        INNER JOIN ratings r ON s.id = r.session_id
        WHERE s.status = 'completed'
        GROUP BY s.template_id, s.color_name, s.animation_level
        HAVING COUNT(r.id) >= 1
        ORDER BY avg_rating DESC
        LIMIT 3
    """).fetchall()

    # 자주 좋아하는 측면
    liked = conn.execute("""
        SELECT liked_aspects FROM ratings WHERE liked_aspects != '[]'
    """).fetchall()
    liked_counts: dict[str, int] = {}
    for r in liked:
        try:
            for aspect in json.loads(r["liked_aspects"]):
                liked_counts[aspect] = liked_counts.get(aspect, 0) + 1
        except json.JSONDecodeError:
            pass

    # 자주 싫어하는 측면
    disliked = conn.execute("""
        SELECT disliked_aspects FROM ratings WHERE disliked_aspects != '[]'
    """).fetchall()
    disliked_counts: dict[str, int] = {}
    for r in disliked:
        try:
            for aspect in json.loads(r["disliked_aspects"]):
                disliked_counts[aspect] = disliked_counts.get(aspect, 0) + 1
        except json.JSONDecodeError:
            pass

    conn.close()

    return {
        "top_rated_combos": [dict(c) for c in top_combos],
        "most_liked": sorted(liked_counts.items(), key=lambda x: -x[1])[:5],
        "most_disliked": sorted(disliked_counts.items(), key=lambda x: -x[1])[:5],
    }


def build_learning_context() -> str:
    """
    학습 데이터를 프롬프트 컨텍스트 문자열로 변환합니다.
    이 문자열을 FE_LEAD_GENERATE_PROMPT에 주입하면
    과거 사용자 선호도를 반영한 코드를 생성합니다.
    """
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) as cnt FROM sessions WHERE status = 'completed'").fetchone()
    if total["cnt"] < 3:
        conn.close()
        return ""  # 데이터 부족 — 학습 비활성화

    insights = get_learning_insights()
    parts = ["━━━ 📊 과거 사용자 선호도 데이터 (참고용) ━━━"]

    if insights["top_rated_combos"]:
        parts.append("\n★ 높은 평점을 받은 조합:")
        for combo in insights["top_rated_combos"]:
            parts.append(
                f"  - {combo['template_id']} + {combo['color_name']} + "
                f"{combo['animation_level']} 애니메이션 → 평점 {combo['avg_rating']}/5"
            )

    if insights["most_liked"]:
        liked_str = ", ".join(f"{k}({v}회)" for k, v in insights["most_liked"])
        parts.append(f"\n👍 사용자가 좋아한 측면: {liked_str}")

    if insights["most_disliked"]:
        disliked_str = ", ".join(f"{k}({v}회)" for k, v in insights["most_disliked"])
        parts.append(f"\n👎 사용자가 불만족한 측면 (개선 필요): {disliked_str}")

    stats = get_session_stats()
    if stats.get("avg_user_score"):
        parts.append(f"\n📈 전체 평균 사용자 평점: {stats['avg_user_score']}/5 ({stats['total_ratings']}건)")

    conn.close()

    parts.append("\n위 데이터를 참고하여 높은 평점을 받을 수 있는 코드를 생성해라.")
    return "\n".join(parts)
