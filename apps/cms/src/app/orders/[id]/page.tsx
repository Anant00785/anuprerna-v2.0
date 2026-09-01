/**
 * /orders/[id] — Order detail (Server Component, Milestone 3)
 *
 * Fetches a single order by its numeric id from Loom via service token, plus its
 * fulfillment-history (shipment + partial-ready records). Read-only view — write
 * actions (cancel, track, fulfill) deferred to cutover. Custom orders are a
 * bespoke corner deferred to the bespoke-corners pause.
 */

import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getOrderById } from "@/lib/api";
import { getOrderFulfillmentList, getOrderReadyList } from "@/lib/order-fulfillment-api";
import { getOrderWorkflowSummariesSafe } from "@/lib/artisanflow-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Button } from "@/components/ui";
import { OrderDetailView } from "./OrderDetailView";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return <NotFound id={id} reason="Invalid order id." />;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  const token = cookieToken ?? await getServiceToken();

  let order;
  try {
    order = await getOrderById(numericId, token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return <LoadError message={message} />;
  }

  if (!order) {
    return <NotFound id={id} reason="No order matched this id." />;
  }

  // Fulfillment history is a live-Loom proxied read (getLiveLoomToken inside),
  // independent of the sandbox order fetch. Never blocks the page: each returns
  // a Result so an outage renders an ErrorBanner in-section, not a broken page.
  const [fulfillmentRes, readyRes, orderWorkflows] = await Promise.all([
    getOrderFulfillmentList(numericId),
    getOrderReadyList(numericId),
    getOrderWorkflowSummariesSafe(numericId, "order", token),
  ]);

  const fulfillments = fulfillmentRes.ok ? fulfillmentRes.data : [];
  const readies = readyRes.ok ? readyRes.data : [];
  const fulfilmentError = !fulfillmentRes.ok
    ? fulfillmentRes.error
    : !readyRes.ok
      ? readyRes.error
      : undefined;

  return (
    <OrderDetailView
      order={order}
      fulfillments={fulfillments}
      readies={readies}
      fulfilmentError={fulfilmentError}
      orderWorkflows={orderWorkflows}
    />
  );
}

function NotFound({ id, reason }: { id: string; reason: string }) {
  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/orders" style={{ color: "#847D77" }}>Orders</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>#{id}</span>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Order not found</h1>
        <div
          className="rounded-xl border px-5 py-4 text-sm"
          style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
        >
          {reason}
        </div>
        <Link href="/orders">
          <Button variant="secondary" size="sm">← Back to Orders</Button>
        </Link>
      </div>
    </WeaveShell>
  );
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div
        className="rounded-xl border px-6 py-5 max-w-lg text-sm"
        style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
      >
        <p className="font-semibold mb-1">Failed to load order</p>
        <p style={{ color: "#B45309" }}>{message}</p>
      </div>
    </div>
  );
}
