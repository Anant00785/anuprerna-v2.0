/**
 * order-production-watch.ts -- the per-SKU production model behind the Order
 * Watch view on the order surface.
 *
 * PURE. No fetching, no React: the caller (server component or the inline-expand
 * API route) hands in the four reads it already makes, this assembles the one
 * shape the view renders. That keeps the join -- which source wins on which
 * field -- in one testable place instead of smeared across two components.
 *
 * THE JOIN, and why each side wins what it wins (measured 2026-08-16 on the
 * sandbox, order 132440539 / Raj Vardhan):
 *
 *   order items            -> the SPINE. One row per SKU on the order, so a SKU
 *                             with no job yet is still visible as an exception
 *                             ("not started") instead of silently absent.
 *   ready / fulfilment      -> Ready and Dispatched quantities. These come from
 *     lists                   the typed relational.custom_order_item_ready /
 *                             _fulfillment rows the order page already reads;
 *                             the workflow rollup carries its own copies but
 *                             they are a month stale.
 *   workflow rollup         -> orderItemId (the ONLY source that links a job to
 *     (/workflow-list)        a line), and the stage tree the chips render.
 *   workflow previews       -> status, hasOverdueSubProcess, hasAssignedArtisan,
 *     (/custom-workflow-      productName. Synced daily, and it DISAGREES with
 *      list)                  the rollup: on 132440539 the rollup says 2 jobs
 *                             COMPLETED / 9 overdue where the fresh preview says
 *                             4 / 6. The fresh side wins every field it owns.
 *
 * ORDER-LEVEL COUNTS are computed over the PREVIEWS, not over the rows: the
 * previews are the complete, fresh set of that order's jobs, so "4 of 24 done,
 * 6 overdue, 2 unassigned" cannot drift if the stale rollup ever drops a line.
 */

import {
  customItemName,
  customItemSku,
  customItemImage,
  customItemProductId,
  readyQty,
  fulfilledQty,
  type OrderWorkflowSummary,
  type WorkflowInstancePreview,
  type CustomOrderDetail,
  type CustomOrderReady,
  type CustomOrderFulfillment,
} from "@/lib/artisanflow-api";
import { isActiveItemStatus } from "@/components/artisanflow/orderStatus";
import { computeWorkflowProgress, orderedStages, type WorkflowProgress } from "@/lib/workflow-progress";

/**
 * ONE ready or dispatch event against ONE order line -- a single partial
 * shipment, not a running total. The row leads with ordered-vs-ready; this is
 * the secondary detail behind it, so "50 METER now, 50 METER a week later"
 * reads as the sequence it actually was instead of collapsing to "100".
 */
export interface FulfilmentEvent {
  /** Parent custom_order_ready / _fulfillment id -- what staff quote on a query. */
  recordId: number;
  quantity: number;
  unit: string;
  /**
   * Epoch MILLISECONDS, or null when the backend has no date at all.
   * receivedDate / dispatchedOn when set, else the row's own created_at
   * (relational.custom_order_item_*.created_at is also epoch ms).
   */
  at: number | null;
  note?: string;
  /** Dispatch-only shipment metadata; absent on ready events. */
  shippingCode?: string;
  trackingUrl?: string;
  zohoPackageId?: string;
}

/** One order line, already normalised by the caller (custom or standard order). */
export interface ProductionWatchItem {
  orderItemId: number;
  sku: string;
  name: string;
  unit: string;
  orderedQuantity: number;
  readyQuantity: number;
  dispatchedQuantity: number;
  itemStatus: string;
  image?: string;
  /** Line price + its currency, folded in from the old Items card. */
  price?: number;
  currency?: string;
  /** Catalogue product id, carried into the per-item Start-production trigger. */
  productId?: number;
  /** Newest first. readyQuantity / dispatchedQuantity are their sums. */
  readyEvents: FulfilmentEvent[];
  dispatchEvents: FulfilmentEvent[];
}

export interface ProductionWatchStage {
  name: string;
  status: string;
}

