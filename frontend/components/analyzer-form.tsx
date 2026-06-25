"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BadgeInfo,
  FileUp,
  Loader2,
  RotateCcw,
  Sparkles
} from "lucide-react";
import {
  analyzeText,
  extractResumeText,
  listProviders,
  type Analysis,
  type OutputMode,
  type ProviderStatus
} from "@/lib/api";

type AnalyzerFormProps = {
  onAnalysis: (analysis: Analysis) => void;
};

const SAMPLE_RESUME =
  "张明\n前端/全栈开发\n参与后台管理系统、数据看板和接口联调，主要使用 React、TypeScript、FastAPI 和 PostgreSQL。";

const SAMPLE_JOB =
  "前端开发工程师\n要求熟悉 React、TypeScript，有后台系统、数据可视化、接口联调经验，了解后端开发优先。";

export function AnalyzerForm({ onAnalysis }: AnalyzerFormProps) {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME);
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB);
  const [outputMode, setOutputMode] = useState<OutputMode>("boss");
  const [provider, setProvider] = useState("default");
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listProviders()
      .then((items) => {
        setProviders(items);
        const defaultProvider = items.find((item) => item.is_default);
        setProvider(defaultProvider?.id ?? "local");
      })
      .catch(() => {
        setProviders([
          {
            id: "local",
            name: "本地关键词分析",
            model: "local-keyword-analyzer",
            base_url: "",
            configured: true,
            is_default: true,
            supports_chat: true
          }
        ]);
        setProvider("local");
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await analyzeText(
        resumeText,
        jobDescription,
        outputMode,
        provider
      );
      onAnalysis(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResumeFileChange(file: File | null) {
    setResumeFile(file);
    setError("");

    if (!file) {
      return;
    }

    setIsParsingResume(true);
    try {
      const extractedText = await extractResumeText(file);
      setResumeText(extractedText);
    } catch (caught) {
      setResumeFile(null);
      setError(caught instanceof Error ? caught.message : "简历文件解析失败");
    } finally {
      setIsParsingResume(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full min-h-[640px] flex-col overflow-hidden rounded-lg border border-[#ded7cf] bg-[#fffdfa] shadow-[0_14px_42px_rgba(31,27,24,0.08)] xl:min-h-0"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#e8e1da] bg-[#fbf7f1] px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-copper" />
          <div>
            <h2 className="text-base font-semibold text-ink">投递材料</h2>
            <p className="mt-1 text-xs text-muted">简历经历 + Boss 岗位原文</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setResumeText(SAMPLE_RESUME);
            setJobDescription(SAMPLE_JOB);
            setOutputMode("boss");
            setProvider(providers.find((item) => item.is_default)?.id ?? "local");
            setResumeFile(null);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#ded7cf] bg-white text-muted transition hover:border-copper hover:text-copper"
          aria-label="恢复示例"
          title="恢复示例"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 py-4">
        <label className="flex min-h-0 flex-1 flex-col">
          <span className="text-sm font-semibold text-ink">
            简历内容
          </span>
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            required
            placeholder="粘贴你当前简历，或者上传 PDF / Word"
            className="mt-2 min-h-0 flex-1 resize-none overflow-auto rounded-md border border-[#ddd6cf] bg-[#fffdf9] p-3 text-[13px] leading-5 text-ink outline-none ring-copper/20 transition placeholder:text-stone-400 focus:border-copper focus:ring-4"
          />
        </label>

        <label className="flex min-h-0 flex-1 flex-col">
          <span className="text-sm font-semibold text-ink">
            岗位描述
          </span>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            required
            placeholder="粘贴 Boss 岗位要求、任职资格、加分项"
            className="mt-2 min-h-0 flex-1 resize-none overflow-auto rounded-md border border-[#ddd6cf] bg-[#fffdf9] p-3 text-[13px] leading-5 text-ink outline-none ring-copper/20 transition placeholder:text-stone-400 focus:border-copper focus:ring-4"
          />
        </label>
      </div>

      <div className="shrink-0 space-y-2 border-t border-[#e8e1da] bg-[#fbf7f1] px-4 py-3">
        <div>
          <p className="mb-2 text-xs font-semibold text-ink">输出模式</p>
          <div className="grid grid-cols-3 gap-1 rounded-md border border-[#ded7cf] bg-white p-1">
            <ModeButton
              active={outputMode === "boss"}
              label="Boss"
              onClick={() => setOutputMode("boss")}
            />
            <ModeButton
              active={outputMode === "formal"}
              label="正式"
              onClick={() => setOutputMode("formal")}
            />
            <ModeButton
              active={outputMode === "intern"}
              label="实习"
              onClick={() => setOutputMode("intern")}
            />
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-ink">AI 模型</span>
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="h-10 w-full rounded-md border border-[#ded7cf] bg-white px-3 text-sm text-ink outline-none ring-copper/20 transition focus:border-copper focus:ring-4"
          >
            {providers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.configured ? "" : "（未配置，自动本地降级）"}
              </option>
            ))}
          </select>
          <span className="mt-1 block truncate text-xs text-muted">
            {providers.find((item) => item.id === provider)?.model ?? "local-keyword-analyzer"}
          </span>
        </label>

        <label className="flex max-w-full cursor-pointer items-center gap-3 rounded-md border border-[#ded7cf] bg-white px-3 py-2 text-sm text-muted transition hover:border-copper hover:text-copper">
          <FileUp className="h-4 w-4 shrink-0" />
          <span className="shrink-0 rounded-md bg-[#f1e4dd] px-2.5 py-1 text-xs font-semibold text-copper">
            选择文件
          </span>
          <span className="min-w-0 flex-1 truncate">
            {isParsingResume
              ? "正在提取简历内容..."
              : resumeFile
                ? resumeFile.name
                : "未选择任何文件"}
          </span>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => {
              void handleResumeFileChange(event.target.files?.[0] ?? null);
            }}
            className="sr-only"
          />
        </label>
        <p className="flex items-start gap-2 text-xs leading-5 text-muted">
          <BadgeInfo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
          <span>仅支持 PDF / Word（.docx），也可以直接粘贴。</span>
        </p>

        <button
          type="submit"
          disabled={isLoading || isParsingResume}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2b2521] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(31,27,24,0.18)] transition hover:bg-[#3b322d] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading || isParsingResume ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isParsingResume ? "正在读取简历" : "生成优化方案"}
        </button>
      </div>

      {error ? <p className="px-4 pb-4 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

function ModeButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-8 rounded px-2 text-xs font-semibold transition ${
        active ? "bg-[#2b2521] text-white" : "text-muted hover:bg-[#f8f3ee] hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
