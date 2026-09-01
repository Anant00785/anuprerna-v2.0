/**
 * workflow-ops.ts — the operable-job vocabulary, in ONE place.
 *
 * Three concerns live here because all three were previously duplicated inline
 * across the instance page, the swimlane and the status control, and drifted:
 *
 *   1. THE THREE-STATE STATUS VOCABULARY (2026-08-16, Amit).
 *      Production runs on exactly three states — To do / In progress / Done.
 *      HALTED is NOT offered as a choice any more ("We're not using the HALTED
 *      thing... if it's green, it means it's already done").
 *
 *      Removing it as a CHOICE is not the same as pretending it cannot exist.
 *      Measured over all 2,082 jobs in the sandbox (both tables, all four list
 *      statuses) AFTER the 2026-08-16 step-detail resync: 3,823 steps ->
 *      COMPLETED 3,258 / PENDING 363 / IN_PROGRESS 199, and 7,090 subprocesses
 *      -> COMPLETED 6,097 / PENDING 834 / IN_PROGRESS 153. ZERO HALTED rows at
 *      either level, and zero HALTED workflows — live runs on exactly the three
 *      values Amit named. So dropping the option orphans nothing and needs no
 *      migration or backfill. But the backend enum still ACCEPTS HALTED
 *      (WORKFLOW_STEP_STATUSES), so a future resync can reintroduce one.
 *
 *      (The WORKFLOW level is a different vocabulary — COMPLETED 1,742 /
 *      INITIATED 199 / CREATED 141 — and is deliberately not conflated with
 *      the node vocabulary here.)
 *
 *      A small number of nodes carry an EMPTY status (3 steps, 6 subprocesses).
 *      `up()` reads absent-or-empty as PENDING, which matches the backend's own
 *      default for a freshly instantiated node — a node that has never been
 *      given a status has not been started.
 *
 *      Hence the rule this module enforces: an UNRECOGNISED status is displayed
 *      AS ITSELF and never silently re-labelled as one of the three. Mapping an
 *      unknown status onto "To do" would tell an operator that finished or
 *      halted work has not been started, which is the one lie a production
 *      board must not tell.
 *
 *   2. COLUMN PLACEMENT, including STAGE DOMINANCE (Amit: "if it is green, it
 *      means it is already done"). See columnForCard.
 *
 *   3. WHETHER A WRITE CAN ACTUALLY PERSIST. See the capability helpers — the
 *      UI must never render a control that silently no-ops.
 */

import { isSandboxId, sandboxRefusal } from "@/lib/sandbox-floor";

// ── 1. Status vocabulary ────────────────────────────────────────────────────

/** The ONLY three states a human may choose, in work order. */
export const NODE_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
export type NodeStatus = (typeof NODE_STATUSES)[number];

/** Amit's words for them. Never show the raw enum to an operator. */
export const NODE_STATUS_LABEL: Record<NodeStatus, string> = {
  PENDING: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Done",
};

export const up = (s?: string): string => (s || "PENDING").toUpperCase();

export function isCanonicalStatus(s?: string): boolean {
  return (NODE_STATUSES as readonly string[]).includes(up(s));
}

/**
 * The label to PRINT for a status.
 *
 * Canonical -> Amit's three words. Anything else (HALTED, or whatever a future
 * Loom resync introduces) -> the raw value, de-underscored, so it reads as the
 * foreign thing it is rather than being folded into a state it is not.
 */
export function statusLabel(s?: string): string {
  const u = up(s);
  if (isCanonicalStatus(u)) return NODE_STATUS_LABEL[u as NodeStatus];
  return u.replace(/_/g, " ");
}

// ── 2. Column placement ─────────────────────────────────────────────────────

export type ColKey = "todo" | "doing" | "done";

export const COLUMNS: { key: ColKey; label: string }[] = [
  { key: "todo", label: NODE_STATUS_LABEL.PENDING },
  { key: "doing", label: NODE_STATUS_LABEL.IN_PROGRESS },
  { key: "done", label: NODE_STATUS_LABEL.COMPLETED },
];

export const statusForCol = (k: ColKey): NodeStatus =>
  k === "done" ? "COMPLETED" : k === "doing" ? "IN_PROGRESS" : "PENDING";

/** Column for a status considered ON ITS OWN. */
export function columnForStatus(s?: string): ColKey {
  const u = up(s);
  if (u === "COMPLETED") return "done";
  if (u === "PENDING") return "todo";
  // IN_PROGRESS *and every unrecognised status* land here. Deliberate: "To do"
  // is the one column that asserts work has NOT begun, and we cannot assert
  // that about a status we do not understand. In-flight is the safe reading,
  // and the card still prints its own true label (see statusLabel).
  return "doing";
}

/**
 * Column for a CARD, which is a task inside a stage — the placement Amit
 * actually complained about.
 *
 * STAGE DOMINANCE: when the owning STAGE is COMPLETED, every one of its cards
 * renders in Done regardless of the task row's own status. A stage that is
 * green is finished, so nothing under it may still be advertised as To do or In
 * progress — that is the exact incoherence reported on 2026-08-16 ("a stage
 * live shows green (done) and ours put it under In progress").
 *
 * This is a DISPLAY rule, not a data rewrite: the stale task status is still
 * printed on the card (statusLabel) and is still what the backend holds. We
 * refuse to let the column contradict the stage, and we refuse to silently
 * "fix" the row underneath.
 *
 * It is not hypothetical. Re-measured over all 2,082 jobs AFTER the 2026-08-16
 * step-detail resync, 1 stage is COMPLETED while carrying a non-COMPLETED task:
 *   - workflow 10992454 (ORDER) step 10992459 "Printing/Dyeing" = COMPLETED,
 *     tasks: "Printed/Dyed Sample" = PENDING, "QC Fabric" = COMPLETED,
 *            "Production Completion" = COMPLETED
 * Before this rule that PENDING task rendered a card under To do beneath a
 * green, ticked, done stage rail. (A second such record, workflow 114027735,
 * existed before the resync and was corrected by it — which is precisely why
 * this is a display rule and not a data rewrite: the board must render whatever
 * the store says coherently, without deciding to "fix" it.)
 */
export function columnForCard(cardStatus: string | undefined, stageStatus: string | undefined): ColKey {
  if (up(stageStatus) === "COMPLETED") return "done";
  return columnForStatus(cardStatus);
}

/** True when the card sits in Done only because its STAGE is closed — the
 *  caller uses this to explain the placement instead of hiding the mismatch. */
export function isStageClosedOverride(cardStatus: string | undefined, stageStatus: string | undefined): boolean {
  return up(stageStatus) === "COMPLETED" && up(cardStatus) !== "COMPLETED";
}

