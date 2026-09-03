/**
 * /artisanflow/custom-orders/[id] — Custom order detail (money-sensitive).
 *
 * Server component. Fetches the order detail + fulfillment list + ready list via
 * the service token (read-only wrapper) and renders the pricing math, items and
 * fulfilment state. The money figures are RECOMPUTED with the same logic the old
 * Weave overview used (see computeCustomOrderMoney) so the numbers match what
 * staff saw. READ-ONLY — no adjust/cancel/track actions.
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import {
  getCustomOrderDetail,
  getCustomOrderFulfillmentList,
  getCustomOrderReadyList,
  getOrderWorkflowSummariesSafe,
  getOrderWorkflowPreviewsSafe,
  getArtisanList,
  getWorkflowArtisanMappings,
  getStepElementArtisanMappings,
  getSubProcessElementArtisanMappings,
  getCustomOrderImpact,
  BackendFetchError,
} from "@/lib/artisanflow-api";
import { buildOrderArtisanRoster } from "@/lib/order-artisan-roster";
import type { OrderImpact } from "@/lib/artisanflow-api";
import { buildCustomOrderProductionWatch } from "@/lib/order-production-watch";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { Button } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { getCustomProductList } from "@/lib/custom-products-api";
import { CustomOrderDetailView } from "./CustomOrderDetailView";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return <NotFound id={id} reason="Invalid custom-order id." />;
  }

  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);

  let order: Awaited<ReturnType<typeof getCustomOrderDetail>> = null;
  try {
    order = await getCustomOrderDetail(numericId, token);
  } catch (e) {
    if (e instanceof BackendFetchError) return <FetchFailed id={id} error={e} />;
    throw e;
  }
  if (!order) {
    return <NotFound id={id} reason="No custom order matched this id." />;
  }

  // FRESH per-job status / overdue / unassigned / product name. Fetched FIRST
  // and handed to the rollup reader so the two do not scan the same workflow
  // lists twice (see getOrderWorkflowSummariesFresh's `previews` parameter).
  // Why two sources at all: getOrderWorkflowPreviewsSafe explains which one
  // wins which field, and by how much they disagree today.
  const workflowPreviews = await getOrderWorkflowPreviewsSafe(numericId, "custom-order", token);
  const [
    fulfillments,
    readies,
    productsResult,
    orderWorkflows,
    artisans,
    wfArtisanMappings,
    stepArtisanMappings,
    subArtisanMappings,
  ] = await Promise.all([
    getCustomOrderFulfillmentList(numericId, token),
    getCustomOrderReadyList(numericId, token),
    getCustomProductList(),
    getOrderWorkflowSummariesSafe(numericId, "custom-order", token, workflowPreviews),
    // WHO is on each line. Four reads, all whole-table and all shared across
    // the order's 24 jobs — see order-artisan-roster.ts for why this is
    // cheaper than the per-node assignment endpoint (3 GETs vs ~160).
    getArtisanList(token),
    getWorkflowArtisanMappings(token),
    getStepElementArtisanMappings(token),
    getSubProcessElementArtisanMappings(token),
  ]);

  // Assemble the Order Watch model server-side: the join lives in one pure
  // function, the page just renders it.
  const watch = buildCustomOrderProductionWatch({
    order,
    readies,
    fulfillments,
    workflows: orderWorkflows,
    previews: workflowPreviews,
  });

  // workflowId -> distinct artisan roster, so the production table can name
  // people instead of printing the word "Assigned".
  const artisanRoster = buildOrderArtisanRoster({
    workflows: orderWorkflows,
    artisans,
    workflowMappings: wfArtisanMappings,
    stepMappings: stepArtisanMappings,
    subProcessMappings: subArtisanMappings,
  });

  // IMPACT. Custom orders have their OWN endpoint; calling the regular
  // /get/impact/order/{id} with a custom order id returns a well-formed
  // ALL-ZERO envelope, which would render as a confident dashboard claiming
  // this order had no impact. Failures are caught here rather than allowed to
  // take the page down, because a missing impact route is not a reason to stop
  // showing an order — but the REASON is carried through to the panel so it can
  // say which kind of nothing this is.
  let impact: OrderImpact | null = null;
  let impactUnavailable: string | undefined;
  try {
    impact = await getCustomOrderImpact(numericId, token);
    if (!impact || (impact.items ?? []).length === 0) {
      impactUnavailable =
        `No impact rows exist for custom order #${numericId} yet. Impact is calculated by Loom per line; nothing is shown here rather than a zeroed dashboard, because a 0 would read as a measurement that was never taken.`;
    }
  } catch (e) {
    impact = null;
    impactUnavailable =
      `Impact could not be read for this order: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Custom-product catalogue for the "Add item" picker (read-only; sandbox copy).
  const products = productsResult.ok
    ? productsResult.data.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        productGroup: p.productGroup,
        unit: p.unit,
        heroImage: p.heroImage,
      }))
    : [];

  return (
    <ArtisanFlowShell parentCrumb={{ label: "Custom Orders", href: "/artisanflow/custom-orders" }} crumb={`#${order.id}`}>
      {/* readies / fulfillments ARE passed on now: besides feeding the `watch`
          model's per-line history, they are the source of the order-level BATCH
          roll-up at the bottom of the page (grouped by consignment, not by
          item). orderWorkflows still exists only to build `watch` + the roster. */}
      <CustomOrderDetailView
        order={order}
        products={products}
        watch={watch}
        readies={readies}
        fulfillments={fulfillments}
        artisanRoster={artisanRoster}
        impact={impact}
        impactUnavailable={impactUnavailable}
      />
    </ArtisanFlowShell>
  );
}

function NotFound({ id, reason }: { id: string; reason: string }) {
  return (
    <ArtisanFlowShell parentCrumb={{ label: "Custom Orders", href: "/artisanflow/custom-orders" }} crumb={`#${id}`}>
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
          Custom order not found
        </h1>
        <div
          className="rounded-xl border px-5 py-4 text-sm"
          style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
        >
          {reason}
        </div>
        <Link href="/artisanflow/custom-orders">
          <Button variant="secondary" size="sm">← Back to Custom Orders</Button>
        </Link>
      </div>
    </ArtisanFlowShell>
  );
}

/** Distinct from NotFound above: this is a backend/config problem, not a
 *  genuinely missing record — never conflate the two on screen. */
function FetchFailed({ id, error }: { id: string; error: BackendFetchError }) {
  return (
    <ArtisanFlowShell parentCrumb={{ label: "Custom Orders", href: "/artisanflow/custom-orders" }} crumb={`#${id}`}>
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
          Can&apos;t load custom order
        </h1>
        <ErrorBanner message={error.message} />
        <Link href="/artisanflow/custom-orders">
          <Button variant="secondary" size="sm">← Back to Custom Orders</Button>
        </Link>
      </div>
    </ArtisanFlowShell>
  );
}
