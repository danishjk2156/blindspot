import { useState } from "react";
import { analyze } from "./api";
import { useAuth } from "./auth";
import { AuthPage } from "./components/AuthPage";
import { CodePane } from "./components/CodePane";
import { CoverageBadge } from "./components/CoverageBadge";
import { countWords, ExplanationPanel, MIN_WORDS } from "./components/ExplanationPanel";
import { Header } from "./components/Header";
import { samples } from "./samples";
import type { AnalyzeResponse, Language } from "./types";

export default function App() {
  const { user } = useAuth();
  return user ? <Workspace /> : <AuthPage />;
}

const STEPS = ["Paste your code", "Explain it out loud", "Find your blindspots"];

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

  const done = [code.trim().length > 0, countWords(transcript) >= MIN_WORDS, result !== null];
  const active = done.indexOf(false) === -1 ? 2 : done.indexOf(false);

  return (
    <div className="night-bg relative min-h-screen text-white">
      <div className="stars pointer-events-none absolute inset-0" />
      <div className="relative">
        <Header onSample={loadSample} />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
                Explain it.
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
                  See what you missed.
                </span>
              </h1>
              <p className="mt-3 max-w-md text-white/60">
                Speak your explanation with Wispr Flow. Blindspot grades every line against what you actually said.
              </p>
            </div>

            <ol className="flex items-center gap-2 text-xs font-semibold" aria-label="Progress">
              {STEPS.map((label, i) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm transition ${
                      done[i]
                        ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                        : i === active
                          ? "border-white text-white"
                          : "border-white/20 text-white/35"
                    }`}
                  >
                    {done[i] ? "✓" : `0${i + 1}`}
                  </span>
                  <span className={`hidden lg:inline ${i === active ? "text-white" : "text-white/45"}`}>{label}</span>
                  {i < STEPS.length - 1 && <span className="mx-1 hidden h-px w-8 bg-white/20 sm:block" />}
                </li>
              ))}
            </ol>
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-5 space-y-3">
              <CoverageBadge result={result} />
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-white/60">
                <Legend color="bg-emerald-400" label="correct" />
                <Legend color="bg-amber-300" label="vague" />
                <Legend color="bg-rose-400" label="wrong" />
                <Legend color="bg-white/50" label="missing" />
                <span className="text-white/45">Hover a line to see what you said and the fix.</span>
              </div>
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
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}
