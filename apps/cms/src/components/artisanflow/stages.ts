/**
 * ArtisanFlow production model + pure helpers (SSR-safe: no React / network / Date).
 *
 * A production flow is an ordered list of STAGES. Each stage is a named phase
 * with a few TASKS (the to-dos: a name, a day estimate, an optional approval
 * checkpoint) and a few DETAILS to capture (plain labels, e.g. "Base Fabric
 * SKU", "Pantone Shade"). Cost is an optional per-stage number.
 *
 * Deliberately tiny so a first-time user gets it at a glance. The 2026-07-02
 * simplification is LOCKED -- do not re-add any of these, they were each tried
 * and found confusing:
 *   - per-task/per-stage QUANTITY or UNIT OF MEASURE
 *   - "how many to make?" / batches / "repeat N times"
 *   - the recipe-sentence grammar `[verb] [qty][uom] of [input] -> makes
 *     [output]` and its material matching
 *   - spec-field `type` / `required` machinery on the details to capture
 *
 * A STAGE is: a name + TASKS (name . days . optional "needs approval" . its own
 * DETAILS) + stage-level DETAILS to capture + optional cost + optional
 * note/photo. Nothing else. Details exist at BOTH levels because live stores
 * them at both (step.properties and subProcess.properties) and template 490267
 * uses both; a detail is a plain text label at either level, with no datatype
 * and no required flag in the UI.
 *
 * Quantity comes from the ORDER ITEM and is shown once, read-only, on the job
 * -- it is never entered here. Time auto-rolls up (stage = sum of its task
 * days, overridable per stage via `daysOverride`; template = sum of stages) and
 * the schedule is SEQUENTIAL: stage i starts after stage i-1.
 *
 * A template is a STARTING POINT only. The job stays editable as work unfolds.
 *
 * NOTE: stageDays + totalCost are the single source of truth for that math.
 */

import type { WorkflowStep } from "@/lib/artisanflow-api";

// -- Core types (single source of truth; jobTypes re-exports these) ----------

export type TaskStatus = "todo" | "doing" | "done";

/** Evidence captured when an approval checkpoint is completed on a JOB. */
export interface Evidence {
  /** URLs returned by the upload route, e.g. "/artisanflow/api/uploads/<file>". */
  photos: string[];
  note: string;
  approvedBy?: string;
  approvedAt?: number;
}

export interface Task {
  id: string;
  name: string;
  days: number;
  needsApproval: boolean;
  /** Live status — only meaningful on a JOB stage, undefined on templates. */
  status?: TaskStatus;
  /** Approval guidance — what to inspect/photograph at this QC checkpoint. */
  instruction?: string;
  /**
   * Capture fields hung off THIS TASK. Live attaches capture properties at both
   * levels and the task level is the one that mattered here: template 490267
   * carries "Comments on the Quality" (string, deferred) on the QC Fabric
   * SUB-PROCESS, and Fabric Finishing has no stage-level properties at all — so
   * reading only `step.properties` rendered Stage 3 as having nothing to capture
   * and dropped the field entirely (audit 2026-08-16).
   *
   * EDITABLE since 2026-08-17: the builder renders a chip row per task, mirroring
   * live's own sub-process dialog, whose ADD PROPERTIES rows hang off the
   * SUB-PROCESS. Only the LABEL is editable (the 2026-07-02 simplification is
   * still locked — no datatype dropdown, no required switch); `toBackendSteps`
   * hands datatype/valuetype straight back, so a Loom-synced field keeps its
   * exact spec through a save. That write-back is not cosmetic — the writer once
   * sent `properties: []` for every sub-process, so opening a Loom-synced
   * template in the builder and saving DELETED these fields silently.
   *
   * JOB mode is the one exception, unchanged and pre-existing: toJobSteps below
   * does NOT write properties back onto a live job node, because a running job's
   * properties carry the VALUES already captured against them (measured on job
   * 33795071: Warp Yarn Color & Shade = "sliver & golden jori"). Rewriting them
   * from the builder would delete real production data, so detail edits made
   * while editing a JOB are dropped — exactly as stage-level detail edits always
   * have been. Fixing that needs a value-preserving merge, not a wider write.
   */
  details?: Detail[];
  /** Captured on the JOB when an approval checkpoint is completed. */
  evidence?: Evidence;
}

