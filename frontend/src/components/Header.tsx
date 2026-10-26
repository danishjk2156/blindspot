import { useAuth } from "../auth";
import { samples } from "../samples";
import { Logo } from "./Logo";

export function Header({ onSample }: { onSample: (i: number) => void }) {
  const { user, logOut } = useAuth();
  const initials = (user?.name ?? "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Logo />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="hidden text-slate-500 sm:inline">Try a sample</span>
            {samples.map((s, i) => (
              <button
                key={s.name}
                onClick={() => onSample(i)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <span
              className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-xs font-bold text-white"
              title={user?.email}
            >
              {initials}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">{user?.name}</span>
            <button onClick={logOut} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
