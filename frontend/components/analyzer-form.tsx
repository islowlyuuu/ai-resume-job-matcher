"use client";

import { FormEvent, useState } from "react";
import {
  ClipboardList,
  FileUp,
  Loader2,
  RotateCcw,
  Sparkles,
  TextCursorInput
} from "lucide-react";
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
      className="flex h-full min-h-[640px] flex-col overflow-hidden rounded-lg border border-[#ded7cf] bg-[#fffdfa] shadow-[0_14px_42px_rgba(31,27,24,0.08)] xl:min-h-0"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#e8e1da] bg-[#fbf7f1] px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[#2b2521] text-white">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">投递材料</h2>
            <p className="text-xs text-muted">简历经历 + Boss 岗位原文</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setResumeText(SAMPLE_RESUME);
            setJobDescription(SAMPLE_JOB);
            setResumeFile(null);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#ded7cf] bg-white text-muted transition hover:border-copper hover:text-copper"
          aria-label="恢复示例"
          title="恢复示例"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-4 px-4 py-4">
        <label className="flex min-h-0 flex-col">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <TextCursorInput className="h-4 w-4 text-copper" />
            简历内容
          </span>
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            placeholder="粘贴你当前简历，或者上传 PDF / Word"
            className="mt-2 min-h-44 flex-1 resize-none overflow-auto rounded-md border border-[#ddd6cf] bg-[#fbfaf7] p-3 text-sm leading-6 text-ink outline-none ring-copper/20 transition placeholder:text-stone-400 focus:border-copper focus:ring-4"
          />
        </label>

        <label className="flex min-h-0 flex-col">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <TextCursorInput className="h-4 w-4 text-copper" />
            岗位描述
          </span>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            required
            placeholder="粘贴 Boss 岗位要求、任职资格、加分项"
            className="mt-2 min-h-44 flex-1 resize-none overflow-auto rounded-md border border-[#ddd6cf] bg-[#fbfaf7] p-3 text-sm leading-6 text-ink outline-none ring-copper/20 transition placeholder:text-stone-400 focus:border-copper focus:ring-4"
          />
        </label>
      </div>

      <div className="shrink-0 space-y-3 border-t border-[#e8e1da] bg-[#fbf7f1] px-4 py-4">
        <label className="inline-flex max-w-full cursor-pointer items-center gap-2 text-sm text-muted">
          <FileUp className="h-4 w-4 shrink-0 text-copper" />
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            className="min-w-0 max-w-64 text-sm"
          />
        </label>
        <p className="rounded-md border border-[#eaded6] bg-white px-3 py-2 text-xs leading-5 text-muted">
          仅支持 PDF 和 Word（.docx）格式；也可以直接粘贴简历内容。
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2b2521] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(31,27,24,0.18)] transition hover:bg-[#3b322d] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          生成优化方案
        </button>
      </div>

      {resumeFile ? (
        <p className="px-4 pb-4 text-xs text-muted">
          当前使用上传文件进行分析：{resumeFile.name}
        </p>
      ) : null}
      {error ? <p className="px-4 pb-4 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
