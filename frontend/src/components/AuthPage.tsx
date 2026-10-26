import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { Logo } from "./Logo";

type Mode = "login" | "signup";

const PREVIEW = [
  { n: 1, text: "def binary_search(arr, target):", bg: "bg-emerald-400/20", tip: "correct" },
  { n: 2, text: "    lo, hi = 0, len(arr) - 1", bg: "bg-emerald-400/20", tip: "correct" },
  { n: 4, text: "        mid = (lo + hi) // 2", bg: "bg-amber-300/25", tip: "vague" },
  { n: 6, text: "            return mid", bg: "bg-rose-400/30", tip: "wrong" },
  { n: 11, text: "    return -1", bg: "bg-white/10", tip: "missing" },
];

export function AuthPage() {
  const { logIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (mode === "signup" && name.trim().length < 2) return "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return null;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") await signUp(name, email, password);
      else await logIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-indigo-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="animate-float pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="animate-float pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-pink-500/30 blur-3xl [animation-delay:-4s]" />
        <div className="relative">
          <Logo light size={40} />
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
            Find the gaps in what you <span className="text-pink-300">think you know</span>.
          </h1>
          <p className="mt-4 text-lg text-indigo-100/80">
            Explain your code out loud. Blindspot grades it line by line and shows exactly which parts you skipped,
            fudged or got wrong.
          </p>

          <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 font-mono text-[13px] shadow-2xl backdrop-blur">
            {PREVIEW.map((l) => (
              <div key={l.n} className={`flex items-center gap-3 rounded-md px-2 py-1 ${l.bg}`}>
                <span className="w-5 text-right text-indigo-200/60">{l.n}</span>
                <span className="flex-1 whitespace-pre text-indigo-50">{l.text}</span>
                <span className="font-sans text-[11px] font-medium uppercase tracking-wide text-indigo-100/70">
                  {l.tip}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-indigo-200/70">
          Every quote we show you is verified against what you actually said.
        </p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-indigo-100/60 sm:p-9">
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist">
              {(["signup", "login"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`rounded-lg py-2 transition ${
                    mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {m === "signup" ? "Sign up" : "Log in"}
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "signup" ? "Start finding your blindspots in under a minute." : "Log in to keep practising."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {mode === "signup" && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Name</span>
                  <input
                    className={field}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                  />
                </label>
              )}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                <input
                  className={field}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
                <div className="relative">
                  <input
                    className={`${field} pr-16`}
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500 hover:text-indigo-600"
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {error && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-300/50 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60"
              >
                {busy ? "One moment…" : mode === "signup" ? "Create account" : "Log in"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
            </div>
            <button
              type="button"
              onClick={continueAsGuest}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              Try the demo as a guest
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Demo build: accounts are stored only in this browser.
          </p>
        </div>
      </main>
    </div>
  );
}
