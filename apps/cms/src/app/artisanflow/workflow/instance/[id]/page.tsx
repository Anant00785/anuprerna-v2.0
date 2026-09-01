/**
 * /artisanflow/workflow/instance/[id] — LIVE workflow instance board.
 * STAGES + TASKS with live status, artisan assignments, sign-off feedback,
 * rendered by the Kanban (PipelineSwimlane): one lane per stage, three columns
 * (To do / In progress / Done), with work order enforced — exactly one card is
 * draggable at a time. "Edit job" goes to ./edit, which edits this job's own
 * name/description/stages — never the shared template.
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import {
  getWorkflow,
  getArtisanList,
  getStepElementAssignments,
  getSubProcessElementAssignments,
  getWorkflowComments,
  getCustomOrderDetail,
  orderWorkflowSteps,
  workflowDelaySummary,
  workflowSchedule,
  BackendFetchError,
  type WorkflowDelaySummary,
  type WorkflowSchedule,
} from "@/lib/artisanflow-api";
import { getIdentity } from "@/lib/feedback-identity";
import { computeStepProgress, computeTaskCounts, type WorkflowProgress } from "@/lib/workflow-progress";
import { getOrderById } from "@/lib/api";
import { isSandboxId, sandboxRefusal } from "@/lib/sandbox-floor";
import {
  canWriteNodeSchedule,
  canWriteNodeValues,
  canWriteWorkflow,
  chainEnd,
} from "@/lib/workflow-ops";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { PipelineSwimlane } from "@/components/artisanflow/PipelineSwimlane";
import {
  WorkflowArtisanPanel,
  type ElementAssignmentRow,
  type QuantityMode,
} from "@/components/artisanflow/WorkflowArtisanPanel";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import { WorkflowDeleteButton } from "@/components/artisanflow/WorkflowDeleteButton";
import { WorkflowNotePanel } from "@/components/artisanflow/WorkflowNotePanel";
import { DiscussionPanel } from "@/components/artisanflow/DiscussionPanel";
import { Button, Card } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { formatEpoch } from "@/lib/utils";
import { Users, Route, ShoppingBag, AlertTriangle, CheckCircle2, Clock, Pencil, CalendarClock, Package } from "lucide-react";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

// Hard-delete of a workflow INSTANCE is off by default. Verified against the
// sandbox wrapper on :8090 (2026-08-16): DELETE delete/workflow/{id} and
// delete/custom-workflow/{id} answer HTTP 501 {"error":"not_implemented",
// "message":"Wrapper is READ-ONLY. Write methods are disabled."} — the routes are
// not deployed. They exist only on anuprerna-backend branch
// `workflow-modification` (commit 7641f4b4 adds the sandbox-floor guard and the
// all-or-nothing transaction), which is unmerged. Shipping a button that always
// errors is worse than not shipping it, so the control renders only when the
// operator opts in with WORKFLOW_INSTANCE_DELETE_ENABLED=true — flip it once
// that backend branch is merged and deployed.
const WORKFLOW_DELETE_ENABLED = (process.env.WORKFLOW_INSTANCE_DELETE_ENABLED ?? "").toLowerCase() === "true";

interface PageProps { params: Promise<{ id: string }>; }

export default async function InstanceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

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
      <ArtisanFlowShell parentCrumb={{ label: "Production", href: "/artisanflow" }} crumb={`Instance #${id}`}>
        <div className="flex flex-col gap-4 max-w-xl">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Can&apos;t load job</h1>
          <ErrorBanner message={fetchError.message} />
          <Link href="/artisanflow"><Button variant="secondary" size="sm">← Back to Production</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }
  if (!wf) {
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Production", href: "/artisanflow" }} crumb={`Instance #${id}`}>
        <div className="flex flex-col gap-4 max-w-xl">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Job not found</h1>
          <Link href="/artisanflow"><Button variant="secondary" size="sm">← Back to Production</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }

  const steps0 = (wf.steps || []).filter((s) => !s.deleted);
  const needsArtisans = (wf.artisanAssignments || []).length > 0 || steps0.length > 0;
  const artisans = needsArtisans ? await getArtisanList(token) : [];
  const artisanName = (aid: number) => {
    const a = artisans.find((x) => x.id === aid);
    return a?.tenant?.name || a?.tenant?.uid || `Artisan #${aid}`;
  };
  const assignableArtisans = artisans.map((a) => ({ id: a.id, name: artisanName(a.id) }));

  // Per-step/subprocess artisan assignments (element-level, separate from the
  // workflow-level `artisanAssignments` list above) — fetched in parallel.
  const stepAssignments = await Promise.all(
    steps0.map((s) => getStepElementAssignments(s.id, token)),
  );
  const subAssignmentsByStep = await Promise.all(
    steps0.map((s) =>
      Promise.all(
        (s.subProcesses || []).filter((sp) => !sp.deleted).map((sp) => getSubProcessElementAssignments(sp.id, token)),
      ),
    ),
  );

  // ORDER and CUSTOM_ORDER jobs are different entities sharing this one detail
  // shape: a custom job's order link lives under referenceOrderId, not orderId
  // (see buildCustomWorkflowDetail on the backend) -- resolve by wf.type rather
  // than assuming orderId is always populated.
  const isCustomJob = wf.type === "CUSTOM_ORDER";
  const linkedOrderId = isCustomJob ? wf.referenceOrderId : wf.orderId;
  const orderHref = isCustomJob ? `/artisanflow/custom-orders/${linkedOrderId}` : `/orders/${linkedOrderId}`;

  const product = wf.product || wf.customProduct;
  const productName = (product as { name?: string })?.name;
  const productSku = (product as { sku?: string })?.sku;
  const productImage = (product as { heroImage?: string })?.heroImage;
  const category = wf.product?.subCategory?.segment?.category?.name;

  const steps = (wf.steps || []).filter((s) => !s.deleted);
  // ONE progress rule for the whole production surface
  // (src/lib/workflow-progress.ts): a STAGE that is IN_PROGRESS counts HALF.
  // Order Watch, the custom-order panels and this page all go through those
  // helpers; this page used to carry its own done-only copy inline, which is
  // how it came to report 0% for a job that was underway. The task tally beside
  // the percentage is a COUNT, never half-weighted.
  //
  // It still will not always MATCH an order row, and that is a data fact rather
  // than a rule difference: the order surfaces read the denormalised
  // workflow_order_summary rollup, which the backend does not recompute on
  // element writes, while this page reads the authoritative job detail. See the
  // measured example in workflow-progress.ts. This page shows the live truth.
  const progress = computeStepProgress(wf.steps || []);
  const taskCounts = computeTaskCounts(wf.steps || []);
  const progressPct = progress.pct;

  // Quantity is INHERITED from the order item and shown with its provenance.
  // It is still never entered on a template or on a stage (the 2026-07-02
  // simplification stands) -- what changed on 2026-08-16 is that the operator
  // can now commit a DIFFERENT quantity to the artisans doing the work
  // ("if I want, I can edit it"), and any divergence from this order line is
  // stated out loud by WorkflowArtisanPanel rather than left to be discovered.
  // Best-effort: both lookups already swallow their own misses, and a missing
  // quantity simply hides the chip rather than failing the page.
  let orderQty: { quantity: number; unit?: string } | null = null;
  if (linkedOrderId != null) {
    const orderItemId = isCustomJob ? wf.referenceOrderItemId : wf.orderItemId;
    if (isCustomJob) {
      const co = await getCustomOrderDetail(linkedOrderId, token).catch(() => null);
      const it = (co?.orderItems || []).find((x) => x.id === orderItemId) ?? (co?.orderItems || [])[0];
      if (it) orderQty = { quantity: it.quantity, unit: it.unit };
    } else {
      const od = await getOrderById(linkedOrderId, token).catch(() => null);
      const it = (od?.items || []).find((x) => x.id === orderItemId) ?? (od?.items || [])[0];
      if (it) orderQty = { quantity: it.quantity, unit: it.unit };
    }
  }

  // What this job can actually SAVE. Both gates are measured facts about the
  // deployed backend, not guesses -- see workflow-ops.ts. Every control below
  // is handed its capability so it can explain itself instead of appearing to
  // work and silently discarding the write.
  const workflowWrite = canWriteWorkflow(wf);
  // THREE writes, TWO capabilities — and the count dropping is the point.
  //
  //   nodeValueWrite — the CAPTURED DETAIL VALUES. Moved to the per-node PATCH
  //                    /update/{step,subprocess}-element merge, which has no status
  //                    gate at all, so a QC value can be recorded on a running job.
  //                    Sharing one capability is what made "Edit values" disappear
  //                    on every started job — i.e. on every real job.
  //   nodeSchedWrite — the ESTIMATED SCHEDULE, moved to that SAME per-node route for
  //                    exactly the same reason and on the same day. Amit opened a
  //                    running job, tried to postpone a stage and found no way to do
  //                    it, while live Weave does it in two clicks. Gating this on the
  //                    whole-tree rule again would re-break it on every real job.
  //   workflowWrite  — the job ROW's own start/end, banded by the sandbox floor.
  //
  // canWriteStepTree is deliberately NOT called here any more. It describes the
  // whole-tree `steps` write, and after the two moves above NOTHING on this page
  // performs one — its last effect was a banner claiming stage dates were read-only,
  // rendered directly above date chips that had started working. It still exists in
  // workflow-ops for a caller that genuinely sends the array; this page is not one.
  const nodeValueWrite = canWriteNodeValues(wf);
  const nodeSchedWrite = canWriteNodeSchedule(wf);

  // Loom keeps the two work measures mutually exclusive (applyWorkflowPlanningDetails
  // nulls whichever is not in play), so pick the one this job is actually
  // planned in and never write both.
  const quantityMode: QuantityMode =
    wf.avgWorkHoursPerProduct != null || wf.fabricUsedPerProductInMeters != null
      ? "products"
      : (wf.artisanAssignments || []).some((a) => a.quantityOfProducts != null)
        ? "products"
        : "fabric";


  // Roll STAGE- and TASK-level artisan rows up to the job.
  //
  // `wf.artisanAssignments` alone is NOT the roster: it is backed by the single
  // workflow_artisan_mapping table and is capped at ONE row per workflow
  // (measured over all 2,082 jobs, never 2). The multiplicity Amit asked for
  // lives in step_element_artisan_mapping and subprocess_element_artisan_mapping,
  // which are already fetched above per node for the pipeline cards — so the
  // rollup is free, and reading only the workflow field would show 1 artisan for
  // a job that has 6. Measured post-resync 2026-08-16: 319 jobs carry >= 2
  // assignments, 269 carry >= 2 DISTINCT artisans, max 6 assignments / 5 artisans.
  const elementAssignments: ElementAssignmentRow[] = [
    ...steps0.flatMap((s, si) =>
      (stepAssignments[si] || []).map((a) => ({
        artisanId: a.artisanId,
        kind: "step" as const,
        elementName: (s.name || "Untitled stage").trim(),
        quantityOfFabricInMeters: a.quantityOfFabricInMeters,
        quantityOfProducts: a.quantityOfProducts,
      })),
    ),
    ...steps0.flatMap((s, si) =>
      (s.subProcesses || [])
        .filter((sp) => !sp.deleted)
        .flatMap((sp, spi) =>
          ((subAssignmentsByStep[si] || [])[spi] || []).map((a) => ({
            artisanId: a.artisanId,
            kind: "subprocess" as const,
            elementName: (sp.name || "Untitled task").trim(),
            quantityOfFabricInMeters: a.quantityOfFabricInMeters,
            quantityOfProducts: a.quantityOfProducts,
          })),
        ),
    ),
  ];

  const now = Date.now();
  // The SECOND end date. `schedule.plannedEnd` is the workflow row's stored
  // estimatedEndDate; this is where the STAGES actually finish, idle gaps and
  // all. Nothing recomputes the stored field when a stage is edited (here or in
  // Loom), so the two CAN drift, and when they do the summary strip says so
  // rather than making one silently mirror the other.
  //
  // Measured 2026-08-17 across all 376 live workflows with a resolvable dated
  // chain: they drift on ZERO of them. An earlier pass reported instance
  // 133044983 as 14 days apart; that was an artefact of the old back-to-back
  // resequence() collapsing the job's real 14-day idle gap between Yarn
  // Processing and Yarn Weaving, not a disagreement in the data. Read from the
  // stored dates, 133044983's chain ends 11 Sept 2026 and its saved end is
  // 11 Sept 2026. The notice is kept because the two remain different
  // quantities that a partial write can separate — it is simply silent now,
  // which is the correct behaviour rather than a lost feature.
  // Same helper the board uses to preview a reschedule, so the two agree.
  const orderedSteps = orderWorkflowSteps(steps);
  const stageChainEnd = chainEnd(orderedSteps, wf.estimatedStartDate || orderedSteps[0]?.estimatedStartDate || 0);
  const delay = workflowDelaySummary(steps, now);
  const schedule = workflowSchedule(wf, delay, now);
  const isDone = (wf.status || "").toUpperCase() === "COMPLETED";

  // The discussion thread is a SIDE PANEL, not the page. getWorkflowComments was
  // awaited bare, so when GET /get/workflow/{id}/comments is unavailable the
  // BackendFetchError escaped the server component and the whole job detail page
  // -- the central screen of this change -- became a hard 500. That is live right
  // now: the deployed sandbox wrapper answers that route with
  // 503 {"success":false,"message":"Sandbox isolated: live Loom is disabled
  // (LOOM_PROXY_ENABLED=false)"}, because the native comment endpoints ship on
  // anuprerna-backend branch `workflow-modification`, which is not merged.
  // Degrade to an empty thread and keep the pipeline, schedule and assignments
  // rendering; same treatment the board route gives its comment-count badges.
  const [comments, identity] = await Promise.all([
    getWorkflowComments(wf.id, token).catch((e) => {
      if (e instanceof BackendFetchError) return [];
      throw e;
    }),
    getIdentity(),
  ]);
  const currentUserName = identity.name || identity.email || "Team member";

  // Element-level assignments folded into the pipeline board itself, so
  // "advance stages" and "assign artisans" are one section, not two.
  const boardAssignments = steps0.length > 0 ? {
    artisans: assignableArtisans,
    step: Object.fromEntries(steps0.map((s, si) => [s.id, stepAssignments[si] || []])),
    subprocess: Object.fromEntries(
      steps0.flatMap((s, si) =>
        (s.subProcesses || []).filter((sp) => !sp.deleted).map((sp, spi) => [sp.id, (subAssignmentsByStep[si] || [])[spi] || []]),
      ),
    ),
  } : undefined;

  return (
    <ArtisanFlowShell parentCrumb={{ label: "Production", href: "/artisanflow" }} crumb={wf.name}>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {productImage ? (
              <img src={productImage} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="h-14 w-14 flex-shrink-0 rounded-xl" style={{ background: "#F3F1ED" }} />
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>{productName || wf.name}</h1>
                <StatusPill status={wf.status} />
              </div>
              <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
                {productSku ? `SKU ${productSku} · ` : ""}{category ? `${category} · ` : ""}
                {isCustomJob ? "Custom Order" : "Order"} #{linkedOrderId ?? "—"}
              </p>
              {/* Quantity comes from the order item and is READ-ONLY here — it is
                  deliberately not part of a template, a stage or a task. */}
              {orderQty && (
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                   style={{ background: "#FEF3E2", color: "#A86120" }}>
                  <Package className="h-3.5 w-3.5" />
                  Order line: {orderQty.quantity}{orderQty.unit ? ` ${orderQty.unit}` : ""}
                </p>
              )}
              {wf.workflowTemplate?.name && (
                <p className="mt-0.5 text-xs" style={{ color: "#AAA39E" }}>
                  Template: {wf.workflowTemplate.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* A template is a STARTING POINT only — the job stays editable as work
                unfolds (2026-07-02 lock), so this is no longer CREATED-only; it is
                offered until the job is COMPLETED. Still sandbox-minted only: Save
                on the edit page PATCHes a full steps rewrite, so a live-synced
                (sub-floor) instance must not be offered the control at all — same
                rule the delete button applies, and the edit page + /api/crud both
                re-check it. */}
            {(wf.status || "").toUpperCase() !== "COMPLETED" && (
              isSandboxId(wf.id) ? (
                <Link href={`/artisanflow/workflow/instance/${wf.id}/edit`} title="Edit this job's own name, description &amp; stages">
                  <Button variant="primary" size="sm"><Pencil className="h-3.5 w-3.5" /> Edit job</Button>
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  title={sandboxRefusal("edit", isCustomJob ? "custom workflow" : "workflow")}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit job
                </Button>
              )
            )}
            <Link href={`/artisanflow/traceability/${wf.id}`}>
              <Button variant="secondary" size="sm"><Route className="h-3.5 w-3.5" /> Traceability</Button>
            </Link>
            {linkedOrderId != null && (
              <Link href={orderHref}>
                <Button variant="ghost" size="sm"><ShoppingBag className="h-3.5 w-3.5" /> {isCustomJob ? "Custom Order" : "Order"}</Button>
              </Link>
            )}
            <DiscussionPanel workflowId={wf.id} initialComments={comments} currentUserName={currentUserName} />
            {/* CREATED only. CREATED is the PRE-start state -- the backend's
                recomputeProcessStatus flips CREATED -> INITIATED as soon as the
                first step leaves PENDING, and INITIATED is shown to staff as
                "In progress" (JobsClient STATUS_TABS). Including INITIATED here
                offered a hard delete on jobs that already had live step /
                subprocess / artisan-assignment rows. The backend enforces
                status === 'CREATED' independently. */}
            {WORKFLOW_DELETE_ENABLED && (wf.status || "").toUpperCase() === "CREATED" && (
              <WorkflowDeleteButton workflowId={wf.id} workflowName={wf.name} kind={isCustomJob ? "custom-order" : "order"} />
            )}
          </div>
        </div>

        {/* Status + delay strip — lead with schedule health */}
        <ScheduleStrip
          schedule={schedule}
          delay={delay}
          isDone={isDone}
          progressPct={progressPct}
          currentStepName={progress.currentStageName ?? undefined}
          progress={progress}
          taskCounts={taskCounts}
          stageChainEnd={stageChainEnd}
        />

        {/* WHO is making this, and HOW MUCH each of them is doing.
            ALWAYS rendered -- the previous version was gated on
            `artisanAssignments.length > 0`, so the one state that needs an
            action (nobody assigned) rendered nothing at all. Workflow-level and
            multi-artisan, per Amit 2026-08-16. */}
        <Card>
          <WorkflowArtisanPanel
            workflowId={wf.id}
            kind={isCustomJob ? "custom-order" : "order"}
            initialAssignments={wf.artisanAssignments || []}
            elementAssignments={elementAssignments}
            artisans={assignableArtisans}
            capability={workflowWrite}
            quantityMode={quantityMode}
            orderQuantity={orderQty}
          />
          {wf.avgArtisanWorkHoursPerMeter != null && (
            <p className="mt-2 text-xs" style={{ color: "#AAA39E" }}>
              {wf.avgArtisanWorkHoursPerMeter} hrs/metre average
            </p>
          )}
        </Card>

        {/* THE JOB NOTE. Live has an Add Note button on the workflow and we had
            none (Amit, 2026-08-17). `note` is a first-class field on the job
            detail and is the SAME value Order Watch prints under a job row
            (OrderWorkflowSummary.note reads full.note), so one write serves both
            screens. Unlike the stage tree it persists on a RUNNING job —
            measured on sandbox job 1000000000000 while INITIATED — so the only
            gate is the sandbox floor. */}
        <Card>
          <WorkflowNotePanel
            workflowId={wf.id}
            kind={isCustomJob ? "custom-order" : "order"}
            initialNote={wf.note}
            capability={workflowWrite}
          />
        </Card>

        {/* Production pipeline (the Kanban) — one lane per STAGE, its TASKS as
            cards moving To do -> In progress -> Done. One surface for advancing
            each node (PATCH update/{step,subprocess}-element) AND assigning its
            artisans inline (PATCH update/{step,subprocess}-element/
            artisan-assignments). */}
        <Card padding="md">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
              Production pipeline · live status
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "#AAA39E" }}>
                Work runs top-to-bottom · start with the card marked Next up, or drag it right · click a stage&rsquo;s dates to reschedule
              </span>
              <span className="rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>
                Sandbox test DB only
              </span>
            </div>
          </div>
          <PipelineSwimlane
            steps={wf.steps || []}
            workflowId={wf.id}
            kind={isCustomJob ? "custom-order" : "order"}
            now={now}
            assignments={boardAssignments}
            jobStart={wf.estimatedStartDate}
            nodeValuesCapability={nodeValueWrite}
            nodeScheduleCapability={nodeSchedWrite}
            savedJobEnd={wf.estimatedEndDate}
            jobCapability={workflowWrite}
            jobStatus={wf.status}
            signedBy={currentUserName}
          />
        </Card>
      </div>
    </ArtisanFlowShell>
  );
}


