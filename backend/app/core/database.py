from collections.abc import Generator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import get_settings


engine = create_engine(
    get_settings().database_url,
    connect_args={"check_same_thread": False}
    if get_settings().database_url.startswith("sqlite")
    else {},
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _ensure_analysis_columns()


def _ensure_analysis_columns() -> None:
    inspector = inspect(engine)
    if "analysisrecord" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("analysisrecord")
    }
    required_columns = {
        "optimized_headline": "TEXT DEFAULT ''",
        "optimized_summary": "TEXT DEFAULT ''",
        "rewritten_bullets": "TEXT DEFAULT '[]'",
        "ats_keywords": "TEXT DEFAULT '[]'",
        "job_core_skills": "TEXT DEFAULT '[]'",
        "job_business_contexts": "TEXT DEFAULT '[]'",
        "job_bonus_points": "TEXT DEFAULT '[]'",
        "job_hard_requirements": "TEXT DEFAULT '[]'",
        "covered_keywords": "TEXT DEFAULT '[]'",
        "missing_keywords": "TEXT DEFAULT '[]'",
        "edit_notes": "TEXT DEFAULT '[]'",
    }

    with engine.begin() as connection:
        for column_name, column_type in required_columns.items():
            if column_name not in existing_columns:
                connection.execute(
                    text(f"ALTER TABLE analysisrecord ADD COLUMN {column_name} {column_type}")
                )


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
