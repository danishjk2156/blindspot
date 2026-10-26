export type Language = "python" | "javascript" | "typescript" | "java" | "cpp" | "other";
export type Status = "correct" | "vague" | "wrong" | "missing" | "neutral";

export interface LineResult {
  n: number;
  status: Status;
  quote: string | null;
  fix: string | null;
}

export interface AnalyzeResponse {
  lines: LineResult[];
  coverage_pct: number;
  cached: boolean;
}

export interface AnalyzeRequest {
  code: string;
  language: Language;
  transcript: string;
}
