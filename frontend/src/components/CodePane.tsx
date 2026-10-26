import type { AnalyzeResponse, Language } from "../types";
import { CodeLine } from "./CodeLine";

const LANGUAGES: Language[] = ["python", "javascript", "typescript", "java", "cpp", "other"];

interface Props {
  code: string;
  language: Language;
  result: AnalyzeResponse | null;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: Language) => void;
  onEdit: () => void;
}

export function CodePane({ code, language, result, onCodeChange, onLanguageChange, onEdit }: Props) {
  const lines = code.split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  const reviewing = result !== null;

  return (
    <section className="flex flex-col rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <h2 className="font-semibold">Code</h2>
        <div className="flex items-center gap-2">
          <select
            value={language}
            disabled={reviewing}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
            aria-label="Language"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          {reviewing && (
            <button onClick={onEdit} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100">
              Edit code
            </button>
          )}
        </div>
      </div>
      {reviewing ? (
        <div className="py-2 font-mono text-sm">
          {lines.map((text, i) => (
            <CodeLine
              key={i}
              text={text}
              result={result.lines[i] ?? { n: i + 1, status: "neutral", quote: null, fix: null }}
            />
          ))}
        </div>
      ) : (
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          spellCheck={false}
          placeholder="Paste your code here (150 lines max)…"
          className="min-h-80 flex-1 resize-y rounded-b-lg p-4 font-mono text-sm outline-none"
        />
      )}
    </section>
  );
}
