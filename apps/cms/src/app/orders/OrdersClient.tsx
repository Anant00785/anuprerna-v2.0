"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { KpiStrip } from "@/components/ui/KpiStrip";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Badge } from "@/components/ui/Badge";
import { TabBar } from "@/components/ui/TabBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import type { OrderRow } from "@/lib/api";
import { paymentStatusVariant } from "@/components/artisanflow/orderStatus";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import {
  Search, X, Trash2, Package, CalendarRange, Clock, AlertTriangle, Inbox,
  ChevronDown, ChevronRight, ArrowRight,
} from "lucide-react";
import { OrderInlinePanel } from "./OrderInlinePanel";

// ── Status vocabulary — MIRRORS live manage-order.component.ts statuses[] and
//    order-preview-table getStatusLabel(). ONLY canonical Loom OrderStatus
//    literals are used as tab ids (enum-lint safe). ─────────────────────────
const STATUS_TABS: { id: string; label: string }[] = [
  { id: "PROCESSING", label: "Awaiting" },
  { id: "PARTIALLY_DISPATCHED", label: "Partially Fulfilled" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "DISPATCHED", label: "Fulfilled" },
  { id: "INITIATED", label: "Incomplete" },
  { id: "FAILED", label: "Failed" },
  { id: "CANCELLED", label: "Cancelled" },
];

const STATUS_LABEL: Record<string, string> = {
  INITIATED: "Incomplete", PROCESSING: "Awaiting", PARTIALLY_DISPATCHED: "Partially Fulfilled",
  IN_TRANSIT: "In Transit", DISPATCHED: "Fulfilled", DELIVERED: "Delivered",
  FAILED: "Failed", CANCELLED: "Cancelled",
};

const PAGE_SIZE = 50;

interface PagedResponse {
  orders: OrderRow[];
  total: number;
  page: number;
  size: number;
  counts?: Record<string, number>;
  overdue?: number;
}

// ── Formatting helpers ─────────────────────────────────────────────────────

function formatDate(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });
}
function formatDayMonth(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" });
}
function formatMoney(amount: number, currency: string) {
  if (!currency) return amount.toLocaleString("en-IN");
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return currency + " " + amount.toLocaleString("en-IN");
  }
}

function productTypeLabel(t: string): string {
  if (t === "FINISHED") return "Finished";
  if (t === "MIXED") return "Fabric + Finished";
  if (t === "FABRIC") return "Fabric";
  return "";
}
function productTypeVariant(t: string): "blue" | "amber" | "stone" {
  if (t === "FINISHED") return "blue";
  if (t === "MIXED") return "amber";
  return "stone"; // FABRIC / unknown
}
function paymentLabel(s: string): string {
  switch ((s || "").toUpperCase()) {
    case "PAID": return "Paid"; case "PENDING": return "Payment pending";
    case "PREPAID": return "Prepaid"; case "FAILED": return "Payment failed"; default: return s || "";
  }
}
function pct(n: number, total: number): number {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}
// Progress bar only makes sense for in-flight orders (live: showProgress()).
function showProgress(r: OrderRow): boolean {
  return r.overallStatus === "PROCESSING" || r.overallStatus === "IN_TRANSIT";
}

// ── Delete action — DELETE /delete/order/{id} via /api/crud (2026-07-06,
//    Phase 4). Native + tested backend; soft-delete only (sets `deleted`,
//    requires the order to have items — same guard as live). ──────────────
function DeleteButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      title="Delete order (sandbox only)"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-red-50"
      style={{ background: "#F3F1ED", color: "#847D77", border: "1px solid #E8E4DE" }}
    >
      <Trash2 className="h-3 w-3" /> Delete
    </button>
  );
}

