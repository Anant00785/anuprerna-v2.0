'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { mergeGuestCartOnLogin } from '@/lib/guest-cart';

// Client auth context. On mount it asks the BFF (/api/auth/me) whether the
// httpOnly loom_jwt cookie identifies a logged-in customer. login() POSTs to
// /api/auth/login (which sets the cookie) then refreshes. The JWT itself is
// never visible to this client code.

export interface AuthUser {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [k: string]: unknown;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** `passwordless` means the account signs in with an emailed code and has NO
   *  password that could ever match — the caller should switch lanes rather than
   *  ask for the password again. */
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string; passwordless?: boolean }>;
  /** PASSWORDLESS SIGN-IN, step 1: ask for a 6-digit code by email. Deliberately
   *  returns the same shape whatever the address is — the whole method is
   *  enumeration-safe on the server and the client must not undo that by
   *  branching on the answer. */
  requestCode: (email: string) => Promise<{ ok: boolean; message?: string }>;
  /** PASSWORDLESS SIGN-IN, step 2. Produces the IDENTICAL session `login` does
   *  (same cookie, same claims), so everything after this point is the same code
   *  path — including the guest-cart merge below. */
  loginWithCode: (email: string, code: string) => Promise<{ ok: boolean; message?: string; throttled?: boolean }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      setUser(data?.authenticated ? (data.profile as AuthUser) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Delay by one event loop tick so the auth check fires AFTER React finishes
    // hydrating the SSR tree. Without this, the fast /api/auth/me response for
    // unauthenticated users can set loading=false during hydration, changing the
    // SiteHeader auth UI from the SSR loading placeholder, causing React #418.
    const t = setTimeout(() => { refresh(); }, 0);
    return () => clearTimeout(t);
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        // Replay any guest-cart lines into the now-authenticated account cart,
        // then clear the guest cart. Best-effort — never blocks a good login.
        try { await mergeGuestCartOnLogin(); } catch { /* ignore */ }
        await refresh();
        return { ok: true };
      }
      return {
        ok: false,
        message: data?.message || 'Login failed.',
        passwordless: data?.passwordless === true,
      };
    },
    [refresh],
  );

  const requestCode = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/email-code/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) return { ok: true, message: data?.message as string | undefined };
      return { ok: false, message: (data?.message as string) || 'Could not send a code right now.' };
    } catch {
      return { ok: false, message: 'Network error. Please try again.' };
    }
  }, []);

  const loginWithCode = useCallback(
    async (email: string, code: string) => {
      const res = await fetch('/api/auth/email-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        // The SAME post-login work a password sign-in does. Sharing this line is
        // the point: a code login must not be a second, subtly different lane.
        try { await mergeGuestCartOnLogin(); } catch { /* ignore */ }
        await refresh();
        return { ok: true };
      }
      // 429 is 'wait', not 'wrong' — a buyer who typed the right digits must not
      // be told their code was bad.
      return {
        ok: false,
        throttled: res.status === 429,
        message: (data?.message as string) || 'That code is not valid or has expired.',
      };
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, requestCode, loginWithCode, logout, refresh }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
