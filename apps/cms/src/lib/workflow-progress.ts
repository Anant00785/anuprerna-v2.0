import {
  orderWorkflowStepSummaries,
  orderWorkflowSteps,
  type OrderWorkflowSummary,
  type OrderWorkflowStepSummary,
  type WorkflowStep,
} from "@/lib/artisanflow-api";

/**
 * ONE progress rule for the whole production surface.
 *
 * A job's progress counts DONE stages fully and IN-PROGRESS stages as HALF:
 *
 *     pct = round((done + 0.5 * doing) / total * 100)
 *
 * Why half, and why stages: the operator reads the stage chips next to the
 * number, so the number has to be computable from the chips they can see. A
 * done-only count over subprocesses (the previous rule) told a weaver who had
 * finished Yarn Processing and was mid-Yarn-Weaving that they were 33% through
 * a 3-stage job -- identical to the moment they picked the loom up, so the bar
 * never moved during the longest stage of the run. Half-credit for the stage
 * actually being worked is the smallest change that makes the bar move when
 * work moves, and it is the rule Amit approved for the Order Watch view.
 *
 * DELIBERATELY the only progress function in the app: the custom-order detail
 * item panel, the custom-orders inline expand, and the Order Watch per-SKU
 * table all call this, so a job cannot read 33% in one place and 50% in another.
 */
export interface WorkflowProgress {
  /** Stages with status COMPLETED. */
  done: number;
  /** Stages with status IN_PROGRESS (counted as half). */
  doing: number;
  /** Total stages on the job. */
  total: number;
  /** round((done + 0.5*doing) / total * 100); 0 when there are no stages. */
  pct: number;
  /** The stage the job is actually sitting on, for "45% -- Yarn Weaving". */
  currentStageName: string | null;
}

function statusOf(s: { stepStatus?: string }): string {
  return (s.stepStatus || "").toUpperCase();
}

/**
 * The job's stages in the order they are actually run (template chain), not the
 * order the rollup happens to serialise them in. Everything that reads a
 * sequence — the chips, the current stage — goes through this.
 */
export function orderedStages(w: OrderWorkflowSummary): OrderWorkflowStepSummary[] {
  return orderWorkflowStepSummaries(w.steps || []);
}

/**
 * The stage a job is sitting on: the first IN_PROGRESS stage, else the first
 * not-yet-COMPLETED stage (what it is about to start), else null (all done).
 * "First" is chain order — see orderedStages.
 */
export function currentStage(w: OrderWorkflowSummary): OrderWorkflowStepSummary | null {
  const steps = orderedStages(w);
  return (
    steps.find((s) => statusOf(s) === "IN_PROGRESS") ??
    steps.find((s) => statusOf(s) !== "COMPLETED") ??
    null
  );
}

export function computeWorkflowProgress(w: OrderWorkflowSummary): WorkflowProgress {
  const steps = w.steps || [];
  let done = 0;
  let doing = 0;
  for (const s of steps) {
    const st = statusOf(s);
    if (st === "COMPLETED") done += 1;
    else if (st === "IN_PROGRESS") doing += 1;
  }
  const total = steps.length;
  const cur = currentStage(w);
  return {
    done,
    doing,
    total,
    pct: total ? Math.round(((done + 0.5 * doing) / total) * 100) : 0,
    // Loom stage names carry trailing spaces ("Yarn Weaving ") — trim, or the
    // label renders as "50% ·  Yarn Weaving " with a visible gap.
    currentStageName: cur ? (cur.stepName || "").trim() || null : null,
  };
}

/**
 * Raw subprocess tally, kept SEPARATE from progress on purpose.
 *
 * Two surfaces print a literal "<b>N</b>/M subprocesses" caption. That caption
 * is a count of things, not a progress rule, so it must not silently inherit
 * the half-credit weighting above -- "1.5/3 subprocesses" is not a sentence.
 * A step with no subprocesses counts as one unit of itself, mirroring what the
 * backend rollup nests.
 */
