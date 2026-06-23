"use client";

import { useEffect, useState } from "react";
import { BarChart3, BriefcaseBusiness, History, Target, Trash2 } from "lucide-react";
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
    <main className="min-h-screen bg-[#f3f1ec] text-ink">
      <header className="border-b border-stone-200 bg-white/90">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-ink">AI Boss 投递助手</p>
              <p className="text-sm text-stone-600">
                JD 解析、简历改写、开场白生成
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-paper px-3 py-2 text-stone-700">
              <Target className="h-4 w-4 text-clay" />
              Boss 投递场景
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-700">
              <BarChart3 className="h-4 w-4 text-moss" />
              已保存 {history.length} 次分析
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1500px] gap-4 px-4 py-4 md:px-6 xl:h-[calc(100vh-73px)] xl:grid-cols-[420px_minmax(0,1fr)_320px] xl:overflow-hidden">
        <div className="min-h-0">
          <AnalyzerForm onAnalysis={handleAnalysis} />
        </div>

        <section className="min-h-0 min-w-0 xl:overflow-auto xl:pr-1">
          {activeAnalysis ? (
            <AnalysisResult analysis={activeAnalysis} />
          ) : (
            <div className="grid h-full min-h-[420px] place-items-center rounded-lg border border-dashed border-stone-300 bg-white/70 p-8 text-center">
              <div>
                <Target className="mx-auto h-10 w-10 text-clay" />
                <h1 className="mt-4 text-2xl font-semibold text-ink">
                  先粘贴简历和 Boss 岗位
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">
                  系统会生成匹配分、简历改写建议、ATS 关键词和 3 条更自然的 Boss 开场白。
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="min-h-0 rounded-lg border border-stone-200 bg-white p-4 shadow-sm xl:h-full xl:overflow-auto">
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
          <div className="mt-4 space-y-2">
            {history.length === 0 ? (
              <div className="rounded-md bg-paper p-4 text-sm leading-6 text-stone-600">
                新的分析记录会显示在这里，方便对比不同岗位。
              </div>
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
