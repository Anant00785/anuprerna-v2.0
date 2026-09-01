"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, X, ChevronUp, ChevronDown, Clock,
  ListChecks, Sparkles, Copy, FileText, ShieldCheck, AlertTriangle, Lock,
} from "lucide-react";
import { Button, Card, Textarea, Select } from "@/components/ui";
import type { KpiItem } from "@/components/ui";
import { KpiStrip } from "@/components/ui";
import {
  STAGE_PRESETS, blankStage, blankTask, presetToStage, stageDays, totalDays, toPayload, toBackendSteps,
  toJobSteps,
  type Detail,
  type Stage,
  type LiveStepNode,
} from "@/components/artisanflow/stages";
import { isSandboxId, sandboxRefusal } from "@/lib/sandbox-floor";
import type { WriteCapability } from "@/lib/workflow-ops";

/**
 * Progressive, add-a-stage-at-a-time TEMPLATE BUILDER. Dead simple, and the
 * shape is LOCKED (2026-07-02): a stage is a NAME, a few TASKS (name / days /
 * optional needs-approval), a few DETAILS to capture (a plain label, no
 * datatype and no required flag), an optional cost and an optional note.
 *
 * DETAILS EXIST AT TWO LEVELS, and both are editable here (2026-08-17). Live's
 * own sub-process dialog hangs its ADD PROPERTIES rows off the SUB-PROCESS, and
 * the data agrees: template 490267 carries "Warp Yarn Color & Shade" / "Weft
 * Yarn Color & Shade" on the Yarn Processing TASK and "Target GSM" on the Yarn
 * Processing STAGE. Before this change the builder only offered the stage row,
 * so the task-level fields were invisible in the one screen whose job is to edit
 * them. The LOCKED simplification is untouched: a detail is still just a plain
 * label -- no datatype dropdown, no required switch. Loom's datatype/valuetype
 * ride along INVISIBLY on each Detail and are handed back verbatim by
 * toBackendSteps, which is what keeps a `deferred` field from being rewritten as
 * `required` on save.
 *
 * Time auto-rolls up -- stage days = sum of its task days, template total = sum
 * of stages -- and a stage may override its own total by hand (daysOverride);
 * clearing the override returns it to the auto sum. Stages run SEQUENTIALLY.
 * QUANTITY is never entered here: it comes from the order item and is shown
 * once, read-only, on the job. Do not re-add per-step quantity/unit-of-measure,
 * batch counts, the verb/input/output recipe grammar or spec-field types.
 *
 * Save wires to POST /add/workflow-template (create) / PATCH /update/workflow-template
 * (edit) via /api/crud -- sandbox pg only. Stages/tasks/details are converted
 * to the real workflow-template steps wire shape by toBackendSteps() (stages.ts)
 * and PERSIST for real (2026-07-06 backend gap-fill: add/update workflow-
 * template stores steps verbatim) -- a saved template's steps read back and
 * re-render in this builder on reopen.
 *
 * The old "Preview payload" raw-JSON inspector is gone: it was a developer
 * affordance sitting on the one screen whose stated bar is that somebody new to
 * ArtisanFlow can use it first time.
 */

const INK = "#1A1714";
const MUTED = "#847D77";
const FAINT = "#AAA39E";
const BORDER = "#E8E4DE";
const SURFACE = "#FAF9F7";

