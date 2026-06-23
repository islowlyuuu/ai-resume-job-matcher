import asyncio

from app.services.analyzer import analyze_resume


def test_local_analyzer_returns_score_without_openai_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    result = asyncio.run(
        analyze_resume(
            "张明\n全栈工程师\n熟悉 React、FastAPI、PostgreSQL、AI 工作流和数据看板开发。",
            "高级全栈工程师\n需要 React、FastAPI、PostgreSQL、AI 产品和数据看板经验。",
        )
    )

    assert result.match_score >= 50
    assert result.candidate_name == "张明"
    assert result.strengths
    assert result.optimized_headline
    assert result.optimized_summary
    assert result.rewritten_bullets
    assert result.ats_keywords
    assert result.job_core_skills
    assert result.job_business_contexts
    assert result.job_hard_requirements
    assert result.covered_keywords
    assert "尊敬" not in result.cover_letter
    assert "此致" not in result.cover_letter
    assert "您好" in result.cover_letter


def test_local_analyzer_supports_output_modes(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    result = asyncio.run(
        analyze_resume(
            "李华\n前端开发\n做过 React 和 TypeScript 项目。",
            "前端开发工程师\n需要 React、TypeScript 经验。",
            output_mode="formal",
        )
    )

    assert "贵团队" in result.cover_letter
