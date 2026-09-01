/**
 * Client-side write helpers for Custom Orders (Phase 5 — write wiring).
 *
 * Every mutation goes through the shared /api/crud forwarder (which attaches the
 * sandbox admin token and writes ONLY to the sandbox pg copy — never live Loom
 * or Zoho). Nothing here talks to :8090 directly.
 *
 * The money math mirrors the live custom-order-overview pricing exactly:
 *   adjustedTotal = total + Σ(type===1 ? +amount : -amount)
 * Currency LABELS on adjustment rows never affect the arithmetic — it is a raw
 * signed sum regardless of the currency field. No business rounding: exactSum
 * performs exact fixed-decimal addition so 118.8 + 20 - 12 === 126.8 (never a
 * binary-float artifact like 126.80000000001).
 */

export async function crudWrite(path: string, method: string, body?: unknown): Promise<void> {
  const res = await fetch('/api/crud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: String(path).replace(/^\/+/, ''), method, body }),
  });
  const j = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
  if (!res.ok || j?.success === false) {
    throw new Error(j?.message || 'Request failed (' + res.status + ')');
  }
}

function countDecimals(n: number): number {
  if (!isFinite(n)) return 0;
  const s = String(n);
  const dot = s.indexOf('.');
  if (dot < 0) return 0;
  // Guard against exponential notation (unlikely for order money, but safe).
  if (s.indexOf('e') >= 0 || s.indexOf('E') >= 0) return 0;
  return s.length - dot - 1;
}

/** Exact fixed-decimal sum — no business rounding, only binary-float cleanup. */
export function exactSum(values: number[]): number {
  let dp = 0;
  for (const v of values) dp = Math.max(dp, countDecimals(v));
  dp = Math.min(dp, 8);
  const f = Math.pow(10, dp);
  let acc = 0;
  for (const v of values) acc += Math.round(v * f);
  return acc / f;
}

export interface AdjustmentLike {
  adjustmentType: number; // 1 = add (+), 2 = subtract (-)
  adjustmentAmount: number;
}

/** adjustedTotal = total + Σ(type1 ? +amount : -amount) over ALL adjustment rows
 *  (wholesale-discount rows are type-2 and ARE included in the subtraction). */
export function computeAdjustedTotal(total: number, adjustments: AdjustmentLike[]): number {
  const signed = adjustments.map((a) => (a.adjustmentType === 1 ? a.adjustmentAmount : -a.adjustmentAmount));
  return exactSum([total, ...signed]);
}

export function isWholesaleParticular(particular: string | undefined): boolean {
  return (particular || '').trim().toLowerCase() === 'wholesale discount';
}

// ── The sandbox floor, for the write controls on an ORDER ───────────────────
//
// Order 132440539 rendered an enabled pencil and trash on all 24 lines, plus Add
// item, Cancel order and Delete, immediately beside a badge reading "Sandbox —
// writes never touch live". For those controls that badge was FALSE: the order is
// live-mirrored, and nothing between the button and the backend said so.
//
// /api/crud now refuses every one of those paths for a sub-floor order id
// (WRITE_REGISTRY bands update/delete custom-order-item, add/custom-order-items and
// the adjustment routes as well as the order-level ones), and OrdersService refuses
// them again on the owning order. THIS is not a third control — it is the screen
// telling the truth: a control that is going to 403 should say so before it is
// clicked, and the badge should match what the buttons can actually do.
import { isSandboxId, sandboxRefusal } from '@/lib/sandbox-floor';

export interface OrderWriteCapability { ok: boolean; reason: string }

/** Whether the write controls on THIS order may be offered at all. */
export function orderWriteCapability(orderId: number): OrderWriteCapability {
  if (isSandboxId(orderId)) return { ok: true, reason: '' };
  return {
    ok: false,
    reason:
      sandboxRefusal('edit', 'order') +
      ' — this order was synced from live Loom, so its lines, adjustments and status ' +
      'cannot be changed here.',
  };
}
