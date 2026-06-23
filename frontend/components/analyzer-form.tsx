"use client";

import { FormEvent, useState } from "react";
import { ClipboardList, FileUp, Loader2, RotateCcw, Send } from "lucide-react";
import { analyzeText, analyzeUpload, type Analysis } from "@/lib/api";

type AnalyzerFormProps = {
  onAnalysis: (analysis: Analysis) => void;
};

const SAMPLE_RESUME =
  "张明\n前端/全栈开发\n参与过后台管理系统、数据看板和接口联调开发，主要使用 React、TypeScript、FastAPI 和 PostgreSQL。";

const SAMPLE_JOB =
  "Boss 岗位：前端开发工程师\n岗位要求：熟悉 React、TypeScript，有后台系统、数据可视化、接口联调经验，了解后端开发优先。";

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
      className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-clay" />
          <h2 className="text-lg font-semibold text-ink">投递材料</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setResumeText(SAMPLE_RESUME);
            setJobDescription(SAMPLE_JOB);
            setResumeFile(null);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:border-clay hover:text-clay"
          aria-label="恢复示例"
          title="恢复示例"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">简历内容</span>
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            rows={9}
            className="mt-2 w-full resize-y rounded-md border border-stone-300 bg-[#fbfaf7] p-3 text-sm leading-6 outline-none ring-clay/30 focus:ring-4"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            岗位描述
          </span>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            rows={9}
            required
            className="mt-2 w-full resize-y rounded-md border border-stone-300 bg-[#fbfaf7] p-3 text-sm leading-6 outline-none ring-clay/30 focus:ring-4"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-stone-200 pt-4">
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
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          生成优化方案
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
