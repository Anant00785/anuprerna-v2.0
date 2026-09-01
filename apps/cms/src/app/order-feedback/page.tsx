/**
 * /order-feedback — Order Feedback hub (server entry point).
 *
 * Mirrors the live "Manage Feedbacks" -> Order Feedbacks screen. The list is
 * server-fetched (per-request live-Loom service token, see order-feedback-api.ts)
 * so keep force-dynamic. A Loom outage passes an error string to the client,
 * which renders the shared ErrorBanner instead of empty buckets.
 */
import React from "react";
import { fetchOrderFeedbackList } from "@/lib/order-feedback-api";
import { OrderFeedbackClient } from "./OrderFeedbackClient";

export const dynamic = "force-dynamic";

export default async function OrderFeedbackPage() {
  const res = await fetchOrderFeedbackList();
  return (
    <OrderFeedbackClient
      rows={res.ok ? res.data : []}
      error={res.ok ? null : res.error}
    />
  );
}
