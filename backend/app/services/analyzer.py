import json
import re
from pathlib import Path

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.schemas.analysis import AnalysisResult
from app.skills import build_skill_prompt


PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "resume_matcher.md"


async def analyze_resume(
    resume_text: str,
    job_description: str,
    output_mode: str = "boss",
    provider: str = "default",
) -> AnalysisResult:
    settings = get_settings()
    selected_provider = _resolve_provider(provider, settings.ai_provider)
    provider_config = settings.provider_configs.get(selected_provider, settings.provider_configs["local"])
    if selected_provider == "local" or not provider_config.get("api_key"):
        return _analyze_locally(
            resume_text,
            job_description,
            output_mode,
            ai_provider="local",
            ai_model="local-keyword-analyzer",
            used_fallback=selected_provider != "local",
            provider_error="" if selected_provider == "local" else f"{provider_config['name']} 未配置 API Key",
        )
    try:
        return await _analyze_with_openai_compatible(
            resume_text,
            job_description,
            output_mode,
            selected_provider,
            provider_config,
        )
    except Exception as exc:
        return _analyze_locally(
            resume_text,
            job_description,
            output_mode,
            ai_provider="local",
            ai_model="local-keyword-analyzer",
            used_fallback=True,
            provider_error=f"{provider_config['name']} 请求失败，已降级本地分析：{exc}",
        )


async def _analyze_with_openai_compatible(
    resume_text: str,
    job_description: str,
    output_mode: str,
    provider: str,
    provider_config: dict[str, str],
) -> AnalysisResult:
    client_kwargs = {"api_key": provider_config["api_key"]}
    if provider_config.get("base_url"):
        client_kwargs["base_url"] = provider_config["base_url"]
    client = AsyncOpenAI(**client_kwargs)
    prompt = PROMPT_PATH.read_text(encoding="utf-8")
    skill_prompt = build_skill_prompt()
    system_prompt = f"{prompt}\n\n{skill_prompt}" if skill_prompt else prompt
    response = await client.chat.completions.create(
        model=provider_config["model"],
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    "简历：\n"
                    f"{resume_text[:12000]}\n\n"
                    "岗位描述：\n"
                    f"{job_description[:8000]}\n\n"
                    f"输出模式：{_mode_label(output_mode)}"
                ),
            },
        ],
    )
    content = response.choices[0].message.content or "{}"
    result = AnalysisResult.model_validate_json(content)
    data = _with_missing_structured_fields(result).model_dump()
    data["ai_provider"] = provider
    data["ai_model"] = provider_config["model"]
    data["used_fallback"] = False
    data["provider_error"] = ""
    return AnalysisResult.model_validate(data)


def _analyze_locally(
    resume_text: str,
    job_description: str,
    output_mode: str = "boss",
    ai_provider: str = "local",
    ai_model: str = "local-keyword-analyzer",
    used_fallback: bool = False,
    provider_error: str = "",
) -> AnalysisResult:
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
    job_core_skills = _extract_core_skills(job_tokens)
    job_business_contexts = _extract_business_contexts(job_description)
    job_bonus_points = _extract_bonus_points(job_description)
    job_hard_requirements = _extract_hard_requirements(job_description, job_core_skills)
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
        job_core_skills=job_core_skills,
        job_business_contexts=job_business_contexts,
        job_bonus_points=job_bonus_points,
        job_hard_requirements=job_hard_requirements,
        covered_keywords=overlap_labels[:10],
        missing_keywords=missing_labels[:10],
        edit_notes=edit_notes,
        cover_letter=_build_openers(job_title, overlap_labels, output_mode),
        ai_provider=ai_provider,
        ai_model=ai_model,
        used_fallback=used_fallback,
        provider_error=provider_error,
    )


def get_provider_status() -> list[dict[str, object]]:
    settings = get_settings()
    default_provider = _resolve_provider("default", settings.ai_provider)
    statuses = []
    for key, config in settings.provider_configs.items():
        configured = key == "local" or bool(config.get("api_key"))
        statuses.append(
            {
                "id": key,
                "name": config["name"],
                "model": config["model"],
                "base_url": config["base_url"],
                "configured": configured,
                "is_default": key == default_provider,
                "supports_chat": True,
            }
        )
    return statuses


def _resolve_provider(provider: str, default_provider: str) -> str:
    selected = (provider or "default").strip().lower()
    if selected == "default":
        selected = (default_provider or "local").strip().lower()
    return selected if selected in get_settings().provider_configs else "local"


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