export interface Detail {
  id: string;
  label: string;
  /**
   * Loom's spec metadata for this capture field, carried through VERBATIM.
   *
   * The 2026-07-02 simplification removed the BUILDER machinery for editing
   * these (a `type` dropdown and a `required` switch), and that stays removed —
   * this is not that. These two are read-off-the-wire facts about a Loom-synced
   * template that the read-only view prints and the writer must hand back
   * unchanged. `valuetype` in particular is load-bearing: live's values are
   * `required` / `optional` / `deferred`, and `deferred` means the field does
   * NOT block completing its task. Re-writing a deferred field as required
   * silently turns an optional QC comment into a blocker.
   *
   * Undefined on a detail the builder just created; the writer defaults those to
   * the same string/required pair it always used.
   */
  datatype?: string;
  valuetype?: string;
}

export interface Stage {
  id: string;
  name: string;
  tasks: Task[];
  details: Detail[];
  cost?: number;
  note?: string;
  photo?: string;
  /** Manual override of the auto-summed stage days. Cleared -> back to task sum. */
  daysOverride?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  stages: Stage[];
}

// Loom steps carry `properties` (spec fields), omitted by the read-only api type.
// Accept a superset so we can read them without editing src/lib.
export type RawProperty = { key: string; datatype?: string; valuetype?: string };
/** A sub-process with its (api-type-omitted) capture properties. Named, not
 *  inlined, because `RawStep` is an INTERSECTION: `step.subProcesses.map(...)`
 *  resolves its callback parameter from the base `WorkflowStep` side, so the
 *  augmented element type has to be applied at the use site to be visible. */
export type RawSubProcess = WorkflowStep["subProcesses"][number] & { properties?: RawProperty[] };
export type RawStep = WorkflowStep & {
  properties?: RawProperty[];
  subProcesses: RawSubProcess[];
};

// -- Derivation: a Loom template step -> a simple Stage ----------------------

/** One Loom `properties[]` entry -> one Detail, metadata intact. */
function toDetails(props: RawProperty[] | undefined, idPrefix: string): Detail[] {
  return (props || [])
    .filter((p) => (p.key || "").trim())
    .map((p, i) => ({
      id: `${idPrefix}-d${i}`,
      label: p.key,
      ...(p.datatype ? { datatype: p.datatype } : {}),
      ...(p.valuetype ? { valuetype: p.valuetype } : {}),
    }));
}

export function deriveStage(step: RawStep, index: number): Stage {
  const sid = String(step.id ?? `s${index}`);
  const tasks: Task[] = ((step.subProcesses || []) as RawSubProcess[])
    .filter((sp) => !sp.deleted)
    .map((sp, i) => {
      const tid = `${sid}-t${sp.id ?? i}`;
      const taskDetails = toDetails(sp.properties, tid);
      return {
        id: tid,
        name: sp.name || "Untitled task",
        days: Number(sp.estimatedDays ?? 0) || 0,
        needsApproval: !!sp.feedbackRequired,
        ...(taskDetails.length ? { details: taskDetails } : {}),
      };
    });
  const details: Detail[] = toDetails(step.properties, sid);
  // The stage's own estimatedDays is authoritative on the wire. Usually it is
  // exactly the task sum (toBackendSteps writes stageDays()), but a Loom-synced
  // step can carry a hand-set figure that its subprocess days do not add up to
  // -- e.g. a stage with no tasks at all but a real duration. Dropping it and
  // re-deriving from the tasks silently rewrote those stages to 0d on the first
  // save. Keep it as an explicit override so the round-trip is lossless; leave
  // it undefined when it already equals the sum, so the builder shows "auto".
  const taskSum = tasks.reduce((t, x) => t + (Number(x.days) || 0), 0);
  const wire = Number(step.estimatedDays ?? NaN);
  const daysOverride = Number.isFinite(wire) && wire !== taskSum ? wire : undefined;
  return {
    id: sid,
    name: step.name || `Stage ${index + 1}`,
    tasks,
    details,
    cost: 0,
    ...(daysOverride != null ? { daysOverride } : {}),
  };
}

