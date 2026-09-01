/**
 * /artisanflow/workflow/feedback — workflow feedback queue.
 * Artisan/admin feedback per subprocess: PENDING / APPROVED / REJECTED.
 * REVIEW SURFACE WITH ACTIONS (2026-08-17). Approve / Reject / Approve & Notify
 * write through /api/crud -> PATCH update/element/feedback/admin. Because this
 * page now takes actions, it is the ONE /artisanflow route that suppresses the
 * module DRAFT banner (whose text says "Read-only"); every other page keeps it.
 *
 * WHAT IS AND IS NOT ACTIONABLE, stated here because the screen has to be honest
 * about it. /api/crud bands this write on the FEEDBACK ROW id, and all 2,728 rows
 * this queue serves were synced from live Loom and sit BELOW the sandbox floor —
 * so on today's data every row renders read-only with the refusal printed beside
 * it, and only a sandbox-minted QC record is actionable. That is the sandbox
 * posture working, not a broken page: a verdict recorded here against a Loom-owned
 * row would be a sandbox edit to production data.
 *
 * Reads the native queue endpoint, NOT Loom's per-kind preview list: the review
 * queue has to show custom-workflow feedback and rows whose rollup mapping is
 * missing, or the tab counts understate the outstanding work. The counts come
 * back with every call and are totals over the whole table, so a capped page
 * still reports the true number.
 */

import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getWorkflowFeedbackQueue, BackendFetchError, type WorkflowFeedbackQueue } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FeedbackClient } from "./FeedbackClient";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

/** Rows rendered per tab. The badge always shows the true total; this only caps
 *  how many cards are sent to the browser (APPROVED alone is ~2.7k rows). */
const PAGE_SIZE = 300;

/**
 * The three queue reads, degraded instead of fatal.
 *
 * getWorkflowFeedbackQueue swallows ordinary emptiness but deliberately RETHROWS
 * a systemic failure (unreachable / 401 / 5xx / "isolated" backend) so a real
 * outage can never masquerade as "no feedback outstanding" — that part is right
 * and is left alone. The bug was here: all three were awaited BARE inside a
 * Promise.all, so one systemic failure escaped the server component and 500'd
 * the whole route. That is the identical shape already fixed for
 * getWorkflowComments and for the order page's rollup (see the
 * getOrderWorkflowSummariesSafe note in artisanflow-api.ts); this page was
 * simply missed.
 *
 * MEASURED 2026-08-16: the sandbox backend answers
 * GET /get/element-feedback/queue with 503 kind:"isolated" — it is running code
 * that does not implement the route — so this page was a hard 500 for every
 * visitor. Reproduced identically on the untouched main build, so the crash
 * predates this change and the underlying 503 is a BACKEND deployment problem
 * (rebuild the wrapper), not something this page can fix.
 *
 * What it can do is stay on screen and say so. An empty queue and a broken queue
 * must never look alike — hence the banner rather than a silent zero.
 */
async function loadQueue(status: string, token?: string): Promise<WorkflowFeedbackQueue | BackendFetchError> {
  try {
    return await getWorkflowFeedbackQueue(status, token, PAGE_SIZE);
  } catch (e) {
    if (e instanceof BackendFetchError) return e;
    throw e;
  }
}

export default async function FeedbackPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

  const results = await Promise.all([
    loadQueue("PENDING", token),
    loadQueue("APPROVED", token),
    loadQueue("REJECTED", token),
  ]);

  const failure = results.find((r): r is BackendFetchError => r instanceof BackendFetchError);
  const [pending, approved, rejected] = results.map((r) =>
    r instanceof BackendFetchError ? { items: [], counts: undefined } : r,
  ) as WorkflowFeedbackQueue[];

  // All three calls return the same table-wide totals; take them from whichever
  // one answered (they are identical), falling back through the others.
  const counts = pending.counts ?? approved.counts ?? rejected.counts;

  return (
    <ArtisanFlowShell parentCrumb={{ label: "Production", href: "/artisanflow" }} crumb="Feedback" hideDraftBanner>
      {failure && (
        <ErrorBanner
          message={`${failure.message} Until then this queue reads empty because it could not be loaded — not because there is nothing outstanding.`}
        />
      )}
      <FeedbackClient
        pending={pending.items}
        approved={approved.items}
        rejected={rejected.items}
        counts={counts}
      />
    </ArtisanFlowShell>
  );
}
