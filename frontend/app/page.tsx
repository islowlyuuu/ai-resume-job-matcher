"use client";

import { useEffect, useState } from "react";
import { BarChart3, History, Trash2 } from "lucide-react";
import { AnalysisResult } from "@/components/analysis-result";
import { AnalyzerForm } from "@/components/analyzer-form";
import { clearAnalyses, listAnalyses, type Analysis } from "@/lib/api";

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

  async function handleClearHistory() {
    await clearAnalyses();
    setHistory([]);
    setActiveAnalysis(null);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8">
      <header className="flex flex-col gap-4 py-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">
            AI Boss 投递助手
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-ink md:text-5xl">
            根据 Boss 岗位要求，优化简历和第一句沟通话术。
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-stone-300 bg-white/80 px-3 py-2 text-sm text-stone-700">
          <BarChart3 className="h-4 w-4 text-moss" />
          已保存 {history.length} 次分析
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <AnalyzerForm onAnalysis={handleAnalysis} />
          {activeAnalysis ? <AnalysisResult analysis={activeAnalysis} /> : null}
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white/95 p-5 shadow-sm xl:sticky xl:top-6 xl:h-fit">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-clay" />
              <h2 className="font-semibold text-ink">分析历史</h2>
            </div>
            {history.length > 0 ? (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-600 transition hover:border-clay hover:text-clay"
                aria-label="清空分析历史"
                title="清空分析历史"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm leading-6 text-stone-600">
                后端启动后，新的分析记录会显示在这里。
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
