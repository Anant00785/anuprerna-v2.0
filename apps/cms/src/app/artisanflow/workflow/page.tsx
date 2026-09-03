/**
 * /artisanflow/workflow — Workflow Templates.
 *
 * Server component. Loads the workflow TEMPLATES (the reusable step/subprocess
 * definitions) only. Live workflow INSTANCES live on the Production board
 * (/artisanflow), and a job is started from the ORDER ITEM it is for, so this
 * page no longer loads the product catalogue — it existed solely to feed the
 * standalone "Start job" order/product picker, removed 2026-08-16.
 */

import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { getWorkflowTemplateList, BackendFetchError } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { WorkflowClient } from "./WorkflowClient";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function WorkflowPage() {
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);

  // getWorkflowTemplateList throws BackendFetchError on a wrapper outage and was
  // awaited bare, so the whole Job Templates screen 500'd instead of banner-ing.
  let templates: Awaited<ReturnType<typeof getWorkflowTemplateList>> = [];
  let fetchError: BackendFetchError | null = null;
  try {
    templates = await getWorkflowTemplateList(token);
  } catch (e) {
    if (e instanceof BackendFetchError) fetchError = e;
    else throw e;
  }

  return (
    <ArtisanFlowShell crumb="Job Templates">
      {fetchError ? <ErrorBanner message={fetchError.message} /> : <WorkflowClient templates={templates} />}
    </ArtisanFlowShell>
  );
}