export interface ProductionWatchRow extends ProductionWatchItem {
  workflowId: number | null;
  workflowName: string | null;
  /** FRESH preview status when known, else the rollup's. */
  workflowStatus: string | null;
  overdue: boolean;
  /** null = no job yet, so "unassigned" would be a lie rather than a flag. */
  assigned: boolean | null;
  progress: WorkflowProgress | null;
  stages: ProductionWatchStage[];
  /**
   * The job's free-text NOTE — a dated dispatch commitment staff type against
   * the workflow ("Aug 13 : Mariam will dispatch the Kantha fabric within 4-5
   * days"). Added 2026-08-16: the audit found we rendered ZERO notes page-wide
   * while live shows them against the line, and this is information that exists
   * NOWHERE else in the system — losing it is worse than any layout bug.
   *
   * It hangs off the WORKFLOW, not the order item (live grafts it on the same
   * way: `item.processAssociated = workflowList.find(w => w.orderItemId ===
   * item.id)`, then renders `processAssociated.note`). So it belongs on the ROW,
   * which is the item⋈workflow join, not on ProductionWatchItem.
   *
   * SOURCE + ITS KNOWN LAG: this is the rollup's copy (the same source live
   * reads). On the sandbox the rollup snapshot can trail the job's own note —
   * measured 2026-08-16 on workflow 133064862, where the rollup still carried
   * "7th JULY WILL TAKE 7 MORE DAYS" while /get/workflow/133064862 already had
   * the 13 Aug Mariam note. Reading the fresh copy would cost a 1.9 MB detail
   * fetch PER JOB (~46 MB for this order's 24 jobs, measured), so the view reads
   * the rollup and DISCLOSES the lag instead of paying that or hiding it. Every
   * note is self-dated in its own text, which is what makes the disclosure
   * actionable rather than decorative.
   */
  note: string | null;
}

export interface OrderProductionWatch {
  rows: ProductionWatchRow[];
  /** Jobs on this order (fresh preview list). */
  workflowsTotal: number;
  workflowsDone: number;
  /** Share of this order's jobs COMPLETED, 0-100. */
  productionPct: number;
  /** ── the exceptions, which is what this view exists to surface ── */
  overdueCount: number;
  unassignedCount: number;
  /** Active order lines carrying no job at all. */
  notStartedCount: number;
  orderedQty: number;
  readyQty: number;
  dispatchedQty: number;
  /** Any exception at all -- the one flag the list row keys its accent off. */
  needsAttention: boolean;
  /**
   * Newest READY and newest DISPATCH event date on this order, epoch ms
   * (null = none ever recorded). Reported SEPARATELY, and that separation is
   * the whole point: the two upstream syncs drift independently. Measured on
   * the sandbox 2026-08-16, order 132440539 -- ready had caught up to
   * 2026-08-13 while dispatch still ended at 2026-07-13, so a single combined
   * watermark would have read "13 Aug" and quietly implied that a month-old
   * Dispatched number was current. The page must never let a stale figure
   * pass for today's.
   */
  lastReadyAt: number | null;
  lastDispatchAt: number | null;
}

function stagesOf(w: OrderWorkflowSummary): ProductionWatchStage[] {
  // Chain order, not rollup order — the chips are read left-to-right as the run.
  return orderedStages(w).map((s) => ({ name: (s.stepName || "").trim() || "—", status: (s.stepStatus || "").toUpperCase() }));
}

