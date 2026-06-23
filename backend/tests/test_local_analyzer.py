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
    assert "尊敬" not in result.cover_letter
    assert "此致" not in result.cover_letter
    assert "您好" in result.cover_letter