function todayInput(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export interface JobMeta {
  workflowTemplateId: number;
  workflowTemplateName: string;
  /** Absent for order-item jobs whose item carries no catalogue product id. */
  productId?: number;
  productName: string;
  orderId?: number;
  orderLabel?: string;
  /** Which order table `orderId` refers to. "custom-order" posts
   *  /add/custom-workflow (CUSTOM_ORDER type) instead of /add/workflow —
   *  the two id spaces are unrelated tables, so this must be set correctly
   *  whenever orderId is set. */
  orderKind?: "order" | "custom-order";
  /** Optional tie-back to the specific order/custom-order item, when known. */
  orderItemId?: number;
}

export interface EditJobMeta {
  workflowId: number;
  kind: "order" | "custom-order";
  /** The job's LIVE step tree, exactly as GET /get/workflow/{id} returned it.
   *  Required, not optional: PATCH /update/custom-workflow stores `steps`
   *  verbatim, so saving without the originals to merge onto is what deletes a
   *  job's node ids, statuses and actual dates. See toJobSteps. */
  originalSteps: LiveStepNode[];
}

export function TemplateBuilder({
  initialName,
  initialDescription,
  initialEstimatedStartDate,
  initialStages,
  templates,
  templateId,
  jobMeta,
  editJob,
}: {
  initialName: string;
  initialDescription: string;
  /** Job mode only: yyyy-mm-dd, defaults to today. */
  initialEstimatedStartDate?: string;
  initialStages: Stage[];
  templates: { id: number; name: string }[];
  templateId?: number;
  /** When set, this is a JOB configure-and-create view, not a template edit —
   *  Save posts /add/workflow (a real production run) instead of
   *  add/update/workflow-template. */
  jobMeta?: JobMeta;
  /** When set, this edits an EXISTING job instance's own name/description/
   *  stages — Save PATCHes /update/workflow or /update/custom-workflow
   *  (never the template). Only reachable while the job hasn't started
   *  (backend refuses a steps rewrite once status leaves CREATED). */
  editJob?: EditJobMeta;
}) {
  const router = useRouter();
  const idc = useRef(1000);
  const newId = () => "new-" + idc.current++;

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [estimatedStartDate, setEstimatedStartDate] = useState(initialEstimatedStartDate || todayInput());
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isEdit = templateId != null;
  /**
   * EDITING A LIVE-MIRRORED TEMPLATE IS REFUSED, and it has to be refused HERE too.
   *
   * All ten templates in the sandbox carry live ids (490267, 1147141, …), they are
   * re-seeded from Loom, and every one of them is referenced by real jobs — 490267
   * alone by 495. A Save on one is a rewrite the sandbox cannot undo, and the
   * screen said "Saves to the sandbox test DB only (never live)… persist for real",
   * which for a live-mirrored template was a promise it could not keep.
   *
   * /api/crud now refuses the write (WRITE_REGISTRY bands update/workflow-template),
   * and that server-side guard is the CONTROL. This client check is not a second
   * control, it is the UI keeping its word: an enabled button that is going to 403
   * is a worse experience than a disabled one that explains itself, and the banner
   * below can now state which it is.
   */
  const templateWrite: WriteCapability =
    isEdit && !isSandboxId(templateId!)
      ? {
          ok: false,
          reason:
            sandboxRefusal("edit", "workflow template") +
            " — this template was synced from live Loom and jobs are running on it, so the sandbox " +
            "refuses to rewrite it. Duplicate it into a new template to make changes.",
        }
      : { ok: true, reason: "" };
  const isJob = !!jobMeta;
  const isEditJob = !!editJob;

  const doSave = async () => {
    setSaving(true);
    setSaveError(null);
    const backendSteps = toBackendSteps(stages);

    if (isEditJob) {
      const isCustom = editJob.kind === "custom-order";
      const est = estimatedStartDate ? new Date(`${estimatedStartDate}T00:00:00`).getTime() : Date.now();
      const path = isCustom ? "update/custom-workflow" : "update/workflow";
      const body = {
        id: editJob.workflowId,
        name: name.trim(),
        description: description.trim(),
        estimatedStartDate: est,
        // NOT backendSteps. This is an existing JOB, and the update endpoint
        // stores `steps` verbatim -- sending the template shape wipes every
        // node id, status and actual date on the job (measured; see toJobSteps).
        // toJobSteps merges the builder's edits onto the live nodes instead.
        steps: toJobSteps(stages, editJob.originalSteps),
      };
      try {
        const res = await fetch("/api/crud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, method: "PATCH", body }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j?.success === false) throw new Error(j?.message || `Save failed (${res.status})`);
        router.push(`/artisanflow/workflow/instance/${editJob.workflowId}`);
        router.refresh();
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (isJob) {
      const isCustom = jobMeta.orderKind === "custom-order";
      const est = estimatedStartDate ? new Date(`${estimatedStartDate}T00:00:00`).getTime() : Date.now();
      const body: Record<string, unknown> = isCustom
        ? {
            name: name.trim(),
            description: description.trim(),
            workflowTemplateId: jobMeta.workflowTemplateId,
            workflowTemplateName: jobMeta.workflowTemplateName,
            type: "CUSTOM_ORDER",
            custom: true,
            steps: backendSteps,
            estimatedStartDate: est,
            estimatedEndDate: est,
            referenceOrderId: jobMeta.orderId,
            ...(jobMeta.orderItemId ? { referenceOrderItemId: jobMeta.orderItemId } : {}),
            ...(jobMeta.productId ? { referenceProductId: jobMeta.productId } : {}),
          }
        : {
            name: name.trim(),
            description: description.trim(),
            workflowTemplateId: jobMeta.workflowTemplateId,
            workflowTemplateName: jobMeta.workflowTemplateName,
            type: "ORDER",
            custom: false,
            steps: backendSteps,
            estimatedStartDate: est,
            ...(jobMeta.orderId ? { orderId: jobMeta.orderId } : {}),
            ...(jobMeta.orderItemId ? { orderItemId: jobMeta.orderItemId } : {}),
            ...(jobMeta.productId ? { productId: jobMeta.productId } : {}),
          };
      const path = isCustom ? "add/custom-workflow" : "add/workflow";
      try {
        const res = await fetch("/api/crud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, method: "POST", body }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j?.success === false || !j?.id) throw new Error(j?.message || `Create failed (${res.status})`);
        router.push(`/artisanflow/workflow/instance/${j.id}`);
        router.refresh();
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Create failed");
      } finally {
        setSaving(false);
      }
      return;
    }

    const draft = toPayload(name, description, stages);
    const body = isEdit
      ? { id: templateId, name: draft.name, description: draft.description, steps: backendSteps }
      : { name: draft.name, description: draft.description, steps: backendSteps, productAssociated: true };
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: isEdit ? "update/workflow-template" : "add/workflow-template",
          method: isEdit ? "PATCH" : "POST",
          body,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || `Save failed (${res.status})`);
      const newId = isEdit ? templateId : j?.id;
      if (newId) router.push(`/artisanflow/workflow/template/${newId}`);
      else router.push("/artisanflow/workflow");
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const patchStage = (id: string, patch: Partial<Stage>) =>
    setStages((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStage = (id: string) => setStages((cur) => cur.filter((s) => s.id !== id));
  const moveStage = (id: string, dir: -1 | 1) =>
    setStages((cur) => {
      const i = cur.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const addStage = () => setStages((cur) => [...cur, blankStage(newId())]);
  const addPreset = (p: (typeof STAGE_PRESETS)[number]) =>
    setStages((cur) => [...cur, presetToStage(p, newId())]);

  const days = totalDays(stages);

  const kpis: KpiItem[] = [
    { label: "Stages", value: stages.length, icon: <ListChecks className="h-4 w-4" /> },
    { label: "Total time", value: `${days} days`, icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      {isJob || isEditJob ? (
        /* Job meta — read-only context + editable job name */
        <Card padding="md">
          <p className="text-[15px] leading-loose" style={{ color: INK }}>
            {isEditJob ? "Editing" : "Starting"}{" "}
            <Fill value={name} onChange={setName} placeholder="name this job" max={44} />
            {isJob && (
              <>
                {" "}from <strong>{jobMeta.workflowTemplateName}</strong>, for{" "}
                <strong>{jobMeta.productName}</strong>
                {jobMeta.orderLabel && (
                  <>
                    {" "}· <strong>{jobMeta.orderLabel}</strong>
                  </>
                )}
              </>
            )}
            .
          </p>
          <p className="mt-1 text-xs" style={{ color: FAINT }}>
            {isEditJob
              ? "This edits the job itself, not its template — other jobs made from the same template are untouched. A template is only a starting point; add, remove, re-order or re-time stages and tasks whenever the work changes."
              : "Day counts and stages below are inherited from the template — tweak anything for this run only; the template itself is untouched."}
          </p>
          {isEditJob && editJob.kind === "order" && (
            <p className="mt-2 rounded-lg px-3 py-2 text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
              Heads up: on a STANDARD order job the backend currently persists the name,
              description and start date but drops the stage tree
              (workflow.mapper.ts mergeWorkflowUpdate has no {"steps"} field, unlike
              mergeCustomWorkflowUpdate). Stage edits here will not stick until that gap
              is filled. Custom-order jobs save stages for real.
            </p>
          )}
          <div className="mt-3 grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2" style={{ borderColor: "#F3F1ED" }}>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: MUTED }}>Job description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Anything worth noting about this run…"
                className="form-input h-9 w-full text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: MUTED }}>Estimated start date</label>
              <input
                type="date"
                value={estimatedStartDate}
                onChange={(e) => setEstimatedStartDate(e.target.value)}
                className="form-input h-9 w-full text-sm"
              />
            </div>
          </div>
        </Card>
      ) : (
        <>
          {isEdit && <LiveJobsNotice templateId={templateId!} />}

          {/* Template meta — reads as a sentence the user completes */}
          <Card padding="md">
            <p className="text-[15px] leading-loose" style={{ color: INK }}>
              I&apos;m building{" "}
              <Fill
                value={name}
                onChange={setName}
                placeholder="name this template (e.g. Finished Sampling)"
                max={40}
              />
              , a production template that makes{" "}
              <Fill
                value={description}
                onChange={setDescription}
                placeholder="what it produces"
                max={44}
              />
              .
            </p>
            <p className="mt-1 text-xs" style={{ color: FAINT }}>
              Then describe each stage below — it fills in like a sentence.
            </p>
          </Card>

          {/* Start from... */}
          <Card padding="md">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
              Start from
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setStages([])}>
                <FileText className="h-3.5 w-3.5" /> Blank
              </Button>
              <div className="inline-flex items-center gap-1.5">
                <Copy className="h-3.5 w-3.5" style={{ color: MUTED }} />
                <Select
                  className="h-8 text-sm"
                  options={templates.filter((t) => t.id !== templateId).map((t) => ({ value: t.id, label: t.name }))}
                  placeholder="Clone an existing template..."
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) router.push(`/artisanflow/workflow/template/${v}/edit`);
                  }}
                />
              </div>
              <span className="mx-1 text-xs" style={{ color: FAINT }}>or drop a stage preset:</span>
              {STAGE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => addPreset(p)}
                  className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white"
                  style={{ borderColor: BORDER, color: "#A86120", background: "#FEF3E2" }}
                >
                  <Sparkles className="h-3 w-3" /> {p.label}
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      {!isJob && <KpiStrip items={kpis} />}

      {/* Stage cards */}
      <div className="flex flex-col gap-3">
        {stages.map((s, i) => (
          <StageEditor
            key={s.id}
            stage={s}
            index={i}
            isFirst={i === 0}
            isLast={i === stages.length - 1}
            newId={newId}
            onPatch={(patch) => patchStage(s.id, patch)}
            onRemove={() => removeStage(s.id)}
            onMove={(dir) => moveStage(s.id, dir)}
          />
        ))}
        {stages.length === 0 && (
          <div className="rounded-xl border py-10 text-center text-sm" style={{ background: SURFACE, borderColor: BORDER, color: FAINT }}>
            No stages yet. Add one below, clone a template, or drop a preset.
          </div>
        )}
      </div>

      <button
        onClick={addStage}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3.5 text-sm font-medium transition-colors hover:bg-white"
        style={{ borderColor: "#D8D3CC", color: MUTED }}
      >
        <Plus className="h-4 w-4" /> Add stage
      </button>

      {/* Summary */}
      <Card padding="md">
        <div className="flex flex-wrap items-end justify-end gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: FAINT }}>Total time</p>
            <p className="font-serif text-xl font-semibold" style={{ color: INK }}>{days} days</p>
          </div>
        </div>
        <p className="mt-3 text-[11px]" style={{ color: FAINT }}>
          Time rolls up from task days. Stages run one after another.
        </p>
      </Card>

      {/* Save */}
      <div className="flex flex-col gap-2">
        {!isJob && templateWrite.ok && (
          <p className="rounded-lg px-3 py-2 text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
            Saves to the sandbox test DB only (never live). Stages, tasks and details all persist for real.
          </p>
        )}
        {!templateWrite.ok && (
          <p
            className="inline-flex items-start gap-1.5 rounded-lg px-3 py-2 text-xs"
            style={{ background: "#F5F5F4", color: "#57534E" }}
          >
            <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              <strong>This template is read-only.</strong> {templateWrite.reason}
            </span>
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={doSave}
            disabled={!name.trim() || saving || !templateWrite.ok}
            loading={saving}
          >
            {isJob
              ? (saving ? "Starting…" : "Create job")
              : isEditJob
                ? (saving ? "Saving…" : "Save job")
                : saving ? "Saving…" : isEdit ? "Save template" : "Create template"}
          </Button>
          {saveError && <span className="text-xs" style={{ color: "#B91C1C" }}>{saveError}</span>}
        </div>
      </div>
    </div>
  );
}

// -- One editable stage, written as a fill-in-the-blank sentence -------------

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`;
}

function StageEditor({
  stage, index, isFirst, isLast, newId, onPatch, onRemove, onMove,
}: {
  stage: Stage;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  newId: () => string;
  onPatch: (patch: Partial<Stage>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const tasks = stage.tasks;
  const details = stage.details;
  // Auto = sum of task days. daysOverride replaces it when the operator sets a
  // figure by hand (a stage can legitimately take longer than its tasks add up
  // to). stageDays() is the single source of truth for which one wins.
  const taskSum = tasks.reduce((t, x) => t + (Number(x.days) || 0), 0);
  const overridden = stage.daysOverride != null;
  const d = stageDays(stage);

  const patchTask = (i: number, patch: Partial<Stage["tasks"][number]>) =>
    onPatch({ tasks: tasks.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const addTask = () => onPatch({ tasks: [...tasks, blankTask(newId())] });
  const removeTask = (i: number) => onPatch({ tasks: tasks.filter((_, j) => j !== i) });
  const moveTask = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= tasks.length) return;
    const next = [...tasks];
    [next[i], next[j]] = [next[j], next[i]];
    onPatch({ tasks: next });
  };

  const addDetail = () => onPatch({ details: [...details, { id: newId(), label: "" }] });
  const patchDetail = (i: number, label: string) =>
    onPatch({ details: details.map((x, j) => (j === i ? { ...x, label } : x)) });
  const removeDetail = (i: number) => onPatch({ details: details.filter((_, j) => j !== i) });

  return (
    <div className="flex gap-3">
      <span
        className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        style={{ background: "#FEF3E2", color: "#A86120" }}
      >
        {index + 1}
      </span>

      <div className="min-w-0 flex-1 rounded-xl border bg-white" style={{ borderColor: BORDER, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="flex flex-col gap-3 px-4 py-4">
          {/* Lead sentence — name, time, cost */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-[15px] leading-loose" style={{ color: INK }}>
              The <strong>{ordinal(index + 1)} stage</strong> is{" "}
              <Fill
                value={stage.name}
                onChange={(v) => onPatch({ name: v })}
                placeholder="name this stage (e.g. Yarn Weaving)"
                max={38}
              />
              , which takes{" "}
              {overridden ? (
                <>
                  <NumFill
                    value={stage.daysOverride ?? 0}
                    onChange={(v) => onPatch({ daysOverride: v })}
                    placeholder="0"
                    width={4}
                    min={0}
                  />
                  <span style={{ color: MUTED }}> day{d === 1 ? "" : "s"}</span>{" "}
                  <button
                    type="button"
                    onClick={() => onPatch({ daysOverride: undefined })}
                    className="text-[11px] font-medium underline"
                    style={{ color: MUTED }}
                    title="Go back to adding up the task days"
                  >
                    use auto ({taskSum}d)
                  </button>
                </>
              ) : (
                <>
                  <span className="font-semibold" style={{ color: "#A86120" }}>{d} day{d === 1 ? "" : "s"}</span>
                  <span style={{ color: FAINT }}> (added up from its tasks)</span>{" "}
                  <button
                    type="button"
                    onClick={() => onPatch({ daysOverride: taskSum })}
                    className="text-[11px] font-medium underline"
                    style={{ color: MUTED }}
                    title="Set this stage&apos;s total by hand instead"
                  >
                    set by hand
                  </button>
                </>
              )}
              .
            </p>
            <div className="flex flex-shrink-0 items-center gap-1 pt-1">
              <IconBtn disabled={isFirst} onClick={() => onMove(-1)}><ChevronUp className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn disabled={isLast} onClick={() => onMove(1)}><ChevronDown className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn onClick={onRemove}><X className="h-3.5 w-3.5" /></IconBtn>
            </div>
          </div>

          {/* Tasks — listed in order, each its own little sentence */}
          <div className="border-t pt-3" style={{ borderColor: "#F3F1ED" }}>
            <p className="mb-2 text-[13px]" style={{ color: MUTED }}>
              {tasks.length > 0
                ? <>It&apos;s done through these {tasks.length === 1 ? "task" : `${tasks.length} tasks`}, in order:</>
                : <>It has no tasks yet — add the first one:</>}
            </p>
            <ul className="flex flex-col gap-2">
              {tasks.map((t, i) => (
                <li key={t.id} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px]" style={{ color: INK }}>
                    <span className="w-4 flex-shrink-0 text-right tabular-nums" style={{ color: FAINT }}>{i + 1}.</span>
                    <Fill
                      value={t.name}
                      onChange={(v) => patchTask(i, { name: v })}
                      placeholder="what happens (e.g. Complete Production)"
                      max={36}
                    />
                    <span style={{ color: MUTED }}>— takes</span>
                    <NumFill value={t.days} onChange={(v) => patchTask(i, { days: v })} placeholder="1" width={4} min={1} />
                    <span style={{ color: MUTED }}>day{t.days === 1 ? "" : "s"}</span>
                    <button
                      type="button"
                      onClick={() => patchTask(i, { needsApproval: !t.needsApproval })}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors"
                      style={
                        t.needsApproval
                          ? { background: "#F3EAFE", color: "#6D28D9" }
                          : { background: "#F3F1ED", color: "#847D77" }
                      }
                      title="Whether this task needs a sign-off / QC checkpoint"
                    >
                      {t.needsApproval ? "needs sign-off" : "add sign-off"}
                    </button>
                    <div className="ml-auto flex flex-shrink-0 items-center gap-0.5">
                      <IconBtn disabled={i === 0} onClick={() => moveTask(i, -1)}><ChevronUp className="h-3 w-3" /></IconBtn>
                      <IconBtn disabled={i === tasks.length - 1} onClick={() => moveTask(i, 1)}><ChevronDown className="h-3 w-3" /></IconBtn>
                      <IconBtn onClick={() => removeTask(i)}><X className="h-3 w-3" /></IconBtn>
                    </div>
                  </div>
                  {/* TASK-level details. Live's sub-process dialog owns these
                      (its ADD PROPERTIES rows), and the read-only view already
                      prints them under their task — this is the editor that was
                      missing. Reads on from the task sentence above it. */}
                  <div className="ml-6 flex flex-wrap items-center gap-1.5 text-[13px]">
                    <span style={{ color: MUTED }}>…and records:</span>
                    <DetailChips
                      details={t.details ?? []}
                      placeholder="e.g. Warp Yarn Color &amp; Shade"
                      emptyLabel="nothing"
                      onAdd={() => patchTask(i, { details: [...(t.details ?? []), { id: newId(), label: "" }] })}
                      onLabel={(k, label) =>
                        patchTask(i, { details: (t.details ?? []).map((x, m) => (m === k ? { ...x, label } : x)) })
                      }
                      onRemove={(k) => patchTask(i, { details: (t.details ?? []).filter((_, m) => m !== k) })}
                    />
                  </div>
                  {t.needsApproval && (
                    <div className="ml-6 rounded-lg border p-3" style={{ borderColor: "#EDE7F6", background: "#FAF8FF" }}>
                      <div className="mb-1 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#6D28D9" }} />
                        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#6D28D9" }}>
                          Sign-off checkpoint
                        </span>
                      </div>
                      <p className="mb-2 text-[12px] leading-snug" style={{ color: "#4A4540" }}>
                        This task cannot be marked done until someone approves it.{" "}
                        <strong style={{ color: INK }}>You write the instructions now</strong> — what the maker
                        should look at and photograph when they get here. They fill in the photos and the verdict
                        later, on the job.
                      </p>
                      <ApprovalInstructionRow
                        taskName={t.name}
                        stageName={stage.name}
                        value={t.instruction ?? ""}
                        onChange={(v) => patchTask(i, { instruction: v })}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addTask}
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium"
              style={{ color: "#A86120" }}
            >
              <Plus className="h-3.5 w-3.5" /> add a task
            </button>
          </div>

          {/* STAGE-level details. Deliberately worded to contrast with the
              per-task row above: these belong to the whole stage, not to any one
              task, which is exactly how live stores them (step.properties vs
              subProcess.properties) and how the read-only view prints them. */}
          <div className="border-t pt-3" style={{ borderColor: "#F3F1ED" }}>
            <p className="mb-2 text-[13px]" style={{ color: MUTED }}>
              Across the whole stage — not tied to one task — the maker records:
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <DetailChips
                details={details}
                placeholder="e.g. Target GSM"
                emptyLabel="nothing extra yet"
                onAdd={addDetail}
                onLabel={patchDetail}
                onRemove={removeDetail}
              />
            </div>
          </div>

          {/* Optional note */}
          <div className="border-t pt-3" style={{ borderColor: "#F3F1ED" }}>
            <p className="mb-1.5 text-[13px]" style={{ color: MUTED }}>A note for the maker (optional):</p>
            <Textarea
              className="min-h-[48px] text-[13px]"
              placeholder="Anything else the maker should know…"
              value={stage.note ?? ""}
              onChange={(e) => onPatch({ note: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Inline "fill in the blank" inputs ---------------------------------------

/** Auto-sizing underlined text blank that reads inline within a sentence. */
function Fill({
  value, onChange, placeholder, max = 40, plain = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  max?: number;
  /** plain = no underline (used inside chips). */
  plain?: boolean;
}) {
  const len = Math.max(value.length, Math.min(placeholder.length, max));
  const ch = Math.min(Math.max(len + 1, 6), max);
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={
        "bg-transparent px-0.5 text-[inherit] outline-none placeholder:font-normal" +
        (plain ? "" : " border-b focus:border-b-2")
      }
      style={{
        width: `${ch}ch`,
        color: INK,
        borderColor: plain ? undefined : "#E3CFAE",
      }}
    />
  );
}

/** Small numeric blank. */
function NumFill({
  value, onChange, placeholder, width = 5, min,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder: string;
  width?: number;
  min?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      value={value ? String(value) : ""}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value) || 0)}
      placeholder={placeholder}
      className="border-b bg-transparent px-0.5 text-center font-semibold text-[inherit] outline-none focus:border-b-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      style={{ width: `${width}ch`, color: "#A86120", borderColor: "#E3CFAE" }}
    />
  );
}

function ApprovalInstructionRow({
  taskName, stageName, value, onChange,
}: {
  taskName: string;
  stageName: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [drafting, setDrafting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function draft() {
    setDrafting(true);
    setFailed(false);
    try {
      const res = await fetch("/artisanflow/api/ai/draft-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageName, taskName }),
      });
      const data = (await res.json().catch(() => ({}))) as { text?: string };
      if (data.text && data.text.trim()) onChange(data.text.trim());
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setDrafting(false);
    }
  }

  // The task name used to be reprinted above the box, which read as though the
  // box already held that value. It does not — the box is EMPTY guidance the
  // template author writes. Removed; the task it belongs to is the line directly
  // above this panel.
  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        className="min-h-[52px] text-[13px]"
        placeholder="Type what the maker must check and photograph, e.g. Photograph the selvedge in daylight; confirm EPI×PPI against the approved sample; flag any dye variance."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={draft}
          disabled={drafting || !taskName.trim()}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-40"
          style={{ borderColor: "#E0D7F5", color: "#6D28D9", background: "#FFFFFF" }}
        >
          <Sparkles className="h-3 w-3" /> {drafting ? "Drafting…" : "Draft it for me"}
        </button>
        {failed ? (
          <span className="text-[11px]" style={{ color: "#B91C1C" }}>
            Couldn&apos;t draft that one — type it in yourself.
          </span>
        ) : !value.trim() ? (
          <span className="text-[11px]" style={{ color: FAINT }}>
            Leave it blank and the maker only sees the task name before approving.
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The reusable chip row behind BOTH detail levels — one stage row, one row per
 * task. Same affordance in both places on purpose: a detail is a plain label
 * wherever it hangs, and the only thing that differs is what it is attached to.
 *
 * A detail read off Loom carries `datatype`/`valuetype` that this UI never shows
 * (the 2026-07-02 simplification, still locked) — the label edit spreads the
 * existing Detail so those two ride through untouched, and only a detail the
 * operator has just typed reaches the writer without them, where it defaults to
 * string/required.
 */
function DetailChips({
  details, placeholder, emptyLabel, onAdd, onLabel, onRemove,
}: {
  details: Detail[];
  placeholder: string;
  emptyLabel: string;
  onAdd: () => void;
  onLabel: (index: number, label: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <>
      {details.map((dd, i) => (
        <span
          key={dd.id}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-1"
          style={{ borderColor: BORDER, background: SURFACE }}
        >
          <Fill value={dd.label} onChange={(v) => onLabel(i, v)} placeholder={placeholder} max={26} plain />
          <button type="button" onClick={() => onRemove(i)} style={{ color: FAINT }} aria-label="Remove detail">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {details.length === 0 && <span className="text-[13px]" style={{ color: FAINT }}>{emptyLabel}</span>}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 text-[13px] font-medium"
        style={{ color: "#A86120" }}
      >
        <Plus className="h-3.5 w-3.5" /> add a detail
      </button>
    </>
  );
}

/**
 * "N live jobs use this template" — the advisory that was missing.
 *
 * The claim it prints is CHECKED against the backend, not assumed. A job stores
 * its OWN copy of the step tree: POST /add/workflow and /add/custom-workflow
 * snapshot `steps` into relational.workflow_step_detail at creation (and
 * /add/workflow re-mints every node id from a per-job band), while PATCH
 * /update/workflow-template writes relational.workflow_templates and nothing
 * else — workflow.service.ts updateTemplate -> repo.shredTemplate. A running
 * job's properties even carry the VALUES already captured against them
 * (measured on job 33795071: Warp Yarn Color & Shade = "sliver & golden jori").
 * So edits here genuinely do NOT reach a job that already exists, and saying so
 * is the true statement, not a reassuring one.
 *
 * Client-fetched on purpose: the count is a full pass over the job table
 * (~12 s uncached), and the builder must never wait on an advisory.
 */
function LiveJobsNotice({ templateId }: { templateId: number }) {
  const [usage, setUsage] = useState<{ total: number; active: number; completed: number } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/artisanflow/api/template-usage?templateId=${templateId}`)
      .then((r) => r.json())
      .then((j: { usage?: { total?: number; active?: number; completed?: number } | null }) => {
        const u = j?.usage;
        if (alive && u && typeof u.total === "number") {
          setUsage({ total: u.total, active: Number(u.active) || 0, completed: Number(u.completed) || 0 });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [templateId]);

  if (!usage || usage.total === 0) return null;

  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border px-4 py-3"
      style={{ borderColor: "#F3D9A4", background: "#FEF8EC" }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#A86120" }} />
      <div className="min-w-0">
        <p className="text-[14px] font-semibold" style={{ color: "#7A4A17" }}>
          {usage.active > 0
            ? `${usage.active} job${usage.active === 1 ? "" : "s"} ${usage.active === 1 ? "is" : "are"} live on this template right now`
            : "Jobs have already been made from this template"}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug" style={{ color: "#8A6A3E" }}>
          {usage.total.toLocaleString("en-IN")} job{usage.total === 1 ? " has" : "s have"} been created from it
          {usage.completed > 0 ? ` (${usage.completed.toLocaleString("en-IN")} already finished)` : ""}. Each one
          took its own copy of these stages when it started, so editing here changes only jobs created from now on
          — nothing already running is touched.
        </p>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-stone-100 disabled:opacity-30"
      style={{ color: MUTED }}
    >
      {children}
    </button>
  );
}
