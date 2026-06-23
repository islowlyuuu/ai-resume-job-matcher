from datetime import datetime

from pydantic import BaseModel, Field


class AnalysisResult(BaseModel):
    candidate_name: str = "候选人"
    job_title: str = "目标岗位"
    match_score: int = Field(ge=0, le=100)
    summary: str
    strengths: list[str]
    gaps: list[str]
    recommendations: list[str]
    optimized_headline: str
    optimized_summary: str
    rewritten_bullets: list[str]
    ats_keywords: list[str]
    job_core_skills: list[str] = Field(default_factory=list)
    job_business_contexts: list[str] = Field(default_factory=list)
    job_bonus_points: list[str] = Field(default_factory=list)
    job_hard_requirements: list[str] = Field(default_factory=list)
    covered_keywords: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    edit_notes: list[str]
    cover_letter: str


class AnalysisRead(AnalysisResult):
    id: int
    created_at: datetime


class AnalyzeTextRequest(BaseModel):
    resume_text: str = Field(min_length=20)
    job_description: str = Field(min_length=20)
    output_mode: str = "boss"


class SnapshotSaveResponse(BaseModel):
    filename: str
    path: str
