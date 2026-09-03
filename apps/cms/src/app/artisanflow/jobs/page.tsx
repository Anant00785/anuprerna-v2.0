/**
 * /artisanflow/jobs — plain Production Jobs list, segregated by order vs
 * custom-order. Distinct from the attention board at /artisanflow (which
 * groups/triages overdue and unassigned work) — this is the flat "every job"
 * view.
 */
import React from "react";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { getWorkflowList, WORKFLOW_STATUSES, BackendFetchError } from "@/lib/artisanflow-api";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { JobsClient } from "./JobsClient";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function ProductionJobsPage() {
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);

  // Dedupe on (workflowType, id), never id alone. ORDER and CUSTOM_ORDER jobs
  // come from two backend tables with INDEPENDENT auto-increment sequences whose
  // ranges overlap almost completely (measured 2026-08-16 against the sandbox:
  // ORDER instance ids 525,129..1,000,000,731,001 vs CUSTOM_ORDER
  // 2,677,965..1,000,000,000,128 -- and both mint sandbox ids from their own
  // MAX(id)+1 above the same 1e12 floor, so the sandbox band collides by
  // construction). An id-only Set therefore silently DROPS a custom-order job
  // whose id happens to equal an order job's, and All Jobs would just be missing
  // a row with nothing on screen to say so. Same key getOrderBoard groups by.
  // These eight list reads ARE the page, so a wrapper outage has to render the
  // shared ErrorBanner like every other page in this tree — not escape the
  // server component as an opaque Next 500. getWorkflowList throws
  // BackendFetchError by design (a real outage must not masquerade as "no jobs"),
  // and it was awaited bare here.
  let lists: Awaited<ReturnType<typeof getWorkflowList>>[] = [];
  let fetchError: BackendFetchError | null = null;
  try {
    lists = await Promise.all(WORKFLOW_STATUSES.map((s) => getWorkflowList(s, token)));
  } catch (e) {
    if (e instanceof BackendFetchError) fetchError = e;
    else throw e;
  }

  const seen = new Set<string>();
  const jobs = lists.flat().filter((w) => {
    const key = `${w.workflowType}:${w.id}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });

  return (
    <WeaveShell breadcrumb={<span className="font-serif text-lg font-medium" style={{ color: "#1A1714" }}>All Jobs</span>}>
      {fetchError ? <ErrorBanner message={fetchError.message} /> : <JobsClient jobs={jobs} />}
    </WeaveShell>
  );
}
