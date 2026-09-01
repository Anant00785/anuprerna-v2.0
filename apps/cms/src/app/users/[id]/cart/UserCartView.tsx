"use client";

/**
 * UserCartView — read-only per-user "View Cart" drill (mirrors the live Angular
 * ViewCartComponent + ViewCartItemPreviewTableComponent). Columns match live:
 * Product (image + name + SKU + group + chips), Quantity, Order Type, Status
 * (Abandoned when idle >= 24h), Last Updated At. NO write affordance exists — a
 * ReadOnlyBadge in the header states mutations are unavailable in the sandbox.
 */

import React from "react";
import Link from "next/link";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Badge } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { CartTenant, CartItemRow, CartSummary } from "./data";

// Exact per-spec read-only marker (copied locally, NOT added to src/components/ui).
function ReadOnlyBadge() {
  return (
    <span title="Read-only in sandbox — mutations are not available"
      className="rounded px-2 py-1 text-xs font-medium cursor-not-allowed opacity-50 select-none"
      style={{ background: "#F3F1ED", color: "#847D77", border: "1px solid #E8E4DE" }}>
      Read-only
    </span>
  );
}

// Live: {{ item.lastUpdatedAt | date:'dd-MM-yyyy @ h:mm a' }} (deterministic, Asia/Kolkata)
function fmtDateTime(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms).toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "Asia/Kolkata",
  });
  // en-GB gives "dd/mm/yyyy, hh:mm am" -> normalise to "dd-mm-yyyy @ h:mm AM"
  const [date, time] = d.split(", ");
  return `${date.replace(/\//g, "-")} @ ${(time ?? "").toUpperCase()}`;
}

function fmtQty(n: number, unit: string): string {
  const dec = unit === "UNIT" ? 0 : 2;
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
}

function fmtINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] uppercase tracking-wide"
      style={{ background: "#F3F1ED", color: "#635D58" }}>
      {children}
    </span>
  );
}

function ProductCell({ item }: { item: CartItemRow }) {
  const href =
    item.slug && item.productKind !== "unknown"
      ? `https://anuprerna.com/product/${item.productKind}/${item.slug}`
      : undefined;
  const body = (
    <div className="flex items-start gap-3">
      {item.heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.heroImage} alt="" className="h-14 w-14 flex-shrink-0 rounded object-contain"
          style={{ background: "#FBFAF8", border: "1px solid #E8E4DE" }} />
      ) : (
        <div className="h-14 w-14 flex-shrink-0 rounded" style={{ background: "#F3F1ED", border: "1px solid #E8E4DE" }} />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium" style={{ color: "#1A1714" }}>{item.productName}</span>
        {item.sku ? <span className="text-xs" style={{ color: "#847D77" }}>SKU: {item.sku}</span> : null}
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {item.productGroup ? <Chip>{item.productGroup}</Chip> : null}
          {item.chosenFabric ? <Chip>Fabric: {item.chosenFabric}</Chip> : null}
          {item.sizeLabel ? <Chip>{item.sizeDisplayName}: {item.sizeLabel}</Chip> : null}
          {item.finishLabels.map((f, i) => (
            <Chip key={`f${i}`}>{item.finishDisplayName}: {f}</Chip>
          ))}
          {item.customSize.map((c, i) => (
            <Chip key={`c${i}`}>{c.key}: {c.value}</Chip>
          ))}
        </div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80">
      {body}
    </a>
  ) : (
    body
  );
}

interface Props {
  uid: string;
  tenant: CartTenant | null;
  items: CartItemRow[];
  summary?: CartSummary | null;
  error?: string;
}

export function UserCartView({ uid, tenant, items, summary, error }: Props) {
  const heading = tenant?.name && tenant.name !== "—" ? tenant.name : uid;
  const shownCount = items.length > 0 ? items.length : summary?.cartItemCount ?? 0;
  const countLabel = `${shownCount} ${shownCount === 1 ? "item" : "items"}`;

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <Link href="/users" style={{ color: "#847D77" }}>Users</Link>
      <span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>{heading}</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>User Cart</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              {error ? "Live shopping cart." : `${countLabel} in this cart — read-only.`}
            </p>
          </div>
          <ReadOnlyBadge />
        </div>

        {error ? <ErrorBanner message={error} /> : null}

        {/* Customer header (live shows Name + Email) */}
        {tenant ? (
          <div className="rounded-xl border p-5" style={{ borderColor: "#E8E4DE", background: "#FFFFFF" }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#847D77" }}>Name</p>
                <p className="text-sm" style={{ color: "#1A1714" }}>{tenant.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#847D77" }}>Email</p>
                <p className="text-sm" style={{ color: "#1A1714" }}>{tenant.email || "—"}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Items table */}
        {!error && items.length === 0 && summary && summary.cartItemCount > 0 ? (
          <div className="rounded-xl border p-5" style={{ borderColor: "#E8E4DE", background: "#FFFFFF" }}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ color: "#1A1714" }}>
              <span><strong>{summary.cartItemCount}</strong> {summary.cartItemCount === 1 ? "item" : "items"}</span>
              <span>Estimated total: <strong>{fmtINR(summary.estimatedTotalPrice)}</strong></span>
              <span>Last updated: {fmtDateTime(summary.lastUpdatedAt)}</span>
              {summary.hasAbandonedItem ? <Badge variant="red">Abandoned</Badge> : <Badge variant="green">Active</Badge>}
            </div>
            <p className="mt-3 text-xs" style={{ color: "#847D77" }}>
              Per-item breakdown isn&apos;t available for this cart in the sandbox — only the summary was synced from live. (Sandbox-created carts show full line items.)
            </p>
          </div>
        ) : !error && items.length === 0 ? (
          <div className="rounded-xl border px-5 py-10 text-center text-sm" style={{ borderColor: "#E8E4DE", color: "#847D77" }}>
            No cart items.
          </div>
        ) : !error ? (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "#E8E4DE" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#FBFAF8", borderBottom: "1px solid #E8E4DE" }}>
                    {["Product", "Quantity", "Order Type", "Status", "Last Updated At"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #F3F1ED" }}>
                      <td className="px-4 py-3 min-w-[16rem] align-top"><ProductCell item={item} /></td>
                      <td className="px-4 py-3 text-sm align-top" style={{ color: "#635D58" }}>
                        {fmtQty(item.quantity, item.unit)} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm align-top" style={{ color: "#635D58" }}>
                        {item.orderType || "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {item.abandoned ? <Badge variant="red">Abandoned</Badge> : <Badge variant="green">Active</Badge>}
                      </td>
                      <td className="px-4 py-3 text-sm align-top whitespace-nowrap" style={{ color: "#635D58" }}>
                        {fmtDateTime(item.lastUpdatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </WeaveShell>
  );
}
