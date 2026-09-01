/**
 * orderDelay.ts — "how late is this custom order, and WHAT is late about it".
 *
 * The Custom Orders list has to LEAD with what is running late, so it needs a
 * per-order delay MAGNITUDE (a 59-day slip must outrank a 3-day one), not just
 * the boolean `hasOverdueSubProcess` the row badge already shows.
 *
 * PURE + SERVER-ONLY. Every number here is computed on the server against ONE
 * explicit `now` and shipped to the client as a plain number. No component ever
 * calls Date.now(), so server and client cannot disagree and there is no
 * hydration drift — the same reason nodeDelay()/workflowDelaySummary() take an
 * explicit `now`.
 *
 * ── THE DELAY DEFINITION (one model, reused — not a second one) ─────────────
 *
 *   lateDays = max(worst overdue LEAF node across the order's jobs,
 *                  days past the order's promised delivery window)
 *
 * WORST, NOT SUM. Production slips overlap in time: ten tasks sitting behind
 * one stalled dye lot are one 40-day problem, not four hundred days of
 * problems. Summing would rank an order with ten 3-day slips above an order
 * with a single 59-day catastrophe and invert the operational priority, which
 * is the exact opposite of what this list is for. The count of overdue nodes is
 * still carried (`overdueNodes`) and used only as a TIE-BREAK.
 *
 * THE max() IS NOT INVENTED HERE. artisanflow-api's own workflowSchedule()
 * already composes job lateness as `Math.max(windowLate, delay.behindDays)` —
 * the promised end date and the worst behind node, whichever is worse. This
 * lifts that identical rule from job level to ORDER level. Both dimensions are
 * kept separately (`stepLateDays`, `deliveryLateDays`) so the row can say WHICH
 * one is driving the number instead of printing an unexplained total.
 *
 * The per-node verdict itself is NOT re-implemented: workflowDelaySummary()
 * from artisanflow-api is the single authority on which leaf nodes are overdue
 * and by how many days (it already handles the leaf rule — a step's
 * subprocesses if it has any, else the step itself — soft-deleted nodes, and
 * the in-progress `actualStart + estimatedDays` due date). Two disagreeing
 * definitions of "late" on one page would be worse than none.
 *
 * `notStarted` is a DIFFERENT QUESTION, deliberately kept OUT of the magnitude:
 * a node whose planned start has passed but whose planned END has not is at
 * RISK, not yet late, and its own end-date test will catch it the day it
 * crosses. Folding "at risk" into "how late" would make the ranking mean two
 * things at once. It is surfaced as context on the row (Amit's reference reads
 * "should have started · Yarn Weaving") and never as a sort key.
 *
 * ── SCOPE OF THE STEP FETCH, and why it is bounded ─────────────────────────
 *
 * Step-level magnitude needs each job's step tree, which is only available per
 * job (/get/custom-workflow/{id}). So it is fetched ONLY for jobs that are
 * themselves flagged overdue AND belong to an order the KPI counts — which is
 * exactly the set the ranked view ranks. MEASURED on the sandbox 2026-08-17:
 * 34 countable orders (41 carry Loom's overdue flag, minus the 7 that are
 * CANCELLED and therefore void -- see VOID_ORDER_STATUSES) -> 104 job details,
 * ~8 MB, under a second at concurrency 12.
 * Fetching all 901 custom jobs instead would be ~71 MB and ~7 s for rows nobody
 * asked to rank.
 *
 * WHY NOT THE PER-ORDER ROLLUP (/get/custom-order/{id}/workflow-list), which
 * carries step dates in ONE cheap call: it reads relational.workflow_order_
 * summary, a stored snapshot last synced 2026-07-17, and it is materially
 * wrong. Measured across all 41 flagged orders on 2026-08-17, rollup-derived
 * vs live-detail-derived worst-late days matched on only 10 of 41, mean
 * absolute error 18.6 days, max 119 days (order 21000426: rollup 406d vs live
 * 287d; order 132440539: rollup 70d / 49 overdue nodes vs live 24d / 6). The
 * live side also agrees with the daily-synced preview flag the KPI is built on
 * — 6 overdue jobs on 132440539, exactly what the preview reports — while the
 * rollup does not. Ranking "most delayed first" off a source that is 119 days
 * out on its worst row would put the wrong order on top, which is the one
 * failure this feature cannot have.
 */