// -- Roll-up math (single source of truth; deps.ts re-exports these) ---------

export function stageDays(s: Stage): number {
  if (s.daysOverride != null) return Number(s.daysOverride) || 0;
  return (s.tasks || []).reduce((t, x) => t + (Number(x.days) || 0), 0);
}
export function totalDays(stages: Stage[]): number {
  return stages.reduce((t, s) => t + stageDays(s), 0);
}
export function totalCost(stages: Stage[]): number {
  return stages.reduce((t, s) => t + (Number(s.cost) || 0), 0);
}

// -- Blank + preset factories (builder) --------------------------------------

export function blankTask(id: string): Task {
  return { id, name: "", days: 1, needsApproval: false };
}
export function blankStage(id: string): Stage {
  return { id, name: "", tasks: [blankTask(`${id}-t0`)], details: [], cost: 0, note: "" };
}

/** Drop-in stage presets (real Anuprerna phases). id assigned by the caller.
 *
 *  Each preset's details sit at the LEVEL LIVE PUTS THEM (re-checked against
 *  template 490267 on 2026-08-17). They used to be flattened onto the stage,
 *  which taught the wrong shape the moment anyone dropped a preset in: live
 *  hangs Warp/Weft Yarn Color & Shade off the Yarn Processing SUB-PROCESS and
 *  Target GSM off the Yarn Processing STEP, and Fabric Finishing has nothing at
 *  step level at all while its QC Fabric sub-process carries Comments on the
 *  Quality. Preset task details are plain labels; the writer defaults them to
 *  string/required exactly like a stage-level one. */
export const STAGE_PRESETS: {
  label: string;
  name: string;
  tasks: (Omit<Task, "id" | "details"> & { details?: string[] })[];
  details: string[];
}[] = [
  {
    label: "Yarn Processing",
    name: "Yarn Processing",
    tasks: [
      {
        name: "Yarn Processing",
        days: 15,
        needsApproval: false,
        details: ["Warp Yarn Color & Shade", "Weft Yarn Color & Shade"],
      },
      { name: "Processed Yarn QC", days: 5, needsApproval: true },
    ],
    details: ["Target GSM"],
  },
  {
    label: "Yarn Weaving",
    name: "Yarn Weaving",
    tasks: [
      { name: "Fabric Initial Sample", days: 20, needsApproval: true },
      { name: "Complete Production", days: 30, needsApproval: false },
    ],
    details: ["Original Sample EPI * PPI"],
  },
  {
    label: "Fabric Finishing",
    name: "Fabric Finishing",
    tasks: [
      { name: "Wash & Finish", days: 7, needsApproval: false },
      { name: "QC Fabric", days: 3, needsApproval: true, details: ["Comments on the Quality"] },
    ],
    details: [],
  },
];

export function presetToStage(p: (typeof STAGE_PRESETS)[number], id: string): Stage {
  return {
    id,
    name: p.name,
    tasks: p.tasks.map((t, i) => {
      const { details: taskDetails, ...rest } = t;
      const tid = `${id}-t${i}`;
      return {
        id: tid,
        ...rest,
        ...(taskDetails && taskDetails.length
          ? { details: taskDetails.map((label, k) => ({ id: `${tid}-d${k}`, label })) }
          : {}),
      };
    }),
    details: p.details.map((label, i) => ({ id: `${id}-d${i}`, label })),
    cost: 0,
    note: "",
  };
}

