"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { KpiStrip, Badge, Button } from "@/components/ui";
import { Pagination } from "@/components/ui/Pagination";
import { TabBar } from "@/components/ui/TabBar";
import type { KpiItem } from "@/components/ui";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import { formatMoney, formatEpoch, formatCount } from "@/lib/utils";
import type { CustomOrderPreview } from "@/lib/artisanflow-api";
import { isActiveItemStatus } from "@/components/artisanflow/orderStatus";
import { compareByDelay, isOrderOverdue, type OrderDelay } from "./orderDelay";
import { ShoppingBag, Clock, PackageCheck, AlertTriangle, Search, ChevronDown, ChevronRight, ArrowRight, X, NotebookPen } from "lucide-react";
import { CustomOrderInlinePanel } from "./CustomOrderInlinePanel";

const PAGE_SIZE = 20;
const TYPES = ["ALL", "FINISHED", "FABRIC"] as const;

// Live-Weave order-item status enum. "Active" = ACTIVE_ITEM_STATUSES (see orderStatus.ts).
const STATUS_SEGMENTS = ["ALL", "ACTIVE", "PROCESSING", "DISPATCHED", "CANCELLED"] as const;
type StatusSeg = (typeof STATUS_SEGMENTS)[number];
const STATUS_LABEL: Record<StatusSeg, string> = {
  ALL: "All",
  ACTIVE: "Active",
  PROCESSING: "Processing",
  DISPATCHED: "Dispatched",
  CANCELLED: "Cancelled",
};
function matchesStatusSeg(status: string, seg: StatusSeg): boolean {
  const s = (status || "").toUpperCase();
  switch (seg) {
    case "ALL": return true;
    case "ACTIVE": return isActiveItemStatus(s);
    case "PROCESSING": return s === "PROCESSING";
    case "DISPATCHED": return s === "DISPATCHED" || s === "PARTIALLY_DISPATCHED";
    case "CANCELLED": return s === "CANCELLED";
    default: return true;
  }
}

// Most delayed first is the DEFAULT: the whole point of this screen is to lead
// with what is running late. Ties fall back to newest-first (compareByDelay),
// so below the late head the list still reads the way it always did.
const SORTS = ["DELAY", "NEWEST"] as const;
type Sort = (typeof SORTS)[number];
const SORT_LABEL: Record<Sort, string> = { DELAY: "Most delayed", NEWEST: "Newest" };

function pct(n: number, total: number): number {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}
// Progress bar only makes sense for in-flight orders, mirroring the plain Orders list.
function showProgress(o: CustomOrderPreview): boolean {
  return (o.orderStatus || "").toUpperCase() === "PROCESSING";
}

/** A muted separator between clauses of a one-line sentence. Decorative only —
 *  hidden from assistive tech so the sentence is read as a sentence. */
function Dot() {
  return <span aria-hidden="true" style={{ color: "#C4BDB6" }}> · </span>;
}

/**
 * ONE delay sentence — the whole "why is this row here", as a single wrapping
 * line of prose instead of the four separate coloured chips it replaces.
 *
 * The MAGNITUDE is not repeated here: it is the red pill on the identity line,
 * which is also the sort key. This line answers the other half — WHICH thing is
 * late — so the two never restate each other. Clauses, in ranked-cause order:
 *
 *   Late since <b>Measurement QC</b> · 12 steps overdue across 3 jobs · delivery crossed 139d ago
 *
 * Every clause is conditional and no clause ever prints a zero. The bottleneck
 * name is the only bold span, because it is the only thing on the row an
 * operator can go and act on.
 *
 * `notStarted` prints ONLY when nothing is already late. It is an AT-RISK
 * signal, not a lateness one (orderDelay.ts keeps it out of the magnitude for
 * exactly that reason), so once a step has genuinely slipped it is noise on a
 * card whose job is to be quiet.
 *
 * `stepsInspected === false` still means NOT MEASURED, never "nothing is late":
 * such an order simply produces no step clause rather than a reassuring zero.
 *
 * Every number is a plain integer computed on the server (orderDelay.ts); this
 * component does no date math, so nothing here can drift between SSR and
 * hydration.
 */
