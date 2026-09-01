/**
 * Shared order-item status helpers for ArtisanFlow.
 *
 * "Active" = the working set an operator can still act on (start production,
 * count as in-progress). Single source of truth so the custom-orders list and
 * the order-detail view agree on what counts as active.
 */

/** Order-item statuses that are still "active" (workable). */
export const ACTIVE_ITEM_STATUSES = ["INITIATED", "PROCESSING"] as const;

/** True if an (already upper-cased or raw) status is an active item status. */
export function isActiveItemStatus(status: string | null | undefined): boolean {
  return (ACTIVE_ITEM_STATUSES as readonly string[]).includes((status || "").toUpperCase());
}

// ── Canonical status vocabularies + badge styling ───────────────────────────
// Source of truth = live Loom enums (order-status.ts / payment-status.ts).
// Kept here so the orders list and order-detail view share ONE styling map
// (no divergent, invented literals). The enum-lint harness gate scans the
// variant helpers below against the live union.

/** Canonical Loom OrderStatus literals. */
export const ORDER_STATUS_VALUES = [
  "INITIATED", "PROCESSING", "CANCELLED", "IN_TRANSIT",
  "PARTIALLY_DISPATCHED", "DISPATCHED", "DELIVERED", "FAILED",
] as const;

/** Canonical Loom PaymentStatus literals. */
export const PAYMENT_STATUS_VALUES = ["PENDING", "PREPAID", "PAID", "FAILED"] as const;

/** Badge palette shared by the orders list + detail views. */
export type BadgeVariant = "green" | "amber" | "red" | "blue" | "stone" | "purple";

/** Badge colour for an OrderStatus. INITIATED / unknown fall through to neutral. */
export function orderStatusVariant(status: string | null | undefined): BadgeVariant {
  switch ((status || "").toUpperCase()) {
    case "DELIVERED":
    case "DISPATCHED":
      return "green";
    case "CANCELLED":
    case "FAILED":
      return "red";
    case "IN_TRANSIT":
      return "blue";
    case "PARTIALLY_DISPATCHED":
      return "purple";
    case "PROCESSING":
      return "amber";
    default:
      return "stone"; // INITIATED / unrecognised
  }
}

/** Badge colour for a PaymentStatus. */
export function paymentStatusVariant(status: string | null | undefined): BadgeVariant {
  switch ((status || "").toUpperCase()) {
    case "PAID":
      return "green";
    case "PREPAID":
      return "blue";
    case "FAILED":
      return "red";
    case "PENDING":
      return "amber";
    default:
      return "stone";
  }
}

// ── ORDER-LEVEL status for a custom order ───────────────────────────────────
//
// WHY THIS EXISTS. The list showed order 132440539 as IN TRANSIT while its detail
// header showed PROCESSING — two screens stating different facts about one order.
// The list is right: `orderStatus` on a list row is computed by the BACKEND across
// every line of the order (OrdersRepository.superUserCustomOrderPreviews). The
// single-order endpoint carries no order-level status at all, so the detail view
// fell back to `orderItems[0].orderStatus` — the FIRST LINE, which on 132440539 is
// one of 22 PROCESSING lines while two later lines are IN_TRANSIT with tracking
// URLs. A first-line fallback is silently wrong whenever the lines disagree, which
// is exactly when an operator most needs the header to be right.
//
// AUTHORITATIVE SOURCE = the backend's own roll-up over ALL lines. It is ported
// here verbatim rather than approximated, and the detail view calls it, so the two
// screens agree BY CONSTRUCTION instead of by coincidence. Porting beats fetching
// the list row (no second request, no pagination window to fall out of) and beats
// changing the endpoint (no backend change, no consumer-shape risk). The inputs it
// needs — `orderStatus` and `trackingUrl` per line — are already on the detail
// payload's orderItems.
//
// The ladder, from orders.repository.ts (custom-order variant):
//
//   cancelled_count  > 0                 -> CANCELLED
//   failed_count     > 0                 -> FAILED     (orderStatus IN INITIATED, FAILED)
//   partial_count    > 0                 -> PARTIALLY_DISPATCHED
//   untracked_count == item_count        -> PROCESSING
//   dispatched_count == item_count       -> DISPATCHED
//   otherwise                            -> IN_TRANSIT
//
// Note `failed_count` folds INITIATED in with FAILED on the CUSTOM variant (the
// standard-order query counts only FAILED). That asymmetry is the backend's, and
// it is reproduced rather than tidied — the point is to MATCH the list, not to
// improve on it. A line's dispatched-ness is judged by a non-empty trackingUrl,
// again exactly as the SQL does, not by its status string.

/** One line of a custom order, as much of it as the roll-up reads. */
export interface RollupLine {
  orderStatus?: string;
  trackingUrl?: string;
}

/**
 * The ORDER-level status, rolled up from every line — the same value the list
 * shows. Returns null for an order with no lines, so the caller can choose its own
 * empty-order wording rather than being handed a status that was never computed.
 */
export function customOrderRollupStatus(items: RollupLine[]): string | null {
  const lines = items || [];
  if (lines.length === 0) return null;
  const st = (l: RollupLine) => (l.orderStatus || "").toUpperCase();
  const tracked = (l: RollupLine) => (l.trackingUrl || "").trim() !== "";

  if (lines.some((l) => st(l) === "CANCELLED")) return "CANCELLED";
  if (lines.some((l) => st(l) === "INITIATED" || st(l) === "FAILED")) return "FAILED";
  if (lines.some((l) => st(l) === "PARTIALLY_DISPATCHED")) return "PARTIALLY_DISPATCHED";
  if (lines.every((l) => !tracked(l))) return "PROCESSING";
  if (lines.every((l) => tracked(l))) return "DISPATCHED";
  return "IN_TRANSIT";
}
