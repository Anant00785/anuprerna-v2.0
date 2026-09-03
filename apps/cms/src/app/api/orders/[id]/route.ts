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
import { getBackendCallToken } from "@/lib/backend-call-token";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Credential order is decided in src/lib/backend-call-token.ts: service
  // token first, session cookie as the fallback. This comment previously
  // described the opposite order, which the v2 API rejects -- it cannot verify
  // a Loom-signed `weave_token` ("Invalid token signature", 401).
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
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);

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