// -- Payload preview (HELD, never sent) --------------------------------------

export interface DraftPayloadStage {
  name: string;
  days: number;
  tasks: { name: string; days: number; needsApproval: boolean; instruction?: string }[];
  details: string[];
  cost: number;
}
export interface DraftPayload {
  name: string;
  description: string;
  stages: DraftPayloadStage[];
}

export function toPayload(name: string, description: string, stages: Stage[]): DraftPayload {
  return {
    name,
    description,
    stages: stages.map((s) => ({
      name: s.name.trim(),
      days: stageDays(s),
      tasks: s.tasks
        .filter((t) => t.name.trim())
        .map((t) => ({
          name: t.name.trim(),
          days: Number(t.days) || 0,
          needsApproval: t.needsApproval,
          ...(t.needsApproval && (t.instruction || "").trim() ? { instruction: t.instruction!.trim() } : {}),
        })),
      details: s.details.filter((d) => d.label.trim()).map((d) => d.label.trim()),
      cost: Number(s.cost) || 0,
    })),
  };
}

// -- Forward mapping: builder Stage[] -> the REAL workflow-template `steps` wire
// shape (2026-07-06 backend gap-fill: add/update workflow-template now persists
// `steps` verbatim -- see workflow.mapper.ts buildTemplateInsert). Verified
// against the 10 live-synced templates already sitting in workflow_templates.data:
// STEPS use primaryStep/parentStepId/previousStepId/nextStepId; SUBPROCESSES use
// the DISTINCT live naming primarySubProcess/parentSubProcessId/previousSubProcessId/
// nextSubProcessId (matches add-workflow.component.ts's generateStepIdentifiers()
// exactly -- parent==previous==the prior sibling's elementId, nextId back-filled
// once the next sibling is known, primary(Sub)Step true only for index 0).
// datatype/valuetype defaults ('string'/'required') match add-step-dialog.component.ts.
// A Stage's free-text `note` and a Task's `instruction` have no field on the live
// step/subprocess shape, so they are NOT sent (dropped, same as before this change).
export interface BackendElement {
  elementId: string;
  posX: number;
  posY: number;
  type: string;
}
export interface BackendProperty {
  key: string;
  datatype: string;
  valuetype: string;
}
export interface BackendSubProcessStep {
  name: string;
  primarySubProcess: boolean;
  parentSubProcessId: string;
  previousSubProcessId: string;
  nextSubProcessId: string;
  estimatedDays: number;
  feedbackRequired: boolean;
  element: BackendElement;
  properties: BackendProperty[];
}
export interface BackendStep {
  name: string;
  primaryStep: boolean;
  parentStepId: string;
  previousStepId: string;
  nextStepId: string;
  estimatedDays: number;
  feedbackRequired: boolean;
  element: BackendElement;
  properties: BackendProperty[];
  subProcesses: BackendSubProcessStep[];
}

/** A builder Detail -> the wire property. Preserves Loom's datatype/valuetype
 *  when the detail came from Loom; falls back to the pair the builder has always
 *  written for a detail a human just typed. */
function toBackendProperty(d: Detail): BackendProperty {
  return {
    key: d.label.trim(),
    datatype: d.datatype || "string",
    valuetype: d.valuetype || "required",
  };
}

