/**
 * OrderProductionWatch -- the ONE per-SKU view for an order's lines.
 *
 * This is the Order Watch surface Amit was running in a second app
 * (/ops/order-watch there) brought into Weave, so production for an order is
 * read where the order is read. It renders in two places off the SAME model
 * (buildOrderProductionWatch): the custom-order detail page and the
 * custom-orders list inline expand.
 *
 * ONE TABLE, ONE PLACE (2026-08-16). The detail page used to render this card
 * AND a full "Items" card underneath it, and the Items card repeated every
 * line's workflow progress a second time ("2/8 subprocesses - 38% - Yarn
 * Weaving - View production"). Amit: "two views are not needed... the first
 * view is more than enough... how much is ready, how much is ordered." So the
 * Items card is gone and the four things only it carried -- the product IMAGE,
 * the line PRICE, per-line EDIT/DELETE and ADD ITEM -- are folded in here.
 * The write widgets arrive as slots (headerAction / renderRowActions) rather
 * than imports, so this component stays read-only and server-renderable and the
 * read-only list expand simply passes neither.
 *
 * ATTENTION-FIRST, deliberately. Amit's brief: the useful entry point is "what
 * needs me", not a list to browse. So the exceptions -- overdue jobs,
 * unassigned jobs, SKUs with no job at all -- are the first thing in the card,
 * rendered as loud counters above the numbers, the table opens sorted with
 * those rows on top (sortByAttention), and every exception row carries a
 * coloured left edge. The tidy stats sit underneath.
 *
 * READY / DISPATCH HISTORY is secondary ON PURPOSE. The row leads with ordered
 * vs ready, which is the number Amit says he cares about most; the sequence of
 * dated partial shipments behind that number lives in a collapsed <details>
 * under the row. Native disclosure, no client state -- so this file needs no
 * "use client", the markup is in the server HTML whether or not it is open,
 * and the same row works in the client-side list expand unchanged.
 *
 * NOT INCLUDED, on purpose (Amit named these as out of scope for Weave): notes
 * / global note, Invoiced (Zoho -- Weave has no Zoho connection), Create
 * Passport, and the Priority / Passport-ready filters. A column that could only
 * ever be blank is worse than no column.
 */

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, UserX, PlayCircle, Package, ChevronRight, PackageCheck, Truck, StickyNote } from "lucide-react";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import { StartProductionDialog } from "@/components/artisanflow/StartProductionDialog";
import { isActiveItemStatus } from "@/components/artisanflow/orderStatus";
import { sortByAttention, type OrderProductionWatch as WatchModel, type ProductionWatchRow, type FulfilmentEvent } from "@/lib/order-production-watch";
import { formatCount, formatEpoch, formatMoney } from "@/lib/utils";

/** Columns in the table below -- the history row spans all of them. */
const COL_COUNT = 9;

/** Older than this and the "last recorded" line turns into a stale warning. */
const STALE_AFTER_DAYS = 14;

function fmtQty(n: number, unit: string): string {
  const dec = (unit || "").toUpperCase() === "UNIT" ? 0 : 2;
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n || 0);
}

const STAGE_TONE: Record<string, { bg: string; fg: string }> = {
  COMPLETED: { bg: "#ECFDF5", fg: "#047857" },
  IN_PROGRESS: { bg: "#EFF6FF", fg: "#1D4ED8" },
  HALTED: { bg: "#FEF2F2", fg: "#B91C1C" },
  PENDING: { bg: "#F5F5F4", fg: "#78716C" },
};

function StageChip({ name, status }: { name: string; status: string }) {
  const tone = STAGE_TONE[status] ?? STAGE_TONE.PENDING;
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: tone.bg, color: tone.fg }}
      title={`${name} — ${status.replace(/_/g, " ").toLowerCase()}`}
    >
      <span className="h-1 w-1 rounded-full" style={{ background: tone.fg }} />
      {name}
    </span>
  );
}

