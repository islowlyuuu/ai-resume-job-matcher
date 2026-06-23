import {
  CheckCircle2,
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
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-5 rounded-lg border border-stone-200 bg-white/90 p-5 shadow-sm md:flex-row md:items-center">
        <ScoreRing score={analysis.match_score} />
        <div>
          <p className="text-sm uppercase tracking-wide text-moss">
            {analysis.candidate_name}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">
            {analysis.job_title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">
            {analysis.summary}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-ink">
          <Sparkles className="h-5 w-5 text-clay" />
          <h3 className="font-semibold">优化后的简历版本</h3>
        </div>
        <div className="mt-4 rounded-md bg-paper/70 p-4">
          <p className="text-sm font-semibold text-moss">推荐标题</p>
          <p className="mt-2 text-xl font-semibold text-ink">
            {analysis.optimized_headline}
          </p>
          <p className="mt-4 text-sm font-semibold text-moss">推荐摘要</p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {analysis.optimized_summary}
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <InsightList
            icon={<ListChecks className="h-5 w-5" />}
            title="改写后的经历要点"
            items={analysis.rewritten_bullets}
          />
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2 text-clay">
              <Tags className="h-5 w-5" />
              <h3 className="font-semibold text-ink">ATS 关键词</h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.ats_keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-md border border-stone-200 bg-paper px-2.5 py-1 text-xs font-medium text-stone-700"
                >
                  {keyword}
                </span>
              ))}
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

      <div className="rounded-lg border border-stone-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-ink">
          <FileText className="h-5 w-5 text-clay" />
          <h3 className="font-semibold">求职信草稿</h3>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-md bg-stone-100 p-4 text-sm leading-6 text-stone-800">
          {analysis.cover_letter}
        </pre>
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
    <div className="rounded-lg border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-clay">
        {icon}
        <h3 className="font-semibold text-ink">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
