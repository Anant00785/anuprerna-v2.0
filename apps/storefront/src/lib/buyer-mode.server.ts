// lib/buyer-mode.server.ts
// RSC / route helper to read the buyer mode from the request cookie.
//
// NOTE: calling cookies() opts the caller into DYNAMIC rendering. The PDP is
// ISR-cached (revalidate=1800) and its perf budget depends on that cache, so the
// PDP gates buyer mode on the CLIENT (see components/BuyerModeProvider.tsx) rather
// than reading the cookie here. Use this helper only from routes that are ALREADY
// dynamic (e.g. future account-aware or checkout surfaces) so it does not force
// static/ISR pages to re-render per request.
import 'server-only';
import { cookies } from 'next/headers';
import { BUYER_MODE_COOKIE, parseBuyerMode, type BuyerMode } from './buyer-mode';

export async function getBuyerMode(): Promise<BuyerMode> {
  const store = await cookies();
  return parseBuyerMode(store.get(BUYER_MODE_COOKIE)?.value);
}
