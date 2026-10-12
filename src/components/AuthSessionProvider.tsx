import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, onUnauthorized, type AuthTokens, type AuthUser } from "@/lib/api-client";
import type { ApiResult } from "@/lib/api-client";

/**
 * Platform-owned session shell for the Vite WEB app type — locked.
 *
 * Sessions are issued by the linked API service (`/api/auth/*`) and carried
 * by its httpOnly cookies (plus a Bearer token for cross-origin deploys).
 * Bootstraps `/api/auth/session` on mount; `useSession()` exposes the result.
 */
export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface SessionContextValue {
  user: AuthUser | null;
  status: SessionStatus;
  data: { user: AuthUser } | null;
  update: () => Promise<AuthUser | null>;
  signIn: (email: string, password: string) => Promise<ApiResult<AuthTokens>>;
  signUp: (email: string, password: string, name?: string) => Promise<ApiResult<AuthTokens>>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const update = useCallback(async () => {
    const next = await authApi.session();
    setUser(next);
    setStatus(next ? "authenticated" : "unauthenticated");
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void authApi.session().then((next) => {
      if (cancelled) return;
      setUser(next);
      setStatus(next ? "authenticated" : "unauthenticated");
    });
    const unsubscribe = onUnauthorized(() => {
      if (cancelled) return;
      setUser(null);
      setStatus("unauthenticated");
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      status,
      data: user ? { user } : null,
      update,
      signIn: async (email, password) => {
        const res = await authApi.login(email, password);
        if (res.success) {
          setUser(res.data.user);
          setStatus("authenticated");
        }
        return res;
      },
      signUp: async (email, password, name) => {
        const res = await authApi.signup(email, password, name);
        if (res.success) {
          setUser(res.data.user);
          setStatus("authenticated");
        }
        return res;
      },
      signOut: async () => {
        await authApi.logout();
        setUser(null);
        setStatus("unauthenticated");
      },
    }),
    [user, status, update],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <AuthSessionProvider> (see src/main.tsx)");
  return ctx;
}
