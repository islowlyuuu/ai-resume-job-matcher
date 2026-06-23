import {
  CheckCircle2,
  Copy,
  FileText,
  Lightbulb,
  ListChecks,
  Sparkles,
  Tags,
  TriangleAlert
} from "lucide-react";
import type { Analysis } from "@/lib/api";
import { ScoreRing } from "./score-ring";

type AnalysisResultProps = {
  analysis: Analysis;
};

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  const openers = analysis.cover_letter
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[#ded7cf] bg-[#fffdf9] p-5 shadow-[0_14px_42px_rgba(31,27,24,0.07)]">
        <div className="grid gap-5 lg:grid-cols-[120px_minmax(0,1fr)]">
          <ScoreRing score={analysis.match_score} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#f1e4dd] px-2.5 py-1 text-xs font-semibold text-copper">
                {analysis.candidate_name}
              </span>
              <span className="rounded-md bg-[#f3eee8] px-2.5 py-1 text-xs font-medium text-muted">
                {analysis.job_title}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              这份简历当前匹配度为 {analysis.match_score}%
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {analysis.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.ats_keywords.slice(0, 8).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-md border border-[#e4ddd5] bg-[#fbf7f1] px-2.5 py-1 text-xs font-medium text-muted"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#ded7cf] bg-[#fffdf9] shadow-[0_14px_42px_rgba(31,27,24,0.07)]">
        <div className="border-b border-[#e8e1da] bg-[#fbf7f1] px-5 py-4">
          <div className="flex items-center gap-2 text-ink">
            <Sparkles className="h-5 w-5 text-copper" />
            <h3 className="font-semibold">简历改写稿</h3>
          </div>
        </div>
        <div className="p-5">
          <div className="rounded-md border border-[#eaded6] bg-[#fbf7f1] p-4">
            <p className="text-xs font-semibold uppercase text-copper">推荐标题</p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {analysis.optimized_headline}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase text-copper">推荐摘要</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {analysis.optimized_summary}
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
            <InsightList
              icon={<ListChecks className="h-5 w-5" />}
              title="改写后的经历要点"
              items={analysis.rewritten_bullets}
            />
            <div className="rounded-lg border border-[#e4ddd5] bg-[#fbf7f1] p-4">
              <div className="flex items-center gap-2 text-copper">
                <Tags className="h-5 w-5" />
                <h3 className="font-semibold text-ink">ATS 关键词</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {analysis.ats_keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-md border border-[#e4ddd5] bg-white px-2.5 py-1 text-xs font-medium text-muted"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InsightList
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="匹配优势"
          items={analysis.strengths}
        />
        <InsightList
          icon={<TriangleAlert className="h-5 w-5" />}
          title="能力差距"
          items={analysis.gaps}
        />
        <InsightList
          icon={<Lightbulb className="h-5 w-5" />}
          title="优化建议"
          items={analysis.recommendations}
        />
      </div>

      <InsightList
        icon={<Sparkles className="h-5 w-5" />}
        title="改写说明"
        items={analysis.edit_notes}
      />

      <div className="rounded-lg border border-[#ded7cf] bg-[#fffdf9] p-5 shadow-[0_14px_42px_rgba(31,27,24,0.07)]">
        <div className="flex items-center gap-2 text-ink">
          <FileText className="h-5 w-5 text-copper" />
          <h3 className="font-semibold">Boss 开场白</h3>
        </div>
        <div className="mt-4 space-y-3">
          {openers.map((opener, index) => (
            <div
              key={opener}
              className="flex gap-3 rounded-lg border border-[#e4ddd5] bg-[#fbf7f1] p-3 text-ink"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-copper text-xs font-semibold text-white">
                {index + 1}
              </span>
              <p className="flex-1 text-sm leading-6 text-ink">{opener}</p>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(opener)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#ded7cf] bg-white text-muted transition hover:border-copper hover:text-copper"
                aria-label="复制开场白"
                title="复制开场白"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsightList({
  icon,
  title,
  items
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-[#e4ddd5] bg-[#fbf7f1] p-4">
      <div className="flex items-center gap-2 text-copper">
        {icon}
        <h3 className="font-semibold text-ink">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