function DelaySentence({ order, delay }: { order: CustomOrderPreview; delay?: OrderDelay }) {
  if (!delay) return null;
  const { deliveryLateDays, stepLateDays, bottleneck, overdueNodes, overdueJobs, notStarted, stepsInspected } = delay;
  const parts: React.ReactNode[] = [];

  if (stepLateDays > 0) {
    parts.push(
      bottleneck ? (
        <>Late since <strong style={{ color: "#302C28" }}>{bottleneck}</strong></>
      ) : (
        <>Worst step {stepLateDays}d late</>
      ),
    );
  }
  if (overdueNodes > 0) {
    parts.push(
      <>
        {overdueNodes} {overdueNodes === 1 ? "step" : "steps"} overdue
        {overdueJobs > 1 ? ` across ${overdueJobs} jobs` : ""}
      </>,
    );
  }
  if (deliveryLateDays > 0) {
    parts.push(<>delivery crossed {deliveryLateDays}d ago</>);
  }
  if (notStarted && stepLateDays === 0) {
    parts.push(<>should have started {notStarted.name} · {notStarted.days}d ago</>);
  }
  // Loom's daily-synced flag says overdue, but no leaf node is past its own
  // estimate today (typically the late node was completed since the last sync,
  // or it carries no end estimate at all). Say so instead of printing a bare 0
  // that would read as "on time" next to an Overdue pill.
  if (!parts.length && isOrderOverdue(order) && stepsInspected) {
    parts.push(<>Flagged overdue · no step past its date today</>);
  }
  if (!parts.length) return null;

  // Prose, not flex: a long bottleneck name has to WRAP inside the card, never
  // widen it. This is the clause most likely to be long, and page-level
  // horizontal scroll at 390px is the failure mode the old chip row guarded
  // against with truncation — plain wrapping text cannot produce it at all.
  return (
    <div
      className="mt-1.5 break-words text-xs first-letter:uppercase"
      style={{ color: "#635D58" }}
      title={stepLateDays > 0 ? `Worst overdue production step: ${stepLateDays}d past its date` : undefined}
    >
      {parts.map((node, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Dot />}
          {node}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Custom order card — "quiet card, one delay line".
//
//    row 1  WHO first: customer name (largest, serif), then #id, status, and the
//           delay pill that IS the sort key; amount + View pinned right.
//    row 2  the single delay sentence (above).
//    row 3  meta: items · delivery window · production counts · global-note marker.
//    row 4  progress bar, PROCESSING orders only, exactly as before.
//
//    The Wholesale / Fabric / Finished tags moved OFF the collapsed row into the
//    expanded panel: they classify an order, they never tell you to act on it,
//    and a third badge row was most of what made this card noisy.
//
//    A header-button toggle (not a whole-card Link) expands the inline
//    production panel, mirroring OrderBoardClient's OrderCard pattern, since
//    this row needs both "open detail page" and "expand in place" affordances.
function CustomOrderCard({ order, delay }: { order: CustomOrderPreview; delay?: OrderDelay }) {
  const [open, setOpen] = useState(false);
  const lateDays = delay?.lateDays ?? 0;
  const globalNote = (order.globalNote || "").trim();
  // Production counts describe work IN FLIGHT, so they are shown on exactly the
  // orders the progress bar covers. The per-status item counters are not
  // mutually exclusive upstream — a cancelled order still reports its old
  // processing/ready tallies — so printing them unconditionally would have a
  // CANCELLED row claiming "5 in production", which is the same class of lie
  // this change removes from the delay side.
  const counts = showProgress(order)
    ? [
        order.processingItemCount > 0 ? `${order.processingItemCount} in production` : "",
        order.readyItemCount > 0 ? `${order.readyItemCount} ready` : "",
        order.dispatchedItemCount > 0 ? `${order.dispatchedItemCount} shipped` : "",
      ].filter(Boolean).join(", ")
    : "";
  const hasWindow = order.estimatedDeliveryFrom > 0 || order.estimatedDeliveryTo > 0;
  const hasTags = order.loyaltyOrder || order.orderType === "FABRIC" || order.orderType === "FINISHED";

  return (
    <div className="rounded-xl border bg-white transition-shadow hover:shadow-card" style={{ borderColor: "#E8E4DE" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); } }}
        className="block w-full cursor-pointer px-4 py-3 text-left"
      >
        {/* Row 1 — WHO, then which order, then how late */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex-shrink-0" style={{ color: "#AAA39E" }}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <span className="min-w-0 break-words font-serif text-[15px] font-semibold leading-tight" style={{ color: "#1A1714" }}>
            {order.name || "—"}
          </span>
          <span className="text-xs tabular-nums" style={{ color: "#AAA39E" }}>#{order.id}</span>
          <StatusPill status={order.orderStatus} />
          {/* The sort key, stated on the row it ranked — otherwise "most delayed
              first" is an ordering the operator has to take on trust. */}
          {lateDays > 0 && (
            <span title="Worst delay on this order: the later of its promised delivery date and its worst overdue production step"
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}>
              <AlertTriangle className="h-3 w-3" /> {lateDays}d late
            </span>
          )}
          {isOrderOverdue(order) && lateDays === 0 && (
            <span title="Has an overdue production subprocess"
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}>
              <AlertTriangle className="h-3 w-3" /> Overdue
            </span>
          )}
          <span className="ml-auto flex items-center gap-3">
            <span className="text-sm font-semibold tabular-nums" style={{ color: "#1A1714" }}>
              {formatMoney(order.adjustedTotal, order.currency)}
            </span>
            <Link
              href={`/artisanflow/custom-orders/${order.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-stone-100"
              style={{ color: "#A86120" }}
            >
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </span>
        </div>

        {/* Row 2 — what is late, in one sentence */}
        <DelaySentence order={order} delay={delay} />

        {/* Row 3 — meta */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs" style={{ color: "#847D77" }}>
          <span>{formatCount(order.itemCount || 0)} {order.itemCount === 1 ? "item" : "items"}</span>
          {hasWindow && (
            <>
              <Dot />
              <span className="tabular-nums">{formatEpoch(order.estimatedDeliveryFrom)} → {formatEpoch(order.estimatedDeliveryTo)}</span>
            </>
          )}
          {counts && (<><Dot /><span>{counts}</span></>)}
          {/* GLOBAL NOTE MARKER. The internal running commentary staff keep against
              an order ("July 27: 3 kantha stitch fabric is in production stage")
              carries real dispatch commitments that exist nowhere else, and until
              now it rendered ONLY on the detail page — so from the list an order
              carrying one looked identical to one that did not. Amber matches the
              Global note card on the detail view. It is the ORDER's note, never
              the customer's own `note` (a different field, deliberately kept
              apart — see CustomOrderDetailView). The snippet is width-bounded and
              truncated so a long note wraps to its own meta line instead of
              pushing the row into horizontal scroll at 390px; the full text is on
              the title attribute and inside the expanded panel. */}
          {globalNote && (
            <>
              <Dot />
              <span
                className="inline-flex min-w-0 max-w-full items-center gap-1 font-medium"
                style={{ color: "#92400E" }}
                title={globalNote}
              >
                <NotebookPen className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Note · {globalNote.split("\n")[0]}</span>
              </span>
            </>
          )}
        </div>

        {/* Row 4 — progress bar (in-flight orders only, mirrors the Orders list) */}
        {showProgress(order) && (
          <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#F0EDE8" }} aria-hidden="true">
            <span style={{ width: pct(order.processingItemCount, order.itemCount) + "%", background: "#F59E0B" }} />
            <span style={{ width: pct(order.readyItemCount, order.itemCount) + "%", background: "#3B82F6" }} />
            <span style={{ width: pct(order.dispatchedItemCount, order.itemCount) + "%", background: "#10B981" }} />
          </div>
        )}
      </div>

      {open && (
        <div className="border-t px-4" style={{ borderColor: "#F0EDE7", background: "#FDFCFA" }}>
          {/* Classification tags live here now, not on the collapsed row. */}
          {hasTags && (
            <div className="flex flex-wrap items-center gap-1.5 pt-3">
              {order.loyaltyOrder && <Badge variant="green">Wholesale</Badge>}
              {order.orderType === "FABRIC" && <Badge variant="purple">Fabric</Badge>}
              {order.orderType === "FINISHED" && <Badge variant="amber">Finished</Badge>}
            </div>
          )}
          <CustomOrderInlinePanel orderId={order.id} />
        </div>
      )}
    </div>
  );
}

export function CustomOrdersClient({
  orders,
  delays = {},
}: {
  orders: CustomOrderPreview[];
  delays?: Record<number, OrderDelay>;
}) {
  const [type, setType] = useState<(typeof TYPES)[number]>("ALL");
  const [statusSeg, setStatusSeg] = useState<StatusSeg>("ACTIVE");
  const [sort, setSort] = useState<Sort>("DELAY");
  // The Overdue-subprocess entry point. Orthogonal to the status segments (an
  // overdue order can sit in any of them), hence its own flag rather than a
  // sixth segment.
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // isOrderOverdue(), not the raw flag: a cancelled order is void and cannot be
  // late, so it is not counted here, not matched by the filter below, and shows
  // no delay badge on its row (orderDelay.ts -> VOID_ORDER_STATUSES). One rule,
  // read from one place, so the tile and the list cannot disagree.
  const overdueCount = useMemo(() => orders.filter((o) => isOrderOverdue(o)).length, [orders]);

  /**
   * Clicking the Overdue stat must land on a list that RECONCILES to it.
   *
   * The KPI counts isOrderOverdue() over EVERY order, ignoring the status and
   * type chips — so the filter has to key off that same predicate AND clear the
   * other filters, or the page would show "34" on the card and a shorter list
   * below it. (The default Active segment alone hides 10 of the 34: 8
   * partially-dispatched, 2 in-transit. The 7 cancelled orders that used to sit
   * in this set are gone from it entirely — they are void, not overdue.)
   */
  const showOverdueOnly = () => {
    setOverdueOnly(true);
    setStatusSeg("ALL");
    setType("ALL");
    setQuery("");
    setSort("DELAY");
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = orders.filter((o) => {
      // Identical predicate to the KPI's own count — filter and stat cannot drift.
      if (overdueOnly && !isOrderOverdue(o)) return false;
      if (type !== "ALL" && (o.orderType || "").toUpperCase() !== type) return false;
      if (!matchesStatusSeg(o.orderStatus, statusSeg)) return false;
      if (!q) return true;
      return (
        String(o.id).includes(q) ||
        (o.name || "").toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q)
      );
    });
    if (sort === "DELAY") return [...rows].sort((a, b) => compareByDelay(a, b, delays));
    return [...rows].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [orders, delays, type, statusSeg, query, overdueOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const kpis: KpiItem[] = useMemo(() => {
    const processing = orders.filter((o) => (o.orderStatus || "").toUpperCase() === "PROCESSING").length;
    const ready = orders.reduce((s, o) => s + (o.readyItemCount || 0), 0);
    return [
      { label: "Custom orders", value: formatCount(orders.length), icon: <ShoppingBag className="h-4 w-4" /> },
      { label: "Processing", value: formatCount(processing), icon: <Clock className="h-4 w-4" /> },
      { label: "Ready items", value: formatCount(ready), icon: <PackageCheck className="h-4 w-4" /> },
      {
        label: "Overdue subprocess",
        value: formatCount(overdueCount),
        icon: <AlertTriangle className="h-4 w-4" />,
        onClick: showOverdueOnly,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, overdueCount]);

  const statusTabs = STATUS_SEGMENTS.map((seg) => ({ id: seg, label: STATUS_LABEL[seg] }));
  const typeTabs = TYPES.map((t) => ({ id: t, label: t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase() }));
  const sortTabs = SORTS.map((s) => ({ id: s, label: SORT_LABEL[s] }));

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
            Custom Orders
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Made-to-order &amp; custom-fabric orders with their pricing, fulfilment and production state.
          </p>
        </div>
        <Link href="/artisanflow/custom-orders/new">
          <Button variant="primary" size="sm">+ New custom order</Button>
        </Link>
      </div>

      <KpiStrip items={kpis} />

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#AAA39E" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search order #, name or email…"
          aria-label="Search custom orders by ID, name, or email"
          className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
          style={{ borderColor: "#E8E4DE", color: "#302C28" }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TabBar tabs={statusTabs} active={statusSeg} onChange={(id) => { setStatusSeg(id as StatusSeg); setPage(1); }} variant="pill" ariaLabel="Order-item status" />
        <TabBar tabs={typeTabs} active={type} onChange={(id) => { setType(id as (typeof TYPES)[number]); setPage(1); }} variant="pill" ariaLabel="Product type" />
        <TabBar tabs={sortTabs} active={sort} onChange={(id) => { setSort(id as Sort); setPage(1); }} variant="pill" ariaLabel="Sort order" />
        <button
          type="button"
          onClick={() => { if (overdueOnly) { setOverdueOnly(false); setPage(1); } else { showOverdueOnly(); } }}
          aria-pressed={overdueOnly}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
          style={overdueOnly
            ? { background: "#B91C1C", borderColor: "#B91C1C", color: "#FFFFFF" }
            : { background: "#FFFFFF", borderColor: "#E8E4DE", color: "#635D58" }}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Overdue only ({formatCount(overdueCount)})
          {overdueOnly && <X className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="-mt-1 text-xs" style={{ color: "#AAA39E" }}>
        Showing {formatCount(filtered.length)} of {formatCount(orders.length)} custom orders
        {overdueOnly ? " with an overdue subprocess" : ""}
        {sort === "DELAY" ? " · most delayed first" : ""}
      </div>

      <div className="flex flex-col gap-2">
        {pageRows.map((o) => <CustomOrderCard key={o.id} order={o} delay={delays[o.id]} />)}
        {filtered.length === 0 && (
          <div className="rounded-xl border py-16 text-center" style={{ borderColor: "#E8E4DE" }}>
            <Search className="mx-auto h-6 w-6" style={{ color: "#C4BDB6" }} />
            <p className="mt-2 text-sm font-medium" style={{ color: "#302C28" }}>No custom orders match.</p>
          </div>
        )}
        <Pagination page={pageSafe} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
