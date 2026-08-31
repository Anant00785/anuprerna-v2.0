// lib/buyer-mode.ts
// Buyer-aware storefront foundation -- THREE-state model.
//
// Anuprerna is B2B-FIRST, but the actual BULK DATA is gated behind WHOLESALE LOGIN.
// The founder's final model:
//
//   guest (DEFAULT, no login) -- retail shopping + an INVITATION to log in as a
//                                wholesale buyer. Does NOT see the actual bulk data.
//   b2c   (tailored retail)   -- retail shopping + an INVITATION to UPGRADE to a
//                                wholesale account. Does NOT see the actual bulk data.
//   b2b   (logged-in wholesale) -- sees the actual BULK DATA: pre-order dialog,
//                                volume-discount tier prices, MOQ box.
//
// Everyone can shop retail (Add-to-Cart, guest checkout). The actual bulk DATA
// (pre-order, volume tiers, MOQ) is shown to b2b ONLY; guest + b2c see a wholesale
// INVITATION in its place (guest -> log in; b2c -> upgrade).
//
// CRITICAL INVARIANT: mode NEVER changes any price. It only SHOWS / HIDES features.
// Displayed prices are byte-identical across all three states.
//
// Session-based, front-end only (no auth coupling in v1). The mode is persisted in
// a cookie so BOTH server components (see buyer-mode.server.ts) and the client (see
// components/BuyerModeProvider.tsx) can read it. Account-level persistence is a later
// slice. This module is pure/isomorphic (no next/headers, no 'use client').

export type BuyerMode = 'guest' | 'b2c' | 'b2b';

// Which wholesale INVITATION to show when the buyer is NOT b2b:
//   'login'   -> guest: "log in as a wholesale buyer"
//   'upgrade' -> b2c:   "upgrade to a wholesale account"
//   null      -> b2b:   no invitation (they already see the bulk data)
export type WholesaleCta = 'login' | 'upgrade' | null;

export const BUYER_MODE_COOKIE = 'ap_buyer_mode';
export const DEFAULT_BUYER_MODE: BuyerMode = 'guest';
// 1 year -- experiment/session persistence; not tied to an auth session.
export const BUYER_MODE_MAX_AGE = 60 * 60 * 24 * 365;

/** Coerce any raw cookie value to a valid mode; unknown/missing => default 'guest'. */
export function parseBuyerMode(raw: string | undefined | null): BuyerMode {
  return raw === 'b2b' ? 'b2b' : raw === 'b2c' ? 'b2c' : DEFAULT_BUYER_MODE;
}

/** True ONLY for the tailored Business state (b2b): bulk-forward qty + MOQ floor. */
export function isBusinessMode(mode: BuyerMode): boolean {
  return mode === 'b2b';
}

/** True ONLY for the tailored retail state (b2c, simulated logged-in B2C): the
 *  SIMPLIFIED experience. Alias isRetailTailored for call-site readability. */
export function isSimplified(mode: BuyerMode): boolean {
  return mode === 'b2c';
}
export const isRetailTailored = isSimplified;

/** The actual BULK DATA (pre-order dialog, volume-discount tiers, MOQ box) is shown
 *  to LOGGED-IN WHOLESALE (b2b) ONLY. guest + b2c see a wholesale invitation instead. */
export function showsBulkData(mode: BuyerMode): boolean {
  return mode === 'b2b';
}

/** Which wholesale invitation to show in place of the bulk data:
 *  guest -> 'login', b2c -> 'upgrade', b2b -> null (already sees the data). */
export function wholesaleCta(mode: BuyerMode): WholesaleCta {
  if (mode === 'b2b') return null;
  return mode === 'b2c' ? 'upgrade' : 'login';
}