export function toBackendSteps(stages: Stage[]): BackendStep[] {
  const steps: BackendStep[] = stages.map((s, i) => ({
    name: s.name.trim(),
    primaryStep: i === 0,
    parentStepId: "",
    previousStepId: "",
    nextStepId: "",
    estimatedDays: stageDays(s),
    feedbackRequired: s.tasks.some((t) => t.needsApproval),
    element: { elementId: `${i + 1}`, posX: 50 + i * 260, posY: 50, type: "STEP" },
    properties: s.details.filter((d) => d.label.trim()).map(toBackendProperty),
    subProcesses: s.tasks
      .filter((t) => t.name.trim())
      .map((t, j) => ({
        name: t.name.trim(),
        primarySubProcess: j === 0,
        parentSubProcessId: "",
        previousSubProcessId: "",
        nextSubProcessId: "",
        estimatedDays: Number(t.days) || 0,
        feedbackRequired: t.needsApproval,
        element: { elementId: `${i + 1}-${j + 1}`, posX: 50 + i * 260, posY: 200 + j * 160, type: "SUBPROCESS" },
        // Was a hardcoded []. That is a verbatim rewrite (mergeTemplateUpdate
        // stores `steps` as sent), so every task-level capture field on a
        // Loom-synced template — "Comments on the Quality" among them — was
        // deleted the first time anyone saved from the builder. The builder
        // cannot edit these, so hand back exactly what was read.
        properties: (t.details || []).filter((d) => d.label.trim()).map(toBackendProperty),
      })),
  }));

  // Chain step-level ids (parent==previous==prior step's elementId; nextStepId
  // back-filled onto the prior step once this one is known).
  let prevStepId = "";
  steps.forEach((st, i) => {
    st.parentStepId = prevStepId;
    st.previousStepId = prevStepId;
    if (i > 0) steps[i - 1].nextStepId = st.element.elementId;
    prevStepId = st.element.elementId;

    // Chain subprocess-level ids WITHIN this step only.
    let prevSubId = "";
    st.subProcesses.forEach((sp, j) => {
      sp.parentSubProcessId = prevSubId;
      sp.previousSubProcessId = prevSubId;
      if (j > 0) st.subProcesses[j - 1].nextSubProcessId = sp.element.elementId;
      prevSubId = sp.element.elementId;
    });
  });

  return steps;
}

// ═════════════════════════════════════════════════════════════════════════════
// JOB-INSTANCE step mapping (2026-08-16) — the SAFE counterpart to toBackendSteps.
//
// toBackendSteps above builds a TEMPLATE: a fresh chain with no ids, no status,
// no actual dates and no estimated dates, which is exactly right when creating
// something. Sending that same shape at an EXISTING JOB destroys it.
//
// MEASURED on sandbox job 1000000000189 (2026-08-16). The job had stage
// "Yarn Processing" IN_PROGRESS with a real actualStartDate and six named
// subprocesses. One PATCH /update/custom-workflow carrying toBackendSteps
// output came back success:true — and every step and subprocess then read
// id=undefined, status=undefined, actualStartDate=undefined. mergeCustomWorkflowUpdate
// assigns body.steps STRAIGHT THROUGH (out['steps'] = body['steps']), so the
// rewrite is verbatim and every omitted field is simply gone. With the node ids
// gone, PATCH /update/{step,subprocess}-element can no longer resolve a node
// (resolveWorkflowScope needs the id), so the pipeline board can never advance
// that job again. Silent, unrecoverable, and reachable from the "Edit job"
// button on any custom-order job.
//
// toJobSteps closes that: it matches each builder Stage back to the node it was
// derived FROM and spreads the original, overwriting only what the builder can
// legitimately change (name, durations, the subprocess set). Identity, status,
// actual dates and estimated dates ride through untouched. Genuinely new stages
// and tasks fall back to the template shape, which is correct — they have no
// prior identity to keep.
//
// The match key is not a guess: deriveStage() stamps `stage.id = String(step.id)`
// and `task.id = \`${step.id}-t${subProcess.id}\``, while newly added rows get
// "new-<n>" ids from the builder. So a numeric parse IS the "did this row exist
// before?" test, and it survives re-ordering and deletion, which an index-based
// match would not.
// ═════════════════════════════════════════════════════════════════════════════

