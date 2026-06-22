"use client";

import { FormEvent, useState } from "react";
import { ClipboardList, FileUp, Loader2, Send } from "lucide-react";
import { analyzeText, analyzeUpload, type Analysis } from "@/lib/api";

type AnalyzerFormProps = {
  onAnalysis: (analysis: Analysis) => void;
};

const SAMPLE_RESUME =
  "张明\n全栈工程师\n负责搭建 React 数据看板、FastAPI 后端服务、PostgreSQL 数据模型，并为运营团队开发 AI 工作流工具。";

const SAMPLE_JOB =
  "高级全栈工程师\n我们需要一名熟悉 React、FastAPI、PostgreSQL、AI 产品、自动化测试和数据看板设计的工程师。";

export function AnalyzerForm({ onAnalysis }: AnalyzerFormProps) {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME);
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = resumeFile
        ? await analyzeUpload(resumeFile, jobDescription)
        : await analyzeText(resumeText, jobDescription);
      onAnalysis(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-stone-200 bg-white/95 p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-clay" />
        <h2 className="text-lg font-semibold text-ink">岗位匹配分析</h2>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">简历内容</span>
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            rows={10}
            className="mt-2 w-full resize-y rounded-md border border-stone-300 bg-paper/60 p-3 text-sm outline-none ring-clay/30 focus:ring-4"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            岗位描述
          </span>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            rows={10}
            required
            className="mt-2 w-full resize-y rounded-md border border-stone-300 bg-paper/60 p-3 text-sm outline-none ring-clay/30 focus:ring-4"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-stone-200 pt-4 md:flex-row md:items-center md:justify-between">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <FileUp className="h-4 w-4 text-moss" />
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            className="max-w-64 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          开始分析
        </button>
      </div>

      {resumeFile ? (
        <p className="mt-3 text-xs text-stone-500">
          当前使用上传文件进行分析：{resumeFile.name}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
