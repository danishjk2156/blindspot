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
    <section className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/60">Code</h2>
        <div className="flex items-center gap-2">
          <select
            value={language}
            disabled={reviewing}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="rounded-full border border-white/25 bg-[#0d0b2e] px-3 py-1 text-xs font-semibold text-white/90 disabled:opacity-40"
            aria-label="Language"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          {reviewing && (
            <button
              onClick={onEdit}
              className="rounded-full border border-white/25 px-3 py-1 text-xs font-semibold text-white/90 hover:border-white hover:bg-white/10"
            >
              Edit code
            </button>
          )}
        </div>
      </div>
      {reviewing ? (
        <div className="py-3 font-mono text-sm">
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
          className="min-h-80 flex-1 resize-y rounded-b-3xl bg-transparent p-5 font-mono text-sm text-slate-100 caret-white outline-none placeholder:text-white/30"
        />
      )}
    </section>
  );
}