import {
  getCustomWorkflowDetail,
  getWorkflowListOfType,
  workflowDelaySummary,
  WORKFLOW_STATUSES,
  type CustomOrderPreview,
  type WorkflowInstancePreview,
  type WorkflowStep,
} from "@/lib/artisanflow-api";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Order statuses whose DELIVERY CLOCK has stopped — a dispatched order is not
 *  "late to deliver", whatever its old delivery window says. Mirrors
 *  workflowSchedule(), which stops accruing lateness once the workflow is done.
 *  Says nothing about the order's production steps. */
const SETTLED_ORDER_STATUSES = new Set(["DISPATCHED"]);

/**
 * VOID — the order will never be produced or delivered, so it is not late and
 * CANNOT BECOME late. Strictly stronger than settled: a settled order merely
 * stopped accruing DELIVERY lateness, a void one has no lateness of any kind.
 *
 * This is THE rule, and it is applied in exactly ONE place — the `flagged` set
 * in getCustomOrderDelays() below, which decides whether an order is measured at
 * all — plus the isOrderOverdue() predicate every render site reads instead of
 * the raw `hasOverdueSubProcess` flag. Consequences, all falling out of that one
 * gate rather than being patched per component: no delay chips, no "Nd late"
 * badge, no "Overdue" badge, excluded from the Overdue-only filter and from the
 * OVERDUE SUBPROCESS KPI, and ranked as not-late. The row still carries its
 * CANCELLED pill and still lists under the Cancelled segment — cancelled is the
 * whole story such a row has to tell.
 *
 * CANCELLED ONLY. DISPATCHED IS DELIBERATELY NOT VOID, though it sits in the
 * settled set above. The two are different facts. A cancelled order is VOID: the
 * work was called off, so "287d late" is not a delayed thing, it is a non-thing,
 * and ranking it above live production actively misleads. A DISPATCHED order by
 * contrast actually happened; its delivery clock rightly stops (it shipped), but
 * a production node still flagged overdue AFTER dispatch is a real discrepancy
 * — goods went out against a job nobody closed — and that is worth seeing, not
 * hiding. Measured on the sandbox 2026-08-17 this choice moves zero rows either
 * way (0 of 205 DISPATCHED orders carry the overdue flag), so it is a statement
 * of intent rather than a silent data change.
 *
 * HOW an order becomes CANCELLED: orderStatus is a backend roll-up that returns
 * CANCELLED if ANY line is cancelled (see customOrderRollupStatus). All 36
 * cancelled custom orders on the sandbox today are FULLY cancelled
 * (cancelledItemCount === itemCount), so nothing live loses its delay signal.
 * Keying off the same status the row's pill shows is the point: a row that reads
 * CANCELLED must not also read "287d late", which is the contradiction this
 * removes.
 */
const VOID_ORDER_STATUSES = new Set(["CANCELLED"]);

// Void implies settled — enforced structurally rather than by eye, so the
// delivery dimension is zeroed for every void status automatically and the two
// rules cannot drift apart if a status is ever added above.
for (const st of VOID_ORDER_STATUSES) SETTLED_ORDER_STATUSES.add(st);

/** The minimum an order row has to carry for the lateness rules to judge it. */
type OrderLatenessInput = { orderStatus?: string; hasOverdueSubProcess?: boolean };

/** True when the order is void — cancelled — and therefore cannot be late. */
export function isOrderVoid(o: OrderLatenessInput): boolean {
  return VOID_ORDER_STATUSES.has((o.orderStatus || "").toUpperCase());
}

/**
 * THE overdue predicate for this screen. Every consumer — the KPI tile, the
 * "Overdue only" filter, the row badge, the delay line's fallback chip — reads
 * this instead of `hasOverdueSubProcess` directly, so "is this order overdue?"
 * has exactly one answer on the page. A pure function of the preview ROW, not of
 * the delay map, so it keeps working unchanged when the ranking degrades to an
 * empty map on a wrapper outage.
 */
export function isOrderOverdue(o: OrderLatenessInput): boolean {
  return !!o.hasOverdueSubProcess && !isOrderVoid(o);
}

