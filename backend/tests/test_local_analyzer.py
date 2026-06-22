import asyncio

from app.services.analyzer import analyze_resume


def test_local_analyzer_returns_score_without_openai_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    result = asyncio.run(
        analyze_resume(
            "Jane Doe\nPython FastAPI SQL React data dashboards",
            "Senior Full Stack Engineer\nWe need Python, FastAPI, React, SQL, and dashboard experience.",
        )
    )

    assert result.match_score >= 50
    assert result.candidate_name == "Jane Doe"
    assert result.strengths
