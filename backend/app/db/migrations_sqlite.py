"""Lightweight SQLite migrations for additive schema changes (no Alembic)."""
from sqlalchemy import text
from sqlalchemy.engine import Engine


def _cols(conn, table: str) -> set:
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {r[1] for r in rows}


def run_sqlite_migrations(engine: Engine) -> None:
    url = str(engine.url)
    if "sqlite" not in url:
        return

    with engine.begin() as conn:
        # --- users ---
        col_names = _cols(conn, "users")
        for stmt in (
            "ALTER TABLE users ADD COLUMN father_name VARCHAR",
            "ALTER TABLE users ADD COLUMN college_area VARCHAR",
            "ALTER TABLE users ADD COLUMN stream VARCHAR",
            "ALTER TABLE users ADD COLUMN mobile_no VARCHAR",
            "ALTER TABLE users ADD COLUMN registration_id VARCHAR",
            "ALTER TABLE users ADD COLUMN state_region VARCHAR",
            "ALTER TABLE users ADD COLUMN institution_name VARCHAR",
            "ALTER TABLE users ADD COLUMN competition_category VARCHAR",
            "ALTER TABLE users ADD COLUMN participant_code VARCHAR",
            "ALTER TABLE users ADD COLUMN mobile_digits VARCHAR",
        ):
            col = stmt.split("ADD COLUMN ")[1].split()[0]
            if col not in col_names:
                conn.execute(text(stmt))
                col_names.add(col)

        # --- platform_settings ---
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS platform_settings (
                    id INTEGER PRIMARY KEY,
                    student_analytics_enabled INTEGER NOT NULL DEFAULT 1,
                    allow_quiz_retakes INTEGER NOT NULL DEFAULT 0
                )
                """
            )
        )
        ps_cols = _cols(conn, "platform_settings")
        if "allow_quiz_retakes" not in ps_cols:
            conn.execute(text("ALTER TABLE platform_settings ADD COLUMN allow_quiz_retakes INTEGER NOT NULL DEFAULT 0"))
        for col, default in (
            ("analytics_rank_tier_1", "3"),
            ("analytics_rank_tier_2", "10"),
            ("analytics_rank_tier_3", "20"),
        ):
            if col not in ps_cols:
                conn.execute(text(f"ALTER TABLE platform_settings ADD COLUMN {col} INTEGER NOT NULL DEFAULT {default}"))
                ps_cols.add(col)
        row = conn.execute(text("SELECT id FROM platform_settings WHERE id = 1")).fetchone()
        if not row:
            conn.execute(
                text(
                    "INSERT INTO platform_settings (id, student_analytics_enabled, allow_quiz_retakes) VALUES (1, 1, 0)"
                )
            )

        # --- quizzes ---
        q_cols = _cols(conn, "quizzes")
        if "question_pool_mode" not in q_cols:
            conn.execute(
                text(
                    "ALTER TABLE quizzes ADD COLUMN question_pool_mode VARCHAR NOT NULL DEFAULT 'all'"
                )
            )
        if "questions_per_attempt" not in q_cols:
            conn.execute(
                text(
                    "ALTER TABLE quizzes ADD COLUMN questions_per_attempt INTEGER NOT NULL DEFAULT 0"
                )
            )

        # --- quiz_attempts ---
        a_cols = _cols(conn, "quiz_attempts")
        if "assigned_question_ids" not in a_cols:
            conn.execute(text("ALTER TABLE quiz_attempts ADD COLUMN assigned_question_ids TEXT"))