/** A live job node, as returned by GET /get/workflow/{id}. Deliberately loose:
 *  we PRESERVE unknown keys rather than enumerate them, because anything this
 *  type fails to mention is exactly what a verbatim rewrite would delete. */
export type LiveStepNode = Record<string, unknown> & {
  id?: number;
  subProcesses?: (Record<string, unknown> & { id?: number; deleted?: boolean })[];
};

/** The numeric backend id a builder Stage came from, or null when it is new. */
export function stageBackendId(stage: Stage): number | null {
  const n = Number(stage.id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** The numeric backend id a builder Task came from, or null when it is new.
 *  Task ids are `<stepId>-t<subProcessId>`; a new task is `<stageId>-t<counter>`
 *  only when the STAGE is new, and `new-<n>` otherwise — both fail this parse,
 *  which is the intent. */
export function taskBackendId(task: Task): number | null {
  const m = /-t(\d+)$/.exec(task.id || "");
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Map builder Stages back onto the LIVE job's step tree without losing anything.
 *
 * Returns a `steps` array safe to send to PATCH /update/custom-workflow:
 *   - a stage that existed  -> the original node, spread, with name /
 *     estimatedDays / subProcesses updated
 *   - a stage that is new   -> the template shape from toBackendSteps
 *   - a stage that was removed in the builder -> omitted (a real deletion)
 * Soft-deleted originals (`deleted: true`) are carried through untouched at the
 * end, because they are history the builder never showed and must not drop.
 */
export function toJobSteps(stages: Stage[], originalSteps: LiveStepNode[]): unknown[] {
  const byId = new Map<number, LiveStepNode>();
  for (const s of originalSteps || []) {
    const id = Number(s?.id);
    if (Number.isInteger(id)) byId.set(id, s);
  }
  // Template-shaped fallbacks for genuinely new rows, positionally aligned so
  // the chain ids (previousStepId / nextStepId) stay coherent across the mix.
  const fresh = toBackendSteps(stages);
  const seen = new Set<number>();

  const out: unknown[] = stages.map((stage, i) => {
    const sid = stageBackendId(stage);
    const original = sid != null ? byId.get(sid) : undefined;
    if (!original) return fresh[i];
    seen.add(sid!);

    const originalSubs = (original.subProcesses || []) as (Record<string, unknown> & { id?: number; deleted?: boolean })[];
    const subById = new Map<number, Record<string, unknown>>();
    for (const sp of originalSubs) {
      const id = Number(sp?.id);
      if (Number.isInteger(id)) subById.set(id, sp);
    }
    const seenSubs = new Set<number>();
    const freshSubs = (fresh[i]?.subProcesses || []) as unknown[];

    const subProcesses: unknown[] = stage.tasks
      .filter((t) => t.name.trim())
      .map((t, j) => {
        const tid = taskBackendId(t);
        const origSub = tid != null ? subById.get(tid) : undefined;
        if (!origSub) return freshSubs[j];
        seenSubs.add(tid!);
        // Spread FIRST so status / actualStartDate / actualEndDate / element /
        // version / feedback all survive; only the two builder-owned fields move.
        return { ...origSub, name: t.name.trim(), estimatedDays: Number(t.days) || 0 };
      })
      .filter((x) => x != null);

    // Keep soft-deleted subprocesses the builder never displayed.
    for (const sp of originalSubs) {
      const id = Number(sp?.id);
      if (sp?.deleted && Number.isInteger(id) && !seenSubs.has(id)) subProcesses.push(sp);
    }

    return {
      ...original,
      name: stage.name.trim(),
      estimatedDays: stageDays(stage),
      subProcesses,
    };
  });

  // Keep soft-deleted stages, same reasoning.
  for (const s of originalSteps || []) {
    const id = Number(s?.id);
    if ((s as { deleted?: boolean })?.deleted && Number.isInteger(id) && !seen.has(id)) out.push(s);
  }
  return out;
}
