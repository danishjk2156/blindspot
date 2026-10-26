import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { Logo, LogoMark } from "./Logo";

type Mode = "login" | "signup";
type Tone = "correct" | "vague" | "wrong" | "missing";

const TONE: Record<Tone, string> = {
  correct: "bg-emerald-400/25",
  vague: "bg-amber-300/30",
  wrong: "bg-rose-400/35",
  missing: "bg-white/15",
};

const SLIDES: { title: string; body: string; lines: [string, Tone][] }[] = [
  {
    title: "Speak it",
    body: "Hold your Wispr Flow hotkey and explain the code out loud, in English or Hinglish.",
    lines: [
      ["def binary_search(arr, target):", "correct"],
      ["    lo, hi = 0, len(arr) - 1", "correct"],
    ],
  },
  {
    title: "See it",
    body: "Every line is graded: correct, vague, wrong or missing, with the exact words you said.",
    lines: [
      ["        mid = (lo + hi) // 2", "vague"],
      ["            return mid", "wrong"],
    ],
  },
  {
    title: "Trust it",
    body: "Each quote is verified against your transcript, so the model can't invent praise.",
    lines: [
      ["        elif arr[mid] < target:", "correct"],
      ["    return -1", "missing"],
    ],
  },
];

function Scene() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07061f" />
          <stop offset="0.55" stopColor="#1f1147" />
          <stop offset="0.85" stopColor="#7a2a63" />
          <stop offset="1" stopColor="#f0703c" />
        </linearGradient>
        <radialGradient id="planet" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f9a8d4" />
          <stop offset="1" stopColor="#4c1d95" />
        </radialGradient>
        <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1d4a" />
          <stop offset="1" stopColor="#09061a" />
        </linearGradient>
      </defs>
      <rect width="600" height="700" fill="url(#sky)" />
      {[[60, 70], [150, 140], [310, 60], [430, 120], [520, 60], [90, 250], [470, 230], [250, 190], [560, 300]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} fill="#fff" opacity="0.8" />
      ))}
      <circle cx="430" cy="250" r="46" fill="url(#planet)" />
      <ellipse cx="430" cy="252" rx="78" ry="12" fill="none" stroke="#f9a8d4" strokeOpacity="0.55" strokeWidth="3" transform="rotate(-18 430 252)" />
      <path d="M0 560 L70 470 L120 520 L200 400 L260 500 L330 430 L400 520 L470 450 L540 530 L600 480 V700 H0 Z" fill="url(#ridge)" />
      <path d="M0 640 L90 590 L180 630 L290 580 L400 630 L500 595 L600 625 V700 H0 Z" fill="#05030f" />
    </svg>
  );
}

export function AuthPage() {
  const { logIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slide, setSlide] = useState(0);

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

  const go = (d: number) => setSlide((s) => (s + d + SLIDES.length) % SLIDES.length);
  const cur = SLIDES[slide];
  const field =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-0 sm:p-6">
      {/* diagonal dark backdrop, like the reference */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] bg-slate-950 lg:block"
        style={{ clipPath: "polygon(0 0, 100% 0, 82% 100%, 0 100%)" }}
      />

      <div className="relative grid w-full max-w-6xl bg-white p-0 shadow-2xl shadow-slate-900/20 sm:rounded-[2.5rem] sm:p-2.5 lg:grid-cols-[1.08fr_1fr]">
        {/* Art panel */}
        <aside
          className="relative hidden min-h-[640px] overflow-hidden rounded-[2rem] bg-slate-950 text-white lg:block"
          style={{ clipPath: "polygon(0 0, 100% 0, 91% 100%, 0 100%)" }}
        >
          <Scene />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-8">
            <span className="text-lg font-bold">How it works</span>
            <div className="flex items-center gap-2 pr-10 text-sm font-semibold">
              <button type="button" onClick={() => switchMode("login")} className={mode === "login" ? "rounded-full border-2 border-white px-4 py-1.5" : "px-3 py-1.5 opacity-80 hover:opacity-100"}>
                Log in
              </button>
              <button type="button" onClick={() => switchMode("signup")} className={mode === "signup" ? "rounded-full border-2 border-white px-4 py-1.5" : "px-3 py-1.5 opacity-80 hover:opacity-100"}>
                Sign up
              </button>
            </div>
          </div>

          <div className="absolute inset-x-8 top-[34%] max-w-md rounded-2xl border border-white/20 bg-black/30 p-4 font-mono text-[13px] backdrop-blur-md">
            {cur.lines.map(([text, tone]) => (
              <div key={text} className={`flex items-center justify-between gap-3 whitespace-pre rounded-md px-2.5 py-1.5 ${TONE[tone]}`}>
                <span>{text}</span>
                <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-white/70">{tone}</span>
              </div>
            ))}
          </div>

          <div className="absolute inset-x-8 bottom-8 flex items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3">
              <LogoMark size={52} />
              <div>
                <div className="text-lg font-bold leading-tight">{cur.title}</div>
                <div className="max-w-[17rem] text-sm leading-snug text-white/80">{cur.body}</div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {[-1, 1].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => go(d)}
                  aria-label={d < 0 ? "Previous" : "Next"}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/60 text-lg transition hover:bg-white/15"
                >
                  {d < 0 ? "←" : "→"}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Form */}
        <main className="flex flex-col px-6 py-8 sm:px-10 lg:px-14">
          <div className="flex items-center justify-between">
            <Logo />
            <span className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600">Demo build</span>
          </div>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <h1 className="text-center text-5xl font-extrabold tracking-tight text-slate-900">
              {mode === "signup" ? "Hi, Coder" : "Welcome back"}
            </h1>
            <p className="mt-3 text-center text-slate-600">
              {mode === "signup" ? "Create your Blindspot account" : "Log in to keep practising"}
            </p>

            <form onSubmit={submit} className="mt-9 space-y-3.5" noValidate>
              {mode === "signup" && (
                <input aria-label="Name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Name" />
              )}
              <input aria-label="Email" className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="Email" />
              <div className="relative">
                <input
                  aria-label="Password"
                  className={`${field} pr-16`}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="Password (8+ characters)"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-4 text-xs font-semibold text-slate-500 hover:text-indigo-600">
                  {show ? "Hide" : "Show"}
                </button>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 py-1 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
              </div>
              <button
                type="button"
                onClick={continueAsGuest}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                Continue as guest
              </button>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 w-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-300/50 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60"
              >
                {busy ? "One moment…" : mode === "signup" ? "Create account" : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
              <button type="button" onClick={() => switchMode(mode === "signup" ? "login" : "signup")} className="font-semibold text-indigo-600 hover:underline">
                {mode === "signup" ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400">Accounts are stored only in this browser (demo).</p>
        </main>
      </div>
    </div>
  );
}
