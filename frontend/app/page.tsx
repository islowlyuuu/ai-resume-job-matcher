"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
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
    <main className="min-h-screen text-ink">
      <header className="border-b border-[#e5ded6] bg-[#fffdf9]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#2b2521] text-white shadow-[0_10px_20px_rgba(31,27,24,0.18)]">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-ink">
                AI Boss 投递助手
              </p>
              <p className="text-sm text-muted">
                JD 解析、简历改写、开场白生成
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-md border border-[#e0d8d0] bg-white px-3 py-2 text-muted shadow-sm">
              <Target className="h-4 w-4 text-copper" />
              Boss 投递场景
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-[#e0d8d0] bg-white px-3 py-2 text-muted shadow-sm">
              <BarChart3 className="h-4 w-4 text-copper" />
              已保存 {history.length} 次分析
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1480px] gap-4 px-4 py-5 md:px-6 xl:h-[calc(100vh-65px)] xl:grid-cols-[320px_minmax(0,1fr)_300px] xl:overflow-hidden">
        <div className="min-h-0">
          <AnalyzerForm onAnalysis={handleAnalysis} />
        </div>

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="grid shrink-0 gap-2 md:grid-cols-3">
            <WorkflowStep
              icon={<Target className="h-4 w-4" />}
              eyebrow="01"
              label="解析岗位"
              active
            />
            <WorkflowStep
              icon={<FilePenLine className="h-4 w-4" />}
              eyebrow="02"
              label="改写简历"
              active={Boolean(activeAnalysis)}
            />
            <WorkflowStep
              icon={<MessageSquareText className="h-4 w-4" />}
              eyebrow="03"
              label="生成开场白"
              active={Boolean(activeAnalysis)}
            />
          </div>
          {activeAnalysis ? (
            <div className="mt-4 min-h-0 flex-1 overflow-auto pr-1">
              <AnalysisResult analysis={activeAnalysis} />
            </div>
          ) : (
            <div className="mt-4 flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-lg border border-[#ded7cf] bg-[#fffdf9] shadow-[0_18px_48px_rgba(31,27,24,0.08)]">
              <div className="border-b border-[#ece5dd] bg-[#fbf7f1] px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span className="h-2.5 w-2.5 rounded-full bg-copper" />
                    当前工作区
                  </div>
                  <span className="text-xs text-muted">等待生成</span>
                </div>
              </div>
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div className="max-w-xl">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#efe0d8] text-copper shadow-sm">
                    <Target className="h-8 w-8" />
                  </div>
                  <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
                    先粘贴简历和 Boss 岗位
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    系统会把岗位要求拆成关键词和能力信号，再输出匹配分、简历改写稿、ATS 关键词，以及 3 条更像真人发出的 Boss 开场白。
                  </p>
                  <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                    <EmptyFeature label="岗位信号" value="技能 / 场景 / 加分项" />
                    <EmptyFeature label="简历输出" value="标题 / 摘要 / 经历要点" />
                    <EmptyFeature label="投递话术" value="短句 / 自然 / 少 AI 味" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="min-h-0 overflow-hidden rounded-lg border border-[#ded7cf] bg-[#fffdf9] shadow-[0_14px_42px_rgba(31,27,24,0.07)] xl:h-full">
          <div className="flex items-center justify-between gap-3 border-b border-[#e8e1da] bg-[#fbf7f1] px-4 py-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-copper" />
              <h2 className="font-semibold text-ink">投递档案</h2>
            </div>
            {history.length > 0 ? (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#ded7cf] bg-white text-muted transition hover:border-copper hover:text-copper"
                aria-label="清空分析历史"
                title="清空分析历史"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="h-full space-y-2 overflow-auto p-4">
            {history.length === 0 ? (
              <div className="rounded-md border border-[#eee6df] bg-[#f8f3ee] p-4 text-sm leading-6 text-muted">
                新的分析记录会显示在这里，方便对比不同岗位。
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveAnalysis(item)}
                  className="block w-full rounded-md border border-[#e4ddd5] bg-white p-3 text-left transition hover:border-copper hover:shadow-sm"
                >
                  <span className="block text-sm font-semibold text-ink">
                    {item.job_title}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
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
  eyebrow,
  label,
  active
}: {
  icon: React.ReactNode;
  eyebrow: string;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${
        active
          ? "border-copper/70 bg-[#fffdf9] text-ink shadow-[0_8px_22px_rgba(31,27,24,0.06)]"
          : "border-[#e2dcd5] bg-[#f7f3ef] text-muted"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className={active ? "text-copper" : "text-stone-400"}>{icon}</span>
        <span className="truncate font-semibold">{label}</span>
      </span>
      <span className={active ? "text-xs text-copper" : "text-xs text-stone-400"}>
        {eyebrow}
      </span>
    </div>
  );
}

function EmptyFeature({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e8e1da] bg-[#fbf7f1] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
        <CheckCircle2 className="h-3.5 w-3.5 text-copper" />
        {label}
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{value}</p>
    </div>
  );
}