/**
 * Says, in words, why two end dates can be on this screen at once.
 *
 * PLANNED (saved) is the workflow row's stored estimatedEndDate. The stage total
 * is where the stage chain actually finishes, idle gaps included — what saving a
 * reschedule would write. They can drift because a stage can be edited (in the
 * pipeline below, or in Loom) without anyone recomputing the row's own field.
 *
 * The honest resolution is NOT to make one silently mirror the other: that would
 * either hide a real disagreement between the plan and the header, or require a
 * database write purely to tidy a label. Name both, state the gap in days, and
 * name the ONE action that makes them agree. Silent when they already agree.
 *
 * ⚠ On live data they always DO agree — 0 of 376 dated chains differ (measured
 * 2026-08-17). The "14 days apart on 133044983" this note used to cite was
 * manufactured by the old back-to-back resequence(), which collapsed that job's
 * real 14-day idle gap; the discrepancy and the gap were the same 14 days. So
 * this component now renders nothing on every live job, and that is correct. It
 * is kept, not deleted, because the two remain different quantities and a
 * partial write can still separate them.
 *
 * This moved OUT of the removed "Schedule · move or extend" card and INTO the
 * summary strip (2026-08-17) because the strip is the surface that already prints
 * PLANNED — the distinction belongs beside the number it qualifies, not in a
 * card that no longer exists.
 */
