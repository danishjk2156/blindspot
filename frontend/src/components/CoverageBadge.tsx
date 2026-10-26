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

export function CoverageBadge({ result }: { result: AnalyzeResponse }) {
  const pct = result.coverage_pct;
  const band =
    pct >= 80 ? "bg-green-100 text-green-800" : pct >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  const c = countBlocks(result);
  return (
    <div className={`flex items-center gap-4 rounded-lg px-4 py-3 ${band}`}>
      <div className="text-4xl font-bold">{Math.round(pct)}%</div>
      <div className="text-sm">
        <div className="font-semibold">Coverage{result.cached ? " (cached)" : ""}</div>
        <div>
          {c.correct} correct · {c.vague} vague · {c.wrong} wrong · {c.missing} missing
        </div>
      </div>
    </div>
  );
}
