import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * DEMO AUTH ONLY. Accounts live in this browser's localStorage, so nothing here is
 * secure or shared across devices. Swap this module for a real provider before launch.
 */
export interface User {
  name: string;
  email: string;
  guest?: boolean;
}

interface StoredUser extends User {
  salt: string;
  hash: string;
}

interface AuthApi {
  user: User | null;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => void;
  logOut: () => void;
}

const USERS_KEY = "blindspot.users";
const SESSION_KEY = "blindspot.session";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the session just won't persist */
  }
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const publicUser = ({ name, email, guest }: User): User => ({ name, email, guest });

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => read<User | null>(SESSION_KEY, null));

  const start = useCallback((u: User) => {
    write(SESSION_KEY, u);
    setUser(u);
  }, []);

  const api = useMemo<AuthApi>(
    () => ({
      user,
      async signUp(name, email, password) {
        const e = email.trim().toLowerCase();
        const users = read<StoredUser[]>(USERS_KEY, []);
        if (users.some((u) => u.email === e)) throw new Error("An account with this email already exists.");
        const salt = crypto.randomUUID();
        const created: StoredUser = { name: name.trim(), email: e, salt, hash: await sha256(salt + password) };
        write(USERS_KEY, [...users, created]);
        start(publicUser(created));
      },
      async logIn(email, password) {
        const e = email.trim().toLowerCase();
        const found = read<StoredUser[]>(USERS_KEY, []).find((u) => u.email === e);
        if (!found || found.hash !== (await sha256(found.salt + password))) {
          throw new Error("Incorrect email or password.");
        }
        start(publicUser(found));
      },
      continueAsGuest: () => start({ name: "Guest", email: "guest@blindspot.demo", guest: true }),
      logOut() {
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {
          /* ignore */
        }
        setUser(null);
      },
    }),
    [user, start],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
