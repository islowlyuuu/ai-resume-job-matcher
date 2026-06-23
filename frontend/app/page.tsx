"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  FilePenLine,
  History,
  MessageSquareText,
  Target,
  Trash2
} from "lucide-react";
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
    <main className="min-h-screen bg-[#f5f2ee] text-ink">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#2a2522] text-white">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-ink">AI Boss 投递助手</p>
              <p className="text-sm text-stone-500">
                JD 解析、简历改写、开场白生成
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-stone-600">
              <Target className="h-4 w-4 text-[#b46a55]" />
              Boss 投递场景
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-stone-600">
              <BarChart3 className="h-4 w-4 text-[#b46a55]" />
              已保存 {history.length} 次分析
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 py-4 md:px-5 xl:h-[calc(100vh-65px)] xl:grid-cols-[350px_minmax(0,1fr)_280px] xl:overflow-hidden">
        <div className="min-h-0">
          <AnalyzerForm onAnalysis={handleAnalysis} />
        </div>

        <section className="min-h-0 min-w-0 xl:overflow-auto xl:pr-1">
          <div className="mb-4 grid gap-2 md:grid-cols-3">
            <WorkflowStep
              icon={<Target className="h-4 w-4" />}
              label="解析岗位"
              active
            />
            <WorkflowStep
              icon={<FilePenLine className="h-4 w-4" />}
              label="改写简历"
              active={Boolean(activeAnalysis)}
            />
            <WorkflowStep
              icon={<MessageSquareText className="h-4 w-4" />}
              label="生成开场白"
              active={Boolean(activeAnalysis)}
            />
          </div>
          {activeAnalysis ? (
            <AnalysisResult analysis={activeAnalysis} />
          ) : (
            <div className="grid h-[calc(100%-4rem)] min-h-[420px] place-items-center rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-[#f3ded8] text-[#9f5746]">
                  <Target className="h-7 w-7" />
                </div>
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

        <aside className="min-h-0 rounded-xl border border-stone-200 bg-white p-3 shadow-sm xl:h-full xl:overflow-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#b46a55]" />
              <h2 className="font-semibold text-ink">投递档案</h2>
            </div>
            {history.length > 0 ? (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-600 transition hover:border-[#c58a7a] hover:text-[#9f5746]"
                aria-label="清空分析历史"
                title="清空分析历史"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="mt-4 space-y-2">
            {history.length === 0 ? (
              <div className="rounded-lg bg-[#f7f4f1] p-4 text-sm leading-6 text-stone-600">
                新的分析记录会显示在这里，方便对比不同岗位。
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveAnalysis(item)}
                  className="block w-full rounded-lg border border-stone-200 bg-[#fbfaf7] p-3 text-left transition hover:border-[#c58a7a]"
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

function WorkflowStep({
  icon,
  label,
  active
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        active
          ? "border-[#c58a7a] bg-white text-ink shadow-sm"
          : "border-stone-200 bg-[#fbfaf7] text-stone-500"
      }`}
    >
      <span className={active ? "text-[#9f5746]" : "text-stone-400"}>{icon}</span>
      {label}
    </div>
  );
}
