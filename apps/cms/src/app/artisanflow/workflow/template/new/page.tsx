/**
 * /artisanflow/workflow/template/new — fresh template BUILDER (empty start).
 *
 * Static segment, so it never collides with template/[id]. Save writes for
 * real (POST /add/workflow-template via /api/crud, sandbox pg only).
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { getWorkflowTemplateList, BackendFetchError } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { TemplateBuilder } from "@/components/artisanflow/TemplateBuilder";
import { Button } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function TemplateNewPage() {
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);
  // The template list only feeds the "clone an existing template" picker — a
  // SUPPLEMENTARY read. It was awaited bare, so a wrapper outage 500'd the whole
  // builder rather than degrading the picker. Show the banner and still let the
  // operator build a template from scratch.
  let list: Awaited<ReturnType<typeof getWorkflowTemplateList>> = [];
  let fetchError: BackendFetchError | null = null;
  try {
    list = await getWorkflowTemplateList(token);
  } catch (e) {
    if (e instanceof BackendFetchError) fetchError = e;
    else throw e;
  }
  const templates = list.map((t) => ({ id: t.id, name: t.name }));

  return (
    <ArtisanFlowShell parentCrumb={{ label: "Job Templates", href: "/artisanflow/workflow" }} crumb="New template">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>New template</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>Build a flow one stage at a time — or clone / start from a preset. Saves to the sandbox for real.</p>
          </div>
          <Link href="/artisanflow/workflow" className="flex-shrink-0">
            <Button variant="secondary" size="sm">← Job Templates</Button>
          </Link>
        </div>
        {fetchError && <ErrorBanner message={fetchError.message} />}
        <TemplateBuilder
          initialName=""
          initialDescription=""
          initialStages={[]}
          templates={templates}
        />
      </div>
    </ArtisanFlowShell>
  );
}