export interface OrderDelay {
  /** THE SORT KEY. max(stepLateDays, deliveryLateDays). 0 = not late. */
  lateDays: number;
  /** Worst overdue leaf node across this order's flagged jobs, in days. */
  stepLateDays: number;
  /** Name of that node, e.g. "Washing › QC Fabric". Undefined when none. */
  bottleneck?: string;
  /** How many leaf nodes are overdue right now across this order's jobs. */
  overdueNodes: number;
  /** How many of this order's jobs carry at least one overdue node. */
  overdueJobs: number;
  /** Days past the customer-promised delivery window (0 = within, or settled). */
  deliveryLateDays: number;
  /** A leaf node whose planned START has passed with no actual start. Context only. */
  notStarted?: { name: string; days: number };
  /**
   * true = we actually read this order's job step trees. false = we did not
   * (the order is not one the Overdue KPI counts), so stepLateDays being 0
   * means "not measured", NOT "nothing is late". The row must never print an
   * unmeasured 0 as if it were a measured one.
   */
  stepsInspected: boolean;
}

export interface CustomOrderDelayMap {
  /** The ONE instant every number in byOrder was measured against. */
  now: number;
  byOrder: Record<number, OrderDelay>;
  /** How many job step trees were read. Diagnostics for the server log. */
  jobsInspected: number;
}

/** Local 5-line concurrency limiter. artisanflow-api has one but does not export
 *  it, and this module deliberately keeps its footprint in that shared file to
 *  a single new export (getWorkflowListOfType). */
