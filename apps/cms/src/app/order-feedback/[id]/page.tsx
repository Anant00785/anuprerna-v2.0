/**
 * /order-feedback/[id] — single Order Feedback detail (server component).
 *
 * Mirrors the live order-feedback-detail screen: satisfaction hero + NPS band,
 * Q1 meter, Q2 yes/no (+ negative follow-up callout), Q3 comment, and the
 * customer + order summary sidebars. Read-only display (the live screen has no
 * mutation actions). Fetched server-side with the live-Loom service token.
 */
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { fetchOrderFeedbackById, type OrderFeedbackDetail } from "@/lib/order-feedback-api";
import { formatEpoch } from "@/lib/utils";

export const dynamic = "force-dynamic";

function inr(n: number): string {
  return "₹" + (n ?? 0).toLocaleString("en-IN");
}

function sentimentOf(score: number): { label: string; emoji: string; color: string } {
  if (score >= 9) return { label: "Promoter", emoji: "😍", color: "#15803D" };
  if (score >= 7) return { label: "Passive", emoji: "🙂", color: "#B45309" };
  return { label: "Detractor", emoji: "😞", color: "#B91C1C" };
}

function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "🙂";
  const a = parts[0].charAt(0);
  const b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (a + b).toUpperCase();
}

const CARD = { background: "#FFFFFF", border: "1px solid #E8E4DE", borderRadius: 12 };