// ── Order card ──────────────────────────────────────────────────────────────
// A header-button toggle (not a whole-card Link) expands the inline production
// panel — same interaction pattern as CustomOrderCard on the Custom Orders list.
function OrderCard({ row, onDeleteClick }: { row: OrderRow; onDeleteClick: (row: OrderRow) => void }) {
  const [open, setOpen] = useState(false);
  // Keep the panel MOUNTED once it has been opened, and hide it on collapse.
  //
  // It used to be unmounted on collapse, so every re-expand re-ran
  // OrderInlinePanel's effect and refetched /api/orders/{id} from scratch.
  // MEASURED against a request-logging proxy: expand = 5 upstream GETs (3 of
  // them FULL workflow-list scans, ~75 KB), collapse = 0, re-expand = 5 more.
  // Toggling one row twice therefore cost 10 GETs / 6 full-list scans for
  // byte-identical data. Staying mounted makes every re-expand free.
  //
  // No new staleness: the panel already never refetched while open, and the
  // only way to create a job from here (StartProductionDialog) NAVIGATES AWAY
  // to /artisanflow/workflow/start/configure, so returning to this list
  // remounts OrdersClient and its cards and refetches anyway. Changing page,
  // tab or search unmounts the card for the same reason.
  const [hasOpened, setHasOpened] = useState(false);
  const toggle = () => setOpen((o) => { if (!o) setHasOpened(true); return !o; });
  return (
    <div className="rounded-xl border bg-white transition-shadow hover:shadow-card" style={{ borderColor: "#E8E4DE" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
        className="block w-full cursor-pointer px-4 py-3 text-left"
      >
        {/* Row 1 — identity + amount + delete action */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex-shrink-0" style={{ color: "#AAA39E" }}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <StatusPill status={row.overallStatus} label={STATUS_LABEL[row.overallStatus] ?? row.overallStatus} />
          <span className="text-sm" style={{ color: "#635D58" }}>
            <span style={{ color: "#AAA39E" }}>#</span><strong style={{ color: "#302C28" }}>{row.id}</strong>
          </span>
          {row.isOverdue && (
            <span title="Estimated delivery date has passed — this order is running late"
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}>
              <AlertTriangle className="h-3 w-3" /> Overdue
            </span>
          )}
          <span aria-hidden="true" style={{ color: "#D6D1CB" }}>·</span>
          <span className="text-sm font-medium" style={{ color: "#302C28" }}>{row.customerName}</span>
          {row.zohoOrderId && (
            <span className="text-xs" style={{ color: "#AAA39E" }}>Zoho: {row.zohoOrderId}</span>
          )}
          <span className="ml-auto flex items-center gap-3">
            <span className="text-sm font-semibold tabular-nums" style={{ color: "#1A1714" }}>
              {formatMoney(row.total, row.currency)}
            </span>
            {/* Opens in a new tab so the reviewer keeps their place in the list
                (carried over from the QA sprint, where the whole card was a
                target=_blank Link before it became an inline-panel toggle). */}
            <Link
              href={"/orders/" + row.id}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-stone-100"
              style={{ color: "#A86120" }}
            >
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <DeleteButton onClick={(e) => { e.stopPropagation(); onDeleteClick(row); }} />
          </span>
        </div>

        {/* Row 2 — badge stack */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {row.paymentStatus && (
            <Badge variant={paymentStatusVariant(row.paymentStatus)}>
              {paymentLabel(row.paymentStatus)}
            </Badge>
          )}
          {row.paymentMode && (
            <span className="text-[10px] uppercase tracking-wide" style={{ color: "#AAA39E" }}>{row.paymentMode}</span>
          )}
          {productTypeLabel(row.productType) && (
            <Badge variant={productTypeVariant(row.productType)}>{productTypeLabel(row.productType)}</Badge>
          )}
          {row.hasSwatchItems && <Badge variant="amber">Swatch</Badge>}
          {row.loyaltyOrder && <Badge variant="green">Wholesale</Badge>}
          {row.hasMadeToOrderItems && <Badge variant="purple">Made-to-order</Badge>}
          {row.hasPreOrderItems && <Badge variant="purple">Pre-order</Badge>}
        </div>

        {/* Row 3 — meta */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "#847D77" }}>
          <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" /> {row.itemCount} {row.itemCount === 1 ? "item" : "items"}</span>
          {(row.estimatedDeliveryFrom > 0 || row.estimatedDeliveryTo > 0) && (
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="h-3 w-3" /> {formatDayMonth(row.estimatedDeliveryFrom)} → {formatDayMonth(row.estimatedDeliveryTo)}
            </span>
          )}
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(row.createdAt)}</span>
        </div>

        {/* Progress line + bar (in-flight orders only, mirrors live) */}
        {showProgress(row) && (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {row.processingItemCount > 0 && (
                <span style={{ color: "#B45309" }}>{row.processingItemCount} in production</span>
              )}
              {row.readyItemCount > 0 && (
                <span style={{ color: "#1D4ED8" }}>{row.readyItemCount} ready</span>
              )}
              {row.dispatchedItemCount > 0 && (
                <span style={{ color: "#047857" }}>{row.dispatchedItemCount} shipped</span>
              )}
              {row.cancelledItemCount > 0 && (
                <span style={{ color: "#B91C1C" }}>{row.cancelledItemCount} cancelled</span>
              )}
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#F0EDE8" }} aria-hidden="true">
              <span style={{ width: pct(row.processingItemCount, row.itemCount) + "%", background: "#F59E0B" }} />
              <span style={{ width: pct(row.readyItemCount, row.itemCount) + "%", background: "#3B82F6" }} />
              <span style={{ width: pct(row.dispatchedItemCount, row.itemCount) + "%", background: "#10B981" }} />
            </div>
          </>
        )}
      </div>

      {hasOpened && (
        <div
          className={`border-t px-4${open ? "" : " hidden"}`}
          style={{ borderColor: "#F0EDE7", background: "#FDFCFA" }}
        >
          <OrderInlinePanel orderId={row.id} />
        </div>
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export function OrdersClient() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [overdue, setOverdue] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("PROCESSING");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback((opts: { status: string; q: string; page: number }) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(opts.page), size: String(PAGE_SIZE), status: opts.status,
      ...(opts.q ? { q: opts.q } : {}),
    });
    fetch(`/api/orders?${params}`)
      .then((r) => { if (!r.ok) throw new Error("Backend returned " + r.status); return r.json() as Promise<PagedResponse>; })
      .then((data) => {
        if (id !== reqId.current) return; // a newer request superseded this one
        setRows(data.orders ?? []);
        setTotal(data.total ?? 0);
        setCounts(data.counts ?? {});
        setOverdue(data.overdue ?? 0);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (id !== reqId.current) return;
        setError(err.message); setLoading(false);
      });
  }, []);

  // Fresh load whenever the tab or (debounced) search changes.
  useEffect(() => { setPage(1); load({ status, q: search, page: 1 }); }, [status, search, load]);

  // Debounce the search box (350 ms, matching live).
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const goToPage = (next: number) => {
    setPage(next);
    load({ status, q: search, page: next });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const doDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `delete/order/${deleteTarget.id}`, method: "DELETE" }),
      });
      const j = await res.json().catch(() => ({}));
      const ok = res.ok && j?.success !== false;
      if (!ok) throw new Error(j?.message || `Delete failed (${res.status})`);
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
  const kpis = [
    { label: "Total", value: totalAll.toLocaleString("en-IN") },
    { label: "Awaiting", value: (counts.PROCESSING ?? 0).toLocaleString("en-IN") },
    { label: "Overdue", value: overdue.toLocaleString("en-IN") },
    { label: "In Transit", value: (counts.IN_TRANSIT ?? 0).toLocaleString("en-IN") },
  ];
  const tabs = STATUS_TABS.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] ?? 0 }));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <WeaveShell breadcrumb={<span className="font-serif text-lg font-medium" style={{ color: "#1A1714" }}>Orders</span>}>
      <div className="flex flex-col gap-5 max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Orders</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              The operational view of every customer order — triage by status, then open a row for full detail.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mt-1"
            style={{ background: "#FEF3C7", color: "#92400E" }}>
            Sandbox — writes never touch live
          </span>
        </div>

        {/* Stats strip */}
        <KpiStrip items={kpis} />

        {error && <ErrorBanner message={error} />}

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#AAA39E" }} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search every order — ID · customer name · Zoho ID"
            aria-label="Search orders by ID, customer name, or Zoho ID"
            className="w-full rounded-lg border py-2 pl-9 pr-9 text-sm outline-none"
            style={{ borderColor: "#E8E4DE", color: "#302C28" }}
          />
          {searchInput.length > 0 && (
            <button type="button" onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#847D77" }} aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <TabBar tabs={tabs} active={status} onChange={(id) => setStatus(id)} variant="pill" ariaLabel="Order status" />
        </div>

        {/* Meta line */}
        {!loading && !error && (
          <div className="-mt-2 text-xs" style={{ color: "#AAA39E" }}>
            {search
              ? `Search \"${search}\" · ${total.toLocaleString("en-IN")} match${total === 1 ? "" : "es"} in ${STATUS_LABEL[status] ?? status}`
              : total > PAGE_SIZE
              ? `Showing ${pageStart.toLocaleString("en-IN")}–${pageEnd.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} ${STATUS_LABEL[status] ?? status} orders`
              : `Showing ${total.toLocaleString("en-IN")} ${STATUS_LABEL[status] ?? status} order${total === 1 ? "" : "s"}`}
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="flex items-center gap-3 py-16 justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "#E8E4DE", borderTopColor: "#A86120" }} />
            <span className="text-sm" style={{ color: "#847D77" }}>Loading orders…</span>
          </div>
        ) : !error && rows.length === 0 ? (
          <div className="rounded-xl border py-16 text-center" style={{ borderColor: "#E8E4DE" }}>
            {search ? <Search className="mx-auto h-6 w-6" style={{ color: "#C4BDB6" }} /> : <Inbox className="mx-auto h-6 w-6" style={{ color: "#C4BDB6" }} />}
            <p className="mt-2 text-sm font-medium" style={{ color: "#302C28" }}>
              {search ? `No orders match \"${search}\" in ${STATUS_LABEL[status] ?? status}` : `No orders in ${STATUS_LABEL[status] ?? status} right now`}
            </p>
            <p className="mt-1 text-xs" style={{ color: "#847D77" }}>Switch tabs to triage other queues.</p>
          </div>
        ) : !error && (
          <div className="flex flex-col gap-2">
            {rows.map((row) => <OrderCard key={row.id} row={row} onDeleteClick={setDeleteTarget} />)}
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete order #${deleteTarget?.id}?`}
        message={<>This permanently marks the order deleted in the sandbox database (soft-delete, matching live). This cannot be undone.</>}
        confirmLabel="Delete" danger loading={deleting} error={deleteError}
        onConfirm={doDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
      />
    </WeaveShell>
  );
}