async function mapLimit<A, B>(items: A[], limit: number, fn: (a: A) => Promise<B>): Promise<B[]> {
  const out: B[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

/**
 * Walk the SAME leaf nodes workflowDelaySummary() judges — a step's
 * subprocesses if it has any, else the step itself, skipping soft-deleted —
 * looking only for the "planned start has passed, nothing actually started"
 * signal, which that helper does not model (it judges END dates).
 *
 * This is a second WALK, never a second VERDICT: it answers a different
 * question and does not touch overdue/behindDays, which stay solely
 * workflowDelaySummary()'s to decide.
 */
function worstNotStarted(steps: WorkflowStep[], now: number): { name: string; days: number } | undefined {
  let best: { name: string; days: number } | undefined;
  const consider = (
    node: { status?: string; estimatedStartDate?: number; actualStartDate?: number },
    name: string,
  ) => {
    const st = (node.status || "").toUpperCase();
    if (st === "COMPLETED" || st === "IN_PROGRESS") return;
    if (node.actualStartDate && node.actualStartDate > 0) return;
    const plannedStart = node.estimatedStartDate && node.estimatedStartDate > 0 ? node.estimatedStartDate : 0;
    if (!plannedStart || now <= plannedStart) return;
    const days = Math.max(1, Math.floor((now - plannedStart) / DAY_MS));
    if (!best || days > best.days) best = { name, days };
  };
  for (const s of (steps || []).filter((x) => !x.deleted)) {
    const subs = (s.subProcesses || []).filter((x) => !x.deleted);
    if (subs.length === 0) consider(s, s.name || "Step");
    else for (const sp of subs) consider(sp, `${s.name || "Step"} › ${sp.name || "Subprocess"}`);
  }
  return best;
}

/** Days the order is past the LATE end of its promised delivery window. */
function deliveryOverrun(o: CustomOrderPreview, now: number): number {
  if (SETTLED_ORDER_STATUSES.has((o.orderStatus || "").toUpperCase())) return 0;
  const due = o.estimatedDeliveryTo && o.estimatedDeliveryTo > 0 ? o.estimatedDeliveryTo : 0;
  if (!due || now <= due) return 0;
  return Math.max(1, Math.floor((now - due) / DAY_MS));
}

/**
 * In-process cache, 60 s — the same TTL and the same reason as artisanflow-api's
 * BOARD_TTL_MS: repeat navigation and paging through this list should not re-read
 * 111 job detail documents. Safe by construction rather than by luck: lateness is
 * measured in DAYS, so a snapshot at most 60 s old cannot round to a different
 * number, and a cold start simply recomputes — nothing here is a correctness
 * dependency on the cache surviving.
 */
const DELAY_TTL_MS = 60 * 1000;
let _delayCache: { at: number; data: CustomOrderDelayMap } | null = null;

/**
 * Build the per-order delay map for the Custom Orders list.
 *
 * `orders` is the FULL list the page renders; the delivery dimension is filled
 * in for every one of them (it is free — the field is already on the preview),
 * while the step dimension is measured only for the orders the Overdue KPI
 * counts (see the header note on scope).
 */
export async function getCustomOrderDelays(
  orders: CustomOrderPreview[],
  token?: string,
): Promise<CustomOrderDelayMap> {
  if (_delayCache && Date.now() - _delayCache.at < DELAY_TTL_MS) return _delayCache.data;

  const now = Date.now();
  const byOrder: Record<number, OrderDelay> = {};
  for (const o of orders) {
    const deliveryLateDays = deliveryOverrun(o, now);
    byOrder[o.id] = {
      lateDays: deliveryLateDays,
      stepLateDays: 0,
      overdueNodes: 0,
      overdueJobs: 0,
      deliveryLateDays,
      stepsInspected: false,
    };
  }

  // The KPI's own set, verbatim: the filter and the ranking must cover exactly
  // the orders the number on the card counts.
  // isOrderOverdue() — not the raw flag — is the SINGLE GATE where voidness is
  // applied: a cancelled order never enters this set, so its step trees are never
  // read, stepLateDays stays 0, lateDays stays 0 and compareByDelay ranks it as
  // not-late. No downstream site has to remember to exclude it again.
  const flagged = new Set(orders.filter((o) => isOrderOverdue(o)).map((o) => o.id));

  // 4 list GETs for all 901 custom jobs. WORKFLOW_STATUSES (not the ACTIVE
  // subset): a COMPLETED job that finished late still belongs to the order's
  // history, and excluding it would silently drop jobs from an order's count.
  let previews: WorkflowInstancePreview[] = [];
  try {
    const lists = await Promise.all(
      WORKFLOW_STATUSES.map((st) => getWorkflowListOfType("CUSTOM_ORDER", st, token)),
    );
    const seen = new Set<number>();
    for (const w of lists.flat()) {
      // Dedupe on id alone is safe here and only here: every row is already
      // filtered to workflowType CUSTOM_ORDER, so the two overlapping id
      // sequences that force (type,id) keys elsewhere cannot collide.
      if (seen.has(w.id)) continue;
      seen.add(w.id);
      previews.push(w);
    }
  } catch {
    // Supplementary data. A wrapper hiccup costs the ranking, never the list:
    // every order still renders, just without a measured step delay.
    previews = [];
  }

  const candidates = previews.filter((p) => p.hasOverdueSubProcess && flagged.has(p.orderId));
  const details = await mapLimit(candidates, 12, (p) => getCustomWorkflowDetail(p.id, token));

  for (let i = 0; i < candidates.length; i++) {
    const orderId = candidates[i].orderId;
    const row = byOrder[orderId];
    // A job can point at an order outside the rendered list; nothing to fill in.
    if (!row) continue;
    row.stepsInspected = true;
    const steps = details[i]?.steps;
    if (!steps || steps.length === 0) continue;

    const summary = workflowDelaySummary(steps, now);
    if (summary.overdueCount > 0) {
      row.overdueJobs += 1;
      row.overdueNodes += summary.overdueCount;
      if (summary.behindDays > row.stepLateDays) {
        row.stepLateDays = summary.behindDays;
        row.bottleneck = summary.bottleneck;
      }
    }
    const ns = worstNotStarted(steps, now);
    if (ns && (!row.notStarted || ns.days > row.notStarted.days)) row.notStarted = ns;
  }

  for (const row of Object.values(byOrder)) {
    row.lateDays = Math.max(row.stepLateDays, row.deliveryLateDays);
  }

  const data: CustomOrderDelayMap = { now, byOrder, jobsInspected: candidates.length };
  _delayCache = { at: Date.now(), data };
  return data;
}

/**
 * Rank comparator — most delayed first.
 *
 * Ties (which includes every not-late order, all sitting at 0) fall back to the
 * list's natural newest-first order, so the bottom of the page still reads the
 * way it always did and only the late head is reordered.
 */
export function compareByDelay(
  a: CustomOrderPreview,
  b: CustomOrderPreview,
  byOrder: Record<number, OrderDelay>,
): number {
  const da = byOrder[a.id];
  const db = byOrder[b.id];
  const la = da?.lateDays ?? 0;
  const lb = db?.lateDays ?? 0;
  if (la !== lb) return lb - la;
  const na = da?.overdueNodes ?? 0;
  const nb = db?.overdueNodes ?? 0;
  if (na !== nb) return nb - na;
  return (b.createdAt || 0) - (a.createdAt || 0);
}