function Detail({ fb }: { fb: OrderFeedbackDetail }) {
  const score = fb.question1Answer || 0;
  const s = sentimentOf(score);
  const markerPercent = ((Math.max(score, 1) - 1) / 9) * 100;
  const order = fb.order;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-center gap-5 p-5" style={{ ...CARD, borderLeft: `4px solid ${s.color}` }}>
        <div className="flex flex-col items-center justify-center rounded-lg px-5 py-3" style={{ background: "#FAF8F5" }}>
          <span className="font-serif text-4xl font-semibold" style={{ color: s.color }}>{score}</span>
          <span className="text-xs" style={{ color: "#847D77" }}>/10</span>
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: s.color }}>{s.emoji} {s.label}</div>
          <div className="font-serif text-xl font-semibold" style={{ color: "#1A1714" }}>
            {order?.tenant.name || "Unknown customer"}
          </div>
          <div className="text-sm" style={{ color: "#847D77" }}>
            Order #{order?.id ?? "—"} · {formatEpoch(order?.createdAt)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Q1 meter */}
          <div className="p-5" style={CARD}>
            <p className="mb-3 text-sm font-medium" style={{ color: "#1A1714" }}>{fb.question1 || "Satisfaction rating"}</p>
            <div className="relative h-2 rounded-full" style={{ background: "linear-gradient(90deg,#FCA5A5,#FCD34D,#86EFAC)" }}>
              <div className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white shadow" style={{ left: `${markerPercent}%`, background: s.color }} />
            </div>
            <div className="mt-2 flex justify-between text-xs" style={{ color: "#847D77" }}>
              <span>😞 Least satisfied</span><span>Most satisfied 😍</span>
            </div>
          </div>

          {/* Q2 */}
          {fb.question2 ? (
            <div className="p-5" style={CARD}>
              <p className="mb-2 text-sm font-medium" style={{ color: "#1A1714" }}>{fb.question2}</p>
              <span className="inline-block rounded px-3 py-1 text-sm font-medium"
                style={fb.question2Answer
                  ? { background: "#DCFCE7", color: "#15803D" }
                  : { background: "#FEE2E2", color: "#B91C1C" }}>
                {fb.question2Answer ? "✓ Yes" : "✗ No"}
              </span>
              {fb.question2 && !fb.question2Answer ? (
                <div className="mt-3 rounded-lg p-3" style={{ background: "#FFF8F0", border: "1px solid #FDE9C5" }}>
                  <p className="text-sm font-medium" style={{ color: "#8A4C19" }}>⚠️ {fb.question2Negative || "What went wrong?"}</p>
                  <p className="mt-1 text-sm" style={{ color: "#635D58" }}>{fb.question2NegativeAnswer || "No details given."}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Q3 */}
          <div className="p-5" style={CARD}>
            <p className="mb-2 text-sm font-medium" style={{ color: "#1A1714" }}>{fb.question3 || "Anything else to share?"}</p>
            {fb.question3Answer ? (
              <blockquote className="border-l-2 pl-3 text-sm italic" style={{ borderColor: "#E8E4DE", color: "#635D58" }}>
                {fb.question3Answer}
              </blockquote>
            ) : (
              <p className="text-sm" style={{ color: "#A9A29C" }}>💭 No written comment left.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Customer */}
          <div className="flex items-center gap-3 p-5" style={CARD}>
            <div className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold"
              style={{ background: "#FEF3E2", color: "#A86120" }}>
              {initialsOf(order?.tenant.name || "")}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-sm" style={{ color: "#1A1714" }}>{order?.tenant.name || "—"}</p>
              <p className="truncate text-xs" style={{ color: "#847D77" }}>✉️ {order?.tenant.email || "—"}</p>
              {order?.tenant.contactNumber ? (
                <p className="truncate text-xs" style={{ color: "#847D77" }}>📞 {order.tenant.contactNumber}</p>
              ) : null}
            </div>
          </div>

          {/* Order summary */}
          {order ? (
            <div className="p-5" style={CARD}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "#847D77" }}>🧾 Order</span>
                <span className="font-mono text-sm" style={{ color: "#1A1714" }}>#{order.id}</span>
              </div>
              <div className="mt-3">
                <div className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>{inr(order.total)}</div>
                <div className="text-xs" style={{ color: "#847D77" }}>Total paid in {order.currency || "INR"}</div>
              </div>
              <div className="mt-3 flex flex-col gap-1 text-sm" style={{ color: "#635D58" }}>
                <div className="flex justify-between"><span>Subtotal</span><span>{inr(order.subTotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{inr(order.shippingCost)}</span></div>
                {order.couponApplied ? (
                  <div className="flex justify-between" style={{ color: "#15803D" }}>
                    <span>🎟️ {order.couponCode}</span><span>−{inr(order.couponDiscountAmount)}</span>
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {order.paymentMode ? (
                  <span className="rounded px-2 py-1 text-xs" style={{ background: "#F3F1ED", color: "#635D58" }}>💳 {order.paymentMode}</span>
                ) : null}
                <span className="rounded px-2 py-1 text-xs" style={{ background: "#F3F1ED", color: "#847D77" }}>📅 {formatEpoch(order.createdAt)}</span>
              </div>
              {order.cancellationReason ? (
                <p className="mt-3 text-xs" style={{ color: "#B91C1C" }}>⚠️ Cancelled: {order.cancellationReason}</p>
              ) : null}
              {order.deleted ? <p className="mt-1 text-xs" style={{ color: "#B91C1C" }}>⚠️ Order deleted</p> : null}
              <Link href={`/orders/${order.id}`} className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: "#A86120" }}>
                View in Orders →
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default async function OrderFeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetchOrderFeedbackById(id);

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <Link href="/order-feedback" className="hover:underline">Order Feedback</Link><span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>#{id}</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-4">
        <Link href="/order-feedback" className="inline-flex items-center gap-1 text-sm" style={{ color: "#847D77" }}>
          <ArrowLeft className="h-4 w-4" /> Back to feedback
        </Link>
        {!res.ok ? (
          <ErrorBanner message={res.error} />
        ) : !res.data ? (
          <div className="rounded-lg border p-8 text-center" style={{ borderColor: "#E8E4DE" }}>
            <p className="text-sm font-medium" style={{ color: "#1A1714" }}>🔍 We couldn't find this feedback</p>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>It may have been removed, or the link is out of date.</p>
          </div>
        ) : (
          <Detail fb={res.data} />
        )}
      </div>
    </WeaveShell>
  );
}
