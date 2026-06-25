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
    ai_provider: str = "local"
    ai_model: str = "local-keyword-analyzer"
    used_fallback: bool = False
    provider_error: str = ""


class AnalysisRead(AnalysisResult):
    id: int
    created_at: datetime


class AnalyzeTextRequest(BaseModel):
    resume_text: str = Field(min_length=20)
    job_description: str = Field(min_length=20)
    output_mode: str = "boss"
    provider: str = "default"


class ResumeTextExtractResponse(BaseModel):
    resume_text: str


class SnapshotSaveResponse(BaseModel):
    filename: str
    path: str


class ProviderStatus(BaseModel):
    id: str
    name: str
    model: str
    base_url: str
    configured: bool
    is_default: bool
    supports_chat: bool
