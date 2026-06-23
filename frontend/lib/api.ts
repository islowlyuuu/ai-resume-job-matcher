export type Analysis = {
  id: number;
  candidate_name: string;
  job_title: string;
  match_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  optimized_headline: string;
  optimized_summary: string;
  rewritten_bullets: string[];
  ats_keywords: string[];
  edit_notes: string[];
  cover_letter: string;
  created_at: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function analyzeText(
  resumeText: string,
  jobDescription: string
): Promise<Analysis> {
  const response = await fetch(`${API_BASE_URL}/api/analyses/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription
    })
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function analyzeUpload(
  resume: File,
  jobDescription: string
): Promise<Analysis> {
  const formData = new FormData();
  formData.append("resume", resume);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_BASE_URL}/api/analyses/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function listAnalyses(): Promise<Analysis[]> {
  const response = await fetch(`${API_BASE_URL}/api/analyses`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function clearAnalyses(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/analyses`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    return payload.detail ?? "请求失败";
  } catch {
    return "请求失败";
  }
}
