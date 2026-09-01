"use client";

/**
 * Inline expand panel for a custom-order row — the Order Watch view, in place.
 *
 * The list preview carries no per-item production state, so the first time a row
 * is expanded this lazily fetches /artisanflow/api/custom-order/[id], which
 * returns the ALREADY-ASSEMBLED Order Watch model (see that route). Rendering it
 * through the SAME OrderProductionWatch component the detail page uses is the
 * point: previously this panel hand-rolled a second, thinner production view, so
 * "what's happening" in the list and "what's happening" on the detail page were
 * two code paths that could — and did — show different things (this one had no
 * ready/dispatched quantities and no stage chips at all). One component, one
 * model, one set of numbers.
 *
 * Read-only. A "View full →" link opens the detail page. Never blocks the row:
 * spinner while loading, error line on failure.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, NotebookPen } from "lucide-react";
import type { CustomOrderDetail, OrderWorkflowSummary } from "@/lib/artisanflow-api";
import type { OrderProductionWatch as OrderProductionWatchModel } from "@/lib/order-production-watch";
import { OrderProductionWatch } from "@/components/artisanflow/OrderProductionWatch";

interface DetailResponse {
  order: CustomOrderDetail;
  orderWorkflows: OrderWorkflowSummary[];
  watch: OrderProductionWatchModel;
}

export function CustomOrderInlinePanel({ orderId }: { orderId: number }) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/artisanflow/api/custom-order/${orderId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: DetailResponse) => { if (alive) setData(j); })
      .catch((e) => { if (alive) setError(e?.message || "Failed to load"); });
    return () => { alive = false; };
  }, [orderId]);

  if (error) {
    return (
      <div className="py-4 text-xs" style={{ color: "#B91C1C" }}>
        Could not load production detail ({error}).{" "}
        <Link href={`/artisanflow/custom-orders/${orderId}`} className="font-medium hover:underline" style={{ color: "#A86120" }}>
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

  const orderLabel = `#${orderId}${data.order.tenant?.name ? ` · ${data.order.tenant.name}` : ""}`;
  const globalNote = (data.order.globalNote || "").trim();

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-center justify-end">
        <Link
          href={`/artisanflow/custom-orders/${orderId}`}
          className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
          style={{ color: "#A86120" }}
        >
          View full <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {/* GLOBAL NOTE. The list row shows only that a note EXISTS; the text
          belongs here, where the operator has already committed to looking at
          this order. Read from the fetched detail rather than the list preview
          so the panel and the detail page cannot show different text.

          Labelled explicitly, because the distinction is load-bearing: this is
          the INTERNAL running commentary staff keep on the order, not the
          customer's own `note`. Merging or mislabelling them would let someone
          read an internal status line as something the customer wrote — the same
          reason CustomOrderDetailView keeps two separate cards. */}
      {globalNote && (
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: "#F3E3C3", background: "#FFFBEB" }}>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#92400E" }}>
            <NotebookPen className="h-3.5 w-3.5" /> Global note
          </p>
          <p className="whitespace-pre-wrap break-words text-xs" style={{ color: "#635D58" }}>{globalNote}</p>
          <p className="mt-1 text-[10px]" style={{ color: "#AAA39E" }}>
            Internal running commentary on the whole order &mdash; not the customer&rsquo;s note. Read-only here.
          </p>
        </div>
      )}
      <OrderProductionWatch
        watch={data.watch}
        orderId={orderId}
        orderKind="custom-order"
        orderLabel={orderLabel}
        compact
      />
    </div>
  );
}
