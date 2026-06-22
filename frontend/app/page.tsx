"use client";

import { useEffect, useState } from "react";
import { BarChart3, History } from "lucide-react";
import { AnalysisResult } from "@/components/analysis-result";
import { AnalyzerForm } from "@/components/analyzer-form";
import { listAnalyses, type Analysis } from "@/lib/api";

export default function Home() {
  const [activeAnalysis, setActiveAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);

  useEffect(() => {
    listAnalyses()
      .then((items) => {
        setHistory(items);
        setActiveAnalysis(items[0] ?? null);
      })
      .catch(() => undefined);
  }, []);

  function handleAnalysis(analysis: Analysis) {
    setActiveAnalysis(analysis);
    setHistory((items) => [analysis, ...items.filter((item) => item.id !== analysis.id)]);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8">
      <header className="flex flex-col gap-4 py-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">
            AI Resume Job Matcher
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-ink md:text-5xl">
            Match every resume to the role that matters.
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-stone-300 bg-white/80 px-3 py-2 text-sm text-stone-700">
          <BarChart3 className="h-4 w-4 text-moss" />
          {history.length} saved analyses
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <AnalyzerForm onAnalysis={handleAnalysis} />
          {activeAnalysis ? <AnalysisResult analysis={activeAnalysis} /> : null}
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white/95 p-5 shadow-sm xl:sticky xl:top-6 xl:h-fit">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-clay" />
            <h2 className="font-semibold text-ink">History</h2>
          </div>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm leading-6 text-stone-600">
                Analysis history appears here after the backend is running.
              </p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveAnalysis(item)}
                  className="block w-full rounded-md border border-stone-200 bg-paper/70 p-3 text-left transition hover:border-clay"
                >
                  <span className="block text-sm font-semibold text-ink">
                    {item.job_title}
                  </span>
                  <span className="mt-1 block text-xs text-stone-600">
                    {item.candidate_name} · {item.match_score}% ·{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
