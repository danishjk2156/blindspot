import { useState } from "react";
import { analyze } from "./api";
import { useAuth } from "./auth";
import { AuthPage } from "./components/AuthPage";
import { CodePane } from "./components/CodePane";
import { CoverageBadge } from "./components/CoverageBadge";
import { ExplanationPanel } from "./components/ExplanationPanel";
import { Header } from "./components/Header";
import { samples } from "./samples";
import type { AnalyzeResponse, Language } from "./types";

export default function App() {
  const { user } = useAuth();
  return user ? <Workspace /> : <AuthPage />;
}

function Workspace() {
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
    <div className="app-bg min-h-screen">
      <Header onSample={loadSample} />
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Explain it. See what you missed.</h1>
          <p className="mt-1 text-sm text-slate-600">
            Paste code, explain it out loud with Wispr Flow, then find your blindspots.
          </p>
        </div>

        {result && (
          <div className="mb-5 space-y-2">
            <CoverageBadge result={result} />
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <Legend color="bg-green-200" label="correct" />
              <Legend color="bg-yellow-200" label="vague" />
              <Legend color="bg-red-200" label="wrong" />
              <Legend color="bg-gray-300" label="missing" />
              <span>Hover a line to see what you said and the fix.</span>
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <main className="grid grid-cols-1 gap-5 md:grid-cols-[3fr_2fr]">
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
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-3 w-3 rounded-sm ${color}`} /> {label}
    </span>
  );
}