export function buildOrderProductionWatch(input: {
  items: ProductionWatchItem[];
  workflows: OrderWorkflowSummary[];
  previews: WorkflowInstancePreview[];
  /** Order-item statuses that can still carry work (isActiveItemStatus). */
  isActiveItemStatus: (status: string) => boolean;
}): OrderProductionWatch {
  const { items, workflows, previews, isActiveItemStatus } = input;
  const previewById = new Map<number, WorkflowInstancePreview>();
  for (const p of previews) previewById.set(p.id, p);

  const usedWorkflowIds = new Set<number>();
  const rows: ProductionWatchRow[] = items.map((item) => {
    const w = workflows.find((x) => x.orderItemId === item.orderItemId);
    if (!w) {
      return {
        ...item,
        workflowId: null,
        workflowName: null,
        workflowStatus: null,
        overdue: false,
        assigned: null,
        progress: null,
        stages: [],
        // No job => no job note. Distinct from a job that simply has none.
        note: null,
      };
    }
    usedWorkflowIds.add(w.workflowId);
    const p = previewById.get(w.workflowId);
    return {
      ...item,
      // productName is preview-only; the order line's own name is the fallback.
      name: p?.productName || item.name,
      sku: item.sku || w.productSku || p?.productSku || "",
      workflowId: w.workflowId,
      workflowName: w.workflowName,
      workflowStatus: (p?.status || w.status || "").toUpperCase() || null,
      overdue: p ? !!p.hasOverdueSubProcess : !!w.hasOverdueSubProcess,
      assigned: p ? !!p.hasAssignedArtisan : null,
      progress: computeWorkflowProgress(w),
      stages: stagesOf(w),
      // Rollup-only field: the fresh preview list does not carry `note` at all,
      // so unlike status/overdue there is no fresher side to prefer here.
      note: (w.note || "").trim() || null,
    };
  });

  // Defensive: a job the fresh preview list knows about but the stale rollup
  // has no orderItemId for would otherwise be counted in the header and absent
  // from the table -- the exact contradiction this view must never show. On
  // today's data this is empty (24 previews, 24 rollup rows, 24 items).
  for (const p of previews) {
    if (usedWorkflowIds.has(p.id)) continue;
    const w = workflows.find((x) => x.workflowId === p.id);
    rows.push({
      orderItemId: w?.orderItemId ?? 0,
      sku: p.productSku || "",
      name: p.productName || "—",
      unit: w?.orderItemUnit || "",
      orderedQuantity: 0,
      readyQuantity: 0,
      dispatchedQuantity: 0,
      itemStatus: w?.orderItemStatus || "",
      productId: undefined,
      readyEvents: [],
      dispatchEvents: [],
      workflowId: p.id,
      workflowName: p.name,
      workflowStatus: (p.status || "").toUpperCase(),
      overdue: !!p.hasOverdueSubProcess,
      assigned: !!p.hasAssignedArtisan,
      progress: w ? computeWorkflowProgress(w) : null,
      stages: w ? stagesOf(w) : [],
      note: (w?.note || "").trim() || null,
    });
  }

  const workflowsTotal = previews.length;
  const workflowsDone = previews.filter((p) => (p.status || "").toUpperCase() === "COMPLETED").length;
  const overdueCount = previews.filter((p) => p.hasOverdueSubProcess).length;
  const unassignedCount = previews.filter((p) => !p.hasAssignedArtisan).length;
  const notStartedCount = rows.filter((r) => r.workflowId == null && isActiveItemStatus(r.itemStatus)).length;

  const sum = (f: (r: ProductionWatchRow) => number) => rows.reduce((s, r) => s + (f(r) || 0), 0);

  const newestOf = (pick: (r: ProductionWatchRow) => FulfilmentEvent[]): number | null => {
    const dates = rows
      .flatMap((r) => pick(r) || [])
      .map((e) => e.at)
      .filter((d): d is number => typeof d === "number" && d > 0);
    return dates.length ? Math.max(...dates) : null;
  };

  return {
    rows,
    workflowsTotal,
    workflowsDone,
    productionPct: workflowsTotal ? Math.round((workflowsDone / workflowsTotal) * 100) : 0,
    overdueCount,
    unassignedCount,
    notStartedCount,
    orderedQty: sum((r) => r.orderedQuantity),
    readyQty: sum((r) => r.readyQuantity),
    dispatchedQty: sum((r) => r.dispatchedQuantity),
    needsAttention: overdueCount > 0 || unassignedCount > 0 || notStartedCount > 0,
    lastReadyAt: newestOf((r) => r.readyEvents),
    lastDispatchAt: newestOf((r) => r.dispatchEvents),
  };
}

