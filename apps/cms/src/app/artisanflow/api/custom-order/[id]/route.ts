/**
 * GET /artisanflow/api/custom-order/[id]
 *
 * Read-only lazy-load endpoint for the custom-orders list INLINE EXPAND panel.
 * The list preview (CustomOrderPreview) carries no per-item production state, so
 * when a row is expanded the client fetches the full order detail plus the
 * native per-order-item workflow rollup here — the exact same server-side reads
 * the /custom-orders/[id] detail page does. No writes. Service-token minted
 * server-side; never reaches the client.
 *
 * It also ASSEMBLES the Order Watch model here rather than shipping four raw
 * lists to the browser: the join (which source wins status/overdue/quantities)
 * is the part that can be got subtly wrong, so it runs in exactly one place —
 * buildCustomOrderProductionWatch — for both this route and the detail page.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import {
  getCustomOrderDetail,
  getCustomOrderReadyList,
  getCustomOrderFulfillmentList,
  getOrderWorkflowSummariesSafe,
  getOrderWorkflowPreviewsSafe,
  BackendFetchError,
} from "@/lib/artisanflow-api";
import { buildCustomOrderProductionWatch } from "@/lib/order-production-watch";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

  // getCustomOrderDetail throws BackendFetchError on a wrapper outage and was
  // awaited bare, so Next answered with an opaque HTML 500 and the inline-expand
  // client's r.json() died on "Unexpected token '<'" instead of showing its
  // ErrorBanner. Answer 502 with the classified message, same as
  // /artisanflow/api/board.
  let order: Awaited<ReturnType<typeof getCustomOrderDetail>>;
  try {
    order = await getCustomOrderDetail(numericId, token);
  } catch (e) {
    if (e instanceof BackendFetchError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    throw e;
  }
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  // All four are non-throwing by construction: the …Safe pair swallow
  // BackendFetchError, and the ready/fulfilment readers already return [] on a
  // non-systemic miss. A degraded production panel beats a dead row.
  const workflowPreviews = await getOrderWorkflowPreviewsSafe(numericId, "custom-order", token);
  const [orderWorkflows, readies, fulfillments] = await Promise.all([
    getOrderWorkflowSummariesSafe(numericId, "custom-order", token, workflowPreviews),
    getCustomOrderReadyList(numericId, token).catch(() => []),
    getCustomOrderFulfillmentList(numericId, token).catch(() => []),
  ]);

  const watch = buildCustomOrderProductionWatch({
    order,
    readies,
    fulfillments,
    workflows: orderWorkflows,
    previews: workflowPreviews,
  });

  return NextResponse.json({ order, orderWorkflows, watch });
}
