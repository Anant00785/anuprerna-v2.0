"use client";

/**
 * Inline expand panel for a plain-order row (Production "what's happening").
 * Twin of CustomOrderInlinePanel.tsx for standard orders — kept as a SEPARATE
 * component (not shared) because OrderItemRow's fields differ from
 * CustomOrderItem's, even though the visual shape is the same by design.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, GitBranch, Package } from "lucide-react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import type { OrderDetail, OrderItemRow } from "@/lib/api";
import type { OrderWorkflowSummary } from "@/lib/artisanflow-api";
import { isActiveItemStatus } from "@/components/artisanflow/orderStatus";
import { StartProductionDialog } from "@/components/artisanflow/StartProductionDialog";
import { computeWorkflowProgress, computeSubProcessCounts } from "@/lib/workflow-progress";

interface DetailResponse {
  order: OrderDetail;
  orderWorkflows: OrderWorkflowSummary[];
}

export function OrderInlinePanel({ orderId }: { orderId: number }) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/orders/${orderId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: DetailResponse) => { if (alive) setData(j); })
      .catch((e) => { if (alive) setError(e?.message || "Failed to load"); });
    return () => { alive = false; };
  }, [orderId]);

  if (error) {
    // Shared ErrorBanner, not bespoke red text: a data outage has to look the
    // same everywhere in Weave and must never be mistakable for an empty state.
    return (
      <div className="flex flex-col gap-2 py-3">
        <ErrorBanner message={`production detail for order #${orderId} (${error})`} />
        <Link href={`/orders/${orderId}`} className="self-start text-xs font-medium hover:underline" style={{ color: "#A86120" }}>
          Open full page
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs" style={{ color: "#847D77" }}>
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#E8E4DE", borderTopColor: "#A86120" }}
        />
        Loading production...
      </div>
    );
  }

  const items = data.order.items || [];
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
          What&apos;s happening &middot; {items.length} item{items.length === 1 ? "" : "s"}
        </p>
        <Link
          href={`/orders/${orderId}`}
          className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
          style={{ color: "#A86120" }}
        >
          View full <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {items.length === 0 && (
        <p className="text-xs" style={{ color: "#AAA39E" }}>No items on this order.</p>
      )}
      {items.map((it) => (
        <InlineItem
          key={it.id}
          orderId={orderId}
          item={it}
          workflow={data.orderWorkflows.find((w) => w.orderItemId === it.id)}
        />
      ))}
    </div>
  );
}

function InlineItem({
  orderId,
  item,
  workflow,
}: {
  orderId: number;
  item: OrderItemRow;
  workflow?: OrderWorkflowSummary;
}) {
  let production: React.ReactNode;
  if (workflow) {
    const { pct, currentStageName } = computeWorkflowProgress(workflow);
    const subs = computeSubProcessCounts(workflow);
    production = (
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#635D58" }}>
          <GitBranch className="h-3 w-3" style={{ color: "#1D4ED8" }} />
          <span className="truncate font-medium" style={{ color: "#1A1714" }}>{workflow.workflowName}</span>
          <span style={{ color: "#C7C1BB" }}>&middot;</span>
          <span><b style={{ color: "#1A1714" }}>{subs.done}</b>/{subs.total} subprocesses &middot; {pct}%</span>
          {currentStageName && <span className="truncate">&middot; {currentStageName}</span>}
        </div>
        <div className="mt-1 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full" style={{ background: "#EDE8E1" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#1D4ED8" }} />
        </div>
      </div>
    );
  } else if (isActiveItemStatus(item.orderStatus)) {
    production = (
      <StartProductionDialog
        item={{
          kind: "order",
          orderId,
          orderItemId: item.id,
          productName: item.productName,
          productSku: item.sku,
          quantity: item.quantity,
          unit: item.unit,
          orderLabel: `#${orderId}`,
        }}
      />
    );
  } else {
    production = <span className="text-[11px]" style={{ color: "#AAA39E" }}>&mdash;</span>;
  }

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: "#FAF9F6" }}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md" style={{ background: "#EDEAE4" }}>
        <Package className="h-4 w-4" style={{ color: "#AAA39E" }} />
      </div>
      <div className="w-40 min-w-0 flex-shrink-0">
        <p className="truncate text-[13px] font-medium" style={{ color: "#1A1714" }}>{item.productName}</p>
        <p className="truncate text-[11px]" style={{ color: "#AAA39E" }}>{item.sku || "—"}</p>
      </div>
      <div className="min-w-0 flex-1">{production}</div>
      <div className="flex-shrink-0"><StatusPill status={item.orderStatus} /></div>
    </div>
  );
}
