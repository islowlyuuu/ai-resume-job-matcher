import json
import re
from pathlib import Path

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.schemas.analysis import AnalysisResult


PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "resume_matcher.md"


async def analyze_resume(resume_text: str, job_description: str) -> AnalysisResult:
    settings = get_settings()
    if settings.openai_api_key:
        return await _analyze_with_openai(resume_text, job_description)
    return _analyze_locally(resume_text, job_description)


async def _analyze_with_openai(resume_text: str, job_description: str) -> AnalysisResult:
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    prompt = PROMPT_PATH.read_text(encoding="utf-8")
    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": (
                    "Resume:\n"
                    f"{resume_text[:12000]}\n\n"
                    "Job description:\n"
                    f"{job_description[:8000]}"
                ),
            },
        ],
    )
    content = response.choices[0].message.content or "{}"
    return AnalysisResult.model_validate_json(content)


def _analyze_locally(resume_text: str, job_description: str) -> AnalysisResult:
    resume_tokens = _keywords(resume_text)
    job_tokens = _keywords(job_description)
    overlap = sorted(job_tokens & resume_tokens)
    missing = sorted(job_tokens - resume_tokens)
    coverage = len(overlap) / max(len(job_tokens), 1)
    overlap_bonus = min(25, len(overlap) * 3)
    score = min(95, max(35, round(coverage * 100) + overlap_bonus + 8))
    job_title = _guess_job_title(job_description)
    candidate_name = _guess_candidate_name(resume_text)

    strengths = [
        f"Resume mentions {keyword}." for keyword in overlap[:6]
    ] or ["Resume contains relevant background, but keyword evidence is limited."]
    gaps = [
        f"Add clearer evidence for {keyword}." for keyword in missing[:6]
    ] or ["No major keyword gaps found in the local analysis."]
    recommendations = [
        "Add a role-specific summary at the top of the resume.",
        "Mirror the strongest job requirements with measurable achievements.",
        "Use project bullets that include tools, business context, and outcomes.",
    ]

    return AnalysisResult(
        candidate_name=candidate_name,
        job_title=job_title,
        match_score=score,
        summary=(
            f"The resume currently matches about {score}% of the visible job signals. "
            f"Strong overlap includes {', '.join(overlap[:5]) or 'general experience'}, "
            "while the highest-value improvements are in the missing requirements."
        ),
        strengths=strengths,
        gaps=gaps,
        recommendations=recommendations,
        cover_letter=(
            f"Dear hiring team,\n\n"
            f"I am excited to apply for the {job_title} role. My background aligns with "
            f"your needs around {', '.join(overlap[:3]) or 'the core responsibilities'}, "
            "and I would welcome the chance to bring that experience to your team.\n\n"
            "Sincerely,\n"
            f"{candidate_name}"
        ),
    )


def _keywords(text: str) -> set[str]:
    stop_words = {
        "and", "for", "with", "the", "you", "your", "are", "that", "this", "from",
        "will", "have", "has", "our", "their", "role", "team", "work", "years",
        "experience", "candidate", "responsibilities", "requirements",
    }
    words = re.findall(r"[a-zA-Z][a-zA-Z+#.-]{2,}", text.lower())
    return {word.strip(".,;:!?") for word in words if word not in stop_words}


def _guess_job_title(job_description: str) -> str:
    first_line = next((line.strip() for line in job_description.splitlines() if line.strip()), "")
    if len(first_line.split()) <= 8:
        return first_line.title()
    patterns = [r"(?:hiring|seeking|looking for)\s+(?:an?\s+)?([^.,\n]+)"]
    for pattern in patterns:
        match = re.search(pattern, job_description, re.IGNORECASE)
        if match:
            return match.group(1).strip().title()
    return "Target Role"


def _guess_candidate_name(resume_text: str) -> str:
    for line in resume_text.splitlines()[:5]:
        clean = line.strip()
        if 2 <= len(clean.split()) <= 4 and not any(char.isdigit() for char in clean):
            return clean
    return "Candidate"


def result_to_record_payload(result: AnalysisResult, resume_text: str, job_description: str) -> dict:
    data = result.model_dump()
    for key in ("strengths", "gaps", "recommendations"):
        data[key] = json.dumps(data[key], ensure_ascii=False)
    data["resume_text"] = resume_text
    data["job_description"] = job_description
    return data


def record_to_result(record) -> dict:
    data = record.model_dump()
    for key in ("strengths", "gaps", "recommendations"):
        data[key] = json.loads(data[key])
    return data
