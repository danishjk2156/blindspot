import type { LineResult, Status } from "../types";

const BG: Record<Status, string> = {
  correct: "bg-green-100",
  vague: "bg-yellow-100",
  wrong: "bg-red-100",
  missing: "bg-gray-200",
  neutral: "",
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
    <div className={`group relative flex ${BG[status]}`}>
      <span className="w-10 shrink-0 select-none pr-3 text-right text-slate-400">{result.n}</span>
      <pre className="whitespace-pre-wrap break-words">{text || " "}</pre>
      {status !== "neutral" && (
        <div className="pointer-events-none absolute left-12 top-full z-10 hidden w-80 max-w-[90vw] rounded-md border border-slate-200 bg-white p-3 font-sans text-sm text-slate-800 shadow-lg group-hover:block">
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