// ── 3. Write capability ─────────────────────────────────────────────────────
//
// MEASURED against the deployed sandbox wrapper on :8090, 2026-08-16, by
// minting two sandbox jobs and diffing the detail before/after each PATCH
// (probe transcript in the PR body):
//
//   PATCH /update/workflow          { artisanAssignments } -> PERSISTS (2 rows landed)
//   PATCH /update/workflow          { estimatedStartDate }  -> PERSISTS
//   PATCH /update/workflow          { steps }               -> SILENTLY DROPPED
//   PATCH /update/custom-workflow   { steps }               -> PERSISTS (verbatim)
//   PATCH /update/{step,subprocess}-element { status, actual*Date } -> PERSISTS
//
// The asymmetry is real and lives in anuprerna-backend workflow.mapper.ts:
// CUSTOM_WORKFLOW_UPDATABLE contains 'steps'; mergeWorkflowUpdate has no steps
// branch at all. So a per-stage schedule edit CANNOT persist on a standard
// ORDER job, and a control that offers it there would lie.

export interface WriteCapability {
  ok: boolean;
  /** Operator-facing sentence for why not. Empty when ok. */
  reason: string;
}

const OK: WriteCapability = { ok: true, reason: "" };

interface CapabilityJob {
  id: number;
  type?: string;
  /** The WORKFLOW-level status (CREATED | INITIATED | HALTED | COMPLETED).
   *  Load-bearing for canWriteStepTree — the backend gates `steps` on it. */
  status?: string;
}

const isCustom = (wf: CapabilityJob) => (wf.type || "").toUpperCase() === "CUSTOM_ORDER";
const entityOf = (wf: CapabilityJob) => (isCustom(wf) ? "custom workflow" : "workflow");

/**
 * Can we PATCH the WORKFLOW row itself (name / dates / artisanAssignments)?
 *
 * Blocked for live-synced rows: /api/crud bands update/workflow and
 * update/custom-workflow below the sandbox floor exactly as it bands the
 * deletes, because a workflow PATCH is a whole-row rewrite. That guard is
 * deliberate and is NOT weakened here — this helper exists so the UI can say
 * WHY a control is inert instead of rendering a button that 400s.
 */
export function canWriteWorkflow(wf: CapabilityJob): WriteCapability {
  if (!isSandboxId(wf.id)) {
    return {
      ok: false,
      reason:
        sandboxRefusal("edit", entityOf(wf)) +
        " — this job was synced from live Loom, so the sandbox refuses to rewrite its row.",
    };
  }
  return OK;
}

/**
 * Can we persist anything inside the `steps` TREE — per-stage dates AND the
 * captured detail VALUES on a stage or a task?
 *
 * ONE helper for both because they are ONE write: both travel as `steps` on
 * PATCH /update/workflow | /update/custom-workflow, and the backend gates that
 * array as a unit. Two helpers would inevitably disagree.
 *
 * Two independent gates, reported separately so the operator learns which one
 * they hit:
 *
 *   1. THE SANDBOX FLOOR (as above) — /api/crud bands both update paths.
 *
 *   2. THE JOB MUST NOT HAVE STARTED. WorkflowService.updateWorkflow and
 *      .updateCustomWorkflow both refuse with
 *        "Only a job that has not started can have its stages edited"
 *      whenever the body carries a `steps` array and the stored status is not
 *      CREATED. The message below is that sentence VERBATIM, so a pre-check
 *      here and a server refusal read identically.
 *
 * RE-MEASURED against the deployed wrapper on :8090, 2026-08-17, by minting one
 * sandbox job of EACH kind and diffing /get/workflow/{id} before and after:
 *
 *   PATCH /update/custom-workflow { steps } on CREATED  -> PERSISTS (values + dates)
 *   PATCH /update/workflow        { steps } on CREATED  -> PERSISTS (values + dates)
 *   PATCH /update/{custom-,}workflow { steps } on INITIATED -> 400, message above
 *   node ids / statuses / actual dates survive all of the above
 *
 * The SECOND line retires a claim this file used to make. Until 2026-08-17 this
 * helper refused every standard-ORDER job outright, on the measured grounds that
 * mergeWorkflowUpdate had no `steps` branch at all. That was true when it was
 * written and is no longer: anuprerna-backend 3d8fde2 ("MERGE steps on PATCH
 * /update/{custom-,}workflow") added the branch to BOTH paths on the same day,
 * routing each through mergeStepTrees. Verified by writing a property value onto
 * standard-order job 1000000000001 and reading it back. Keeping the old refusal
 * would now be the lie — it would hide a write that works.
 *
 * The FIRST line adds a gate this helper never had, and its absence was a live
 * bug rather than a missing feature: the board offered "Save schedule" on a
 * STARTED custom job, sent `steps`, and got the 400 above — a control that could
 * not succeed, presented as if it could. The chain head's start date is
 * unaffected and still moves on a started job, because that is the workflow
 * ROW's own estimatedStartDate and mergeWorkflowUpdate applies it regardless of
 * status; only the per-stage array is gated.
 */
export function canWriteStepTree(wf: CapabilityJob): WriteCapability {
  const base = canWriteWorkflow(wf);
  if (!base.ok) return base;
  const status = (wf.status || "").toUpperCase();
  if (status !== "CREATED") {
    return {
      ok: false,
      reason:
        "Only a job that has not started can have its stages edited — the backend " +
        "refuses a `steps` write once the job leaves CREATED (this one is " +
        (status ? status.replace(/_/g, " ") : "already underway") +
        "). Stage dates and captured detail values both travel in that array, so " +
        "both are read-only here. Statuses, actual dates and artisan assignments " +
        "are element-level writes and keep working.",
    };
  }
  return OK;
}

/** RETIRED as an alias of canWriteStepTree (2026-08-17). It named "can the
 *  schedule be edited", answered with the whole-tree rule, and that answer was
 *  wrong the moment the schedule stopped travelling in the `steps` array — it is
 *  what made the date chip inert on every started job. The schedule question is
 *  now canWriteNodeSchedule; this name is kept pointing at the STEP-TREE rule it
 *  actually described so nothing silently changes meaning under a caller, and it
 *  should be deleted once the last one is gone. */
export const canWriteStageSchedule = canWriteStepTree;

