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
    <section className="flex flex-col rounded-2xl border border-white bg-white/90 shadow-lg shadow-indigo-100/50 backdrop-blur">
      <div className="border-b border-slate-200 px-4 py-2">
        <h2 className="font-semibold">Your explanation</h2>
      </div>
      <textarea
        ref={ref}
        value={transcript}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Hold ${hotkey} and explain the code out loud…`}
        className="min-h-64 flex-1 resize-y p-4 text-sm outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
        <div className="text-xs text-slate-500">
          <span className="mr-2 rounded-full bg-slate-100 px-2 py-0.5">Wispr Flow: hold {hotkey}</span>
          <span className={ready ? "text-green-700" : ""}>
            {words} / {MIN_WORDS} words
          </span>
        </div>
        <button
          onClick={onSubmit}
          disabled={loading || !ready}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-300/50 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {loading ? "Grading…" : "Find my blindspots"}
        </button>
      </div>
    </section>
  );
}
