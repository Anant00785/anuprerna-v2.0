'use client';
// Buyer-mode session context (front-end only, no auth) -- THREE states:
// 'guest' (default), 'b2c' (tailored/simplified retail), 'b2b' (logged-in
// wholesale). Mirrors the proven CurrencyProvider pattern: SSR + first client
// render use the DEFAULT ('guest') so hydration matches the ISR-cached HTML,
// then an effect applies the real cookie value on the client -- no hydration
// warning, ISR/perf preserved.
//
// The actual BULK DATA (pre-order, volume tiers, MOQ box) is b2b-only (showBulkData);
// guest + b2c see a wholesale INVITATION instead (wholesaleCta). The setter writes
// the cookie so a Server Component on a DYNAMIC route can read it via
// lib/buyer-mode.server.ts. Prices never depend on mode (see lib/buyer-mode.ts).
//
// ── RECONCILING THE TOGGLE WITH A REAL ACCOUNT (2026-08-17) ────────────────
// The 'View as' toggle and the ap_buyer_mode cookie predate accounts having a
// declared buyer type. Now that they do, the two could disagree, and a
// disagreement here is not cosmetic: trade pricing is gated SERVER-SIDE on the
// account, so a signed-in retail buyer who flipped the toggle to Business would
// be shown a business-shaped page whose tier data the server will refuse to
// send. That is worse than either state on its own — it looks like a bug, or
// worse, like we are hiding their pricing.
//
// So the rule is: WHILE SIGNED IN, THE ACCOUNT WINS AND THE TOGGLE IS INERT.
//   * the mode is driven from profile.buyerType and re-asserted on every auth
//     refresh, so it cannot be left stale by a manual flip;
//   * setMode() is a no-op for a signed-in buyer, and `lockedByAccount` is
//     exposed so the toggle can say WHY instead of silently ignoring a click;
//   * signed OUT, nothing changes at all — the toggle still drives guest/retail/
//     business framing for testing, because there is no account to contradict.
// Changing it for real is a one-tap action in account settings, which writes the
// account and therefore moves the cookie with it.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  BUYER_MODE_COOKIE, BUYER_MODE_MAX_AGE, DEFAULT_BUYER_MODE,
  parseBuyerMode, isBusinessMode, isSimplified, showsBulkData, wholesaleCta,
  type BuyerMode, type WholesaleCta,
} from '@/lib/buyer-mode';

interface BuyerModeState {
  mode: BuyerMode;
  /** b2b only -- bulk-forward qty + MOQ floor. */
  isBusiness: boolean;
  /** b2c only -- simplified retail. */
  isSimplified: boolean;
  /** b2b ONLY -- the actual bulk DATA (pre-order dialog, volume tiers, MOQ box). */
  showBulkData: boolean;
  /** Which wholesale invitation to show in place of the bulk data:
   *  'login' (guest) | 'upgrade' (b2c) | null (b2b). */
  wholesaleCta: WholesaleCta;
  /** TRUE while a real account is signed in: the mode comes from that account's
   *  stored buyer type and the manual toggle cannot override it. */
  lockedByAccount: boolean;
  /** TRUE ONLY if the logged-in user is an authenticated Business / Wholesale account. */
  isBusinessAccount: boolean;
  /** TRUE ONLY if the user is authorized to switch between Business and Retail modes. */
  canSwitchMode: boolean;
  setMode: (m: BuyerMode) => void;
}

const Ctx = createContext<BuyerModeState | null>(null);

function readCookie(): BuyerMode {
  if (typeof document === 'undefined') return DEFAULT_BUYER_MODE;
  const m = document.cookie.match(new RegExp('(?:^|; )' + BUYER_MODE_COOKIE + '=([^;]*)'));
  return parseBuyerMode(m ? decodeURIComponent(m[1]) : null);
}

export function BuyerModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<BuyerMode>(DEFAULT_BUYER_MODE);

  // Apply a mode + persist the cookie (shared by the auth bridge below and the
  // manual setMode). Kept as a ref-stable helper so the bridge effect deps stay minimal.
  const setModeFromAuth = useCallback((m: BuyerMode) => {
    setModeState((prev) => (prev !== m ? m : prev));
    if (typeof document !== 'undefined') {
      document.cookie =
        BUYER_MODE_COOKIE + '=' + m + '; path=/; max-age=' + BUYER_MODE_MAX_AGE + '; SameSite=Lax';
    }
  }, []);

  // Apply the persisted cookie value after mount (avoids SSR/hydration mismatch
  // on the ISR-cached pages, which are always generated with the 'guest' default).
  useEffect(() => {
    const c = readCookie();
    setModeState((prev) => (c !== prev ? c : prev));
  }, []);

  const { user, loading } = useAuth();
  const wasAuthedRef = useRef(false);

  // Determine if the user is a registered/logged-in Business account
  const isBusinessAccount = Boolean(
    user && (
      (user as Record<string, unknown>).buyerType === 'b2b' ||
      (user as Record<string, unknown>).isBusiness === true ||
      (user as Record<string, unknown>).accountType === 'business' ||
      (user as Record<string, unknown>).companyName ||
      (user as Record<string, unknown>).gstNumber ||
      (user as Record<string, unknown>).activeWholesaleProgram ||
      (user as Record<string, unknown>).wholesaleProgramActive ||
      (user as Record<string, unknown>).isWholesaleMember
    )
  );

  // ONLY business accounts are permitted to switch between Business and Retail
  const canSwitchMode = isBusinessAccount;
  const lockedByAccount = !loading && !!user && !isBusinessAccount;

  useEffect(() => {
    if (loading) return;
    if (user) {
      wasAuthedRef.current = true;
      if (isBusinessAccount) {
        // Business user: preserve their current cookie choice if they switched to retail ('b2c'), else default to 'b2b'
        const existingCookie = readCookie();
        if (existingCookie === 'b2c' || existingCookie === 'b2b') {
          setModeFromAuth(existingCookie);
        } else {
          setModeFromAuth('b2b');
        }
      } else {
        // Retail user: always fixed to retail mode ('b2c')
        setModeFromAuth('b2c');
      }
    } else {
      // Not signed in: always standard normal retail website
      wasAuthedRef.current = false;
      setModeFromAuth(DEFAULT_BUYER_MODE);
    }
  }, [user, loading, isBusinessAccount, setModeFromAuth]);

  const setMode = useCallback((m: BuyerMode) => {
    // Only business accounts can switch to b2b
    if (!isBusinessAccount && m === 'b2b') {
      return;
    }
    setModeState(m);
    if (typeof document !== 'undefined') {
      document.cookie =
        BUYER_MODE_COOKIE + '=' + m + '; path=/; max-age=' + BUYER_MODE_MAX_AGE + '; SameSite=Lax';
    }
  }, [isBusinessAccount]);

  return (
    <Ctx.Provider
      value={{
        mode,
        isBusiness: isBusinessMode(mode),
        isSimplified: isSimplified(mode),
        showBulkData: showsBulkData(mode),
        wholesaleCta: wholesaleCta(mode),
        lockedByAccount,
        isBusinessAccount,
        canSwitchMode,
        setMode,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useBuyerMode(): BuyerModeState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBuyerMode must be used within <BuyerModeProvider>');
  return ctx;
}
