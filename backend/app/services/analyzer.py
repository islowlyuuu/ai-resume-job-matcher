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
                    "简历：\n"
                    f"{resume_text[:12000]}\n\n"
                    "岗位描述：\n"
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
    overlap_labels = [_display_keyword(keyword) for keyword in overlap]
    missing_labels = [_display_keyword(keyword) for keyword in missing]
    coverage = len(overlap) / max(len(job_tokens), 1)
    overlap_bonus = min(25, len(overlap) * 3)
    score = min(95, max(35, round(coverage * 100) + overlap_bonus + 8))
    job_title = _guess_job_title(job_description)
    candidate_name = _guess_candidate_name(resume_text)

    strengths = [
        f"简历中体现了「{keyword}」相关经验。" for keyword in overlap_labels[:6]
    ] or ["简历具备一定相关背景，但和岗位关键词的直接对应还不够明显。"]
    gaps = [
        f"建议补充「{keyword}」方面的具体项目或成果。" for keyword in missing_labels[:6]
    ] or ["本地分析未发现明显关键词缺口。"]
    recommendations = [
        "在简历开头增加一段面向目标岗位的个人摘要。",
        "把岗位中最核心的要求对应到可量化的项目成果上。",
        "项目经历建议同时写清技术工具、业务场景和最终结果。",
    ]

    return AnalysisResult(
        candidate_name=candidate_name,
        job_title=job_title,
        match_score=score,
        summary=(
            f"当前简历与岗位描述中的显性要求约有 {score}% 的匹配度。"
            f"主要重合点包括：{'、'.join(overlap_labels[:5]) or '通用项目经验'}。"
            "后续优化重点应放在岗位要求中尚未被简历充分证明的部分。"
        ),
        strengths=strengths,
        gaps=gaps,
        recommendations=recommendations,
        cover_letter=(
            "尊敬的招聘团队：\n\n"
            f"您好！我希望申请「{job_title}」岗位。我的经历与贵方在"
            f"「{'、'.join(overlap_labels[:3]) or '核心岗位职责'}」方面的要求较为匹配，"
            "也期待有机会把相关项目经验和解决问题的能力带到团队中。\n\n"
            "此致\n"
            f"{candidate_name}"
        ),
    )


def _keywords(text: str) -> set[str]:
    stop_words = {
        "and", "for", "with", "the", "you", "your", "are", "that", "this", "from",
        "will", "have", "has", "our", "their", "role", "team", "work", "years",
        "experience", "candidate", "responsibilities", "requirements",
    }
    cn_keywords = {
        "全栈", "前端", "后端", "数据看板", "看板", "数据库", "自动化测试",
        "测试", "产品", "工程师", "项目", "运营", "工作流", "简历", "岗位",
    }
    words = re.findall(r"[a-zA-Z][a-zA-Z+#.-]{2,}", text.lower())
    tokens = {word.strip(".,;:!?") for word in words if word not in stop_words}
    tokens.update(keyword for keyword in cn_keywords if keyword in text)
    return tokens


def _display_keyword(keyword: str) -> str:
    display_map = {
        "ai": "AI",
        "api": "API",
        "fastapi": "FastAPI",
        "postgresql": "PostgreSQL",
        "react": "React",
        "sql": "SQL",
        "typescript": "TypeScript",
        "javascript": "JavaScript",
        "python": "Python",
    }
    return display_map.get(keyword, keyword)


def _guess_job_title(job_description: str) -> str:
    first_line = next((line.strip() for line in job_description.splitlines() if line.strip()), "")
    if len(first_line.split()) <= 8:
        return first_line if _has_cjk(first_line) else first_line.title()
    patterns = [r"(?:hiring|seeking|looking for)\s+(?:an?\s+)?([^.,\n]+)"]
    for pattern in patterns:
        match = re.search(pattern, job_description, re.IGNORECASE)
        if match:
            title = match.group(1).strip()
            return title if _has_cjk(title) else title.title()
    return "目标岗位"


def _guess_candidate_name(resume_text: str) -> str:
    for line in resume_text.splitlines()[:5]:
        clean = line.strip()
        if 2 <= len(clean) <= 6 and _has_cjk(clean) and not any(char.isdigit() for char in clean):
            return clean
        if 2 <= len(clean.split()) <= 4 and not any(char.isdigit() for char in clean):
            return clean
    return "候选人"


def _has_cjk(text: str) -> bool:
    return any("\u4e00" <= char <= "\u9fff" for char in text)


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
