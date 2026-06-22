from datetime import datetime

from pydantic import BaseModel, Field


class AnalysisResult(BaseModel):
    candidate_name: str = "Unknown candidate"
    job_title: str = "Untitled role"
    match_score: int = Field(ge=0, le=100)
    summary: str
    strengths: list[str]
    gaps: list[str]
    recommendations: list[str]
    cover_letter: str


class AnalysisRead(AnalysisResult):
    id: int
    created_at: datetime


class AnalyzeTextRequest(BaseModel):
    resume_text: str = Field(min_length=20)
    job_description: str = Field(min_length=20)
