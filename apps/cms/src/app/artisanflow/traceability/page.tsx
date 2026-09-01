/**
 * /artisanflow/traceability — pick a product/workflow to trace.
 * Lists live + completed workflow instances; each links to its journey timeline.
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getWorkflowList, getWorkflowListMulti, ACTIVE_WORKFLOW_STATUSES, BackendFetchError } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import { formatEpoch, formatCount } from "@/lib/utils";
import { Route, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";
const CAP = 60;

export default async function TraceabilityIndexPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());
  // Live/in-progress = the non-completed Loom workflow statuses (CREATED +
  // INITIATED + HALTED). The prior "IN_PROGRESS" is a workflow-STEP status, not
  // a workflow status, so the endpoint matched nothing and every live workflow
  // (the ~64 INITIATED + ~32 CREATED) silently vanished from the list.
  // Both reads ARE the page. Awaited bare, a wrapper outage escaped as an opaque
  // Next 500; render the shared ErrorBanner like the rest of this tree.
  let inProgress: Awaited<ReturnType<typeof getWorkflowListMulti>> = [];
  let completed: Awaited<ReturnType<typeof getWorkflowList>> = [];
  let fetchError: BackendFetchError | null = null;
  try {
    [inProgress, completed] = await Promise.all([
      getWorkflowListMulti(ACTIVE_WORKFLOW_STATUSES, token),
      getWorkflowList("COMPLETED", token),
    ]);
  } catch (e) {
    if (e instanceof BackendFetchError) fetchError = e;
    else throw e;
  }
  const all = [...inProgress, ...completed];

  return (
    <ArtisanFlowShell crumb="Traceability">
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#F5F3FF", color: "#6D28D9" }}>
            <Route className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Traceability</h1>
            <p className="mt-1 max-w-2xl text-sm" style={{ color: "#847D77" }}>
              The journey of every product: <b>product → order → artisan &amp; cluster → process → impact</b>.
              Pick a product workflow to see its full provenance timeline.
            </p>
          </div>
        </div>

        {fetchError && <ErrorBanner message={fetchError.message} />}

        <div className="flex flex-col gap-2">
          {!fetchError && all.slice(0, CAP).map((w) => (
            <Link
              key={w.id}
              href={`/artisanflow/traceability/${w.id}`}
              className="group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-shadow hover:shadow-card"
              style={{ borderColor: "#E8E4DE" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {w.productImage ? (
                <img src={w.productImage} alt="" className="h-11 w-11 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-11 w-11 flex-shrink-0 rounded-lg" style={{ background: "#F3F1ED" }} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: "#1A1714" }}>{w.productName || w.name}</p>
                <p className="truncate text-xs" style={{ color: "#847D77" }}>
                  {w.productSku ? `SKU ${w.productSku} · ` : ""}Order #{w.orderId} · {formatEpoch(w.orderCreatedAt)}
                </p>
              </div>
              <StatusPill status={w.status} />
              <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "#AAA39E" }} />
            </Link>
          ))}
          {!fetchError && all.length === 0 && (
            <div className="rounded-xl border py-10 text-center text-sm" style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#AAA39E" }}>
              No traceable workflows found.
            </div>
          )}
          {all.length > CAP && (
            <p className="pt-1 text-center text-xs" style={{ color: "#AAA39E" }}>
              Showing {CAP} of {formatCount(all.length)} (preview cap).
            </p>
          )}
        </div>
      </div>
    </ArtisanFlowShell>
  );
}