/** The loud counter. Zero renders as a quiet "all clear" chip, never a red 0. */
function ExceptionCounter({
  n,
  label,
  icon,
  fg,
  bg,
}: {
  n: number;
  label: string;
  icon: React.ReactNode;
  fg: string;
  bg: string;
}) {
  const on = n > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${on ? "text-sm font-semibold" : "text-xs font-medium"}`}
      style={on ? { background: bg, color: fg } : { background: "#F5F5F4", color: "#A8A29E" }}
    >
      {icon}
      <span className="tabular-nums">{formatCount(n)}</span> {label}
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>{label}</p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: tone || "#1A1714" }}>{value}</p>
    </div>
  );
}

/**
 * HONEST FRESHNESS -- stated PER STREAM, never as one blended number.
 *
 * The Ready and Dispatched totals above come from two separately-synced
 * upstream tables, and they drift apart. Measured on the sandbox 2026-08-16,
 * order 132440539: ready rows ran to 2026-08-13 while dispatch rows still
 * stopped at 2026-07-13. A single "last recorded 13 Aug" would have been true
 * of ready and a month wrong about dispatch -- which is exactly the kind of
 * quietly-stale figure this line exists to prevent. So each stream states its
 * own newest date and goes amber on its own.
 *
 * The staleness itself is a BACKEND SYNC GAP in another lane, not something
 * this page can fix; all this page owes the reader is not pretending otherwise.
 */
function StreamFreshness({ label, at }: { label: string; at: number | null }) {
  if (!at) {
    return (
      <span style={{ color: "#AAA39E" }}>
        no {label.toLowerCase()} recorded yet
      </span>
    );
  }
  const days = Math.floor((Date.now() - at) / 86_400_000);
  const stale = days >= STALE_AFTER_DAYS;
  return (
    <span style={{ color: stale ? "#92400E" : "#AAA39E" }}>
      {label} to <b>{formatEpoch(at)}</b>
      {stale && <> ({formatCount(days)} days ago)</>}
    </span>
  );
}

function FreshnessLine({ lastReadyAt, lastDispatchAt }: { lastReadyAt: number | null; lastDispatchAt: number | null }) {
  if (!lastReadyAt && !lastDispatchAt) {
    return (
      <p className="text-[11px]" style={{ color: "#AAA39E" }}>
        No ready or dispatch has been recorded against this order yet.
      </p>
    );
  }
  const oldest = [lastReadyAt, lastDispatchAt].filter((d): d is number => !!d);
  const anyStale = oldest.some((d) => Math.floor((Date.now() - d) / 86_400_000) >= STALE_AFTER_DAYS);
  return (
    <p className="text-[11px]" style={{ color: "#AAA39E" }}>
      Recorded up to — <StreamFreshness label="Ready" at={lastReadyAt} />
      {" · "}
      <StreamFreshness label="Dispatch" at={lastDispatchAt} />
      {anyStale && (
        <span style={{ color: "#92400E" }}>
          {" — these quantities are only as fresh as the dates above."}
        </span>
      )}
    </p>
  );
}

/**
 * Says where the per-line notes come from and, crucially, that they can LAG.
 *
 * The note is read from the order's workflow rollup — the same source live
 * reads. On the sandbox that rollup is a snapshot that is not recomputed when a
 * job's note is edited, so it can trail the job's own copy (measured 2026-08-16:
 * workflow 133064862's rollup note was still the 7 July one while the job itself
 * carried the 13 Aug Mariam note). Reading the fresh copy costs a 1.9 MB detail
 * fetch per job — ~46 MB for this order's 24 jobs — so this view reads the cheap
 * source and NAMES the lag rather than paying that or pretending it is current.
 *
 * Same discipline as FreshnessLine above it: state the limit where the number is
 * read, never one screen away. Silence when there is nothing to qualify.
 */
function NotesProvenanceLine({ rows }: { rows: ProductionWatchRow[] }) {
  const n = rows.filter((r) => (r.note || "").trim()).length;
  if (n === 0) return null;
  return (
    <p className="text-[11px]" style={{ color: "#AAA39E" }}>
      {formatCount(n)} {n === 1 ? "line carries a job note" : "lines carry a job note"} — from this order&apos;s
      workflow rollup, so a note edited on the job itself can take a sync to appear here. Each note is
      self-dated; trust the date in the text.
    </p>
  );
}

export function OrderProductionWatch({
  watch,
  orderId,
  orderKind,
  orderLabel,
  compact = false,
  currency,
  headerAction,
  renderRowActions,
  renderArtisan,
}: {
  watch: WatchModel;
  orderId: number;
  orderKind: "order" | "custom-order";
  orderLabel: string;
  /** Inline-expand density: same content, tighter chrome, no card border. */
  compact?: boolean;
  /** Order currency, the fallback when a line carries none. */
  currency?: string;
  /** e.g. the Add-item button. Omitted by the read-only list expand. */
  headerAction?: React.ReactNode;
  /** e.g. per-line edit/delete. Omitted by the read-only list expand. */
  renderRowActions?: (row: ProductionWatchRow) => React.ReactNode;
  /**
   * The ARTISAN cell's contents, when the caller can resolve WHO is on the line.
   *
   * A SLOT, for the same reason headerAction and renderRowActions are slots:
   * resolving names costs three whole-table mapping reads (see
   * getWorkflowArtisanMappings), and only the custom-order DETAIL page is
   * willing to pay that. The inline list expand passes nothing and keeps the
   * zero-cost assigned/unassigned flag it renders today, so this table stays
   * cheap on the hot path it is measured on.
   *
   * Returning null falls through to that flag, so a caller can pass the slot
   * and still degrade honestly on a line whose roster did not resolve.
   */
  renderArtisan?: (row: ProductionWatchRow) => React.ReactNode;
}) {
  const rows = sortByAttention(watch.rows);
  // Ready/Dispatched are summed across the order's lines. Label the unit only
  // when every line shares one; a mixed-unit order gets a bare number rather
  // than a confidently wrong "METER".
  const units = Array.from(new Set(rows.map((r) => (r.unit || "").toUpperCase()).filter(Boolean)));
  const qtyUnit = units.length === 1 ? units[0] : "";
  const accent = watch.overdueCount > 0 ? "#DC2626" : watch.unassignedCount > 0 ? "#D97706" : "#10B981";

  return (
    <div
      className={compact ? "flex flex-col gap-3 py-3" : "rounded-xl border bg-white"}
      style={compact ? undefined : { borderColor: "#E8E4DE" }}
    >
      <div className={compact ? "flex flex-col gap-3" : "flex flex-col gap-3 border-b px-5 py-4"} style={compact ? undefined : { borderColor: "#F3F1ED" }}>
        {/* ── EXCEPTIONS FIRST: what needs me, before any tidy number ── */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={compact ? "text-[11px] font-semibold uppercase tracking-wide" : "font-serif text-base font-semibold"} style={{ color: compact ? "#847D77" : "#1A1714" }}>
            Production
          </h3>
          <ExceptionCounter n={watch.overdueCount} label="overdue" fg="#B91C1C" bg="#FEE2E2" icon={<AlertTriangle className="h-3.5 w-3.5" />} />
          <ExceptionCounter n={watch.unassignedCount} label="unassigned" fg="#92400E" bg="#FEF3C7" icon={<UserX className="h-3.5 w-3.5" />} />
          <ExceptionCounter n={watch.notStartedCount} label="not started" fg="#9A3412" bg="#FFEDD5" icon={<PlayCircle className="h-3.5 w-3.5" />} />
          {headerAction ? <span className="ml-auto">{headerAction}</span> : null}
        </div>

        {/* ── then the numbers ── */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="min-w-[180px] flex-1">
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>Production</p>
              <p className="text-lg font-semibold tabular-nums" style={{ color: accent }}>{watch.productionPct}%</p>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full" style={{ background: "#EDE8E1" }}>
              <div className="h-full rounded-full" style={{ width: `${watch.productionPct}%`, background: accent }} />
            </div>
          </div>
          <Stat label="Jobs done" value={`${formatCount(watch.workflowsDone)} / ${formatCount(watch.workflowsTotal)}`} />
          <Stat label="Ordered" value={`${fmtQty(watch.orderedQty, qtyUnit)}${qtyUnit ? ` ${qtyUnit}` : ""}`} />
          <Stat label="Ready" value={`${fmtQty(watch.readyQty, qtyUnit)}${qtyUnit ? ` ${qtyUnit}` : ""}`} tone="#047857" />
          <Stat label="Dispatched" value={`${fmtQty(watch.dispatchedQty, qtyUnit)}${qtyUnit ? ` ${qtyUnit}` : ""}`} tone="#A86120" />
        </div>

        <FreshnessLine lastReadyAt={watch.lastReadyAt} lastDispatchAt={watch.lastDispatchAt} />
        <NotesProvenanceLine rows={rows} />
      </div>

      {/* ── per-SKU table ──
          At >=1440 this no longer scrolls at all (see the layout note on
          CustomOrderDetailView). On a phone a 9-column production table cannot
          fit and live does not fit it either, so the scroller stays — but it
          gets a PERMANENT scrollbar rather than the overlay one, because an
          invisible scroller is how the desktop blocker hid half the table in the
          first place. The hint below says so in words, since a 3px gutter is not
          a discoverable affordance on its own. */}
      <div className="overflow-x-auto [scrollbar-color:#C7C1BB_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#C7C1BB] [&::-webkit-scrollbar]:h-2">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: "#F3F1ED" }}>
              <Th>Item</Th>
              <Th right>Price</Th>
              <Th>Artisan</Th>
              <Th right>Ordered</Th>
              <Th right>Ready</Th>
              <Th right>Dispatched</Th>
              <Th>Workflow</Th>
              <Th>Stages</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <WatchRow
                key={`${r.orderItemId}-${r.workflowId ?? "none"}`}
                row={r}
                orderId={orderId}
                orderKind={orderKind}
                orderLabel={orderLabel}
                currency={currency}
                rowActions={renderRowActions ? renderRowActions(r) : null}
                artisanCell={renderArtisan ? renderArtisan(r) : null}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-8 text-center text-sm" style={{ color: "#AAA39E" }}>
                  No items on this order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wide ${right ? "text-right" : ""}`}
      style={{ color: "#AAA39E" }}
      scope="col"
    >
      {children}
    </th>
  );
}

