import { useEffect, useRef } from "react";

export const MIN_WORDS = 20;

export function countWords(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

const hotkey = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "Fn" : "Ctrl+Win";

interface Props {
  transcript: string;
  loading: boolean;
  onChange: (t: string) => void;
  onSubmit: () => void;
}

export function ExplanationPanel({ transcript, loading, onChange, onSubmit }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const words = countWords(transcript);
  const ready = words >= MIN_WORDS;

  return (
    <section className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/60">Your explanation</h2>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-400" /> Wispr Flow: hold {hotkey}
        </span>
      </div>
      <textarea
        ref={ref}
        value={transcript}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Hold ${hotkey} and explain the code out loud…`}
        className="min-h-64 flex-1 resize-y bg-transparent p-5 text-[15px] leading-relaxed text-slate-100 caret-white outline-none placeholder:text-white/30"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-pink-400 transition-all"
              style={{ width: `${Math.min(100, (words / MIN_WORDS) * 100)}%` }}
            />
          </div>
          <span className={ready ? "text-emerald-300" : "text-white/50"}>
            {words} / {MIN_WORDS} words
          </span>
        </div>
        <button
          onClick={onSubmit}
          disabled={loading || !ready}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/50 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {loading ? "Grading…" : "Find my blindspots"}
        </button>
      </div>
    </section>
  );
}