def _build_openers(job_title: str, overlap_labels: list[str], output_mode: str) -> str:
    focus = "、".join(overlap_labels[:3]) if overlap_labels else "岗位方向"
    if output_mode == "formal":
        return "\n".join(
            [
                f"您好，我关注到贵团队的{job_title}岗位，我有{focus}相关经验，希望有机会进一步沟通。",
                f"您好，我的经历与{job_title}岗位中的{focus}方向较匹配，想了解一下岗位细节。",
                f"您好，我对这个{job_title}机会比较感兴趣，过往做过{focus}相关工作，方便沟通吗？",
            ]
        )
    if output_mode == "intern":
        return "\n".join(
            [
                f"您好，我对{job_title}方向很感兴趣，之前接触过{focus}，想了解下这个机会。",
                f"您好，我有{focus}相关学习或项目经历，想投递这个{job_title}岗位。",
                f"您好，这个岗位方向和我准备的{focus}比较接近，方便进一步沟通吗？",
            ]
        )
    return "\n".join(
        [
            f"您好，我看了这个{job_title}岗位，和我之前做的{focus}方向比较接近，想进一步了解一下。",
            f"您好，我有{focus}相关经验，感觉和岗位要求比较匹配，想沟通下这个机会。",
            f"您好，这个岗位方向我比较感兴趣，我之前有{focus}相关经历，方便的话想了解下团队情况。",
        ]
    )


def _mode_label(output_mode: str) -> str:
    return {
        "boss": "Boss 直聘简短自然版",
        "formal": "正式平台稍正式版",
        "intern": "实习/转岗友好版",
    }.get(output_mode, "Boss 直聘简短自然版")


def _extract_core_skills(job_tokens: set[str]) -> list[str]:
    technical = {
        "react", "typescript", "javascript", "python", "fastapi", "postgresql",
        "sql", "api", "ai", "vue", "node", "next.js", "docker",
    }
    skills = [_display_keyword(token) for token in sorted(job_tokens) if token in technical]
    return skills[:8] or ["从岗位描述中未识别到明确技术栈"]


def _extract_business_contexts(job_description: str) -> list[str]:
    contexts = [
        keyword for keyword in [
            "后台系统", "管理系统", "数据看板", "数据可视化", "接口联调",
            "AI 工作流", "业务流程", "运营工具", "产品迭代",
        ]
        if keyword in job_description
    ]
    return contexts[:8] or ["岗位业务场景描述较少，建议面试前进一步确认"]


def _extract_bonus_points(job_description: str) -> list[str]:
    lines = [line.strip() for line in job_description.splitlines() if line.strip()]
    bonus_lines = [
        line for line in lines
        if any(keyword in line for keyword in ("优先", "加分", "更佳", "熟悉", "了解"))
    ]
    return bonus_lines[:5] or ["暂无明确加分项，可重点补充岗位核心技能证据"]


def _extract_hard_requirements(
    job_description: str,
    job_core_skills: list[str],
) -> list[str]:
    lines = [line.strip() for line in job_description.splitlines() if line.strip()]
    hard_lines = [
        line for line in lines
        if any(keyword in line for keyword in ("要求", "必须", "需要", "负责", "岗位职责"))
    ]
    if hard_lines:
        return hard_lines[:5]
    return [f"需要体现 {skill} 相关经验" for skill in job_core_skills[:5]]


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
    for key in _LIST_FIELDS:
        data[key] = json.dumps(data[key], ensure_ascii=False)
    data["resume_text"] = resume_text
    data["job_description"] = job_description
    return data


def record_to_result(record) -> dict:
    data = record.model_dump()
    for key in _LIST_FIELDS:
        data[key] = json.loads(data.get(key) or "[]")
    return data


def _with_missing_structured_fields(result: AnalysisResult) -> AnalysisResult:
    data = result.model_dump()
    for field in _LIST_FIELDS:
        data.setdefault(field, [])
    return AnalysisResult.model_validate(data)


_LIST_FIELDS = (
    "strengths",
    "gaps",
    "recommendations",
    "rewritten_bullets",
    "ats_keywords",
    "job_core_skills",
    "job_business_contexts",
    "job_bonus_points",
    "job_hard_requirements",
    "covered_keywords",
    "missing_keywords",
    "edit_notes",
)