/** One dated ready-or-dispatch event: the quantity, the day, and (for a
 *  shipment) the carrier trail staff need to chase it. */
function EventLine({ e, tone }: { e: FulfilmentEvent; tone: string }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1">
      <span className="tabular-nums text-xs font-semibold" style={{ color: tone }}>
        {fmtQty(e.quantity, e.unit)} {e.unit}
      </span>
      <span className="text-[11px]" style={{ color: "#635D58" }}>on {formatEpoch(e.at ?? undefined)}</span>
      <span className="text-[10px]" style={{ color: "#C7C1BB" }}>#{e.recordId}</span>
      {e.shippingCode ? <span className="text-[10px]" style={{ color: "#847D77" }}>via {e.shippingCode}</span> : null}
      {e.trackingUrl ? (
        <a href={e.trackingUrl} target="_blank" rel="noreferrer" className="text-[10px] hover:underline" style={{ color: "#1D4ED8" }}>
          track
        </a>
      ) : null}
      {e.zohoPackageId ? <span className="text-[10px]" style={{ color: "#AAA39E" }}>pkg {e.zohoPackageId}</span> : null}
      {e.note ? <span className="text-[10px] italic" style={{ color: "#847D77" }}>{e.note}</span> : null}
    </li>
  );
}

function EventGroup({
  title,
  icon,
  tone,
  events,
}: {
  title: string;
  icon: React.ReactNode;
  tone: string;
  events: FulfilmentEvent[];
}) {
  return (
    <div className="min-w-[240px] flex-1">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: tone }}>
        {icon} {title} <span style={{ color: "#C7C1BB" }}>({formatCount(events.length)})</span>
      </p>
      {events.length ? (
        <ul className="mt-0.5">
          {events.map((e, i) => <EventLine key={`${e.recordId}-${i}`} e={e} tone={tone} />)}
        </ul>
      ) : (
        <p className="mt-0.5 text-[11px]" style={{ color: "#AAA39E" }}>None recorded.</p>
      )}
    </div>
  );
}

