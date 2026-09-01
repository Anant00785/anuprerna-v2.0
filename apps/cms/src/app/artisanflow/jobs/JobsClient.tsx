"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { KpiStrip, Badge } from "@/components/ui";
import { TabBar } from "@/components/ui/TabBar";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import { formatCount, formatEpoch } from "@/lib/utils";
import type { WorkflowInstancePreview } from "@/lib/artisanflow-api";
import { Briefcase, Search, ArrowRight, AlertTriangle, Calendar, CalendarRange } from "lucide-react";

const PAGE_SIZE = 30;
const KIND_TABS = [
  { id: "ORDER", label: "Order jobs" },
  { id: "CUSTOM_ORDER", label: "Custom-order jobs" },
] as const;
const STATUS_TABS = [
  { id: "ALL", label: "All" },
  { id: "CREATED", label: "Created" },
  { id: "INITIATED", label: "In progress" },
  { id: "HALTED", label: "Halted" },
  { id: "COMPLETED", label: "Completed" },
] as const;

/** Derived job-run window (see computeStepWindow in artisanflow-api.ts).
 *  undefined = not yet fetched for this row; { from: null, to: null } =
 *  fetched, no step carried a usable date. formatEpoch renders both as an
 *  em dash, so the row never has to special-case "loading" vs "no data". */
type RunWindow = { from: number | null; to: number | null };