export function computeSubProcessCounts(w: OrderWorkflowSummary): { done: number; total: number } {
  let total = 0;
  let done = 0;
  for (const s of w.steps || []) {
    const subs = s.subProcesses || [];
    if (subs.length === 0) {
      total += 1;
      if (statusOf(s) === "COMPLETED") done += 1;
    } else {
      for (const sp of subs) {
        total += 1;
        if ((sp.subProcessStatus || "").toUpperCase() === "COMPLETED") done += 1;
      }
    }
  }
  return { done, total };
}

// ── The same two rules, over a LIVE job tree ───────────────────────────────
//
// Everything above reads OrderWorkflowSummary — the denormalised per-order
// rollup (GET /get/order/{id}/workflow-list). The job detail page and the
// production board read the job itself (GET /get/workflow/{id}), which is a
// WorkflowStep[] with a different field spelling: `status` rather than
// `stepStatus`, `subProcesses[].status` rather than `.subProcessStatus`, and a
// `deleted` flag the rollup does not carry.
//
// These two are that shape, and NOTHING ELSE. Same stage-level half-credit
// rule, same count-is-not-progress split. The job page used to carry its own
// done-only copy of this math inline; that copy is gone, so there is now
// exactly one RULE in the app.
//
// One rule is NOT one number, and the difference is worth stating plainly so
// nobody "fixes" a discrepancy that is not here. The rollup and the detail are
// two different STORES, and the backend does not keep them in step: element
// writes (PATCH update/{step,subprocess}-element) mutate workflow_step_detail
// and explicitly do NOT recompute workflow_order_summary (see the LIMITATION
// note on WorkflowService.addWorkflow). Measured on job 133044983, 2026-08-16:
//
//   rollup   Yarn Processing COMPLETED, Yarn Weaving IN_PROGRESS  -> 1.5/4 = 38%
//   detail   Yarn Processing IN_PROGRESS, everything else PENDING -> 0.5/4 = 13%
//
// Both numbers are this rule applied honestly to the data each surface was
// given. Closing that gap means recomputing the rollup on the write path, in
// anuprerna-backend — it cannot be closed here, and papering over it by having
// the job board read the stale rollup would make the board lie about the work.

/** computeWorkflowProgress, over a live job tree. Identical rule. */
export function computeStepProgress(steps: WorkflowStep[]): WorkflowProgress {
  const live = (steps || []).filter((s) => !s.deleted);
  let done = 0;
  let doing = 0;
  for (const s of live) {
    const st = (s.status || "").toUpperCase();
    if (st === "COMPLETED") done += 1;
    else if (st === "IN_PROGRESS") doing += 1;
  }
  const total = live.length;
  // Chain order, not id order — same reason as orderedStages: the "current
  // stage" label has to name the stage the operator is actually on, and the
  // backend returns steps in insertion order (on job 133044983 the chain head
  // is the LAST element of the array).
  const ordered = orderWorkflowSteps(live);
  const cur =
    ordered.find((s) => (s.status || "").toUpperCase() === "IN_PROGRESS") ??
    ordered.find((s) => (s.status || "").toUpperCase() !== "COMPLETED") ??
    null;
  return {
    done,
    doing,
    total,
    pct: total ? Math.round(((done + 0.5 * doing) / total) * 100) : 0,
    // Loom stage names carry trailing spaces ("Yarn Weaving ").
    currentStageName: cur ? (cur.name || "").trim() || null : null,
  };
}

/** computeSubProcessCounts, over a live job tree. A count of TASKS, printed as
 *  a caption next to the percentage — deliberately NOT half-weighted, because
 *  "1.5/8 tasks" is not a sentence. */
export function computeTaskCounts(steps: WorkflowStep[]): { done: number; total: number } {
  let total = 0;
  let done = 0;
  for (const s of (steps || []).filter((x) => !x.deleted)) {
    const subs = (s.subProcesses || []).filter((x) => !x.deleted);
    if (subs.length === 0) {
      total += 1;
      if ((s.status || "").toUpperCase() === "COMPLETED") done += 1;
    } else {
      for (const sp of subs) {
        total += 1;
        if ((sp.status || "").toUpperCase() === "COMPLETED") done += 1;
      }
    }
  }
  return { done, total };
}
