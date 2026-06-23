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
    optimized_headline = _build_optimized_headline(job_title, overlap_labels)
    optimized_summary = _build_optimized_summary(candidate_name, job_title, overlap_labels)
    rewritten_bullets = _build_rewritten_bullets(overlap_labels, missing_labels)
    ats_keywords = _dedupe_preserve_order([*overlap_labels, *missing_labels])[:12]
    edit_notes = [
        "把简历标题直接对齐目标岗位，方便招聘方快速判断方向匹配。",
        "摘要优先突出岗位中反复出现的技能和业务场景。",
        "项目经历改写为“动作 + 技术/场景 + 结果”的结构，更适合招聘筛选。",
        "缺失关键词不建议硬塞，应结合真实项目补充证据。",
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
        optimized_headline=optimized_headline,
        optimized_summary=optimized_summary,
        rewritten_bullets=rewritten_bullets,
        ats_keywords=ats_keywords,
        edit_notes=edit_notes,
        cover_letter=_build_boss_openers(job_title, overlap_labels),
    )


def _keywords(text: str) -> set[str]:
    stop_words = {
        "and", "for", "with", "the", "you", "your", "are", "that", "this", "from",
        "will", "have", "has", "our", "their", "role", "team", "work", "years",
        "experience", "candidate", "responsibilities", "requirements", "boss",
    }
    cn_keywords = {
        "全栈", "前端", "后端", "数据看板", "看板", "数据库", "自动化测试",
        "测试", "产品", "项目", "运营", "工作流", "接口联调", "数据可视化",
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


def _build_optimized_headline(job_title: str, overlap_labels: list[str]) -> str:
    focus = " / ".join(overlap_labels[:3]) if overlap_labels else "业务交付"
    return f"{job_title}｜{focus} 方向"


def _build_optimized_summary(
    candidate_name: str,
    job_title: str,
    overlap_labels: list[str],
) -> str:
    focus = "、".join(overlap_labels[:5]) if overlap_labels else "项目交付、跨团队协作和问题解决"
    return (
        f"{candidate_name}具备面向「{job_title}」的相关项目经验，"
        f"能够围绕{focus}推进需求落地。建议在正式简历中补充可量化结果，"
        "例如性能提升、效率提升、转化提升、成本下降或交付周期缩短。"
    )


def _build_rewritten_bullets(
    overlap_labels: list[str],
    missing_labels: list[str],
) -> list[str]:
    primary = overlap_labels[:4] or ["核心技能"]
    bullets = [
        f"围绕目标岗位要求，使用{primary[0]}完成核心模块建设，并沉淀可复用的实现方案。",
        f"结合{', '.join(primary[:3])}等技术或能力，优化业务流程，提升团队协作和交付效率。",
        "将项目经历按业务背景、个人职责、关键动作和结果影响重写，突出与岗位职责的直接关联。",
    ]
    if missing_labels:
        bullets.append(
            f"针对岗位提到的{missing_labels[0]}，补充真实项目中的使用场景、产出和复盘。"
        )
    return bullets


def _build_boss_openers(job_title: str, overlap_labels: list[str]) -> str:
    focus = "、".join(overlap_labels[:3]) if overlap_labels else "岗位方向"
    return "\n".join(
        [
            f"您好，我看了这个{job_title}岗位，和我之前做的{focus}方向比较接近，想进一步了解一下。",
            f"您好，我有{focus}相关经验，感觉和岗位要求比较匹配，想沟通下这个机会。",
            f"您好，这个岗位方向我比较感兴趣，我之前有{focus}相关经历，方便的话想了解下团队情况。",
        ]
    )


def _dedupe_preserve_order(items: list[str]) -> list[str]:
    seen = set()
    deduped = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped


def _guess_job_title(job_description: str) -> str:
    first_line = next((line.strip() for line in job_description.splitlines() if line.strip()), "")
    first_line = re.sub(r"^(Boss\s*)?岗位[:：]\s*", "", first_line, flags=re.IGNORECASE)
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
    for key in ("strengths", "gaps", "recommendations", "rewritten_bullets", "ats_keywords", "edit_notes"):
        data[key] = json.dumps(data[key], ensure_ascii=False)
    data["resume_text"] = resume_text
    data["job_description"] = job_description
    return data


def record_to_result(record) -> dict:
    data = record.model_dump()
    for key in ("strengths", "gaps", "recommendations", "rewritten_bullets", "ats_keywords", "edit_notes"):
        data[key] = json.loads(data.get(key) or "[]")
    return data
