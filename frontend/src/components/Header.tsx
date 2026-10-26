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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07061f]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Logo light />
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-xs font-semibold uppercase tracking-widest text-white/40 sm:inline">Samples</span>
            {samples.map((s, i) => (
              <button
                key={s.name}
                onClick={() => onSample(i)}
                className="rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white hover:bg-white/10"
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 border-l border-white/15 pl-4">
            <span
              className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-xs font-bold text-white"
              title={user?.email}
            >
              {initials}
            </span>
            <span className="hidden text-sm font-medium text-white/85 sm:inline">{user?.name}</span>
            <button
              onClick={logOut}
              className="rounded-full border border-white/25 px-3 py-1 text-xs font-semibold text-white/85 transition hover:border-white hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
