import { useId } from "react";
import type { AnalyzeResponse, Status } from "../types";

type Graded = Exclude<Status, "neutral">;

/** Count unique blocks: consecutive lines sharing status, quote and fix belong to one block. */
function countBlocks(result: AnalyzeResponse): Record<Graded, number> {
  const counts: Record<Graded, number> = { correct: 0, vague: 0, wrong: 0, missing: 0 };
  let prev: string | null = null;
  for (const l of result.lines) {
    if (l.status === "neutral") {
      prev = null;
      continue;
    }
    const sig = `${l.status}|${l.quote}|${l.fix}`;
    if (sig !== prev) counts[l.status]++;
    prev = sig;
  }
  return counts;
}

const RING: Record<Graded, string> = {
  correct: "border-emerald-400 text-emerald-300",
  vague: "border-amber-300 text-amber-200",
  wrong: "border-rose-400 text-rose-300",
  missing: "border-white/40 text-white/70",
};

export function CoverageBadge({ result }: { result: AnalyzeResponse }) {
  const gid = useId().replace(/:/g, "");
  const pct = result.coverage_pct;
  const verdict = pct >= 80 ? "Solid understanding" : pct >= 50 ? "Getting there" : "Big blindspots";
  const c = countBlocks(result);
  const R = 44;
  const C = 2 * Math.PI * R;

  return (
    <section className="grid items-center gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur sm:grid-cols-[auto_1fr]">
      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#818cf8" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${(C * Math.max(pct, 0.5)) / 100} ${C}`}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-3xl font-extrabold text-white">{Math.round(pct)}%</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">coverage</div>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-white">{verdict}</div>
          <div className="text-sm text-white/55">{result.cached ? "From cache" : "Freshly graded"}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(c) as Graded[]).map((k) => (
          <div key={k} className="flex flex-col items-center gap-2">
            <div className={`grid h-16 w-16 place-items-center rounded-full border-2 text-2xl font-bold ${RING[k]}`}>{c[k]}</div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/55">{k}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
