import { CheckCircle2, FileText, Lightbulb, TriangleAlert } from "lucide-react";
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

      <div className="grid gap-4 lg:grid-cols-3">
        <InsightList
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Strengths"
          items={analysis.strengths}
        />
        <InsightList
          icon={<TriangleAlert className="h-5 w-5" />}
          title="Gaps"
          items={analysis.gaps}
        />
        <InsightList
          icon={<Lightbulb className="h-5 w-5" />}
          title="Next Actions"
          items={analysis.recommendations}
        />
      </div>

      <div className="rounded-lg border border-stone-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-ink">
          <FileText className="h-5 w-5 text-clay" />
          <h3 className="font-semibold">Draft Cover Letter</h3>
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
