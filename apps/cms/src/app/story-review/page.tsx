/**
 * /story-review — Story Mapping Review Queue (Server Component)
 *
 * Lists products the cluster/craft auto-derivation could NOT confidently map
 * (ambiguous / no-rule sub-categories), so an editor can pick the mapping by
 * hand. Each row deep-links to the product-edit form's Cluster & Craft panel.
 */
import React from "react";
import Link from "next/link";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Button, Badge } from "@/components/ui";
import { getStoryReviewQueue } from "@/lib/api";
import { getSandboxToken } from "@/lib/sandbox-token";
import type { StoryReviewRow } from "@/lib/api";

export const dynamic = "force-dynamic";

// Fixed locale + timezone → deterministic. Server-only render (no client
// hydration of this component), so there is no server/client locale mismatch.
function fmtDate(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default async function StoryReviewPage() {
  // review-queue is a gated native admin route: attach the wrapper admin
  // token. Page access itself is already gated by middleware (session cookie).
  const token = getSandboxToken();

  let rows: StoryReviewRow[] = [];
  let error = "";
  try {
    rows = await getStoryReviewQueue(token);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load review queue";
  }

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/dashboard" style={{ color: "#847D77" }}>Dashboard</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>Story Review</span>
        </div>
      }
    >
      <div className="flex flex-col gap-5 max-w-5xl pb-16">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              Story Mapping Review Queue
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Products whose cluster/craft could not be auto-derived — pick the mapping by hand.
            </p>
          </div>
          {rows.length > 0 && <Badge variant="amber">{rows.length} pending</Badge>}
        </div>

        {error ? (
          <div
            className="rounded-xl border px-5 py-4 text-sm"
            style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
          >
            Failed to load review queue: {error}
          </div>
        ) : rows.length === 0 ? (
          <div
            className="rounded-xl border px-5 py-8 text-center text-sm"
            style={{ background: "#F5F7F5", borderColor: "#DDE7DD", color: "#3F5140" }}
          >
            All products have been mapped. Nothing needs a manual cluster/craft pick.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "#E8E4DE" }}>
            <div
              className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{ background: "#FAF9F7", color: "#847D77" }}
            >
              <span className="col-span-4">Product</span>
              <span className="col-span-2">SKU</span>
              <span className="col-span-3">Sub-category</span>
              <span className="col-span-2">Flagged</span>
              <span className="col-span-1 text-right">Action</span>
            </div>
            {rows.map((r) => (
              <div
                key={String(r.id)}
                className="grid grid-cols-12 items-center gap-3 border-t px-4 py-3 text-sm"
                style={{ borderColor: "#F0EDE8" }}
              >
                <span className="col-span-4 font-medium truncate" style={{ color: "#1A1714" }}>
                  {r.product_name ?? `Product #${r.product_id}`}
                </span>
                <span className="col-span-2 truncate" style={{ color: "#635D58" }}>
                  {r.sku ?? "—"}
                </span>
                <span className="col-span-3 truncate" style={{ color: "#635D58" }}>
                  {r.sub_category_name ?? (r.sub_category_id != null ? `#${r.sub_category_id}` : "unknown")}
                </span>
                <span className="col-span-2 text-xs" style={{ color: "#847D77" }}>
                  {fmtDate(r.created_at)}
                </span>
                <span className="col-span-1 flex justify-end">
                  <Link href={`/listings/${r.product_id}#cluster-craft`}>
                    <Button variant="secondary" size="sm">Edit →</Button>
                  </Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </WeaveShell>
  );
}