// The row carries TWO destinations (the job, and the order it belongs to), so it
// cannot be one big <Link>: an <a> may not contain another <a>. Wrapping the row
// in a Link and nesting the "Order #" Link inside it produced invalid HTML, the
// parser relocated the inner anchor, and hydration failed with React #418
// ("Minified React error #418 ... args[]=HTML") on every render of this page.
// stopPropagation on the inner link did not help -- the mismatch happens in the
// HTML parser, before any click. Structured like ItemRow on the production board
// instead: a plain <div> row holding sibling links. The thumbnail below is
// OUTSIDE both links entirely, for the same reason -- it must never become a
// nested anchor.
function JobRow({ job, runWindow }: { job: WorkflowInstancePreview; runWindow?: RunWindow }) {
  const jobHref = `/artisanflow/workflow/instance/${job.id}`;
  // orderId 0 is how this change models an ORDERLESS job (started from the
  // standalone "Start job" flow with no order picked -- see getOrderBoard, which
  // splits those out before grouping precisely so they do not collapse into one
  // fake "order #0" card). Building the href unconditionally rendered a live
  // "Order #0" link to /orders/0 on every such row: an invitation to a
  // not-found page for a relationship that does not exist.
  const orderHref = job.orderId
    ? `/${job.workflowType === "CUSTOM_ORDER" ? "artisanflow/custom-orders" : "orders"}/${job.orderId}`
    : null;
  return (
    <div
      className="flex items-start gap-3 rounded-xl border bg-white px-4 py-3 transition-shadow hover:shadow-card"
      style={{ borderColor: "#E8E4DE" }}
    >
      {/* Fabric thumbnail, fixed size so rows never jump height while it
          loads or when a job has none. Idiom matched to the production-watch
          item row (OrderProductionWatch.tsx): h-10 w-10 rounded-lg
          object-cover, neutral #F3F1ED placeholder tile when there's no image. */}
      {job.productImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={job.productImage} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="h-10 w-10 flex-shrink-0 rounded-lg" style={{ background: "#F3F1ED" }} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusPill status={job.status} />
          {/* New tab: carried forward from the QA sprint, where the custom-workflow
              list rows (the deleted /workflow surface this page replaces) opened
              the workflow detail in a new tab so the reviewer keeps their place. */}
          <Link href={jobHref} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center gap-x-2 gap-y-1 hover:underline">
            <span className="text-sm" style={{ color: "#635D58" }}>
              <span style={{ color: "#AAA39E" }}>#</span><strong style={{ color: "#302C28" }}>{job.id}</strong>
            </span>
            {job.hasOverdueSubProcess && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
                <AlertTriangle className="h-3 w-3" /> Overdue
              </span>
            )}
            <span aria-hidden="true" style={{ color: "#D6D1CB" }}>·</span>
            <span className="text-sm font-medium" style={{ color: "#302C28" }}>{job.name}</span>
          </Link>
          <span className="ml-auto flex items-center gap-3">
            {orderHref ? (
              <Link
                href={orderHref}
                className="text-xs font-medium hover:underline"
                style={{ color: "#A86120" }}
              >
                Order #{job.orderId}
              </Link>
            ) : (
              <span className="text-xs font-medium" style={{ color: "#AAA39E" }}>
                No order
              </span>
            )}
            <Link href={jobHref} target="_blank" rel="noopener noreferrer" aria-label={`Open job #${job.id}`}>
              <ArrowRight className="h-3.5 w-3.5" style={{ color: "#AAA39E" }} />
            </Link>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "#847D77" }}>
          {job.productName && <span>{job.productName}</span>}
          {job.productSku && <Badge variant="stone">{job.productSku}</Badge>}
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Ordered {formatEpoch(job.orderCreatedAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarRange className="h-3 w-3" /> {formatEpoch(runWindow?.from ?? undefined)} → {formatEpoch(runWindow?.to ?? undefined)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function JobsClient({ jobs }: { jobs: WorkflowInstancePreview[] }) {
  const [kind, setKind] = useState<(typeof KIND_TABS)[number]["id"]>("ORDER");
  const [statusSeg, setStatusSeg] = useState<(typeof STATUS_TABS)[number]["id"]>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [windows, setWindows] = useState<Record<string, RunWindow>>({});
  // Ids already requested (or in flight) -- never re-requested for the life of
  // this page, even if the operator pages away and back. Kept OUTSIDE React
  // state on purpose: it must not itself trigger a re-render/re-fetch loop.
  const requestedKeysRef = useRef<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (j.workflowType !== kind) return false;
      if (statusSeg !== "ALL" && (j.status || "").toUpperCase() !== statusSeg) return false;
      if (!q) return true;
      return String(j.id).includes(q) || (j.name || "").toLowerCase().includes(q) || (j.productSku || "").toLowerCase().includes(q);
    });
  }, [jobs, kind, statusSeg, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filtered, pageSafe],
  );

  // Fetch the derived run window for the rows actually on screen, bounded to
  // one page (<=30) at a time -- see the doc comment on the route this calls
  // (src/app/artisanflow/api/jobs-windows/route.ts) for why the whole ~2,200
  // job table is never fetched at once.
  useEffect(() => {
    const orderIds: number[] = [];
    const customIds: number[] = [];
    for (const j of pageRows) {
      const key = `${j.workflowType}:${j.id}`;
      if (requestedKeysRef.current.has(key)) continue;
      requestedKeysRef.current.add(key);
      (j.workflowType === "CUSTOM_ORDER" ? customIds : orderIds).push(j.id);
    }
    if (orderIds.length === 0 && customIds.length === 0) return;
    const params = new URLSearchParams();
    if (orderIds.length) params.set("orderIds", orderIds.join(","));
    if (customIds.length) params.set("customIds", customIds.join(","));
    let cancelled = false;
    fetch(`/artisanflow/api/jobs-windows?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.windows) return;
        setWindows((prev) => ({ ...prev, ...data.windows }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pageRows]);

  const kpis = [
    { label: "Order jobs", value: formatCount(jobs.filter((j) => j.workflowType === "ORDER").length), icon: <Briefcase className="h-4 w-4" /> },
    { label: "Custom-order jobs", value: formatCount(jobs.filter((j) => j.workflowType === "CUSTOM_ORDER").length), icon: <Briefcase className="h-4 w-4" /> },
    { label: "Overdue", value: formatCount(jobs.filter((j) => j.hasOverdueSubProcess).length), icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>All Jobs</h1>
        <p className="mt-1 text-sm" style={{ color: "#847D77" }}>Every production job, segregated by order type.</p>
      </div>

      <KpiStrip items={kpis} />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#AAA39E" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search job #, name or SKU…"
          aria-label="Search production jobs"
          className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
          style={{ borderColor: "#E8E4DE", color: "#302C28" }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TabBar tabs={KIND_TABS.map((t) => ({ id: t.id, label: t.label }))} active={kind}
          onChange={(id) => { setKind(id as typeof kind); setPage(1); }} variant="pill" ariaLabel="Job order type" />
        <TabBar tabs={STATUS_TABS.map((t) => ({ id: t.id, label: t.label }))} active={statusSeg}
          onChange={(id) => { setStatusSeg(id as typeof statusSeg); setPage(1); }} variant="pill" ariaLabel="Job status" />
      </div>

      <div className="-mt-1 text-xs" style={{ color: "#AAA39E" }}>
        Showing {formatCount(filtered.length)} {KIND_TABS.find((t) => t.id === kind)?.label.toLowerCase()}
      </div>

      <div className="flex flex-col gap-2">
        {pageRows.map((j) => (
          <JobRow key={`${j.workflowType}:${j.id}`} job={j} runWindow={windows[`${j.workflowType}:${j.id}`]} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border py-16 text-center" style={{ borderColor: "#E8E4DE" }}>
            <Search className="mx-auto h-6 w-6" style={{ color: "#C4BDB6" }} />
            <p className="mt-2 text-sm font-medium" style={{ color: "#302C28" }}>No jobs match.</p>
          </div>
        )}
        <Pagination page={pageSafe} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
