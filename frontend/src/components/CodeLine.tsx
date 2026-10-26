import type { LineResult, Status } from "../types";

const STYLE: Record<Status, string> = {
  correct: "bg-emerald-400/15 border-l-emerald-400",
  vague: "bg-amber-300/15 border-l-amber-300",
  wrong: "bg-rose-400/20 border-l-rose-400",
  missing: "bg-white/10 border-l-white/40",
  neutral: "border-l-transparent",
};

const LABEL: Record<Exclude<Status, "neutral">, string> = {
  correct: "Correct",
  vague: "Vague",
  wrong: "Wrong",
  missing: "Missing",
};

export function CodeLine({ text, result }: { text: string; result: LineResult }) {
  const { status, quote, fix } = result;
  return (
    <div className={`group relative flex border-l-[3px] ${STYLE[status]}`}>
      <span className="w-10 shrink-0 select-none pr-3 text-right text-white/30">{result.n}</span>
      <pre className="whitespace-pre-wrap break-words text-slate-100">{text || " "}</pre>
      {status !== "neutral" && (
        <div className="pointer-events-none absolute left-12 top-full z-10 hidden w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-3 font-sans text-sm text-slate-800 shadow-2xl group-hover:block">
          <div className="mb-1 font-semibold">{LABEL[status]}</div>
          {status === "missing" || !quote ? (
            <p className="text-slate-600">You didn't mention this.</p>
          ) : (
            <p>
              <span className="font-medium">You said:</span> <q>{quote}</q>
            </p>
          )}
          {fix && (
            <p className="mt-1">
              <span className="font-medium">Fix:</span> {fix}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