/**
 * Can the CAPTURED VALUES on ONE node be written?
 *
 * SEPARATE from canWriteStepTree since 2026-08-17, because they stopped being the
 * same write. This one has NO status gate, and that is the whole point.
 *
 * WHAT WAS WRONG. Both the schedule and the captured values used to travel as the
 * whole-tree `steps` array, so both inherited its CREATED-only rule. The moment a
 * job's first Start promoted it CREATED -> INITIATED the "Edit values" control
 * count dropped to ZERO and the board said "Stage dates and captured details are
 * read-only on this job". Since every real job is INITIATED or later, captured
 * values were in practice NEVER editable — the exact opposite of the requirement,
 * and a QC field that can only be filled in before the work starts is not a QC
 * field. The audit measured it: 0 Edit-values buttons on a started job.
 *
 * WHAT CHANGED. anuprerna-backend 8b5cf83 made `properties` writable PER NODE on
 * PATCH /update/{step,subprocess}-element, as a key-wise MERGE, with no status
 * gate at all — specifically so a value can be captured on a job in flight. This
 * file predated that commit by 27 minutes and went on citing the old limit.
 * Re-measured against the RUNNING :8090 image rather than trusted from a comment
 * (mergeNodeProperties + guardPropertyCapture are both compiled into
 * /app/dist/workflow/, verified 2026-08-17).
 *
 * The merge is SAFER than the whole-tree write it replaces, which is why it is now
 * the only path for values on either kind of job:
 *   • the stored entry IS the schema — key/datatype/valuetype are preserved
 *     verbatim and only `value` is written, so a `deferred` field can never be
 *     silently promoted to `required`;
 *   • an UNKNOWN key REFUSES the whole payload and names the key, instead of
 *     answering 200 and dropping it;
 *   • validation is all-or-nothing, so a rejected payload leaves the node
 *     byte-identical;
 *   • the whole-tree write soft-deletes any node the payload omits. This one
 *     cannot touch a node it does not address.
 *
 * THE ONE GATE THAT REMAINS is the sandbox floor, and it is the backend's, not an
 * invention here: WorkflowService.guardPropertyCapture refuses a `properties`
 * write whose OWNING WORKFLOW is sub-floor. The reasoning is worth keeping
 * straight, because it is why this differs from canWriteElement below — a STATUS
 * advance on a live-synced job is the sandbox working as intended, while captured
 * CONTENT on one has no execution meaning and would be silently reverted by the
 * next db:refresh. So status stays writable there and values do not.
 */
export function canWriteNodeValues(wf: CapabilityJob): WriteCapability {
  if (!isSandboxId(wf.id)) {
    return {
      ok: false,
      reason:
        sandboxRefusal("capture a value on", entityOf(wf)) +
        " — this job was synced from live Loom. A value written here would be reverted by the " +
        "next sandbox refresh, so the backend refuses it rather than letting it look saved.",
    };
  }
  return OK;
}

/**
 * Can the ESTIMATED SCHEDULE on ONE node be written?
 *
 * SEPARATE from canWriteStepTree since 2026-08-17, and separate for exactly the
 * reason canWriteNodeValues is: it stopped being the same write. This one has NO
 * status gate, and that is the whole point.
 *
 * WHAT WAS WRONG. Amit opened a running job, tried to POSTPONE a stage, and found
 * no way to do it. Live Weave lets him — the "UPDATE WORKFLOW SUB PROCESS" dialog
 * carries an editable Estimated Start Date / Estimated End Date on an IN_PROGRESS
 * node. Here the only path a stage date had ever travelled was the whole-tree
 * `steps` array, so it inherited that array's CREATED-only rule, and since every
 * real job is INITIATED or later the schedule was in practice NEVER editable. By
 * the standing rule — if live does it, we do it — that is a DEFECT, not a missing
 * feature.
 *
 * WHAT CHANGED. anuprerna-backend widened applyNodeStatusPatch to accept
 * estimatedStartDate / estimatedEndDate / estimatedDays PER NODE on PATCH
 * /update/{step,subprocess}-element, with no status gate, specifically so a plan
 * can be moved on a job in flight. That is also how LIVE writes it: the dialog
 * PATCHes the edited node and then each affected downstream node INDIVIDUALLY
 * (update-workflow-sub-process.component.ts _bulkUpdateAffectedElements), never a
 * whole-tree rewrite. Re-measured against the running wrapper rather than trusted
 * from a comment — see backend test/workflow-node-schedule.test.ts, 16/16.
 *
 * The per-node write is SAFER than the whole-tree one it replaces, identically to
 * the captured-value case: mergeStepTrees soft-deletes any stored node the payload
 * omits, so the old call had to resend the entire tree every time; this one cannot
 * touch a node it does not address, and it cannot blank a node id.
 *
 * THE ONE GATE THAT REMAINS is the sandbox floor, and it is the backend's, not an
 * invention here: WorkflowService.guardNodeContentWrite refuses a schedule write
 * whose owning workflow is sub-floor. The reasoning is the same one that splits
 * canWriteNodeValues from canWriteElement — a STATUS advance on a live-synced job
 * is the sandbox working as intended, while the PLAN on one has no execution
 * meaning here and would be silently reverted by the next db:refresh. Worth
 * knowing: /api/crud registers update/{step,subprocess}-element as `open` rather
 * than banded, so this refusal comes from the backend alone. Do not "simplify" it
 * away on the grounds that the route looks unbanded.
 */
export function canWriteNodeSchedule(wf: CapabilityJob): WriteCapability {
  if (!isSandboxId(wf.id)) {
    return {
      ok: false,
      reason:
        sandboxRefusal("reschedule", entityOf(wf)) +
        " — this job was synced from live Loom. A date moved here would be reverted by the " +
        "next sandbox refresh, so the backend refuses it rather than letting it look saved.",
    };
  }
  return OK;
}

/**
 * Can THIS stage's own dates be typed directly?
 *
 * A stage that OWNS TASKS does not have dates of its own to type — they are
 * DERIVED, start = min(task starts) and end = max(task ends). That is not a
 * simplification invented here, it is live's contract, stated in live's own code:
 * update-workflow-step.component.ts implements both date setters as empty bodies
 * under the comment "Step dates are read-only and calculated from sub-processes",
 * while update-workflow-sub-process.component.ts carries the real editors and
 * calls updateParentStepDates to roll the result up.
 *
 * So the operator edits the TASK, and the stage follows. A stage with NO tasks is
 * its own unit of work — this board already renders it as a single card — and
 * there the stage IS the thing to edit.
 *
 * The stage rail keeps a START control in both cases, because "postpone this
 * stage" is a real operator intent and this board is stage-first in a way live's
 * dialog is not. Moving a stage that owns tasks moves its TASKS RIGIDLY by the
 * same delta (see projectStageMove), so the derived relationship above still holds
 * exactly after the write. What is refused is typing a stage's DURATION while its
 * tasks decide it — that number cannot be honoured, and a control that cannot be
 * honoured is the one thing this surface does not render.
 */
