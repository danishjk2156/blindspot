import { useState } from "react";
import { analyze } from "./api";
import { CodePane } from "./components/CodePane";
import { CoverageBadge } from "./components/CoverageBadge";
import { ExplanationPanel } from "./components/ExplanationPanel";
import { samples } from "./samples";
import type { AnalyzeResponse, Language } from "./types";

export default function App() {
  const [code, setCode] = useState(samples[0].code);
  const [language, setLanguage] = useState<Language>(samples[0].language);
  const [transcript, setTranscript] = useState(samples[0].transcript);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadSample(i: number) {
    const s = samples[i];
    setCode(s.code);
    setLanguage(s.language);
    setTranscript(s.transcript);
    setResult(null);
    setError(null);
  }

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setResult(await analyze({ code, language, transcript }));
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Blindspot</h1>
          <p className="text-sm text-slate-600">
            Explain your code out loud. See, line by line, what you didn't really understand.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Samples:</span>
          {samples.map((s, i) => (
            <button key={s.name} onClick={() => loadSample(i)} className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100">
              {s.name}
            </button>
          ))}
        </div>
      </header>

      {result && (
        <div className="mb-4 space-y-2">
          <CoverageBadge result={result} />
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <Legend color="bg-green-100" label="correct" />
            <Legend color="bg-yellow-100" label="vague" />
            <Legend color="bg-red-100" label="wrong" />
            <Legend color="bg-gray-200" label="missing" />
            <span>Hover a line for what you said and the fix.</span>
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <main className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_2fr]">
        <CodePane
          code={code}
          language={language}
          result={result}
          onCodeChange={(c) => {
            setCode(c);
            setResult(null);
          }}
          onLanguageChange={setLanguage}
          onEdit={() => setResult(null)}
        />
        <ExplanationPanel transcript={transcript} loading={loading} onChange={setTranscript} onSubmit={run} />
      </main>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-3 w-3 rounded-sm border border-slate-300 ${color}`} /> {label}
    </span>
  );
}
