"use client";

/**
 * OrderFeedbackClient — the Order Feedback preview screen for the Weave sandbox.
 *
 * Faithful to live (manage-order-feedback): four buckets derived from the same
 * answer logic, one shared preview table (Rating / Customer / Order # / Found it? /
 * Comment / Date / View). The live screen is READ-ONLY (no status change / reply /
 * approve actions exist), so there are no mutation controls to disable — a
 * "Read-only sandbox" pill in the header makes the sandbox contract explicit.
 * View is a read navigation to the detail page.
 */
import React, { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, Star, Clock, Inbox, ExternalLink } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataList, DataListColumn, Badge } from "@/components/ui";
import { TabBar } from "@/components/ui/TabBar";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useClientTable } from "@/lib/useClientTable";
import { formatEpoch } from "@/lib/utils";
import type { OrderFeedbackRow } from "@/lib/order-feedback-api";

type Tab = "feedback" | "rating" | "incomplete" | "unrated";
const PAGE_SIZE = 25;

function ReadOnlyBadge() {
  return (
    <span
      title="Read-only in sandbox — the live Order Feedback screen has no mutations"
      className="rounded px-2 py-1 text-xs font-medium cursor-not-allowed opacity-70 select-none"
      style={{ background: "#F3F1ED", color: "#847D77", border: "1px solid #E8E4DE" }}
    >
      Read-only
    </span>
  );
}

/** NPS band for a 1-10 rating (mirrors live ratingClass): low 1-6, mid 7-8, high 9-10. */
function ratingVariant(n: number): "green" | "amber" | "red" {
  if (n <= 6) return "red";
  if (n <= 8) return "amber";
  return "green";
}

function snippet(text: string): string {
  if (!text) return "";
  return text.length > 60 ? text.slice(0, 60) + "…" : text;
}

/** Bucketing — identical logic to the live ManageOrderFeedbackComponent. */
function bucketize(rows: OrderFeedbackRow[]) {
  const unrated: OrderFeedbackRow[] = [];
  const feedback: OrderFeedbackRow[] = [];
  const rating: OrderFeedbackRow[] = [];
  const incomplete: OrderFeedbackRow[] = [];
  for (const f of rows) {
    if (!(f.question1Answer > 0)) { unrated.push(f); continue; }
    if (f.question3Answer) feedback.push(f);
    else if (f.question1Answer > 0 && f.question2) rating.push(f);
    else incomplete.push(f);
  }
  return { feedback, rating, incomplete, unrated };
}

function useColumns(): DataListColumn<OrderFeedbackRow>[] {
  return useMemo<DataListColumn<OrderFeedbackRow>[]>(() => [
    {
      key: "rating", label: "Rating",
      render: (r) =>
        r.question1Answer > 0 ? (
          <Badge variant={ratingVariant(r.question1Answer)}>{r.question1Answer}/10</Badge>
        ) : (
          <span className="text-sm" style={{ color: "#A9A29C" }}>No rating</span>
        ),
    },
    {
      key: "customer", label: "Customer",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm" style={{ color: "#1A1714" }}>{r.customerName || "—"}</span>
          <span className="text-xs" style={{ color: "#847D77" }}>{r.customerEmail || ""}</span>
        </div>
      ),
    },
    {
      key: "orderId", label: "Order #",
      render: (r) => <span className="font-mono text-sm" style={{ color: "#635D58" }}>#{r.orderId}</span>,
    },
    {
      key: "found", label: "Found it?",
      render: (r) =>
        r.question2 ? (
          <span className="inline-flex items-center gap-1">
            <Badge variant={r.question2Answer ? "green" : "red"}>{r.question2Answer ? "Yes" : "No"}</Badge>
            {!r.question2Answer && r.question2NegativeAnswer ? (
              <span title="Left negative feedback" style={{ color: "#B45309" }}>⚠️</span>
            ) : null}
          </span>
        ) : (
          <span style={{ color: "#A9A29C" }}>—</span>
        ),
    },
    {
      key: "comment", label: "Comment",
      render: (r) =>
        r.question3Answer ? (
          <span className="text-sm" style={{ color: "#635D58" }}>{snippet(r.question3Answer)}</span>
        ) : (
          <span style={{ color: "#A9A29C" }}>—</span>
        ),
    },
    {
      key: "date", label: "Date",
      render: (r) => <span className="text-sm" style={{ color: "#847D77" }}>{formatEpoch(r.updatedAt)}</span>,
    },
    {
      key: "actions", label: "",
      render: (r) => (
        <Link
          href={`/order-feedback/${r.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
          style={{ color: "#A86120" }}
        >
          View <ExternalLink className="h-3 w-3" />
        </Link>
      ),
    },
  ], []);
}

function FeedbackTable({ rows }: { rows: OrderFeedbackRow[] }) {
  const columns = useColumns();
  const searchFields = useCallback(
    (r: OrderFeedbackRow) => [r.customerName, r.customerEmail, String(r.orderId), r.question3Answer],
    [],
  );
  const table = useClientTable(rows, { searchFields, pageSize: PAGE_SIZE });
  return (
    <DataList
      data={table.paged}
      columns={columns}
      getId={(r) => String(r.id)}
      total={table.filtered.length}
      page={table.page}
      pageSize={PAGE_SIZE}
      onPageChange={table.setPage}
      onSearch={table.setSearch}
      searchPlaceholder="Search by customer, order # or comment…"
      emptyMessage="No feedback in this bucket yet."
    />
  );
}

export function OrderFeedbackClient({ rows, error }: { rows: OrderFeedbackRow[]; error: string | null }) {
  const [tab, setTab] = useState<Tab>("feedback");
  const buckets = useMemo(() => bucketize(rows), [rows]);

  const tabs = [
    { id: "feedback", label: "Complete with Feedback", count: buckets.feedback.length, icon: MessageCircle },
    { id: "rating", label: "Complete with Rating", count: buckets.rating.length, icon: Star },
    { id: "incomplete", label: "Incomplete", count: buckets.incomplete.length, icon: Clock },
    { id: "unrated", label: "No Rating", count: buckets.unrated.length, icon: Inbox },
  ];
  const active =
    tab === "feedback" ? buckets.feedback :
    tab === "rating" ? buckets.rating :
    tab === "incomplete" ? buckets.incomplete :
    buckets.unrated;

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Relationships</span><span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Order Feedback</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Order Feedback</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              How customers rated their order experience (post-purchase NPS survey)
            </p>
          </div>
          <ReadOnlyBadge />
        </div>

        {error ? (
          <ErrorBanner message={error} />
        ) : (
          <>
            <TabBar
              tabs={tabs}
              active={tab}
              onChange={(id) => setTab(id as Tab)}
              variant="underline"
              ariaLabel="Order feedback buckets"
            />
            <FeedbackTable rows={active} />
          </>
        )}
      </div>
    </WeaveShell>
  );
}