function EndDateDisagreement({
  stageChainEnd,
  savedEnd,
  fg,
}: {
  stageChainEnd: number;
  savedEnd?: number;
  fg: string;
}) {
  if (!savedEnd || !stageChainEnd) return null;
  const diffDays = Math.round((stageChainEnd - savedEnd) / 86_400_000);
  if (diffDays === 0) return null;
  const n = Math.abs(diffDays);
  return (
    <p
      className="mt-3 rounded-lg border px-3 py-2 text-[11px] leading-snug"
      style={{ background: "rgba(255,255,255,0.6)", borderColor: "#FCD34D", color: fg }}
    >
      <strong>Two end dates, and they disagree.</strong> The stages add up to{" "}
      <strong>{formatEpoch(stageChainEnd)}</strong>, {n} {n === 1 ? "day" : "days"}{" "}
      {diffDays < 0 ? "earlier" : "later"} than the <strong>{formatEpoch(savedEnd)}</strong> saved on the job and shown
      as PLANNED above. The saved date is what the rest of the app reports; the stage total is what this plan actually
      runs to. Rescheduling any stage in the pipeline below and saving replaces the saved date with the stage total.
    </p>
  );
}

function ScheduleStrip({
  schedule,
  delay,
  isDone,
  progressPct,
  currentStepName,
  progress,
  taskCounts,
  stageChainEnd,
}: {
  schedule: WorkflowSchedule;
  delay: WorkflowDelaySummary;
  isDone: boolean;
  progressPct: number;
  currentStepName?: string;
  progress: WorkflowProgress;
  taskCounts: { done: number; total: number };
  /** What the stage chain adds up to — the other end date. See EndDateDisagreement. */
  stageChainEnd: number;
}) {
  const late = schedule.lateDays > 0;
  // Palette by health.
  const theme = isDone
    ? (late ? { bg: "#FFF7ED", border: "#FED7AA", fg: "#B45309", accent: "#B45309" } : { bg: "#F0FDF4", border: "#BBF7D0", fg: "#065F46", accent: "#047857" })
    : late
      ? { bg: "#FEF2F2", border: "#FECACA", fg: "#991B1B", accent: "#DC2626" }
      : delay.dueSoonCount > 0
        ? { bg: "#FFFBEB", border: "#FDE9C5", fg: "#8A4C19", accent: "#B45309" }
        : { bg: "#F0FDF4", border: "#BBF7D0", fg: "#065F46", accent: "#047857" };

  const Icon = isDone ? CheckCircle2 : late ? AlertTriangle : delay.dueSoonCount > 0 ? Clock : CheckCircle2;

  const headline = isDone
    ? (late ? `Completed ${schedule.lateDays}d late` : "Completed on schedule")
    : late
      ? `Delayed by ${schedule.lateDays} ${schedule.lateDays === 1 ? "day" : "days"}`
      : delay.dueSoonCount > 0
        ? "On schedule — due soon"
        : "On schedule";

  const sub: string[] = [];
  if (!isDone && currentStepName) sub.push(`Current stage: ${currentStepName}`);
  if (!isDone && late && delay.bottleneck) sub.push(`Bottleneck: ${delay.bottleneck}`);
  if (!isDone && delay.overdueCount > 0) sub.push(`${delay.overdueCount} ${delay.overdueCount === 1 ? "stage" : "stages"} overdue`);
  if (!isDone && delay.dueSoonCount > 0) sub.push(`${delay.dueSoonCount} due soon`);
  if (!isDone && !late && delay.nextDueLabel) sub.push(`Next: ${delay.nextDueLabel}`);

  return (
    <div className="rounded-2xl border p-4" style={{ background: theme.bg, borderColor: theme.border }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-6 w-6 flex-shrink-0" style={{ color: theme.accent }} />
          <div>
            <p className="text-base font-semibold" style={{ color: theme.fg }}>{headline}</p>
            {sub.length > 0 && (
              <p className="mt-0.5 text-xs" style={{ color: theme.fg, opacity: 0.85 }}>{sub.join(" · ")}</p>
            )}
          </div>
        </div>

        {/* Planned vs projected completion */}
        {(schedule.plannedEnd || schedule.projectedEnd) && (
          <div className="flex items-center gap-4 text-xs" style={{ color: theme.fg }}>
            {schedule.plannedEnd && (
              <div title="The end date saved on the job (estimatedEndDate). The stage durations may add up to a different date — any gap between the two is spelled out below.">
                <p className="uppercase tracking-wide" style={{ opacity: 0.7, fontSize: 10 }}>Planned (saved)</p>
                <p className="font-semibold">{formatEpoch(schedule.plannedEnd)}</p>
              </div>
            )}
            {isDone ? (
              schedule.actualEnd && (
                <div>
                  <p className="uppercase tracking-wide" style={{ opacity: 0.7, fontSize: 10 }}>Actual</p>
                  <p className="font-semibold inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{formatEpoch(schedule.actualEnd)}</p>
                </div>
              )
            ) : (
              schedule.projectedEnd && (
                <div>
                  <p className="uppercase tracking-wide" style={{ opacity: 0.7, fontSize: 10 }}>Projected</p>
                  <p className="font-semibold inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" />{formatEpoch(schedule.projectedEnd)}</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* The two end dates, when they disagree. */}
      <EndDateDisagreement stageChainEnd={stageChainEnd} savedEnd={schedule.plannedEnd} fg={theme.fg} />

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: theme.fg, opacity: 0.85 }}>
          <span>Progress</span>
          <span className="font-semibold">
            {progressPct}%
            {progress.total > 0 ? ` · ${progress.done}/${progress.total} stages done` : ""}
            {progress.doing > 0 ? ` · ${progress.doing} in progress` : ""}
            {taskCounts.total > 0 ? ` · ${taskCounts.done}/${taskCounts.total} tasks` : ""}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: progressPct + "%", background: theme.accent }} />
        </div>
      </div>
    </div>
  );
}
