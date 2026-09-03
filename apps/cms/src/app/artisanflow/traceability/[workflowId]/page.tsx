/**
 * /artisanflow/traceability/[workflowId] — product journey timeline.
 * Derives product → order → artisan/cluster → process → impact from existing links.
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { getWorkflow, getArtisanList, getOrderImpact, getWorkflowArtisanLineage, BackendFetchError } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { TraceTimeline } from "@/components/artisanflow/TraceTimeline";
import { Button, Card } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GitBranch } from "lucide-react";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps { params: Promise<{ workflowId: string }>; }

export default async function TraceabilityDetailPage({ params }: PageProps) {
  const { workflowId } = await params;
  const numericId = Number(workflowId);
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);

  let wf: Awaited<ReturnType<typeof getWorkflow>> = null;
  let fetchError: BackendFetchError | null = null;
  if (Number.isInteger(numericId)) {
    try {
      wf = await getWorkflow(numericId, token);
    } catch (e) {
      if (e instanceof BackendFetchError) fetchError = e;
      else throw e;
    }
  }

  if (fetchError) {
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Traceability", href: "/artisanflow/traceability" }} crumb={`#${workflowId}`}>
        <div className="flex flex-col gap-4 max-w-xl">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Can&apos;t load job</h1>
          <ErrorBanner message={fetchError.message} />
          <Link href="/artisanflow/traceability"><Button variant="secondary" size="sm">← Back to Traceability</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }
  if (!wf) {
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Traceability", href: "/artisanflow/traceability" }} crumb={`#${workflowId}`}>
        <div className="flex flex-col gap-4 max-w-xl">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Job not found</h1>
          <Link href="/artisanflow/traceability"><Button variant="secondary" size="sm">← Back to Traceability</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }

  // Real lineage: the legacy workflow-level `artisanAssignments` blob is stale
  // on most rows -- merge in the AUTHORITATIVE step/subprocess (element-level)
  // assignments (same source the instance/custom-workflow detail pages use for
  // their assignment panels) so the chain shows real artisans, not a dead field.
  // ORDER and CUSTOM_ORDER jobs are different entities sharing this one detail
  // shape: a custom job's order link lives under referenceOrderId, not orderId.
  const isCustomJob = wf.type === "CUSTOM_ORDER";
  const linkedOrderId = isCustomJob ? wf.referenceOrderId : wf.orderId;

  const steps = (wf.steps || []).filter((s) => !s.deleted);
  const needsArtisans = (wf.artisanAssignments || []).length > 0 || steps.length > 0;
  const [artisans, impact, lineage] = await Promise.all([
    needsArtisans ? getArtisanList(token) : Promise.resolve([]),
    // Impact is a live Zoho compute scoped to STANDARD orders only -- there is
    // no custom-order equivalent, so this stays order-only by design.
    !isCustomJob && wf.orderId ? getOrderImpact(wf.orderId, token) : Promise.resolve(null),
    getWorkflowArtisanLineage(wf.steps, wf.artisanAssignments, token),
  ]);

  const product = wf.product || wf.customProduct;
  const productName = (product as { name?: string })?.name || wf.name;

  return (
    <ArtisanFlowShell parentCrumb={{ label: "Traceability", href: "/artisanflow/traceability" }} crumb={productName}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Product journey</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Full provenance for <b style={{ color: "#1A1714" }}>{productName}</b> — {isCustomJob ? "custom order" : "order"} #{linkedOrderId ?? "—"}.
            </p>
          </div>
          <Link href={`/artisanflow/workflow/instance/${wf.id}`}>
            <Button variant="secondary" size="sm"><GitBranch className="h-3.5 w-3.5" /> Open job board</Button>
          </Link>
        </div>

        <Card padding="lg">
          <TraceTimeline wf={wf} artisans={artisans} impact={impact} assignments={lineage} />
        </Card>
      </div>
    </ArtisanFlowShell>
  );
}
