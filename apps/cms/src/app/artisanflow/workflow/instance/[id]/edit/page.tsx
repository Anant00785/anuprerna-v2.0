/**
 * /artisanflow/workflow/instance/[id]/edit — edit THIS job's own name,
 * description, start date, and stages. PATCHes /update/workflow for an ORDER
 * job and /update/custom-workflow for a CUSTOM_ORDER one (native, sandbox pg
 * only) — never touches the workflow_template it was created from, unlike the
 * old "Edit job" link which sent people to the template editor (a 2026-07-24
 * fix: editing a job was silently editing every other job made from the same
 * template too).
 *
 * getWorkflow() loads EITHER kind (the instance detail page renders its "Edit
 * job" link for both), so the kind handed to TemplateBuilder must be DERIVED
 * from the row, never assumed. It was hardcoded "order", so editing a custom
 * job PATCHed /update/workflow — a different table with an independent id
 * sequence — and either failed silently or wrote the unrelated ORDER row that
 * happened to share the id. Resolve it exactly the way the detail page does
 * (isCustomJob = wf.type === "CUSTOM_ORDER").
 *
 * Reachable until the job is COMPLETED. A template is a STARTING POINT only —
 * the job stays editable as work unfolds (add / remove / re-order / re-time
 * stages and tasks), which is the 2026-07-02 locked behaviour. The old
 * CREATED-only gate was written on the belief that the backend refuses a steps
 * rewrite once a step has begun; it does not. There is no status check on
 * either update path (workflow.service.ts updateWorkflow /
 * updateCustomWorkflow), so the gate was blocking the product rule rather than
 * a backend rule. A COMPLETED job is still excluded — reshaping the stage tree
 * of finished work has no operational meaning.
 *
 * SANDBOX FLOOR. Also refused for LIVE-SYNCED ids (id <= SANDBOX_FLOOR). This
 * page hands TemplateBuilder an editJob, and Save PATCHes update/workflow or
 * update/custom-workflow with a FULL steps rewrite plus a new name and
 * description. That is exactly as destructive to a Loom-derived row as the
 * delete this codebase already bands — it overwrites the stage tree the sandbox
 * cannot recreate — yet only the delete path was guarded, so a live-synced
 * instance sitting in CREATED (e.g. 133048758, the shape the old
 * .artisanflow-jobs.json fixture was full of) could be rewritten wholesale.
 * Guarded here at the trigger and, because a client-side check is not a control,
 * in /api/crud on the way out. See WorkflowDeleteButton for the same pattern on
 * the delete path.
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { getWorkflow, BackendFetchError } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { TemplateBuilder } from "@/components/artisanflow/TemplateBuilder";
import { deriveStage, type LiveStepNode, type RawStep } from "@/components/artisanflow/stages";
import { isSandboxId, sandboxRefusal } from "@/lib/sandbox-floor";
import { Button } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps { params: Promise<{ id: string }>; }

export default async function EditJobInstancePage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);
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

  const backHref = `/artisanflow/workflow/instance/${id}`;

  if (fetchError || !wf) {
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Production", href: "/artisanflow" }} crumb="Edit job">
        <div className="flex max-w-xl flex-col gap-4">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Can&apos;t load job</h1>
          {fetchError && <ErrorBanner message={fetchError.message} />}
          <Link href={backHref}><Button variant="secondary" size="sm">← Back to job</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }

  // Sandbox floor, checked on wf.id — the id TemplateBuilder will actually PATCH
  // — not on the URL param. Refuse BEFORE rendering the builder so the stage tree
  // is never even offered for rewriting.
  if (!isSandboxId(wf.id)) {
    const entity = wf.type === "CUSTOM_ORDER" ? "custom workflow" : "workflow";
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Production", href: "/artisanflow" }} crumb="Edit job">
        <div className="flex max-w-xl flex-col gap-4">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>This job can&apos;t be edited</h1>
          <p className="text-sm" style={{ color: "#847D77" }}>
            {sandboxRefusal("edit", entity)} — it was synced from live Loom, so rewriting its
            name, description or stages here would overwrite data the sandbox cannot recreate.
          </p>
          <Link href={backHref}><Button variant="secondary" size="sm">← Back to job</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }

  if ((wf.status || "").toUpperCase() === "COMPLETED") {
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Production", href: "/artisanflow" }} crumb="Edit job">
        <div className="flex max-w-xl flex-col gap-4">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>This job is finished</h1>
          <p className="text-sm" style={{ color: "#847D77" }}>
            Stages stay editable while a job is running, but reshaping the plan of work that is already complete would only rewrite history.
          </p>
          <Link href={backHref}><Button variant="secondary" size="sm">← Back to job</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }

  // Same discriminator the detail page uses for its order link and its delete
  // control — ORDER and CUSTOM_ORDER are separate tables, so this decides which
  // update endpoint TemplateBuilder is allowed to write to.
  const isCustomJob = wf.type === "CUSTOM_ORDER";

  const stages = (wf.steps || []).filter((s) => !s.deleted).map((s, i) => deriveStage(s as RawStep, i));
  const estimatedStartDate = wf.estimatedStartDate
    ? new Date(wf.estimatedStartDate).toISOString().slice(0, 10)
    : undefined;

  return (
    <ArtisanFlowShell parentCrumb={{ label: "Production", href: "/artisanflow" }} crumb="Edit job">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Edit job</h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Changes apply to this job only — the template it was created from is untouched.
            Add, remove, re-order or re-time stages and tasks as the work changes.
          </p>
        </div>
        <TemplateBuilder
          initialName={wf.name}
          initialDescription={wf.description || ""}
          initialEstimatedStartDate={estimatedStartDate}
          initialStages={stages}
          templates={[]}
          // The LIVE nodes go with the edit so Save can MERGE onto them rather
          // than replace them -- see toJobSteps / EditJobMeta.originalSteps.
          editJob={{
            workflowId: wf.id,
            kind: isCustomJob ? "custom-order" : "order",
            originalSteps: (wf.steps || []) as unknown as LiveStepNode[],
          }}
        />
      </div>
    </ArtisanFlowShell>
  );
}