/**
 * Exceptions first, then least-progressed. "What needs me" is the entry point
 * Amit asked for, so the table cannot open in id order and make him hunt.
 */
export function sortByAttention(rows: ProductionWatchRow[]): ProductionWatchRow[] {
  const rank = (r: ProductionWatchRow): number => {
    if (r.overdue) return 0;
    if (r.assigned === false) return 1;
    if (r.workflowId == null) return 2;
    return 3;
  };
  return [...rows].sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return (a.progress?.pct ?? 0) - (b.progress?.pct ?? 0);
  });
}

// ── Custom-order adapter ────────────────────────────────────────────────────
// ONE place that turns a CustomOrderDetail + its ready/fulfilment lists into
// watch rows, so the server-rendered detail page and the lazily-fetched inline
// expand cannot drift into showing different quantities for the same order.

/**
 * Explode the order-level ready / fulfilment records into PER-LINE events.
 *
 * Both backends nest the same way -- one parent record (a ready receipt or a
 * shipment) carrying a list of {customOrderItemId, quantity, unit} lines -- so
 * one generic walker serves both. The parent owns the date and the shipment
 * metadata; the child owns the quantity. Sorted newest first because the
 * question being asked is "what went out last", not "what went out first".
 */
function eventsForItem<P extends { id: number; note?: string; createdAt?: number }, C extends { customOrderItemId: number; quantity: number; unit: string; createdAt?: number }>(
  itemId: number,
  records: P[],
  childrenOf: (p: P) => C[] | undefined,
  dateOf: (p: P) => number | undefined,
  metaOf?: (p: P) => Partial<FulfilmentEvent>,
): FulfilmentEvent[] {
  const out: FulfilmentEvent[] = [];
  for (const rec of records || []) {
    for (const child of childrenOf(rec) || []) {
      if (child.customOrderItemId !== itemId) continue;
      out.push({
        recordId: rec.id,
        quantity: child.quantity,
        unit: child.unit,
        // Parent business date wins; child/parent created_at is the fallback so
        // an event is never rendered dateless just because the date column is
        // unfilled. All three are epoch MILLISECONDS.
        at: dateOf(rec) || rec.createdAt || child.createdAt || null,
        note: rec.note || undefined,
        ...(metaOf ? metaOf(rec) : {}),
      });
    }
  }
  return out.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

export function buildCustomOrderProductionWatch(args: {
  order: CustomOrderDetail;
  readies: CustomOrderReady[];
  fulfillments: CustomOrderFulfillment[];
  workflows: OrderWorkflowSummary[];
  previews: WorkflowInstancePreview[];
}): OrderProductionWatch {
  const { order, readies, fulfillments, workflows, previews } = args;
  const items: ProductionWatchItem[] = (order.orderItems || []).map((it) => {
    const pid = customItemProductId(it);
    return {
      orderItemId: it.id,
      sku: customItemSku(it) || "",
      name: customItemName(it),
      unit: it.unit,
      orderedQuantity: it.quantity,
      // Ready / Dispatched come from the typed ready + fulfilment rows, NOT the
      // month-stale copies on the workflow rollup.
      readyQuantity: readyQty(it.id, readies),
      dispatchedQuantity: fulfilledQty(it.id, fulfillments),
      itemStatus: it.orderStatus,
      image: customItemImage(it) || undefined,
      price: it.price,
      currency: it.currency || order.currency,
      productId: pid ? Number(pid) : undefined,
      // The same rows the two totals above are summed from, kept individually
      // so a partial shipment reads as a sequence of dated events.
      readyEvents: eventsForItem(it.id, readies, (r) => r.customOrderItemReadyList, (r) => r.receivedDate),
      dispatchEvents: eventsForItem(
        it.id,
        fulfillments,
        (f) => f.customOrderItemFulfillmentList,
        (f) => f.dispatchedOn,
        (f) => ({ shippingCode: f.shippingCode, trackingUrl: f.trackingUrl, zohoPackageId: f.zohoPackageId }),
      ),
    };
  });
  return buildOrderProductionWatch({ items, workflows, previews, isActiveItemStatus });
}
