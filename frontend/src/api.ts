import type { AnalyzeRequest, AnalyzeResponse } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function analyze(body: AnalyzeRequest): Promise<AnalyzeResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server. Is the backend running?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Something went wrong");
  return data as AnalyzeResponse;
}
