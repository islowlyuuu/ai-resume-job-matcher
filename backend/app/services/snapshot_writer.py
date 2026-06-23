import re
from datetime import datetime
from pathlib import Path

from app.schemas.analysis import AnalysisRead


SNAPSHOT_DIR = Path(__file__).resolve().parents[3] / "change_snapshots"


def save_analysis_snapshot(analysis: AnalysisRead) -> Path:
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = (
        f"{_safe_filename(analysis.candidate_name)}_"
        f"{_safe_filename(analysis.job_title)}_"
        f"{timestamp}.md"
    )
    path = SNAPSHOT_DIR / filename
    path.write_text(_to_markdown(analysis), encoding="utf-8")
    return path


def _safe_filename(value: str) -> str:
    clean = re.sub(r"[^\w\u4e00-\u9fff-]+", "_", value.strip())
    clean = re.sub(r"_+", "_", clean).strip("_")
    return clean[:40] or "未命名"


def _to_markdown(analysis: AnalysisRead) -> str:
    openers = [line.strip() for line in analysis.cover_letter.splitlines() if line.strip()]
    return "\n".join(
        [
            f"# {analysis.candidate_name} - {analysis.job_title}",
            "",
            f"- 匹配分：{analysis.match_score}%",
            f"- 生成时间：{analysis.created_at.isoformat()}",
            "",
            "## 匹配总结",
            "",
            analysis.summary,
            "",
            "## 推荐简历标题",
            "",
            analysis.optimized_headline,
            "",
            "## 推荐摘要",
            "",
            analysis.optimized_summary,
            "",
            "## 改写后的经历要点",
            "",
            *_list_items(analysis.rewritten_bullets),
            "",
            "## ATS 关键词",
            "",
            "、".join(analysis.ats_keywords),
            "",
            "## 匹配优势",
            "",
            *_list_items(analysis.strengths),
            "",
            "## 能力差距",
            "",
            *_list_items(analysis.gaps),
            "",
            "## 优化建议",
            "",
            *_list_items(analysis.recommendations),
            "",
            "## 改写说明",
            "",
            *_list_items(analysis.edit_notes),
            "",
            "## Boss 开场白",
            "",
            *_list_items(openers),
            "",
        ]
    )


def _list_items(items: list[str]) -> list[str]:
    return [f"- {item}" for item in items]
