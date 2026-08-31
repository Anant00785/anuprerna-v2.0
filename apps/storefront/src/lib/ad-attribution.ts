// =====================================================================================
// AD ATTRIBUTION — client-side capture + persistence of the Google-Ads click id
// (gclid / gbraid / wbraid) and UTM params from the ad-landing URL, so they can be
// attached to the add-to-cart and order payloads (offline-conversion attribution).
//
// Faithful port of the live Angular AdAttributionService
// (fabric/src/app/services/ad-attribution.service.ts). Same storage key (_an_attr),
// same 89-day window, LAST-CLICK-WINS, same record shape, same wire field names
// (clickId / clickIdType / clickCapturedAt / utmSource / utmMedium / utmCampaign).
//
// Policy:
//  - 89-day attribution window measured from the ad click.
//  - Last-click wins: a newer ad visit overwrites the stored one.
//  - One conversion per click: clearAttribution() is called on order success.
//  - UTM fallback: privacy browsers strip the click id but leave utm_* intact, so a
//    visit carrying any utm_* is still captured (without a click id).
//
// SSR-safe: every window/localStorage access is guarded by `typeof window`.
// =====================================================================================

const STORAGE_KEY = '_an_attr';
const WINDOW_DAYS = 89;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type ClickIdType = 'GCLID' | 'GBRAID' | 'WBRAID';

export interface AdAttribution {
  clickId?: string;
  clickIdType?: ClickIdType;
  capturedAt: number; // epoch ms of the visit that carried the ad params
  expiresAt: number;  // capturedAt + WINDOW_MS
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Captures the attribution from the current URL (last-click overwrite). A click id
 * (gclid / gbraid / wbraid) is preferred, but a visit carrying only utm_* is still
 * captured so source / medium / campaign survives on privacy browsers that strip the
 * click id. Returns the record, or null when the URL carries no attribution at all.
 */
export function captureFromUrl(): AdAttribution | null {
  if (!isBrowser()) return null;

  const search = window.location.search;
  if (!search) return null;

  const params = new URLSearchParams(search);
  const gclid = params.get('gclid');
  const gbraid = params.get('gbraid');
  const wbraid = params.get('wbraid');

  let clickId: string | undefined;
  let clickIdType: ClickIdType | undefined;
  if (gclid) { clickId = gclid; clickIdType = 'GCLID'; }
  else if (gbraid) { clickId = gbraid; clickIdType = 'GBRAID'; }
  else if (wbraid) { clickId = wbraid; clickIdType = 'WBRAID'; }

  const utmSource = params.get('utm_source') || undefined;
  const utmMedium = params.get('utm_medium') || undefined;
  const utmCampaign = params.get('utm_campaign') || undefined;

  if (!clickId && !utmSource && !utmMedium && !utmCampaign) return null;

  const now = Date.now();
  const record: AdAttribution = {
    clickId,
    clickIdType,
    capturedAt: now,
    expiresAt: now + WINDOW_MS,
    utmSource,
    utmMedium,
    utmCampaign,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* quota / private-mode — ignore */
  }
  return record;
}

/** Returns the current valid attribution, or null. Self-cleaning on expiry / corruption. */
export function readAttribution(): AdAttribution | null {
  if (!isBrowser()) return null;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let record: AdAttribution | null = null;
  try {
    record = JSON.parse(raw) as AdAttribution;
  } catch {
    clearAttribution();
    return null;
  }

  const hasSignal = !!(record && (record.clickId || record.utmSource || record.utmMedium || record.utmCampaign));
  if (!record || !hasSignal || !record.expiresAt || record.expiresAt <= Date.now()) {
    clearAttribution();
    return null;
  }
  return record;
}

/**
 * Merges the stored attribution into an outgoing cart / order payload, IN PLACE,
 * when a valid record is present. No-op otherwise. Returns the same object for
 * convenience. Mirrors AdAttributionService.attachTo.
 */
export function attachTo<T extends Record<string, unknown>>(payload: T): T {
  if (!payload) return payload;
  const record = readAttribution();
  if (!record) return payload;

  if (record.clickId) {
    (payload as Record<string, unknown>).clickId = record.clickId;
    (payload as Record<string, unknown>).clickIdType = record.clickIdType;
  }
  (payload as Record<string, unknown>).clickCapturedAt = record.capturedAt;
  if (record.utmSource) (payload as Record<string, unknown>).utmSource = record.utmSource;
  if (record.utmMedium) (payload as Record<string, unknown>).utmMedium = record.utmMedium;
  if (record.utmCampaign) (payload as Record<string, unknown>).utmCampaign = record.utmCampaign;
  return payload;
}

/** Destroys the stored attribution (localStorage + sessionStorage). Called on order success. */
export function clearAttribution(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  try {
    window.sessionStorage?.removeItem(STORAGE_KEY);
  } catch { /* sessionStorage may be unavailable (private mode / disabled) */ }
}
