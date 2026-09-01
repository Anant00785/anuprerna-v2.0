/**
 * GET /api/orders/[id]
 *
 * Client-callable order detail lookup — thin wrapper around getOrderById.
 * Used by StartJobDialog to scope the product picker to the items on a
 * selected order once "Order" is chosen. Read-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrderById } from "@/lib/api";
import { getOrderWorkflowSummariesSafe } from "@/lib/artisanflow-api";
import { getServiceToken } from "@/lib/loom-service-token";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Session cookie first, service token only as the fallback -- the same order
  // every sibling route added by this change uses (/artisanflow/api/board,
  // /artisanflow/api/custom-order/[id], /artisanflow/api/custom-orders/search).
  // Reaching straight for the shared admin credential made this the one
  // client-callable read in the set that could never act as the signed-in user.
  // Validate BEFORE any fetch. Number("abc") is NaN, and NaN was being
  // interpolated straight into the upstream URL (/get/order/NaN), so a typo'd or
  // probed path became a backend round-trip that could only ever fail. Every
  // sibling route added by this change already does this (see
  // /artisanflow/api/custom-order/[id]); this one was the outlier.
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

  try {
    const [order, orderWorkflows] = await Promise.all([
      getOrderById(numericId, token),
      getOrderWorkflowSummariesSafe(numericId, "order", token),
    ]);
    if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
    return NextResponse.json({ order, orderWorkflows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