function WatchRow({
  row,
  orderId,
  orderKind,
  orderLabel,
  currency,
  rowActions,
  artisanCell,
}: {
  row: ProductionWatchRow;
  orderId: number;
  orderKind: "order" | "custom-order";
  orderLabel: string;
  currency?: string;
  rowActions?: React.ReactNode;
  /** Resolved artisan NAMES from the caller. Null falls back to the flag. */
  artisanCell?: React.ReactNode;
}) {
  // The coloured left edge IS the exception signal at row level -- same
  // vocabulary as the counters above it.
  const edge = row.overdue ? "#DC2626" : row.assigned === false ? "#D97706" : row.workflowId == null ? "#EA580C" : "transparent";

  const readyEvents = row.readyEvents || [];
  const dispatchEvents = row.dispatchEvents || [];
  const hasHistory = readyEvents.length > 0 || dispatchEvents.length > 0;
  const note = (row.note || "").trim();
  const hasNote = note.length > 0;
  const newest = [...readyEvents, ...dispatchEvents]
    .map((e) => e.at)
    .filter((d): d is number => typeof d === "number" && d > 0)
    .sort((a, b) => b - a)[0];

  // The row's bottom rule belongs on whichever of {main, note, history} is last.
  const lastRow = hasHistory ? "history" : hasNote ? "note" : "main";
  const rule = (which: string) =>
    which === lastRow ? { className: "border-b", style: { borderColor: "#F7F5F2" } } : { className: "", style: undefined };

  return (
    <>
      <tr className={`${rule("main").className} align-top`} style={rule("main").style}>
        <td className="py-3 pl-3 pr-3" style={{ borderLeft: `3px solid ${edge}` }}>
          <div className="flex items-start gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {row.image ? (
              <img src={row.image} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 flex-shrink-0 rounded-lg" style={{ background: "#F3F1ED" }} />
            )}
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-semibold" style={{ color: "#1A1714" }}>{row.sku || "—"}</p>
              <p className="max-w-[190px] truncate text-xs" style={{ color: "#635D58" }} title={row.name}>{row.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {row.itemStatus ? <StatusPill status={row.itemStatus} /> : null}
                {row.overdue && (
                  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
                    <AlertTriangle className="h-3 w-3" /> Overdue
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>

        <td className="px-3 py-3 text-right text-xs tabular-nums" style={{ color: "#1A1714" }}>
          {row.price != null ? formatMoney(row.price, row.currency || currency || "INR") : <span style={{ color: "#AAA39E" }}>—</span>}
        </td>

        {/* WHO, when the caller could resolve it. The flag below is the
            fallback, not the default: "Assigned" answers whether anyone is on
            the line but never who, which is exactly the gap Amit raised on
            2026-08-17. See ArtisanNamesCell for the resolved rendering. */}
        <td className="px-3 py-3">
          {artisanCell ? artisanCell : row.assigned == null ? (
            <span className="text-xs" style={{ color: "#AAA39E" }}>—</span>
          ) : row.assigned ? (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#047857" }}>Assigned</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: "#FEF3C7", color: "#92400E" }}>
              <UserX className="h-3 w-3" /> Unassigned
            </span>
          )}
        </td>

        <td className="px-3 py-3 text-right text-xs tabular-nums" style={{ color: "#1A1714" }}>
          {fmtQty(row.orderedQuantity, row.unit)} <span style={{ color: "#AAA39E" }}>{row.unit}</span>
        </td>
        <td className="px-3 py-3 text-right text-xs tabular-nums" style={{ color: "#047857" }}>{fmtQty(row.readyQuantity, row.unit)}</td>
        <td className="px-3 py-3 text-right text-xs tabular-nums" style={{ color: "#A86120" }}>{fmtQty(row.dispatchedQuantity, row.unit)}</td>

        <td className="px-3 py-3">
          {row.progress ? (
            <div className="min-w-[140px]">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tabular-nums" style={{ color: "#1A1714" }}>{row.progress.pct}%</span>
                <span className="truncate text-[11px]" style={{ color: "#635D58" }}>
                  {row.progress.currentStageName ?? "all stages done"}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#EDE8E1" }}>
                <div className="h-full rounded-full" style={{ width: `${row.progress.pct}%`, background: row.overdue ? "#DC2626" : "#1D4ED8" }} />
              </div>
              {row.workflowStatus && <div className="mt-1"><StatusPill status={row.workflowStatus} /></div>}
            </div>
          ) : (
            <span className="text-xs" style={{ color: "#AAA39E" }}>No job yet</span>
          )}
        </td>

        <td className="px-3 py-3">
          <div className="flex max-w-[240px] flex-wrap gap-1">
            {row.stages.map((s, i) => <StageChip key={i} name={s.name} status={s.status} />)}
            {row.stages.length === 0 && <span className="text-xs" style={{ color: "#AAA39E" }}>—</span>}
          </div>
        </td>

        <td className="px-3 py-3">
          <div className="flex flex-col items-end gap-1.5">
            {row.workflowId != null ? (
              <Link
                href={`/artisanflow/workflow/instance/${row.workflowId}`}
                className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium hover:underline"
                style={{ color: "#1D4ED8" }}
              >
                Open job <ArrowRight className="h-3 w-3" />
              </Link>
            ) : isActiveItemStatus(row.itemStatus) ? (
              <StartProductionDialog
                item={{
                  kind: orderKind,
                  orderId,
                  orderItemId: row.orderItemId,
                  productId: row.productId,
                  productName: row.name,
                  productSku: row.sku || undefined,
                  quantity: row.orderedQuantity,
                  unit: row.unit,
                  orderLabel,
                }}
              />
            ) : (
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#AAA39E" }}><Package className="h-3 w-3" /> —</span>
            )}
            {rowActions}
          </div>
        </td>
      </tr>

      {/* THE JOB NOTE — restored 2026-08-16. Live renders this amber against the
          order line and we rendered nothing at all, silently dropping dated
          dispatch commitments ("Aug 13 : Mariam will dispatch the Kantha fabric
          within 4-5 days") that exist in no other system.

          It gets its own full-width sub-row rather than a chip inside the ITEM
          cell, for two reasons: these notes run to a full sentence and would
          either be truncated to uselessness in a ~190px cell or push the table
          back over its container (the B-1 blocker fixed in the same change), and
          a commitment reads better as a line than as a tooltip. NOT a <details>
          like the history below it — a note nobody opens is a note nobody acts
          on. */}
      {hasNote && (
        <tr className={rule("note").className} style={rule("note").style}>
          <td colSpan={COL_COUNT} className="p-0" style={{ borderLeft: `3px solid ${edge}` }}>
            <div
              className="mx-3 mb-2.5 flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5"
              style={{ borderColor: "#FCD34D", background: "#FFFBEB" }}
            >
              <StickyNote className="mt-[1px] h-3 w-3 flex-shrink-0" style={{ color: "#D97706" }} />
              <p className="text-[11px] leading-snug" style={{ color: "#78350F" }}>
                <span className="font-semibold">Note:</span> {note}
              </p>
            </div>
          </td>
        </tr>
      )}

      {/* Secondary by design: the dated sequence behind the Ready / Dispatched
          totals on the row above. Native <details> -- no client state, and the
          events are in the server HTML whether or not it is open. */}
      {hasHistory && (
        <tr className={rule("history").className} style={rule("history").style}>
          <td colSpan={COL_COUNT} className="p-0" style={{ borderLeft: `3px solid ${edge}` }}>
            <details className="group">
              <summary
                className="flex cursor-pointer list-none items-center gap-1.5 px-3 pb-2.5 text-[11px] font-medium"
                style={{ color: "#847D77" }}
              >
                <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                Ready &amp; dispatch history
                <span style={{ color: "#AAA39E" }}>
                  {formatCount(readyEvents.length)} ready · {formatCount(dispatchEvents.length)} dispatch
                  {newest ? ` · latest ${formatEpoch(newest)}` : ""}
                </span>
              </summary>
              <div className="mx-3 mb-3 flex flex-wrap gap-x-8 gap-y-3 rounded-lg border px-3 py-2.5" style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}>
                <EventGroup title="Ready" tone="#047857" icon={<PackageCheck className="h-3 w-3" />} events={readyEvents} />
                <EventGroup title="Dispatched" tone="#A86120" icon={<Truck className="h-3 w-3" />} events={dispatchEvents} />
              </div>
            </details>
          </td>
        </tr>
      )}
    </>
  );
}