export function canTypeStageDuration(taskCount: number): WriteCapability {
  if (taskCount > 0) {
    return {
      ok: false,
      reason:
        "This stage's length follows its tasks — it runs from the first task's start to the " +
        "last one's end, exactly as live derives it. Change a task's duration and the stage " +
        "re-measures itself. You can still move the whole stage with the start date.",
    };
  }
  return OK;
}

/** Element-level STATUS + artisan writes (update/{step,subprocess}-element[/artisan-assignments])
 *  are NOT banded — /api/crud registers both as `open` because they are addressed by an
 *  element id and exercising the live-synced jobs is the point of the sandbox — and they
 *  persist on live-synced jobs too. Verified on live-mirrored workflow 133044983 (step
 *  133044984 assignments read 200). Note the deliberate asymmetry with
 *  canWriteNodeValues: the same two endpoints ALSO carry the property capture, and that
 *  ONE field is floor-guarded by the backend while the status advance beside it is not. */
export function canWriteElement(): WriteCapability {
  return OK;
}

// ── 4. Sequential schedule maths ────────────────────────────────────────────

export const DAY_MS = 86_400_000;

export interface SchedulableStep {
  id?: number;
  estimatedDays?: number;
  estimatedStartDate?: number;
  estimatedEndDate?: number;
  deleted?: boolean;
}

export interface SchedulePatch {
  estimatedStartDate: number;
  estimatedEndDate: number;
  estimatedDays: number;
}

/** One stage's own dates as they are STORED (or seeded, when it has none). */
export interface StageBaseline {
  start: number;
  end: number;
  days: number;
  /** False when the stage carried no usable dates and had to be seeded. */
  scheduled: boolean;
}

/** What the operator changed about ONE stage. Both fields are absolute, not deltas. */
export interface ScheduleEdit {
  /** New start for this stage. Moves it AND everything after it by the same delta. */
  startMs?: number;
  /** New duration in days. Moves everything after it by the difference. */
  days?: number;
}

/**
 * THE SCHEDULING MODEL — gap-preserving, not back-to-back.
 *
 * This replaced a resequence() that re-packed every stage against its
 * predecessor's end, and that was a DATA-CORRUPTION bug rather than a missing
 * feature. Measured over all 376 live workflows with a resolvable dated chain
 * (2026-08-17): 55 of them carry at least one IDLE GAP between one stage ending
 * and the next starting, 742 idle days in total. On 133044983 Yarn Processing
 * ends 11 Jun 2026 and Yarn Weaving starts 25 Jun 2026 — a real 14-day gap in
 * the plan. Re-packing would have silently deleted it and dragged every
 * downstream date 14 days earlier on the first save. Amit's rule: if live does
 * it, we do it.
 *
 * The same measurement retired a claim this file used to make. The old repack
 * was ALSO the entire source of the "two end dates disagree" banner: collapsing
 * 133044983's 14-day gap produced a chain end 14 days before the job's stored
 * estimatedEndDate, and that gap WAS the 14 days. Against the stored dates, 0 of
 * those 376 jobs have a chain end that differs from the saved end at all. The
 * banner stays (the two really are different quantities and can drift after a
 * partial write) — it is simply, and correctly, silent on live data now.
 *
 * ── baselineSchedule ──
 * Each stage's dates come from the stage ITSELF, so whatever spacing the plan
 * has is what we start from. A stage with no usable dates — a job created
 * through POST /add/workflow gets estimatedStartDate/EndDate 0 — is SEEDED
 * back-to-back from the running cursor, because a stage with no dates has no
 * gap to preserve. Seeding is a one-time reading of an unscheduled stage, never
 * a re-reading of a scheduled one.
 */
export function baselineSchedule(
  ordered: SchedulableStep[],
  jobStartMs: number,
): Record<number, StageBaseline> {
  const out: Record<number, StageBaseline> = {};
  let cursor = Number.isFinite(jobStartMs) && jobStartMs > 0 ? jobStartMs : 0;
  for (const s of ordered) {
    if (s.deleted) continue;
    const id = Number(s.id);
    if (!Number.isFinite(id)) continue;
    const storedStart = Number(s.estimatedStartDate);
    const storedEnd = Number(s.estimatedEndDate);
    const storedDays = Number(s.estimatedDays);
    const hasStart = Number.isFinite(storedStart) && storedStart > 0;
    const hasEnd = Number.isFinite(storedEnd) && storedEnd > 0;
    const start = hasStart ? storedStart : cursor;
    const usableDays = Number.isFinite(storedDays) && storedDays >= 0 ? storedDays : null;
    // Prefer the stored END: it is the thing the rest of the plan is spaced
    // against. Only synthesise one from the duration when there is none.
    const end = hasEnd && storedEnd >= start ? storedEnd : start + (usableDays ?? 0) * DAY_MS;
    const days = usableDays ?? Math.round((end - start) / DAY_MS);
    out[id] = { start, end, days, scheduled: hasStart && hasEnd };
    cursor = end;
  }
  return out;
}

/**
 * Project the baseline forward under the operator's edits.
 *
 * ONE rule, applied to every stage including the chain head:
 *
 *   • Moving a stage's START moves that stage and EVERYTHING AFTER IT by the
 *     same delta. Its own duration is untouched, and so is every gap further
 *     down the chain. The gap immediately BEFORE it is what changes — which is
 *     how an idle gap gets created, widened or closed.
 *   • Changing a stage's DAYS moves everything after it by the difference,
 *     again leaving the later gaps alone.
 *
 * Because the rule is uniform, "move the job start" needs no special case: the
 * chain head has nothing in front of it, so moving its start moves the whole
 * job — the behaviour the old model had, arrived at rather than hard-coded.
 *
 * With NO edits the output is byte-identical to the baseline, so a save that
 * changes nothing writes nothing new. That is the property the re-packing
 * version could not have: it rewrote dates on every job it touched.
 */
