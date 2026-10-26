import { useId } from "react";

/** Blindspot mark: an eye whose pupil has a gap in it, the part you can't see. */
export function LogoMark({ size = 36 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="0.55" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id={`${id}-iris`} x1="16" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#${id}-bg)`} />
      <path d="M6 24C11 15 17 11.5 24 11.5S37 15 42 24c-5 9-11 12.5-18 12.5S11 33 6 24Z" fill="#fff" fillOpacity="0.96" />
      <circle cx="24" cy="24" r="8.5" fill={`url(#${id}-iris)`} />
      <circle cx="24" cy="24" r="3.4" fill="#1E1B4B" />
      <circle cx="26.6" cy="21.4" r="1.6" fill="#fff" />
      <path d="M32.5 24a8.5 8.5 0 0 1-3.4 6.8" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ size = 36, light = false }: { size?: number; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
        Blind
        <span
          className={
            light
              ? "text-pink-300"
              : "bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent"
          }
        >
          spot
        </span>
      </span>
    </span>
  );
}
