from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class AnalysisRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_name: str = Field(default="Unknown candidate", index=True)
    job_title: str = Field(default="Untitled role", index=True)
    match_score: int = Field(ge=0, le=100)
    summary: str
    strengths: str
    gaps: str
    recommendations: str
    optimized_headline: str = Field(default="")
    optimized_summary: str = Field(default="")
    rewritten_bullets: str = Field(default="[]")
    ats_keywords: str = Field(default="[]")
    job_core_skills: str = Field(default="[]")
    job_business_contexts: str = Field(default="[]")
    job_bonus_points: str = Field(default="[]")
    job_hard_requirements: str = Field(default="[]")
    covered_keywords: str = Field(default="[]")
    missing_keywords: str = Field(default="[]")
    edit_notes: str = Field(default="[]")
    cover_letter: str
    resume_text: str
    job_description: str
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