export function projectSchedule(
  ordered: SchedulableStep[],
  jobStartMs: number,
  edits: Record<number, ScheduleEdit> = {},
): Record<number, SchedulePatch> {
  const base = baselineSchedule(ordered, jobStartMs);
  const out: Record<number, SchedulePatch> = {};
  // How far the remaining baseline timeline has been displaced so far. Adding it
  // to BOTH ends of every later stage is precisely what keeps their gaps intact.
  let shift = 0;
  for (const s of ordered) {
    if (s.deleted) continue;
    const id = Number(s.id);
    if (!Number.isFinite(id)) continue;
    const b = base[id];
    if (!b) continue;
    const edit = edits[id] ?? {};

    let start = b.start + shift;
    if (edit.startMs != null && Number.isFinite(edit.startMs) && edit.startMs !== start) {
      shift += edit.startMs - start;
      start = edit.startMs;
    }
    // The stage keeps its own length across a move: its end rides the same shift.
    let end = b.end + shift;
    let days = b.days;
    if (edit.days != null && Number.isFinite(edit.days) && edit.days >= 0) {
      const newEnd = start + edit.days * DAY_MS;
      shift += newEnd - end;
      end = newEnd;
      days = edit.days;
    }
    out[id] = { estimatedStartDate: start, estimatedEndDate: end, estimatedDays: days };
  }
  return out;
}

/**
 * Where the plan ENDS — the last stage's end, gaps included.
 *
 * This is the second of the TWO end dates the job page shows, and it is not the
 * same quantity as the workflow row's own estimatedEndDate: this one is derived
 * from the stages, that one is a stored field nobody recomputes when a stage is
 * edited. Both the top summary (to state a disagreement) and the pipeline board
 * (to preview a reschedule) need it, and they must not compute it two ways.
 *
 * `ordered` must already be in CHAIN order — see orderWorkflowSteps. Feeding it
 * insertion order gives the end of a run that is not the run.
 */
export function chainEnd(
  ordered: SchedulableStep[],
  jobStartMs: number,
  edits: Record<number, ScheduleEdit> = {},
): number {
  const ends = Object.values(projectSchedule(ordered, jobStartMs, edits)).map((p) => p.estimatedEndDate);
  return ends.length ? Math.max(...ends) : jobStartMs;
}

/** Idle days between one stage ending and the next starting. Negative = overlap. */
export function gapDays(prevEndMs: number, nextStartMs: number): number {
  return Math.round((nextStartMs - prevEndMs) / DAY_MS);
}

/**
 * Apply a computed schedule onto the REAL step nodes, PRESERVING every other
 * field on every node and subprocess.
 *
 * This is the whole safety story for the date editor, and it is a direct
 * response to a measured data-destruction bug. PATCH /update/custom-workflow
 * stores `steps` VERBATIM (mergeCustomWorkflowUpdate assigns body.steps
 * straight through). The existing "Edit job" page sends the output of
 * stages.ts toBackendSteps, which is a TEMPLATE shape — it carries no id, no
 * status, no actual dates and no estimated dates. Measured on sandbox job
 * 1000000000189 (2026-08-16): after one such save, every step and subprocess
 * came back with id=undefined and status=undefined, and an IN_PROGRESS stage
 * with a real actualStartDate was blanked. With the ids gone, PATCH
 * /update/{step,subprocess}-element can never resolve a node again, so the job
 * is permanently unadvanceable.
 *
 * So: spread the existing node, then overwrite ONLY the three schedule fields.
 * Nothing is reconstructed, nothing is defaulted, and subProcesses ride through
 * untouched.
 */
export function mergeScheduleIntoSteps<T extends SchedulableStep>(
  steps: T[],
  schedule: Record<number, SchedulePatch>,
): T[] {
  return steps.map((s) => {
    const id = Number(s.id);
    const patch = Number.isFinite(id) ? schedule[id] : undefined;
    if (!patch) return s;
    return { ...s, ...patch };
  });
}

/**
 * ── THE TWO-LEVEL SCHEDULE ─────────────────────────────────────────────────
 *
 * A job's plan lives at two levels and only ONE of them is typed:
 *
 *   TASK (subprocess)  the unit an operator actually reschedules.
 *   STAGE (step)       start = min(task starts), end = max(task ends). DERIVED
 *                      whenever the stage owns tasks — live's own rule, see
 *                      canTypeStageDuration for the citation. A stage with NO
 *                      tasks is its own unit and is typed directly.
 *   JOB                start = chain head's start, end = the last stage's end.
 *
 * Everything below preserves IDLE GAPS at BOTH levels, by the one rule
 * projectSchedule already applies at stage level: a node and everything after it
 * move by the SAME delta, so every later gap survives and only the gap
 * immediately in front of the edited node absorbs the change.
 *
 * THIS IS A DELIBERATE DIVERGENCE FROM LIVE, and the one place we do not copy it.
 * Live's WorkflowSchedulerService.cascadeForward re-packs every following node
 * back-to-back (`curr.estimatedStartDate = prev.estimatedEndDate`), which DELETES
 * idle time. Measured over all 376 live workflows with a resolvable dated chain:
 * 55 carry at least one idle gap, 742 idle days in total — on 133044983 Yarn
 * Processing ends 11 Jun and Yarn Weaving starts 25 Jun, a real 14-day hole in the
 * plan that live's own cascade would silently close on the first save. We keep the
 * gaps. See the projectSchedule header for the full measurement and why the
 * re-packing version was a data-corruption bug rather than a missing feature.
 */

/** One node's pending write, addressed by the endpoint that owns it. */
export interface NodeSchedulePatch extends SchedulePatch {
  id: number;
  kind: "step" | "subprocess";
}

export interface TaskSchedulable extends SchedulableStep {
  id?: number;
}

/** A stage plus the tasks it owns, already in CHAIN order at both levels. */
export interface OrderedStage extends SchedulableStep {
  id?: number;
  tasks: TaskSchedulable[];
}

/** Stage dates DERIVED from tasks — live's updateParentStepDates, exactly:
 *  min of the starts, max of the ends, duration as the span between them.
 *  Returns null for a stage with no tasks, which has nothing to derive from and
 *  keeps whatever it was typed. */
function deriveStageFromTasks(tasks: SchedulePatch[]): SchedulePatch | null {
  if (tasks.length === 0) return null;
  const start = Math.min(...tasks.map((t) => t.estimatedStartDate));
  const end = Math.max(...tasks.map((t) => t.estimatedEndDate));
  return { estimatedStartDate: start, estimatedEndDate: end, estimatedDays: Math.round((end - start) / DAY_MS) };
}

/**
 * Project ONE task edit across the whole job.
 *
 * Three hops, each the same gap-preserving rule applied one level down:
 *   1. inside the edited stage, the task and its later siblings shift;
 *   2. the stage RE-DERIVES from its tasks (min/max);
 *   3. every LATER stage — and every task inside it — rides the delta by which
 *      the edited stage's END moved.
 *
 * Hop 3 moves the later stages' TASKS too, not just the stage rails. Skipping
 * that is the subtle way to corrupt this model: the stage would say one thing and
 * min/max of its own tasks another, and the next task edit anywhere downstream
 * would silently "correct" the stage back and undo the move.
 *
 * Returns every node that ACTUALLY moved, so the caller writes the minimum set —
 * which is what live does with _bulkUpdateAffectedElements, and what keeps a
 * no-op save from rewriting dates on nodes nobody touched.
 */
export function projectTaskEdit(
  stages: OrderedStage[],
  jobStartMs: number,
  stageId: number,
  taskId: number,
  edit: ScheduleEdit,
): NodeSchedulePatch[] {
  const out: NodeSchedulePatch[] = [];
  const idx = stages.findIndex((st) => Number(st.id) === stageId);
  if (idx < 0) return out;

  const target = stages[idx];
  const stageBase = baselineSchedule([target], jobStartMs)[stageId];
  const anchor = stageBase?.start ?? jobStartMs;

  // (1) the tasks of the edited stage, under the edit
  const taskBase = baselineSchedule(target.tasks, anchor);
  const taskNext = projectSchedule(target.tasks, anchor, { [taskId]: edit });
  for (const t of target.tasks) {
    const id = Number(t.id);
    const b = taskBase[id];
    const n = taskNext[id];
    if (!b || !n) continue;
    if (b.start !== n.estimatedStartDate || b.end !== n.estimatedEndDate || b.days !== n.estimatedDays) {
      out.push({ id, kind: "subprocess", ...n });
    }
  }

  // (2) the stage re-derives from its own tasks
  const derived = deriveStageFromTasks(Object.values(taskNext));
  if (!derived || !stageBase) return out;
  if (
    derived.estimatedStartDate !== stageBase.start ||
    derived.estimatedEndDate !== stageBase.end ||
    derived.estimatedDays !== stageBase.days
  ) {
    out.push({ id: stageId, kind: "step", ...derived });
  }

  // (3) everything after it rides the delta its END moved by — gaps intact
  const shift = derived.estimatedEndDate - stageBase.end;
  if (shift !== 0) {
    for (const st of stages.slice(idx + 1)) {
      if (st.deleted) continue;
      const sid = Number(st.id);
      if (!Number.isFinite(sid)) continue;
      const b = baselineSchedule([st], jobStartMs)[sid];
      if (!b) continue;
      out.push({
        id: sid,
        kind: "step",
        estimatedStartDate: b.start + shift,
        estimatedEndDate: b.end + shift,
        estimatedDays: b.days,
      });
      for (const t of shiftTasks(st, shift)) out.push(t);
    }
  }
  return out;
}

/** Every task of one stage, moved rigidly by `shift`. Used by both projections —
 *  a stage never moves without its tasks, or the derived min/max stops agreeing
 *  with the rail the operator is looking at. */
function shiftTasks(stage: OrderedStage, shift: number): NodeSchedulePatch[] {
  const out: NodeSchedulePatch[] = [];
  if (shift === 0) return out;
  for (const t of stage.tasks) {
    if (t.deleted) continue;
    const id = Number(t.id);
    if (!Number.isFinite(id)) continue;
    const start = Number(t.estimatedStartDate);
    const end = Number(t.estimatedEndDate);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end <= 0) continue;
    out.push({
      id,
      kind: "subprocess",
      estimatedStartDate: start + shift,
      estimatedEndDate: end + shift,
      estimatedDays: Number(t.estimatedDays) || Math.round((end - start) / DAY_MS),
    });
  }
  return out;
}

/**
 * Project the STAGE-level edits the rail chips produce, into per-node writes.
 *
 * The stage maths is projectSchedule unchanged — this adds the two things the
 * old whole-tree save never had to think about, because it rewrote everything
 * anyway:
 *   • only nodes that ACTUALLY moved are returned, so a no-op save writes nothing;
 *   • a moved stage drags its TASKS with it, rigidly, keeping stage == min/max of
 *     its tasks true after the write (see canTypeStageDuration for why that
 *     invariant is live's and not ours to break).
 */
export function projectStageMove(
  stages: OrderedStage[],
  jobStartMs: number,
  edits: Record<number, ScheduleEdit>,
): NodeSchedulePatch[] {
  const out: NodeSchedulePatch[] = [];
  const base = baselineSchedule(stages, jobStartMs);
  const next = projectSchedule(stages, jobStartMs, edits);
  for (const st of stages) {
    if (st.deleted) continue;
    const id = Number(st.id);
    if (!Number.isFinite(id)) continue;
    const b = base[id];
    const n = next[id];
    if (!b || !n) continue;
    const moved =
      b.start !== n.estimatedStartDate || b.end !== n.estimatedEndDate || b.days !== n.estimatedDays;
    if (!moved) continue;
    out.push({ id, kind: "step", ...n });
    for (const t of shiftTasks(st, n.estimatedStartDate - b.start)) out.push(t);
  }
  return out;
}

/** Shape ordered steps + their ordered tasks into the input the two projections
 *  above consume. Callers already hold both orderings; this only pairs them, so
 *  the chain order stays the single source it already is. */
export function toOrderedStages<S extends SchedulableStep, T extends SchedulableStep>(
  steps: S[],
  tasksOf: (s: S) => T[],
): OrderedStage[] {
  return steps.map((s) => ({ ...s, tasks: tasksOf(s).filter((t) => !t.deleted) }));
}

/** yyyy-mm-dd for a date input, in UTC so the value round-trips the epoch we store. */
export function toDateInput(ms?: number): string {
  if (!ms || !Number.isFinite(ms)) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

/** Parse a yyyy-mm-dd date input back to the UTC epoch we store. */
export function fromDateInput(v: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const ms = Date.parse(v + "T00:00:00.000Z");
  return Number.isFinite(ms) ? ms : null;
}

// ── 5. Captured detail VALUES ───────────────────────────────────────────────
//
// The template decides WHICH details a node captures; the job holds the VALUE.
// Both live in the same `properties[]` array on the step / subprocess node — see
// NodeProperty in artisanflow-api.ts for the measured shapes.

/** True when this detail has a value recorded against it. `0` and `""` are
 *  values; only absent/null is "not captured". */
export function hasPropertyValue(p: { value?: string | number }): boolean {
  return p.value !== undefined && p.value !== null && p.value !== "";
}

/** What to PRINT for a captured value, or null when nothing is captured.
 *  Never returns "" — an empty string would render as a silent blank beside a
 *  key, which reads as "captured, and it was nothing". */
export function propertyValueText(p: { value?: string | number }): string | null {
  return hasPropertyValue(p) ? String(p.value) : null;
}

/** Whether to render a NUMBER input for this detail. Respects live's `datatype`
 *  and nothing else — no type dropdown, per the 2026-07-02 simplification. */
export function isNumericProperty(p: { datatype?: string }): boolean {
  return (p.datatype || "").toLowerCase() === "number";
}

/**
 * Coerce one edited field back to the shape the node stores.
 *
 * A cleared field becomes an ABSENT `value`, not `""`: absent is what the
 * backend serves for a detail nobody has filled in (measured: "Comments on the
 * Quality" on 133045000 has no `value` key at all), so clearing must return the
 * node to that state rather than inventing an empty string the reader would
 * have to special-case. datatype / valuetype ride through UNTOUCHED — rewriting
 * a `deferred` field as `required` silently turns an optional QC comment into a
 * blocker (see the note on stages.ts Detail).
 */
export function applyPropertyValue<T extends NodePropertyLike>(prop: T, raw: string): T {
  const trimmed = raw.trim();
  if (trimmed === "") {
    const { value: _drop, ...rest } = prop;
    return rest as T;
  }
  if (isNumericProperty(prop)) {
    const n = Number(trimmed);
    // A number field the operator typed prose into keeps the PROSE rather than
    // storing NaN. The backend stores whatever jsonb it is handed, so NaN would
    // serialise as null and read back as "never captured".
    return { ...prop, value: Number.isFinite(n) ? n : trimmed };
  }
  return { ...prop, value: trimmed };
}

export interface NodePropertyLike {
  key: string;
  value?: string | number;
  datatype?: string;
  valuetype?: string;
}

/** A node's captured details, keyed by the node id the PATCH addresses. */
export type NodePropertyPatch = Record<number, NodePropertyLike[]>;

interface MergeableNode {
  id?: number;
  properties?: NodePropertyLike[];
  subProcesses?: MergeableNode[];
  deleted?: boolean;
}

/**
 * Apply captured VALUES onto the REAL node tree, preserving every other field
 * on every node — the same discipline, and for the same measured reason, as
 * mergeScheduleIntoSteps above.
 *
 * PATCH /update/{custom-,}workflow merges `steps` onto the stored tree
 * (mergeStepTrees), and its merge has TWO properties this function has to
 * respect:
 *
 *   • A stored node the payload OMITS is SOFT-DELETED, not left alone. So the
 *     payload must carry the WHOLE tree — every stage and every task — even
 *     when one field on one task changed. Sending just the edited node would
 *     silently delete the rest of the job.
 *   • Only NODE_CALLER_FIELDS are taken from the payload (`name`,
 *     `estimated*`, `feedbackRequired`, the chain ids, `properties`). `id`,
 *     `status`, `actualStartDate`, `actualEndDate`, `version` and `element` are
 *     server-owned and survive whatever we send.
 *
 * So: spread every existing node, overwrite ONLY `properties`, and only on the
 * nodes named in `patch`. Nothing is reconstructed and nothing is defaulted.
 */
export function mergePropertiesIntoSteps<T extends MergeableNode>(
  steps: T[],
  patch: NodePropertyPatch,
): T[] {
  const applyOne = <N extends MergeableNode>(node: N): N => {
    const id = Number(node.id);
    const next = Number.isFinite(id) && patch[id] ? { ...node, properties: patch[id] } : node;
    if (!Array.isArray(next.subProcesses)) return next as N;
    return { ...next, subProcesses: next.subProcesses.map(applyOne) } as N;
  };
  return steps.map(applyOne);
}

// ── 6. Reverting a status set by mistake ────────────────────────────────────
//
// Amit, 2026-08-17: "the status here is done by default... We need a way to
// revert back if something is done by mistake."
//
// Advancing and reverting are NOT symmetric, and the asymmetry is in the
// BACKEND, not in the UI. recomputeProcessStatus (workflow.mapper.ts) only ever
// moves derived state FORWARD:
//
//   PENDING step + any started task      -> IN_PROGRESS   (stamps actualStartDate)
//   IN_PROGRESS step + ALL tasks done    -> COMPLETED     (stamps actualEndDate)
//   CREATED job + first step started     -> INITIATED
//   every step COMPLETED                 -> COMPLETED
//
// There is no downgrade branch anywhere in it. MEASURED consequences, both on
// sandbox job 1000000000000 (2026-08-17):
//
//   (a) Reverting a TASK out of Done leaves its stage COMPLETED. The board
//       applies STAGE DOMINANCE (columnForCard), so the reverted task would
//       still render under Done — the undo would look like it did nothing.
//       => reverting a task under a closed stage MUST re-open the stage too.
//
//   (b) Reverting a STAGE whose tasks are all still COMPLETED is UNDONE in the
//       same request: the write lands, then recomputeProcessStatus sees
//       IN_PROGRESS + allDone and puts it straight back to COMPLETED. Measured:
//       PATCH step -> IN_PROGRESS answered success, the re-read said COMPLETED.
//       => a stage with tasks is not independently revertible. Revert the TASK;
//          the stage follows. A stage with NO tasks IS its own unit of work and
//          reverts directly.

/** The state a node moves BACK to, one step at a time. Done -> In progress ->
 *  To do. Null when there is nothing before it. */
export function previousStatus(s?: string): NodeStatus | null {
  const u = up(s);
  if (u === "COMPLETED") return "IN_PROGRESS";
  if (u === "IN_PROGRESS") return "PENDING";
  return null;
}

/**
 * The PATCH body for moving one node BACK to `target`.
 *
 * The actual dates are cleared to `0`, never to null, and that is a measured
 * requirement rather than a style choice:
 *
 *   • applyNodeStatusPatch writes `actualEndDate` only when the body value is
 *     non-null AND finite, so `actualEndDate: null` is IGNORED and the stale
 *     completion date survives the undo. Measured: reverting task 1000000000005
 *     with null left actualEndDate 1786953654681 in place.
 *   • `0` IS the model's own "never happened" sentinel — instantiateSteps /
 *     instantiateSubProcesses are born with actualStartDate 0 / actualEndDate 0
 *     — and formatEpoch(0) already prints "—", so nothing downstream needs a
 *     special case.
 *
 * Moving back to In progress clears the END date and keeps the start (the work
 * really did begin). Moving back to To do clears BOTH.
 */
export function revertPatch(
  target: NodeStatus,
  node: { actualStartDate?: number; actualEndDate?: number },
): Record<string, unknown> {
  const body: Record<string, unknown> = { status: target };
  if (node.actualEndDate) body.actualEndDate = 0;
  if (target === "PENDING" && node.actualStartDate) body.actualStartDate = 0;
  return body;
}

/** A stage is revertible ON ITS OWN only when it has no tasks — otherwise the
 *  backend's forward-only cascade re-closes it in the same request. See (b). */
export function stageRevertibleAlone(taskCount: number): boolean {
  return taskCount === 0;
}

// ── 7. Sign-off on a QC / approval checkpoint ───────────────────────────────
//
// Amit, 2026-08-17: "whatever is in that QC... completion needs a complete
// sign-off." A task carrying `feedbackRequired` must not simply flip to Done.
//
// WHAT ALREADY EXISTS, and is reused rather than re-invented:
//   • The FLAG. `feedbackRequired` is on every step and subprocess, is written
//     by the template builder's "needs sign-off" switch (TemplateBuilder ->
//     stages.ts toBackendSteps) and survives instantiation onto a job.
//   • The EVIDENCE SHAPE. `element.feedback` = { id, text, image, video, status,
//     remarks, uploader, uploadedBy, approvedBy, updatedAt, version,
//     feedbackUploaded } — Loom's own ElementFeedback, already served inside the
//     job detail and already rendered by FeedbackMedia + the Job Feedback queue.
//     Measured on job 133044983 task "Fabric Initial Sample": 4 photos, 1 video,
//     status APPROVED, approvedBy 23483.
//   • The dead `Evidence { photos, note, approvedBy, approvedAt }` interface in
//     stages.ts, which has NO producer and NO consumer anywhere in the repo
//     (grep, 2026-08-17). It is a sketch of the shape above; the wire shape is
//     the real one, so this panel reads the wire shape and that sketch stays
//     unused rather than being promoted into a second vocabulary.
//
// WHAT USED TO BE IMPOSSIBLE AND NO LONGER IS (2026-08-17). This section
// previously listed four measured reasons the approver could not be stored, and
// the panel printed them: "The approver's name is not stored", on a button
// reading "Complete — time stamped, name not stored". Driving the flow twice on
// two jobs left element.feedback null and ZERO element_feedback rows. Every one
// of those four reasons was closed by anuprerna-backend 8b5cf83, which landed 27
// minutes AFTER this file was last written — the whole gap was a merge-window
// casualty, not a design position. Re-measured against the RUNNING :8090 image
// rather than re-read from the stale comment:
//
//   (1) THE NODE HAD NO WRITABLE FEEDBACK FIELD — closed. applyNodeStatusPatch's
//       allowlist gained `properties`, and the sign-off itself does not need it:
//       it goes to the element-feedback routes, which are real writes.
//   (2) THE TABLE WAS NOT READ BACK BY THIS SCREEN — closed. Every feedback write
//       now MIRRORS the canonical record onto the node's own element.feedback
//       inside the steps blob, which is exactly where live Loom already serves it
//       (3,572 synced nodes carry that embed). So GET /get/workflow/{id} returns
//       it with no view change and no second vocabulary.
//   (3) IT REFUSED ON A SANDBOX-MINTED JOB — closed. addFeedback now
//       MATERIALISES the missing relational.element row from the node itself
//       before inserting, so a node that lives only inside the jsonb tree can
//       carry a sign-off.
//   (4) LIVE-MIRRORED JOBS ARE REFUSED BY THE SANDBOX FLOOR — still true, and
//       deliberately so. This is the one that stays.
//
// HOW IT IS WRITTEN, and the trap that makes a broken version look correct:
//
//   POST  /add/element/feedback?tenantId=<id>          { elementId, text }
//   PATCH /update/element/feedback/admin?tenantId=<id> { id, status, remarks }
//
// `tenantId` is a QUERY PARAMETER (@Query('tenantId'), workflow.controller.ts
// :551), NOT a body field. Sent in the body it is ignored, the call answers HTTP
// 200, and relational.element_feedback.approved_by stays NULL — a sign-off that
// looks recorded and is not. Verify the COLUMN, never the status code. Neither
// the tenant nor the signer's name is taken from the client: /api/crud derives
// both from the session and writes them itself (see signoff-identity.ts), the
// same posture as workflow-comment attribution.

/**
 * Can an approval RECORD (who + verdict + remarks) be persisted for this node?
 *
 * Two gates, and only two:
 *   1. THE SANDBOX FLOOR. A sign-off recorded against a Loom-owned row is a write
 *      the sandbox has no business making, and the backend refuses it on the
 *      OWNING WORKFLOW's id. Note it must be the JOB's id that is tested, not the
 *      element's: a sub-floor job still mints node/element ids from
 *      workflowId * 1000 + seq, so those land ABOVE 1e12 and an element-id-only
 *      check waves live-mirrored jobs straight through — the backend's own suite
 *      caught exactly that.
 *   2. THE NODE MUST HAVE AN ELEMENT ID, because that is what the record attaches
 *      to.
 */
export function canRecordSignOff(wf: CapabilityJob, elementId?: number): WriteCapability {
  if (!isSandboxId(wf.id)) {
    return {
      ok: false,
      reason:
        sandboxRefusal("record a sign-off on", entityOf(wf)) +
        " — this job was synced from live Loom, so the sandbox refuses to write against its rows.",
    };
  }
  if (elementId == null || !Number.isFinite(elementId)) {
    return { ok: false, reason: "This task carries no element id, so there is nothing to attach a sign-off to." };
  }
  return OK;
}

/** True when this node is a QC / approval checkpoint that must not flip
 *  straight to Done. The flag is the template's, carried onto the job. */
export function needsSignOff(node: { feedbackRequired?: boolean }): boolean {
  return node.feedbackRequired === true;
}

/**
 * The status a STAGE should carry given its tasks — the same derivation
 * recomputeProcessStatus applies on the backend, run FORWARDS AND BACKWARDS.
 *
 * The backend's copy only ever moves a stage forward (PENDING -> IN_PROGRESS ->
 * COMPLETED) and has no downgrade branch at all, which is exactly why an undo
 * has to compute the correct stage status itself and PATCH it. Deriving it from
 * the tasks — rather than picking a status — means the stage a revert leaves
 * behind is the one the backend would have derived if it could:
 *
 *   no tasks              -> null (the stage IS the unit of work; leave it alone)
 *   every task COMPLETED  -> COMPLETED
 *   any task started      -> IN_PROGRESS
 *   otherwise             -> PENDING
 */
export function stageStatusFromTasks(
  tasks: { status?: string; deleted?: boolean }[],
): NodeStatus | null {
  const live = tasks.filter((t) => !t.deleted);
  if (live.length === 0) return null;
  if (live.every((t) => up(t.status) === "COMPLETED")) return "COMPLETED";
  if (live.some((t) => up(t.status) === "IN_PROGRESS" || up(t.status) === "COMPLETED")) return "IN_PROGRESS";
  return "PENDING";
}
