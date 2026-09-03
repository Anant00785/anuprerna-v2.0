"use client";

/**
 * PipelineSwimlane — the operator-facing production board for a LIVE workflow
 * instance. Replaces the old dense WorkflowBoard (mode="instance") card wall
 * with a guided, order-enforcing swimlane:
 *
 *   • One lane per STAGE, in template order, numbered.
 *   • Three columns: To do · In progress · Done.
 *   • Work runs strictly in order. Exactly ONE card is "active" (draggable) at
 *     a time — the first not-done TASK of the first not-done STAGE. Everything
 *     before it is Done + locked; everything after is locked until its turn.
 *     This tells a new user exactly where to start, and that card is labelled
 *     "Next up" so the guidance is legible rather than implied by a border
 *     colour.
 *
 *     The single-active-card LOCK is a deliberate product choice, confirmed by
 *     Amit on 2026-08-16 when it was put to him explicitly that only one card
 *     is editable at a time. Do not loosen it into a soft highlight without
 *     asking him again.
 *   • Advance a card by dragging it rightward into the next column (or use the
 *     inline arrow). Completing the last task of a step auto-completes the step
 *     and unlocks the next lane. Starting the first task marks the step running.
 *   • Click any card to expand its detail (dates, feedback, artisan assign).
 *     Artisan assignment stays available even on locked cards — only the STATUS
 *     transition is order-gated, not who does the work.
 *   • RESCHEDULE IN PLACE. Every stage rail carries its own dates as a control:
 *     click the date chip and that stage's start / duration are edited on the
 *     stage they belong to, with the cascade previewed on every rail below —
 *     and on the IDLE GAP rows between them — before anything is written.
 *     Moving a stage moves everything after it BY THE SAME DELTA, so the plan's
 *     existing idle gaps survive; see projectSchedule. This replaced the standalone
 *     "Schedule · move or extend" card (Amit, 2026-08-17: "this portion ... again
 *     has to be part of the pipeline table itself. Creating that separately is
 *     confusing to people"). The chip is a BUTTON, deliberately not a click
 *     handler on the lane — a stray click must never open an editor — and card
 *     drag lives in a different subtree, so the two interactions cannot collide.
 *
 * Writes go through the same native endpoints StepStatusControl uses:
 *   PATCH /update/{step,subprocess}-element
 *     {id, workflowId, status?, actual*Date?, properties?, estimated*?}
 *
 * INCLUDING THE SCHEDULE, since 2026-08-17. A reschedule used to be one whole-tree
 * `steps` PATCH, which the backend refuses once a job leaves CREATED — so on every
 * real job the date controls could not save, which is the defect Amit hit when he
 * tried to postpone a stage on a running job. It is now N per-node PATCHes, one per
 * node that actually moved, which is also exactly how LIVE writes it
 * (update-workflow-sub-process.component.ts _bulkUpdateAffectedElements), plus one
 * PATCH of the workflow row when the job's own start/end move.
 * A stage with no tasks becomes a single draggable card itself.
 * Sandbox test DB only.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  GripVertical,
  Check,
  Clock,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Loader2,
  CalendarClock,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  nodeDelay,
  orderWorkflowSteps,
  orderWorkflowSubProcesses,
  type NodeProperty,
  type SubProcessFeedback,
  type WorkflowStep,
  type WorkflowSubProcess,
} from "@/lib/artisanflow-api";
import { formatEpoch } from "@/lib/utils";
import { ArtisanAssignmentPanel } from "./ArtisanAssignmentPanel";
import type { BoardAssignments } from "./WorkflowBoard";
import { StatusPill } from "./StatusPill";
import { FeedbackMedia } from "./FeedbackMedia";
import { CapturedDetails } from "./CapturedDetails";
import { SignOffPanel } from "./SignOffPanel";
import {
  COLUMNS,
  DAY_MS,
  NODE_STATUS_LABEL,
  baselineSchedule,
  canRecordSignOff,
  canWriteNodeValues,
  canTypeStageDuration,
  hasPropertyValue,
  columnForCard,
  columnForStatus,
  fromDateInput,
  gapDays,
  isCanonicalStatus,
  isStageClosedOverride,
  mergePropertiesIntoSteps,
  needsSignOff,
  previousStatus,
  projectSchedule,
  projectStageMove,
  projectTaskEdit,
  toOrderedStages,
  revertPatch,
  stageRevertibleAlone,
  stageStatusFromTasks,
  statusForCol,
  statusLabel,
  toDateInput,
  up,
  type ColKey,
  type NodeStatus,
  type NodeSchedulePatch,
  type ScheduleEdit,
  type SchedulePatch,
  type StageBaseline,
  type WriteCapability,
} from "@/lib/workflow-ops";

// The three-state vocabulary, the column mapping and the stage-dominance rule
// all now live in @/lib/workflow-ops so the board, the status dropdown and the
// job page cannot drift apart. This file used to carry its own copy, which is
// how "HALTED -> In progress" survived here after the option was dropped
// elsewhere, and how a COMPLETED stage came to render a card under To do.
const isDone = (s?: string) => up(s) === "COMPLETED";

/** Per-node gate state. active = the single draggable card. */
type Gate = "done" | "active" | "locked";

interface CardModel {
  kind: "step" | "subprocess";
  id: number;
  name: string;
  status?: string;
  estimatedDays?: number;
  /** Added 2026-08-17 — the card could show a "Due" date but not the start it is
   *  measured from, which is precisely the field an operator postpones. */
  estimatedStartDate?: number;
  estimatedEndDate?: number;
  actualStartDate?: number;
  actualEndDate?: number;
  feedback?: SubProcessFeedback;
  /** The details this node was asked to capture, and whatever has been recorded
   *  against them. See NodeProperty — it has always been on the wire. */
  properties?: NodeProperty[];
  /** The template's "needs sign-off" flag. A card carrying it cannot reach Done
   *  by drag or by the inline arrow — see SignOffPanel. */
  feedbackRequired?: boolean;
  /** element.id — what an element-feedback write would have to address. */
  elementId?: number;
  gate: Gate;
}

const GRID = "180px repeat(3, minmax(150px, 1fr))";

export function PipelineSwimlane({
  steps,
  workflowId,
  kind,
  now,
  assignments,
  jobStart,
  savedJobEnd,
  nodeValuesCapability,
  nodeScheduleCapability,
  jobCapability,
  jobStatus,
  signedBy,
}: {
  steps: WorkflowStep[];
  workflowId: number;
  /** Which PATCH family this job saves through — the two are not interchangeable. */
  kind: "order" | "custom-order";
  now: number;
  assignments?: BoardAssignments;
  /** The job's own estimatedStartDate — the anchor the whole chain hangs off. */
  jobStart?: number;
  /**
   * The job's SAVED estimatedEndDate. Shown in the reschedule panel only so the
   * operator can see what a save is about to replace; the standing explanation
   * of why the two end dates differ lives in the top summary strip.
   */
  savedJobEnd?: number;
  // stepTreeCapability was REMOVED from this board on 2026-08-17, and its absence
  // is deliberate. It described the whole-tree `steps` write, and this board no
  // longer performs one: captured values moved to the per-node PATCH earlier that
  // day, the SCHEDULE followed it, and nothing else here ever wrote the array. The
  // prop's last use was a banner reading "Stage dates are read-only on this job"
  // on every started job — which, once the schedule moved to the per-node route,
  // was simply FALSE, and sat directly above date chips that now work. A capability
  // no control consults is not documentation, it is a badge waiting to disagree
  // with the buttons beside it. If a whole-tree write ever returns here, re-add it
  // WITH the control it gates, not before.
  /**
   * Whether the CAPTURED VALUES on a node can be written. SEPARATE from
   * stepTreeCapability since 2026-08-17: values no longer travel in the whole-tree
   * `steps` array, so they no longer inherit its CREATED-only rule. Folding the two
   * back together would re-break value editing on every job that has started, which
   * is every real job. See canWriteNodeValues.
   */
  nodeValuesCapability: WriteCapability;
  /**
   * Whether the ESTIMATED SCHEDULE on a node can be written. SEPARATE from
   * stepTreeCapability for the same reason nodeValuesCapability is, and added the
   * same day: the schedule left the whole-tree `steps` array for the per-node
   * route, so it no longer inherits that array's CREATED-only rule. This is the
   * capability that makes a stage postponable on a RUNNING job — fold it back into
   * stepTreeCapability and every real job goes read-only again. See
   * canWriteNodeSchedule.
   */
  nodeScheduleCapability: WriteCapability;
  /** Whether the workflow row itself (its own start/end/note/status) can be PATCHed. */
  jobCapability: WriteCapability;
  /** The WORKFLOW-level status. An undo has to correct it by hand — the
   *  backend's cascade never moves a job back out of COMPLETED. */
  jobStatus?: string;
  /** Who the session says is acting, for the sign-off panel. */
  signedBy: string;
}) {
  const router = useRouter();
  // Template order comes from the step chain, NOT from the id. This board
  // hard-locks every card except the computed-active one, so the ordering IS the
  // gate -- getting it from an assumption about insertion order would block the
  // operator on the wrong card. See orderWorkflowSteps.
  const live = orderWorkflowSteps(steps || []).filter((s) => !s.deleted);
  // Stages paired with their OWN ordered tasks — the input both schedule
  // projections consume. Built here, once, so the board, the cascade preview and
  // the save all read the same chain order at both levels; deriving it twice is
  // how a preview comes to disagree with what is written.
  const orderedStages = toOrderedStages(live, (st) =>
    orderWorkflowSubProcesses(st.subProcesses || []).filter((sp) => !sp.deleted),
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  // The card whose SIGN-OFF panel is open. A `feedbackRequired` task reaches
  // Done through that panel and through nothing else — see SignOffPanel.
  const [signOffFor, setSignOffFor] = useState<string | null>(null);
  // Captured-detail saves are a different write (a whole-tree `steps` PATCH)
  // than a status advance, so they carry their own busy key rather than
  // borrowing busyKey and greying out the drag affordances.
  const [propBusyKey, setPropBusyKey] = useState<string | null>(null);
  // Something the board did that the operator would otherwise have to notice on
  // their own — e.g. an undo that could not correct the job header.
  const [info, setInfo] = useState<string | null>(null);

  // ── Schedule editing, folded INTO the board ───────────────────────────────
  // ONE piece of draft state: per-stage {startMs?, days?}, exactly what
  // projectSchedule() consumes. Keeping it at BOARD level rather than inside the
  // open panel is what makes the cascade visible — every rail and every idle-gap
  // row re-renders against the same projection the moment one stage changes, so
  // "three stages moved, the 14-day gap held" is on screen before Save is
  // pressed rather than discovered afterwards.
  const [schedFor, setSchedFor] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, ScheduleEdit>>({});
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedError, setSchedError] = useState<string | null>(null);
  const [schedOk, setSchedOk] = useState<string | null>(null);
  // TASK-level rescheduling. Deliberately NOT folded into `edits` above: a task
  // draft is scoped to ONE task inside ONE stage and is committed on its own, so
  // sharing the stage draft would let a half-typed task date ride along with a
  // stage save the operator thought was unrelated. Null = no task draft open.
  const [taskSched, setTaskSched] = useState<{ stageId: number; taskId: number; edit: ScheduleEdit } | null>(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  if (live.length === 0) {
    return (
      <div
        className="rounded-xl border py-10 text-center text-sm"
        style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#AAA39E" }}
      >
        No stages defined for this job yet.
      </div>
    );
  }

  // Active STEP = first not-done step (in order). All not-done steps after it
  // are "upcoming" (locked); done steps are always done regardless of position.
  const activeStepIdx = live.findIndex((s) => !isDone(s.status));

  // Only used to SEED stages that carry no dates of their own; a stage that has
  // dates is read from itself, gaps and all. See baselineSchedule.
  const seedAnchor = jobStart || live[0]?.estimatedStartDate || 0;
  const baseline = baselineSchedule(live, seedAnchor);
  // Both recomputed every render so the preview can never lag the inputs.
  const preview = projectSchedule(live, seedAnchor, edits);
  const previewEnd = Math.max(
    ...[seedAnchor, ...Object.values(preview).map((p) => p.estimatedEndDate)],
  );
  // DIRTY is measured against the baseline, not against the presence of an edit
  // key: typing a value back to what it already was is not a change, and a Save
  // button that lights up for a no-op write is a lie about what is pending.
  const schedDirty = live.some((st) => {
    const b = baseline[Number(st.id)];
    const p = preview[Number(st.id)];
    return (
      !!b && !!p &&
      (b.start !== p.estimatedStartDate || b.end !== p.estimatedEndDate || b.days !== p.estimatedDays)
    );
  });
  // Counted against what is STORED, so the number agrees with the chips: a chip
  // goes amber exactly when its dates are about to change on disk. On a job whose
  // stages already carry dates this is the same set as the baseline diff; they
  // differ only on an unscheduled job, where a save legitimately writes dates
  // onto every stage for the first time.
  const movedCount = live.filter((st) => {
    const p = preview[Number(st.id)];
    return (
      !!p &&
      (p.estimatedStartDate !== (st.estimatedStartDate || 0) || p.estimatedEndDate !== (st.estimatedEndDate || 0))
    );
  }).length;
  // The job row's own start follows the chain HEAD — editing a later stage must
  // not move the job's start date.
  const headId = Number(live[0]?.id);
  const projectedJobStart = preview[headId]?.estimatedStartDate ?? seedAnchor;

  function openSchedule(stepId: number) {
    setSchedError(null);
    setSchedOk(null);
    setSchedFor((cur) => (cur === stepId ? null : stepId));
  }

  /**
   * Give ONE stage a new start.
   *
   * Every stage has a start of its own — that is the whole point of the
   * gap-preserving model — so this is the same operation on the chain head and
   * on stage 4: the stage and everything after it move by the delta, each later
   * gap intact. What changes is the gap immediately BEFORE this stage, which is
   * how idle time is created, widened or closed. On the head there is no stage
   * in front, so moving it moves the whole job.
   */
  function setStageStart(stepId: number, newMs: number) {
    setSchedOk(null);
    if (!Number.isFinite(newMs)) return;
    setEdits((c) => ({ ...c, [stepId]: { ...c[stepId], startMs: newMs } }));
  }

  function setStageDays(stepId: number, raw: string) {
    setSchedOk(null);
    setEdits((c) => {
      const next = { ...c[stepId] };
      if (raw === "") delete next.days;
      else {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0) return c;
        next.days = n;
      }
      const out = { ...c };
      if (next.startMs == null && next.days == null) delete out[stepId];
      else out[stepId] = next;
      return out;
    });
  }

  function discardSchedule() {
    setEdits({});
    setSchedError(null);
    setSchedOk(null);
  }

  /**
   * Open the TASK date editor on one card.
   *
   * The draft starts EMPTY ({}), not pre-filled with the stored dates: an empty
   * edit projects to exactly the baseline, so "opened but not typed in" and "typed
   * back to what it was" are the same state and neither can arm the Save button.
   * Opening a second task closes the first — one draft at a time, so there is never
   * an unsaved edit hidden behind a collapsed card.
   */
  function openTaskSchedule(stageId: number, taskId: number) {
    setTaskError(null);
    setSchedOk(null);
    setTaskSched((cur) => (cur && cur.taskId === taskId ? null : { stageId, taskId, edit: {} }));
  }

  function setTaskStart(ms: number) {
    if (!Number.isFinite(ms)) return;
    setSchedOk(null);
    setTaskSched((cur) => (cur ? { ...cur, edit: { ...cur.edit, startMs: ms } } : cur));
  }

  function setTaskDays(raw: string) {
    setSchedOk(null);
    setTaskSched((cur) => {
      if (!cur) return cur;
      const next = { ...cur.edit };
      if (raw === "") delete next.days;
      else {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0) return cur;
        next.days = n;
      }
      return { ...cur, edit: next };
    });
  }

  /**
   * Write a projected schedule as N PER-NODE PATCHes, then the workflow row.
   *
   * This replaced a single whole-tree `steps` PATCH on 2026-08-17, and the swap is
   * the entire reason a running job can be rescheduled at all: the whole-tree route
   * 400s the moment a job leaves CREATED ("Only a job that has not started can have
   * its stages edited"), and every real job is INITIATED or later. It is also how
   * LIVE has always written a reschedule — one PATCH for the edited node, one for
   * each affected downstream node, one for the workflow row if its own dates moved
   * (update-workflow-sub-process.component.ts _bulkUpdateAffectedElements).
   *
   * Beyond working at all, the per-node write is strictly SAFER: mergeStepTrees
   * soft-deletes any stored node the payload omits, so the whole-tree call had to
   * resend the entire tree every time and one malformed step could blank a node id
   * permanently. These calls cannot touch a node they do not address.
   *
   * SEQUENTIAL, not Promise.all. These land in one jsonb blob per job and the
   * backend read-modify-writes the whole `steps` array per call, so concurrent
   * PATCHes to the same workflow race and the last writer wins — which on a cascade
   * means silently dropping some of the very moves being previewed. Live fires them
   * in parallel and gets away with it against a row-per-node store; we cannot.
   *
   * A partial failure is REPORTED, never swallowed: the operator is told how many
   * nodes landed before the failure, because the plan is then genuinely half-moved
   * and pretending otherwise is worse than the error.
   */
  async function writeNodeSchedule(
    patches: NodeSchedulePatch[],
    jobStart: number,
    jobEnd: number,
  ): Promise<void> {
    let done = 0;
    try {
      for (const np of patches) {
        await patch(np.kind === "subprocess" ? "update/subprocess-element" : "update/step-element", {
          id: np.id,
          workflowId,
          estimatedStartDate: np.estimatedStartDate,
          estimatedEndDate: np.estimatedEndDate,
          estimatedDays: np.estimatedDays,
        });
        done++;
      }
    } catch (e) {
      throw new Error(
        (e instanceof Error ? e.message : "Save failed") +
          ` — ${done} of ${patches.length} stages/tasks were already moved, so the plan is part-way. Reopen the job to see where it stands.`,
      );
    }
    // The job row's own dates follow the chain, and this PATCH is what keeps the
    // header agreeing with the rails. It is banded by the sandbox floor rather than
    // by job status, so it is sent only when the row itself is writable.
    if (jobCapability.ok) {
      await patch(kind === "custom-order" ? "update/custom-workflow" : "update/workflow", {
        id: workflowId,
        estimatedStartDate: jobStart,
        estimatedEndDate: jobEnd,
      });
    }
  }

  async function saveSchedule() {
    // Belt and braces. The chips are inert when the job cannot be written, but a
    // control that cannot save must not be reachable by any path — including a
    // stale panel left open across a prop change.
    if (!nodeScheduleCapability.ok || !schedDirty) return;
    setSchedSaving(true);
    setSchedError(null);
    setSchedOk(null);
    try {
      const patches = projectStageMove(orderedStages, seedAnchor, edits);
      await writeNodeSchedule(patches, projectedJobStart, previewEnd);
      const stageCount = patches.filter((np) => np.kind === "step").length;
      const taskCount = patches.length - stageCount;
      setSchedOk(
        `Schedule saved — ${stageCount} stage${stageCount === 1 ? "" : "s"}` +
          (taskCount ? ` and ${taskCount} task${taskCount === 1 ? "" : "s"}` : "") +
          " moved, and the idle gaps between stages were kept.",
      );
      setEdits({});
      setSchedFor(null);
      router.refresh();
    } catch (e) {
      setSchedError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSchedSaving(false);
    }
  }

  /**
   * Commit ONE task's new dates, with the stage it belongs to and everything after
   * it riding the same delta. See projectTaskEdit for the three-hop projection and
   * why the later stages' TASKS move too.
   */
  async function saveTaskSchedule() {
    if (!taskSched || !nodeScheduleCapability.ok) return;
    const patches = projectTaskEdit(
      orderedStages,
      seedAnchor,
      taskSched.stageId,
      taskSched.taskId,
      taskSched.edit,
    );
    if (patches.length === 0) return;
    setTaskSaving(true);
    setTaskError(null);
    setSchedOk(null);
    try {
      const headPatch = patches.find((np) => np.kind === "step" && np.id === Number(live[0]?.id));
      const jobStart = headPatch ? headPatch.estimatedStartDate : projectedJobStart;
      const jobEnd = Math.max(
        previewEnd,
        ...patches.map((np) => np.estimatedEndDate),
      );
      await writeNodeSchedule(patches, jobStart, jobEnd);
      const moved = patches.length - 1;
      setSchedOk(
        "Task rescheduled" +
          (moved > 0
            ? ` — ${moved} other stage${moved === 1 ? "" : "s"}/task${moved === 1 ? "" : "s"} moved with it, idle gaps kept.`
            : "."),
      );
      setTaskSched(null);
      router.refresh();
    } catch (e) {
      setTaskError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setTaskSaving(false);
    }
  }

  const keyOf = (kind: "step" | "subprocess", id: number) => `${kind}:${id}`;
  const nameFor = (aid: number) => assignments?.artisans.find((a) => a.id === aid)?.name ?? `#${aid}`;
  const initials = (n: string) =>
    n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

  async function patch(path: string, body: Record<string, unknown>) {
    await call("PATCH", path, body);
  }

  /** One write through /api/crud, returning the parsed body — the sign-off needs
   *  the id the create call mints. Throws on transport failure OR on an inner
   *  `success: false`, because this backend answers 200 with a failure envelope. */
  async function call(
    method: "PATCH" | "POST",
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const res = await fetch("/api/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, method, body }),
    });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || j?.success === false) throw new Error(String(j?.message || "Update failed"));
    return j;
  }

  /**
   * THE SIGN-OFF GATE. A node the template flagged `feedbackRequired` does not
   * flip to Done from a drag or an arrow — the only route is the panel, which
   * makes the approval an explicit act rather than a side effect of a gesture.
   * Reaching In progress is unaffected; a checkpoint still has to be worked on
   * before it can be signed off.
   */
  function signOffBlocks(node: { feedbackRequired?: boolean; status?: string }, target: ColKey): boolean {
    return target === "done" && needsSignOff(node) && up(node.status) !== "COMPLETED";
  }

  /** Open the checkpoint for a card, expanding it so the panel is on screen. */
  function openSignOff(ckey: string) {
    setError(null);
    setInfo(null);
    setExpanded(ckey);
    setSignOffFor(ckey);
  }

  async function advance(
    stepIdx: number,
    sub: WorkflowSubProcess | null,
    target: ColKey,
    /** Set ONLY by the sign-off panel, which IS the gate being satisfied. */
    signedOff = false,
  ) {
    const step = live[stepIdx];
    const node = sub ?? step;
    const targetStatus = statusForCol(target);
    if (up(node.status) === targetStatus) return;
    if (!signedOff && signOffBlocks(node, target)) {
      openSignOff(keyOf(sub ? "subprocess" : "step", node.id));
      return;
    }
    const bkey = keyOf(sub ? "subprocess" : "step", node.id);
    setBusyKey(bkey);
    setError(null);
    try {
      const stamp = (b: Record<string, unknown>, n: { actualStartDate?: number; actualEndDate?: number }) => {
        if (targetStatus === "IN_PROGRESS" && !n.actualStartDate) b.actualStartDate = now;
        if (targetStatus === "COMPLETED" && !n.actualEndDate) b.actualEndDate = now;
        return b;
      };
      if (sub) {
        await patch("update/subprocess-element", stamp({ id: sub.id, workflowId, status: targetStatus }, sub));
        // Keep the owning step coherent with its tasks.
        const subs = (step.subProcesses || []).filter((sp) => !sp.deleted);
        if (targetStatus === "IN_PROGRESS" && up(step.status) === "PENDING") {
          await patch("update/step-element", stamp({ id: step.id, workflowId, status: "IN_PROGRESS" }, step));
        }
        if (
          targetStatus === "COMPLETED" &&
          !isDone(step.status) &&
          subs.every((sp) => sp.id === sub.id || isDone(sp.status))
        ) {
          await patch("update/step-element", stamp({ id: step.id, workflowId, status: "COMPLETED" }, step));
        }
      } else {
        await patch("update/step-element", stamp({ id: step.id, workflowId, status: targetStatus }, step));
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyKey(null);
    }
  }

  /**
   * PERSIST THE APPROVAL RECORD — who, what verdict, what remarks.
   *
   * This is the write the board used to skip entirely: before 2026-08-17 a
   * sign-off stamped `actualEndDate` and threw the approver away, so a QC
   * checkpoint could not say who passed it. Two calls, in this order:
   *
   *   POST  /add/element/feedback          -> mints the record, mirrors it onto
   *                                           the node so the next GET shows it
   *   PATCH /update/element/feedback/admin -> sets status + remarks, and stamps
   *                                           approved_by when APPROVED
   *
   * `tenantId` is NOT sent from here on purpose: it is a QUERY parameter on the
   * backend, and /api/crud derives it (and the signer's name) from the session and
   * attaches it itself. A tenantId in this body would be silently ignored and
   * approved_by would stay NULL on an HTTP 200 — see signoff-identity.ts.
   *
   * A node that ALREADY carries a record is updated rather than re-created:
   * addFeedback refuses a second row for the same element by design.
   *
   * The record is written BEFORE the status moves, so a failed sign-off leaves the
   * task in progress instead of completing it with no approver — the exact state
   * this fixes.
   */
  async function recordSignOff(
    elementId: number | undefined,
    existingFeedbackId: number | undefined,
    verdict: "APPROVED" | "REJECTED",
    remarks: string,
  ): Promise<void> {
    const cap = canRecordSignOff(capabilityJob(), elementId);
    if (!cap.ok) throw new Error(cap.reason);
    let feedbackId = existingFeedbackId;
    if (feedbackId == null) {
      const created = await call("POST", "add/element/feedback", { elementId, workflowId, text: "" });
      const minted = Number(created?.id);
      if (!Number.isFinite(minted) || minted <= 0) {
        throw new Error("The sign-off record could not be created, so the task was not completed.");
      }
      feedbackId = minted;
    }
    await call("PATCH", "update/element/feedback/admin", {
      id: feedbackId,
      status: verdict,
      remarks: remarks.trim(),
    });
  }

  /** The shape the capability helpers read. One place, so the board cannot ask the
   *  same question two slightly different ways. */
  const capabilityJob = () => ({
    id: workflowId,
    type: kind === "custom-order" ? "CUSTOM_ORDER" : "ORDER",
    status: jobStatus,
  });

  /** Complete a checkpoint BECAUSE it was signed off. The only caller is
   *  SignOffPanel's approve action, so the gate cannot be bypassed by anything
   *  that has not been through it. */
  async function advanceSignedOff(stepIdx: number, sub: WorkflowSubProcess | null): Promise<void> {
    await advance(stepIdx, sub, "done", true);
  }

  /**
   * Move ONE node BACK — Amit, 2026-08-17: "the status here is done by
   * default... We need a way to revert back if something is done by mistake."
   *
   * This is deliberately NOT `advance()` with a lower target, because undoing is
   * not the mirror image of advancing. recomputeProcessStatus (the backend's
   * cascade) only ever moves derived state FORWARD, so an undo has to correct by
   * hand everything the forward path got for free. All three corrections below
   * are measured on sandbox job 1000000000000, not inferred:
   *
   *  1. THE NODE. `actualEndDate: 0`, never null — a null body value is skipped
   *     by applyNodeStatusPatch and the stale completion date survives the undo.
   *     See revertPatch.
   *
   *  2. THE OWNING STAGE. Reverting a task under a COMPLETED stage leaves the
   *     stage green, and STAGE DOMINANCE then renders the reverted task under
   *     Done anyway — the undo would appear to do nothing. So the stage is
   *     re-derived from its tasks (stageStatusFromTasks: exactly the rule the
   *     backend would apply if it had a downgrade branch) and PATCHed. This is
   *     also why a stage WITH tasks is not revertible on its own: PATCHing it to
   *     IN_PROGRESS while every task is still COMPLETED is undone inside the same
   *     request by the cascade. Measured — the write answered success and the
   *     re-read said COMPLETED.
   *
   *  3. THE JOB ROW. A COMPLETED job is never moved back either. It can only be
   *     corrected where the workflow row itself is writable (sandbox-minted),
   *     and only to INITIATED — mergeWorkflowUpdate refuses to write CREATED
   *     back by design, so a job reverted all the way to untouched keeps the
   *     status it had. When the correction cannot be made, say so rather than
   *     leaving a green header over an unfinished board.
   */
  async function revert(stepIdx: number, sub: WorkflowSubProcess | null, target: NodeStatus) {
    const step = live[stepIdx];
    const node = sub ?? step;
    if (up(node.status) === target) return;
    const bkey = keyOf(sub ? "subprocess" : "step", node.id);
    setBusyKey(bkey);
    setError(null);
    setInfo(null);
    try {
      if (sub) {
        await patch("update/subprocess-element", { id: sub.id, workflowId, ...revertPatch(target, sub) });
        // (2) re-derive the stage from what its tasks now say.
        const subs = (step.subProcesses || []).filter((sp) => !sp.deleted);
        const projected = subs.map((sp) => (sp.id === sub.id ? { ...sp, status: target } : sp));
        const want = stageStatusFromTasks(projected);
        if (want && up(step.status) !== want) {
          await patch("update/step-element", { id: step.id, workflowId, ...revertPatch(want, step) });
        }
      } else {
        await patch("update/step-element", { id: step.id, workflowId, ...revertPatch(target, step) });
      }
      // (3) the job row.
      if (up(jobStatus) === "COMPLETED") {
        if (jobCapability.ok) {
          await patch(kind === "custom-order" ? "update/custom-workflow" : "update/workflow", {
            id: workflowId,
            status: "INITIATED",
          });
        } else {
          setInfo(
            "Moved back. The job header still reads Completed: correcting the workflow row is a sandbox-only " +
              "write, and " + jobCapability.reason,
          );
        }
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyKey(null);
    }
  }

  /**
   * Save the captured VALUES on one node.
   *
   * ONE node, ONE call — PATCH /update/{step,subprocess}-element with just this
   * node's `properties`. That replaced a whole-tree `steps` rewrite on 2026-08-17
   * and it is a strict improvement in three ways, not a shortcut:
   *
   *   • IT WORKS ON A RUNNING JOB. The whole-tree PATCH 400s once a job leaves
   *     CREATED ("Only a job that has not started can have its stages edited"),
   *     and every real job is INITIATED — so captured values were effectively
   *     never editable. The per-node route has no status gate.
   *   • IT CANNOT DELETE THE REST OF THE JOB. mergeStepTrees soft-deletes any
   *     stored node the payload omits, which is why the old call had to resend the
   *     entire tree every time. This one cannot touch a node it does not address.
   *   • IT CANNOT REWRITE THE SCHEMA. The backend merges key-wise, keeps the
   *     stored key/datatype/valuetype verbatim and writes only `value`, so a
   *     `deferred` field can never be promoted to `required`. An unknown key is
   *     refused loudly, all-or-nothing, instead of answering 200 and dropping it.
   *
   * Only key + value is sent, never a type: the caller supplies a value and the
   * STORED datatype wins. An empty capture is sent as `null`, which DELETES the
   * key — exactly how an uncaptured property is already stored, and the same
   * meaning hasPropertyValue() gives "" on the read side.
   */
  async function saveProperties(
    ckey: string,
    nodeId: number,
    nodeKind: "step" | "subprocess",
    next: NodeProperty[],
  ): Promise<void> {
    if (!nodeValuesCapability.ok) throw new Error(nodeValuesCapability.reason);
    setPropBusyKey(ckey);
    setError(null);
    setInfo(null);
    try {
      await patch(nodeKind === "subprocess" ? "update/subprocess-element" : "update/step-element", {
        id: nodeId,
        workflowId,
        properties: next.map((p) => ({ key: p.key, value: hasPropertyValue(p) ? p.value : null })),
      });
      setInfo("Captured details saved.");
      router.refresh();
    } finally {
      setPropBusyKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="rounded-md px-3 py-1.5 text-xs" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-md px-3 py-1.5 text-xs" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
          {info}
        </p>
      )}
      {/* The refusal is stated ONCE, up front, in the same words the backend
          would answer with — a board whose date chips simply do nothing reads as
          broken. Kept from the removed schedule card verbatim. */}
      {!jobCapability.ok && (
        <p
          className="inline-flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-[11px]"
          style={{ background: "#F5F5F4", color: "#57534E" }}
        >
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>
            <strong>This job’s own start and end cannot be changed.</strong> {jobCapability.reason}
          </span>
        </p>
      )}
      {schedOk && (
        <p className="rounded-md px-3 py-1.5 text-xs" style={{ background: "#ECFDF5", color: "#047857" }}>
          {schedOk}
        </p>
      )}
      {/* A draft with its panel collapsed would otherwise be a dead end: the
          amber chips say something changed, but the only Save lives inside the
          panel. Carry the commit point up here so an unsaved schedule can always
          be finished or thrown away from one place. */}
      {schedDirty && schedFor === null && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2"
          style={{ background: "#FEF7EC", borderColor: "#E8D9C4" }}
        >
          <span className="text-[11px]" style={{ color: "#A86120" }}>
            <strong>Unsaved schedule.</strong> {movedCount} {movedCount === 1 ? "stage has" : "stages have"} moved —
            the stages now end <strong>{formatEpoch(previewEnd)}</strong>.
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={discardSchedule}
              className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
              style={{ color: "#847D77" }}
            >
              <RotateCcw className="h-3 w-3" /> Discard
            </button>
            <Button variant="primary" size="sm" onClick={saveSchedule} disabled={schedSaving} loading={schedSaving}>
              {schedSaving ? "Saving…" : "Save schedule"}
            </Button>
          </div>
        </div>
      )}
      {schedError && schedFor === null && (
        <p className="rounded-md px-3 py-1.5 text-xs" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
          {schedError}
        </p>
      )}
      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: 720 }}>
          {/* Column header */}
          <div className="grid items-center px-1 pb-1" style={{ gridTemplateColumns: GRID, gap: 8 }}>
            <span />
            {COLUMNS.map((c) => (
              <span key={c.key} className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
                {c.label}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {live.map((step, si) => {
              const stepDone = isDone(step.status);
              const stepActive = si === activeStepIdx;
              const laneState: Gate = stepDone ? "done" : stepActive ? "active" : "locked";
              const subs = orderWorkflowSubProcesses(step.subProcesses || []).filter((sp) => !sp.deleted);

              // Within the active step, the active TASK is the first not-done sub.
              const activeSubIdx = subs.findIndex((sp) => !isDone(sp.status));

              // Build the cards for this lane.
              const cards: CardModel[] = [];
              if (subs.length === 0) {
                // Step itself is the unit of work.
                cards.push({
                  kind: "step",
                  id: step.id,
                  name: step.name || "Untitled stage",
                  status: step.status,
                  estimatedDays: step.estimatedDays,
                  estimatedStartDate: step.estimatedStartDate,
                  estimatedEndDate: step.estimatedEndDate,
                  actualStartDate: step.actualStartDate,
                  actualEndDate: step.actualEndDate,
                  feedback: step.element?.feedback,
                  properties: step.properties,
                  feedbackRequired: step.feedbackRequired,
                  elementId: step.element?.id,
                  gate: stepDone ? "done" : stepActive ? "active" : "locked",
                });
              } else {
                subs.forEach((sp, spi) => {
                  const g: Gate = isDone(sp.status)
                    ? "done"
                    : stepActive && spi === activeSubIdx
                    ? "active"
                    : "locked";
                  cards.push({
                    kind: "subprocess",
                    id: sp.id,
                    name: sp.name || "Untitled task",
                    status: sp.status,
                    estimatedDays: sp.estimatedDays,
                    estimatedStartDate: sp.estimatedStartDate,
                    estimatedEndDate: sp.estimatedEndDate,
                    actualStartDate: sp.actualStartDate,
                    actualEndDate: sp.actualEndDate,
                    feedback: sp.element?.feedback,
                    properties: sp.properties,
                    feedbackRequired: sp.feedbackRequired,
                    elementId: sp.element?.id,
                    gate: g,
                  });
                });
              }

              const laneBg = laneState === "active" ? "#FFFFFF" : "#FAF9F7";
              const laneBorder = laneState === "active" ? "#E8D9C4" : "#EDE9E3";

              const nextStep = live[si + 1];
              const bHere = baseline[Number(step.id)];
              const bNext = nextStep ? baseline[Number(nextStep.id)] : undefined;
              const pHere = preview[Number(step.id)];
              const pNext = nextStep ? preview[Number(nextStep.id)] : undefined;

              return (
                <React.Fragment key={step.id ?? si}>
                <div
                  className="grid rounded-xl border"
                  style={{ gridTemplateColumns: GRID, gap: 0, background: laneBg, borderColor: laneBorder }}
                >
                  {/* Rail — the stage */}
                  <div className="flex flex-col gap-1.5 border-r p-3" style={{ borderColor: laneBorder }}>
                    <div className="flex items-start gap-1.5">
                      <span
                        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-semibold"
                        style={
                          laneState === "done"
                            ? { background: "#ECFDF3", color: "#047857" }
                            : laneState === "active"
                            ? { background: "#FEF3E2", color: "#A86120" }
                            : { background: "#F3F1ED", color: "#AAA39E" }
                        }
                      >
                        {laneState === "done" ? <Check className="h-3 w-3" /> : si + 1}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-[13px] font-semibold leading-snug"
                          style={{ color: laneState === "locked" ? "#AAA39E" : "#1A1714" }}
                        >
                          {step.name || "Untitled stage"}
                        </p>
                        {step.primaryStep && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#A86120" }}>
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <LaneDelay step={step} now={now} done={stepDone} />
                    </div>
                    {/* The dates ARE the control — this is where rescheduling
                        lives now, on the stage it belongs to. */}
                    <StageDateChip
                      storedStart={step.estimatedStartDate}
                      storedEnd={step.estimatedEndDate}
                      storedDays={step.estimatedDays}
                      preview={schedDirty ? preview[Number(step.id)] : undefined}
                      editable={nodeScheduleCapability.ok}
                      open={schedFor === Number(step.id)}
                      lockReason={nodeScheduleCapability.reason}
                      onOpen={() => openSchedule(Number(step.id))}
                    />
                    {/* The STAGE's own captured details, on the stage they belong
                        to. Live puts capture properties at BOTH levels and both
                        carry values — measured on 133044983, "Target GSM: 150"
                        hangs off the Yarn Processing STAGE while Warp/Weft Yarn
                        Color & Shade hang off its TASK. Reading only one level
                        drops half the data, which is what this board did.
                        Renders nothing at all when the stage has no details. */}
                    <div style={{ minWidth: 0 }} className="break-words">
                      <CapturedDetails
                        level="stage"
                        nodeName={step.name || "Untitled stage"}
                        properties={step.properties}
                        capability={nodeValuesCapability}
                        saving={propBusyKey === `stage:${step.id}`}
                        onSave={(next) => saveProperties(`stage:${step.id}`, Number(step.id), "step", next)}
                      />
                    </div>
                  </div>

                  {/* Three columns */}
                  {COLUMNS.map((col) => (
                    <div
                      key={col.key}
                      className="flex flex-col gap-2 border-r p-2 last:border-r-0"
                      style={{ borderColor: laneBorder, background: col.key === "done" ? "rgba(4,120,87,0.03)" : undefined }}
                      onDragOver={(e) => {
                        if (dragKey) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        // Only the active card (belongs to this active lane) can drop.
                        if (!dragKey || !stepActive) return;
                        const active = cards.find((c) => c.gate === "active");
                        if (!active || keyOf(active.kind, active.id) !== dragKey) return;
                        const sub = active.kind === "subprocess" ? subs.find((sp) => sp.id === active.id) ?? null : null;
                        setDragKey(null);
                        advance(si, sub, col.key);
                      }}
                    >
                      {cards
                        // STAGE DOMINANCE: a card under a COMPLETED stage
                        // renders in Done whatever its own row says. See
                        // columnForCard — this is the fix for "live shows green,
                        // ours put it under In progress".
                        .filter((c) => columnForCard(c.status, step.status) === col.key)
                        .map((c) => {
                          const ckey = keyOf(c.kind, c.id);
                          const isBusy = busyKey === ckey;
                          const isOpen = expanded === ckey;
                          const draggable = c.gate === "active" && !isBusy;
                          const assignRows =
                            (c.kind === "step" ? assignments?.step[c.id] : assignments?.subprocess[c.id]) || [];
                          const d = c.gate !== "done" ? nodeDelay(c, now) : null;
                          const overdue = d?.state === "overdue";
                          return (
                            <div key={ckey} className="flex flex-col">
                              <div
                                draggable={draggable}
                                onDragStart={() => draggable && setDragKey(ckey)}
                                onDragEnd={() => setDragKey(null)}
                                className="rounded-lg border bg-white px-2.5 py-2 transition-shadow"
                                style={{
                                  borderColor: overdue ? "#FECACA" : c.gate === "active" ? "#E8D9C4" : "#E8E4DE",
                                  borderLeftWidth: overdue ? 3 : c.gate === "active" ? 3 : 1,
                                  borderLeftColor: overdue ? "#DC2626" : c.gate === "active" ? "#A86120" : undefined,
                                  opacity: c.gate === "locked" ? 0.6 : 1,
                                  cursor: draggable ? "grab" : "pointer",
                                  boxShadow: c.gate === "active" ? "0 1px 3px rgba(168,97,32,0.12)" : undefined,
                                }}
                              >
                                <div className="flex items-start gap-1.5">
                                  {draggable && (
                                    <GripVertical className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: "#C9C3BC" }} />
                                  )}
                                  {c.gate === "locked" && (
                                    <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: "#C9C3BC" }} />
                                  )}
                                  {c.gate === "done" && (
                                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: "#047857" }} />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setExpanded(isOpen ? null : ckey)}
                                    className="flex min-w-0 flex-1 items-start gap-1 text-left"
                                  >
                                    <span
                                      className="text-[12px] font-medium leading-tight"
                                      style={{ color: c.gate === "locked" ? "#AAA39E" : "#1A1714" }}
                                    >
                                      {c.name}
                                    </span>
                                    {isOpen ? (
                                      <ChevronDown className="ml-auto mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: "#AAA39E" }} />
                                    ) : (
                                      <ChevronRight className="ml-auto mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: "#AAA39E" }} />
                                    )}
                                  </button>
                                  {isBusy && <Loader2 className="mt-0.5 h-3 w-3 flex-shrink-0 animate-spin" style={{ color: "#A86120" }} />}
                                </div>

                                {/* One contextual line + light signals */}
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-0.5 text-[10px]" style={{ color: "#847D77" }}>
                                  {/* A status outside the three-state vocabulary
                                      (e.g. a HALTED row a Loom resync brings
                                      back) is printed AS ITSELF — never folded
                                      into one of the three. */}
                                  {!isCanonicalStatus(c.status) && (
                                    <span
                                      className="inline-flex items-center rounded px-1 py-0.5 font-semibold uppercase tracking-wide"
                                      style={{ background: "#F5F5F4", color: "#57534E" }}
                                      title="This row carries a status outside To do / In progress / Done"
                                    >
                                      {statusLabel(c.status)}
                                    </span>
                                  )}
                                  {isStageClosedOverride(c.status, step.status) && (
                                    <span
                                      style={{ color: "#847D77" }}
                                      title={`The stage is marked Done, so this task is shown as closed. Its own row still reads ${statusLabel(c.status)}.`}
                                    >
                                      closed with stage · row says {statusLabel(c.status)}
                                    </span>
                                  )}
                                  {c.gate === "done" && c.actualEndDate ? (
                                    <span style={{ color: "#047857" }}>Done {formatEpoch(c.actualEndDate)}</span>
                                  ) : d && d.label ? (
                                    <span
                                      className="inline-flex items-center gap-1 font-semibold"
                                      style={{ color: overdue ? "#DC2626" : d.state === "due-soon" ? "#B45309" : "#847D77" }}
                                    >
                                      {overdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                      {d.label}
                                    </span>
                                  ) : c.estimatedEndDate ? (
                                    <span>Due {formatEpoch(c.estimatedEndDate)}</span>
                                  ) : null}
                                  {c.feedbackRequired && (
                                    <span
                                      className="inline-flex items-center gap-0.5 font-semibold"
                                      style={{ color: "#6D28D9" }}
                                      title="This is a QC / approval checkpoint — it is completed by signing off, not by dragging it into Done"
                                    >
                                      <ShieldCheck className="h-3 w-3" />
                                      Sign-off
                                    </span>
                                  )}
                                  {/* The number of details the template asked for, and how many
                                      are filled in. The values themselves are in the card body —
                                      this is the at-a-glance "is anything missing here". */}
                                  {(c.properties?.length ?? 0) > 0 && (
                                    <span
                                      style={{ color: "#847D77" }}
                                      title={(c.properties || [])
                                        .map((pr) => `${pr.key}: ${pr.value ?? "—"}`)
                                        .join(" · ")}
                                    >
                                      {(c.properties || []).filter((pr) => pr.value !== undefined && pr.value !== null && pr.value !== "").length}
                                      /{c.properties!.length} details
                                    </span>
                                  )}
                                  {c.feedback?.status && (
                                    <span className="inline-flex items-center gap-0.5" style={{ color: "#6D28D9" }}>
                                      <MessageSquare className="h-3 w-3" />
                                      {c.feedback.status}
                                    </span>
                                  )}
                                  {assignRows.length > 0 && (
                                    <span className="inline-flex items-center -space-x-1">
                                      {assignRows.slice(0, 3).map((r) => (
                                        <span
                                          key={r.artisanId}
                                          title={nameFor(r.artisanId)}
                                          className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-semibold ring-1 ring-white"
                                          style={{ background: "#FEF3E2", color: "#A86120" }}
                                        >
                                          {initials(nameFor(r.artisanId))}
                                        </span>
                                      ))}
                                    </span>
                                  )}
                                </div>

                                {/* The single active card says so in words. This is a
                                    LABEL on the card the gate already chose — it does not
                                    widen what is draggable. */}
                                {c.gate === "active" && (
                                  <span
                                    className="mt-1 inline-block text-[9px] font-semibold uppercase tracking-wide"
                                    style={{ color: "#A86120" }}
                                  >
                                    Next up
                                  </span>
                                )}

                                {/* Active card: quick "advance" affordance next to drag */}
                                {c.gate === "active" && !isBusy && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      advance(
                                        si,
                                        c.kind === "subprocess" ? subs.find((sp) => sp.id === c.id) ?? null : null,
                                        columnForStatus(c.status) === "todo" ? "doing" : "done",
                                      )
                                    }
                                    className="mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                                    style={{ background: "#FEF3E2", color: "#A86120" }}
                                  >
                                    {columnForStatus(c.status) === "todo"
                                      ? "Start"
                                      : c.feedbackRequired
                                        ? "Sign off"
                                        : "Mark done"}
                                    {columnForStatus(c.status) !== "todo" && c.feedbackRequired ? (
                                      <ShieldCheck className="h-3 w-3" />
                                    ) : (
                                      <ArrowRight className="h-3 w-3" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {isOpen && (
                                <CardDetail
                                  c={c}
                                  workflowId={workflowId}
                                  assignments={assignments}
                                  assignRows={assignRows}
                                  nodeValuesCapability={nodeValuesCapability}
                                  nodeScheduleCapability={nodeScheduleCapability}
                                  schedDraft={
                                    taskSched && taskSched.taskId === c.id ? taskSched.edit : undefined
                                  }
                                  schedSaving={taskSaving && taskSched?.taskId === c.id}
                                  schedError={taskSched?.taskId === c.id ? taskError : null}
                                  onSchedOpen={() => openTaskSchedule(Number(step.id), c.id)}
                                  onSchedClose={() => {
                                    setTaskSched(null);
                                    setTaskError(null);
                                  }}
                                  onSchedStart={(ms) => setTaskStart(ms)}
                                  onSchedDays={(v) => setTaskDays(v)}
                                  onSchedSave={saveTaskSchedule}
                                  propBusy={propBusyKey === ckey}
                                  onSaveProperties={(next) => saveProperties(ckey, c.id, c.kind, next)}
                                  /* A stage WITH tasks is not independently revertible — the
                                     backend re-closes it inside the same request. See revert(). */
                                  revertable={c.kind === "subprocess" || stageRevertibleAlone(subs.length)}
                                  revertBusy={isBusy}
                                  onRevert={(target) =>
                                    revert(si, c.kind === "subprocess" ? subs.find((sp) => sp.id === c.id) ?? null : null, target)
                                  }
                                  signOffOpen={signOffFor === ckey}
                                  signOffCapability={canRecordSignOff(
                                    { id: workflowId, type: kind === "custom-order" ? "CUSTOM_ORDER" : "ORDER", status: jobStatus },
                                    c.elementId,
                                  )}
                                  signedBy={signedBy}
                                  onSignOffOpen={() => openSignOff(ckey)}
                                  onSignOffClose={() => setSignOffFor(null)}
                                  onSignOffApprove={async (remarks) => {
                                    const sub = c.kind === "subprocess" ? subs.find((sp) => sp.id === c.id) ?? null : null;
                                    // The RECORD first. If it fails the panel shows the error and the
                                    // card stays put, rather than completing with no approver.
                                    await recordSignOff(c.elementId, c.feedback?.id, "APPROVED", remarks);
                                    setSignOffFor(null);
                                    await advanceSignedOff(si, sub);
                                  }}
                                  onSignOffReject={async (remarks) => {
                                    const sub = c.kind === "subprocess" ? subs.find((sp) => sp.id === c.id) ?? null : null;
                                    // A rejection is a recorded verdict too — REJECTED, with
                                    // approved_by deliberately left null by the backend.
                                    await recordSignOff(c.elementId, c.feedback?.id, "REJECTED", remarks);
                                    setSignOffFor(null);
                                    await revert(si, sub, "IN_PROGRESS");
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ))}

                  {/* Reschedule panel — a full-width row of the SAME grid, so it
                      opens under the stage it edits instead of somewhere else on
                      the page. */}
                  {schedFor === Number(step.id) && (
                    /* minWidth:0 below is load-bearing, not cosmetic. A grid item
                       defaults to min-width:auto == MIN-CONTENT, so this full-span row's
                       widest unbreakable line was setting the floor for the whole lane
                       grid: the board grew past its 720px base, the page card grew with
                       it, and the flex sidebar was squeezed until its labels clipped — at
                       1440, with documentElement.scrollWidth still equal to innerWidth, so
                       the page-overflow check could not see it. Zeroing the floor lets the
                       flex-wrap row wrap instead of push. */
                    <div
                      className="border-t px-3 py-3"
                      style={{ gridColumn: "1 / -1", minWidth: 0, borderColor: laneBorder, background: "#FCFBF9" }}
                    >
                      <StageRescheduleRow
                        stageName={(step.name || "Untitled stage").trim()}
                        stageNumber={si + 1}
                        isChainHead={si === 0}
                        previousStageName={si > 0 ? (live[si - 1].name || "Untitled stage").trim() : undefined}
                        patch={preview[Number(step.id)]}
                        baseline={baseline[Number(step.id)]}
                        gapBefore={
                          si > 0 && preview[Number(live[si - 1].id)] && pHere
                            ? gapDays(preview[Number(live[si - 1].id)].estimatedEndDate, pHere.estimatedStartDate)
                            : undefined
                        }
                        baseGapBefore={
                          si > 0 && baseline[Number(live[si - 1].id)] && bHere
                            ? gapDays(baseline[Number(live[si - 1].id)].end, bHere.start)
                            : undefined
                        }
                        dirty={schedDirty}
                        movedCount={movedCount}
                        previewEnd={previewEnd}
                        savedJobEnd={savedJobEnd}
                        stageCapability={nodeScheduleCapability}
                        durationCapability={canTypeStageDuration(
                          orderedStages[si] ? orderedStages[si].tasks.length : 0,
                        )}
                        saving={schedSaving}
                        error={schedError}
                        onStart={(ms) => setStageStart(Number(step.id), ms)}
                        onDays={(v) => setStageDays(Number(step.id), v)}
                        onSave={saveSchedule}
                        onDiscard={discardSchedule}
                        onClose={() => setSchedFor(null)}
                      />
                    </div>
                  )}
                </div>

                {/* IDLE GAP — rendered where it actually is, between the two
                    stages. 55 of the 376 live dated chains carry one; drawing it
                    is the only way an operator can see that closing it is a
                    decision rather than an accident. */}
                {bHere && bNext && pHere && pNext && (
                  <IdleGapRow
                    nextStageName={(nextStep!.name || "Untitled stage").trim()}
                    baseDays={gapDays(bHere.end, bNext.start)}
                    previewDays={gapDays(pHere.estimatedEndDate, pNext.estimatedStartDate)}
                  />
                )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The idle time between one stage ending and the next starting.
 *
 * Silent when there is none AND the draft does not create one — a back-to-back
 * plan should not grow a row of noise per stage. Loud when a draft changes it,
 * because a gap quietly opening or closing is exactly the thing the previous
 * scheduling model did wrong and nobody could see.
 */
function IdleGapRow({
  nextStageName,
  baseDays,
  previewDays,
}: {
  nextStageName: string;
  baseDays: number;
  previewDays: number;
}) {
  const changed = baseDays !== previewDays;
  if (previewDays === 0 && !changed) return null;
  const say = (d: number) =>
    d === 0
      ? "no idle time"
      : d > 0
        ? `${d} ${d === 1 ? "day" : "days"} idle`
        : `${-d} ${-d === 1 ? "day" : "days"} overlap`;
  return (
    <div className="flex flex-wrap items-center gap-1.5 pl-6 text-[10px]" style={{ color: changed ? "#A86120" : "#AAA39E" }}>
      <span className="inline-block h-2.5 w-px" style={{ background: changed ? "#E8D9C4" : "#E8E4DE" }} />
      <span style={{ fontWeight: changed ? 600 : 400 }}>
        {say(previewDays)} before {nextStageName}
      </span>
      {changed && (
        <span className="line-through" style={{ color: "#C9C3BC", fontWeight: 400 }}>
          was {say(baseDays)}
        </span>
      )}
    </div>
  );
}

/**
 * The stage's dates, rendered as the thing you click to change them.
 *
 * Three jobs at once, which is why it is one component and not a label plus a
 * button: it PRINTS the stage's schedule, it is the AFFORDANCE for editing it,
 * and while a draft is open it is the PREVIEW — the new dates in amber with the
 * stored ones struck through beneath, on every stage the cascade touched. That
 * last part is what makes "changing one stage shifts the ones after it" visible
 * without a separate preview table: the table IS the board.
 *
 * When the job cannot be written it renders as plain text with a lock and the
 * backend's own refusal on hover, never as a dead button.
 */
function StageDateChip({
  storedStart,
  storedEnd,
  storedDays,
  preview,
  editable,
  open,
  lockReason,
  onOpen,
}: {
  storedStart?: number;
  storedEnd?: number;
  storedDays?: number;
  /** Only passed while a draft is open — absent means "show what is stored". */
  preview?: SchedulePatch;
  editable: boolean;
  open: boolean;
  lockReason: string;
  onOpen: () => void;
}) {
  const moved =
    !!preview &&
    (preview.estimatedStartDate !== (storedStart || 0) || preview.estimatedEndDate !== (storedEnd || 0));
  const start = moved ? preview!.estimatedStartDate : storedStart;
  const end = moved ? preview!.estimatedEndDate : storedEnd;
  const days = moved ? preview!.estimatedDays : storedDays;

  const inner = (
    <>
      <span
        className="flex w-full items-center gap-1 text-[9px] font-semibold uppercase tracking-wide"
        style={{ color: moved ? "#A86120" : open ? "#A86120" : "#AAA39E" }}
      >
        <CalendarClock className="h-3 w-3 flex-shrink-0" />
        {days != null ? `${days}d planned` : "Schedule"}
        {editable ? (
          <Pencil className="ml-auto h-2.5 w-2.5 flex-shrink-0" />
        ) : (
          <Lock className="ml-auto h-2.5 w-2.5 flex-shrink-0" />
        )}
      </span>
      <span className="text-[10px] leading-tight" style={{ color: moved ? "#A86120" : "#847D77" }}>
        {formatEpoch(start)} → {formatEpoch(end)}
      </span>
      {moved && (
        <span className="text-[9px] leading-tight line-through" style={{ color: "#AAA39E" }}>
          was {formatEpoch(storedStart)} → {formatEpoch(storedEnd)}
        </span>
      )}
    </>
  );

  const style = {
    borderColor: moved || open ? "#E8D9C4" : "#EDE9E3",
    background: moved ? "#FEF7EC" : "#FFFFFF",
  };

  if (!editable) {
    return (
      <div
        className="mt-0.5 flex w-full flex-col items-start gap-0.5 rounded-md border px-1.5 py-1"
        style={style}
        title={lockReason}
      >
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={open}
      title="Change this stage's dates"
      className="mt-0.5 flex w-full flex-col items-start gap-0.5 rounded-md border px-1.5 py-1 text-left transition-colors hover:border-[#E8D9C4] hover:bg-[#FEF7EC]"
      style={style}
    >
      {inner}
    </button>
  );
}

/**
 * THE TASK PLAN — read-out and editor in one, on the card's detail.
 *
 * Replaces the dead "{n}d planned · Due {date}" line. It is the same interaction
 * as the stage rail's StageDateChip, deliberately: one idiom for "these dates are
 * a control", so an operator who has learned the rail already knows this. Closed,
 * it reads as the plan; open, it edits the start and the duration and previews the
 * result in amber with the stored values struck through.
 *
 * WHAT IT REFUSES, AND HOW. A STAGE card (a stage with no tasks is rendered as one)
 * shows the plan as TEXT with a lock and the reason on hover — never a disabled
 * button, never a button that 400s. Two different reasons can lock it and they are
 * reported separately, because they send the operator to different places:
 *   • the SANDBOX FLOOR — a live-synced job, where the backend refuses the write;
 *   • DERIVED DATES — a stage measures itself from its tasks, so the edit belongs
 *     on the task or on the stage rail, and the copy says which.
 */
function TaskDateControl({
  card,
  capability,
  draft,
  saving,
  error,
  onOpen,
  onClose,
  onStart,
  onDays,
  onSave,
}: {
  card: CardModel;
  capability: WriteCapability;
  draft?: ScheduleEdit;
  saving: boolean;
  error: string | null;
  onOpen: () => void;
  onClose: () => void;
  onStart: (ms: number) => void;
  onDays: (v: string) => void;
  onSave: () => void;
}) {
  const storedStart = card.estimatedStartDate || 0;
  const storedEnd = card.estimatedEndDate || 0;
  const storedDays = card.estimatedDays;
  const open = draft !== undefined;

  // The draft's own projection: start moves, end rides the duration.
  const days = draft?.days ?? (storedDays != null ? storedDays : Math.round((storedEnd - storedStart) / DAY_MS));
  const start = draft?.startMs ?? storedStart;
  const end = start + (Number.isFinite(days) ? days : 0) * DAY_MS;
  const dirty = open && (start !== storedStart || end !== storedEnd || days !== storedDays);

  const planText =
    storedStart || storedEnd ? `${formatEpoch(storedStart)} → ${formatEpoch(storedEnd)}` : "No dates planned";

  // A stage derives its dates from its tasks — the edit lives on the task or on
  // the stage rail, and this says so instead of offering a control that cannot win.
  const derived = card.kind === "step";
  const lockReason = !capability.ok
    ? capability.reason
    : "This stage's dates are measured from its tasks — reschedule a task, or use the stage's date chip on the rail to move the whole stage.";

  if (!capability.ok || derived) {
    return (
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-2 py-1 text-[10px]"
        style={{ borderColor: "#F0EDE8", background: "#FCFBF9", color: "#847D77" }}
        title={lockReason}
      >
        <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
          <CalendarClock className="h-3 w-3" /> Planned
          <Lock className="h-2.5 w-2.5" />
        </span>
        <span>{planText}</span>
        {storedDays != null && <span>{storedDays}d</span>}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        title="Change this task's dates"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-2 py-1 text-left text-[10px] transition-colors hover:border-[#E8D9C4] hover:bg-[#FEF7EC]"
        style={{ borderColor: "#F0EDE8", background: "#FCFBF9", color: "#847D77" }}
      >
        <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
          <CalendarClock className="h-3 w-3" /> Planned
          <Pencil className="h-2.5 w-2.5" />
        </span>
        <span>{planText}</span>
        {storedDays != null && <span>{storedDays}d</span>}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border px-2 py-2" style={{ borderColor: "#E8D9C4", background: "#FEF7EC" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#A86120" }}>
          <CalendarClock className="h-3 w-3" /> Reschedule task
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-[10px] font-medium hover:underline"
          style={{ color: "#847D77" }}
        >
          <X className="h-3 w-3" /> Close
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <label className="flex flex-col gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
            Starts
          </span>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={toDateInput(start)}
              aria-label={`Start date for ${card.name}`}
              onChange={(e) => {
                const ms = fromDateInput(e.target.value);
                if (ms != null) onStart(ms);
              }}
              className="rounded border px-1.5 py-0.5 text-[11px] outline-none"
              style={{ borderColor: "#E8E4DE" }}
            />
            {[1, 7].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onStart(start + d * DAY_MS)}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: "#FEF3E2", color: "#A86120" }}
                title={`Postpone this task by ${d} day${d === 1 ? "" : "s"} — everything after it moves too`}
              >
                +{d}d
              </button>
            ))}
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
            Days
          </span>
          <input
            type="number"
            min={0}
            value={Number.isFinite(days) ? String(days) : ""}
            aria-label={`Days for ${card.name}`}
            onChange={(e) => onDays(e.target.value)}
            className="w-16 rounded border px-1.5 py-0.5 text-right text-[11px] outline-none"
            style={{ borderColor: "#E8E4DE" }}
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
            Ends
          </span>
          <span className="py-0.5 text-[11px] font-semibold" style={{ color: dirty ? "#A86120" : "#1A1714" }}>
            {formatEpoch(end)}
          </span>
        </div>
      </div>

      {dirty && (
        <p className="text-[10px] leading-snug" style={{ color: "#A86120" }}>
          <span className="line-through" style={{ color: "#AAA39E" }}>
            was {planText}
          </span>{" "}
          — this task and everything after it move by the same number of days. Idle gaps are kept.
        </p>
      )}

      {error && (
        <p className="rounded-md px-2 py-1 text-[10px]" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Save dates
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] font-medium hover:underline"
          style={{ color: "#847D77" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * The reschedule panel for ONE stage, opened under that stage's lane.
 *
 * Two edits, because a gap-preserving plan has exactly two: where this stage
 * STARTS and how many DAYS it runs. Everything else — the cascade, the idle gap
 * in front of it, the new plan end — is shown, never typed. Nothing is written
 * until Save, and Save is dead until the projection actually differs from what
 * is stored.
 *
 * Both fields are gated, and by DIFFERENT rules, because they fail for different
 * reasons: the START is refused only by the sandbox floor (canWriteNodeSchedule),
 * while the DURATION is additionally refused on a stage that owns tasks, whose
 * length is measured from them rather than typed (canTypeStageDuration). Each
 * refusal renders as text plus the backend's own sentence, never as a control that
 * silently no-ops — the one thing this surface refuses to do.
 *
 * The chain head no longer needs a special case. It had one while stage dates
 * travelled in the whole-tree `steps` array and only the head's start — doubling as
 * the workflow row's estimatedStartDate — could persist on a started job. Every
 * stage's start now persists through the same per-node PATCH, so the head is just
 * the stage with nothing in front of it.
 */
function StageRescheduleRow({
  stageName,
  stageNumber,
  isChainHead,
  previousStageName,
  patch,
  baseline,
  gapBefore,
  baseGapBefore,
  dirty,
  movedCount,
  previewEnd,
  savedJobEnd,
  stageCapability,
  durationCapability,
  saving,
  error,
  onStart,
  onDays,
  onSave,
  onDiscard,
  onClose,
}: {
  stageName: string;
  stageNumber: number;
  isChainHead: boolean;
  previousStageName?: string;
  patch?: SchedulePatch;
  baseline?: StageBaseline;
  /** Idle days in front of this stage under the current draft. */
  gapBefore?: number;
  /** The same, as stored — so a change to it can be named rather than implied. */
  baseGapBefore?: number;
  dirty: boolean;
  movedCount: number;
  previewEnd: number;
  savedJobEnd?: number;
  stageCapability: WriteCapability;
  /** Whether this stage's DURATION can be typed at all. A stage that owns tasks
   *  derives its length from them — live's rule, see canTypeStageDuration. */
  durationCapability: WriteCapability;
  saving: boolean;
  error: string | null;
  onStart: (ms: number) => void;
  onDays: (v: string) => void;
  onSave: () => void;
  onDiscard: () => void;
  onClose: () => void;
}) {
  const start = patch?.estimatedStartDate ?? baseline?.start ?? 0;
  const end = patch?.estimatedEndDate ?? baseline?.end ?? 0;
  const days = patch?.estimatedDays ?? baseline?.days;
  // EVERY stage's start is now writable through the same per-node PATCH, so the
  // chain-head special case is gone. It existed because the head's start doubled
  // as the workflow row's own estimatedStartDate — the ONE date that persisted on
  // a started job back when stage dates travelled in the whole-tree `steps` array.
  // With the per-node route there is nothing special about the head: it is simply
  // the stage with nothing in front of it, so moving it moves the whole job.
  const startEditable = stageCapability.ok;
  // The DURATION is a second, narrower gate: a stage that owns tasks measures its
  // own length from them, so the number is not the operator's to type here.
  const daysEditable = stageCapability.ok && durationCapability.ok;
  const gapWord = (d: number) =>
    d === 0 ? "no idle time" : d > 0 ? `${d} ${d === 1 ? "day" : "days"} idle` : `${-d} ${-d === 1 ? "day" : "days"} overlap`;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
          <CalendarClock className="h-3.5 w-3.5" /> Reschedule · stage {stageNumber} · {stageName}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
          style={{ color: "#847D77" }}
        >
          <X className="h-3 w-3" /> Close
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
            Starts
          </span>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={toDateInput(start)}
              disabled={!startEditable}
              aria-label={`Start date for ${stageName}`}
              onChange={(e) => {
                const ms = fromDateInput(e.target.value);
                if (ms != null) onStart(ms);
              }}
              className="rounded border px-2 py-1 text-xs outline-none disabled:opacity-50"
              style={{ borderColor: "#E8E4DE" }}
            />
            {startEditable &&
              [-7, -1, 1, 7].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onStart(start + d * DAY_MS)}
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: "#FEF3E2", color: "#A86120" }}
                  title={
                    isChainHead
                      ? `Move the whole job by ${d} day${Math.abs(d) === 1 ? "" : "s"}`
                      : `Start ${stageName} ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} ${d > 0 ? "later" : "earlier"} — everything after it moves too`
                  }
                >
                  {d > 0 ? `+${d}d` : `${d}d`}
                </button>
              ))}
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
            Days
          </span>
          <input
            type="number"
            min={0}
            value={days == null ? "" : String(days)}
            disabled={!daysEditable}
            aria-label={`Days for ${stageName}`}
            title={daysEditable ? undefined : durationCapability.reason}
            onChange={(e) => onDays(e.target.value)}
            className="w-20 rounded border px-2 py-1 text-right text-xs outline-none disabled:opacity-50"
            style={{ borderColor: "#E8E4DE" }}
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
            Ends
          </span>
          <span className="py-1 text-xs font-semibold" style={{ color: "#1A1714" }}>
            {formatEpoch(end)}
          </span>
        </div>

        {/* The idle gap in front of this stage is a first-class readout, because
            the start field is the thing that edits it. */}
        {gapBefore != null && previousStageName && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
              After {previousStageName}
            </span>
            <span
              className="py-1 text-xs font-semibold"
              style={{ color: baseGapBefore != null && baseGapBefore !== gapBefore ? "#A86120" : "#1A1714" }}
            >
              {gapWord(gapBefore)}
              {baseGapBefore != null && baseGapBefore !== gapBefore && (
                <span className="ml-1.5 text-[10px] font-normal line-through" style={{ color: "#AAA39E" }}>
                  was {gapWord(baseGapBefore)}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] leading-snug" style={{ color: "#847D77" }}>
        {isChainHead
          ? "This is the first stage, so moving its start moves the whole job."
          : `Moving this stage's start moves it — and every stage after it — by the same number of days. Only the idle time after “${previousStageName}” changes; the gaps further down the chain are kept exactly as they are.`}{" "}
        Watch the dates on the rails, and the idle-gap lines between them. The stage&apos;s
        own tasks move with it, so its dates keep matching the work inside it.
      </p>

      {dirty && (
        <p className="rounded-md px-2.5 py-1.5 text-[11px]" style={{ background: "#FEF7EC", color: "#A86120" }}>
          <strong>Preview only — nothing is saved yet.</strong> {movedCount}{" "}
          {movedCount === 1 ? "stage moves" : "stages move"} · the plan now ends{" "}
          <strong>{formatEpoch(previewEnd)}</strong>
          {savedJobEnd && savedJobEnd !== previewEnd
            ? `, replacing the ${formatEpoch(savedJobEnd)} currently saved on the job.`
            : "."}
        </p>
      )}

      {!stageCapability.ok && (
        <p
          className="inline-flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-[11px]"
          style={{ background: "#FFFBEB", color: "#92400E" }}
        >
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>{stageCapability.reason}</span>
        </p>
      )}

      {/* The DERIVED-duration rule, stated where the disabled field is rather than
          only on hover. A greyed input with no explanation beside it is exactly the
          "dead control" this surface refuses; the operator needs to know the number
          is not missing, it is measured — and where to go to change it. */}
      {stageCapability.ok && !durationCapability.ok && (
        <p
          className="inline-flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-[11px]"
          style={{ background: "#F5F5F4", color: "#57534E" }}
        >
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>{durationCapability.reason}</span>
        </p>
      )}

      {error && (
        <p className="rounded-md px-2.5 py-1.5 text-[11px]" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={onSave} disabled={!dirty || saving} loading={saving}>
          {saving ? "Saving…" : "Save schedule"}
        </Button>
        {dirty && (
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
            style={{ color: "#847D77" }}
          >
            <RotateCcw className="h-3 w-3" /> Discard changes
          </button>
        )}
      </div>
    </div>
  );
}

function LaneDelay({ step, now, done }: { step: WorkflowStep; now: number; done: boolean }) {
  const d = nodeDelay(step, now);
  if (done) {
    // Keep the daily board quiet on finished work — no red on done stages.
    if (d.state === "late-done") return <span className="text-[10px]" style={{ color: "#AAA39E" }}>{d.days}d late</span>;
    return null;
  }
  if (d.state === "overdue")
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "#DC2626" }}>
        <AlertTriangle className="h-3 w-3" /> {d.label}
      </span>
    );
  return null;
}

/**
 * The expanded body of one card — everything about a node that does not fit on
 * its face, and every action that must be DELIBERATE rather than a gesture.
 *
 * Four things live here, in the order an operator needs them:
 *   1. WHERE IT STANDS — status, plan dates, and the ACTUAL start / end. Live
 *      shows actuals beside the estimates; this board previously printed the
 *      completion date on the card face and nothing else, so a task that had
 *      started but not finished showed no actual date at all.
 *   2. CAPTURED DETAILS — the values recorded against this node, editable in
 *      place where they can persist. See CapturedDetails.
 *   3. THE UNDO — an explicit "move back one state" control, never a toggle on
 *      the card face, because a mis-click on a production board is exactly the
 *      mistake it exists to fix.
 *   4. THE CHECKPOINT — the sign-off panel, on a node the template flagged.
 * Artisan assignment stays where it was, at the bottom.
 */
function CardDetail({
  c,
  workflowId,
  assignments,
  assignRows,
  nodeValuesCapability,
  nodeScheduleCapability,
  schedDraft,
  schedSaving,
  schedError,
  onSchedOpen,
  onSchedClose,
  onSchedStart,
  onSchedDays,
  onSchedSave,
  propBusy,
  onSaveProperties,
  revertable,
  revertBusy,
  onRevert,
  signOffOpen,
  signOffCapability,
  signedBy,
  onSignOffOpen,
  onSignOffClose,
  onSignOffApprove,
  onSignOffReject,
}: {
  c: CardModel;
  workflowId: number;
  assignments?: BoardAssignments;
  assignRows: { artisanId: number; quantityOfFabricInMeters?: number | null; quantityOfProducts?: number | null }[];
  nodeValuesCapability: WriteCapability;
  /** Whether this node's ESTIMATED dates can be written. See canWriteNodeSchedule. */
  nodeScheduleCapability: WriteCapability;
  /** The task-level date draft, when it is open on THIS card. */
  schedDraft?: ScheduleEdit;
  schedSaving: boolean;
  schedError: string | null;
  onSchedOpen: () => void;
  onSchedClose: () => void;
  onSchedStart: (ms: number) => void;
  onSchedDays: (v: string) => void;
  onSchedSave: () => void;
  propBusy: boolean;
  onSaveProperties: (next: NodeProperty[]) => Promise<void>;
  /** False for a stage that owns tasks — see revert() decision (2). */
  revertable: boolean;
  revertBusy: boolean;
  onRevert: (target: NodeStatus) => Promise<void>;
  signOffOpen: boolean;
  signOffCapability: WriteCapability;
  signedBy: string;
  onSignOffOpen: () => void;
  onSignOffClose: () => void;
  onSignOffApprove: (remarks: string) => Promise<void>;
  onSignOffReject: (remarks: string) => Promise<void>;
}) {
  const back = previousStatus(c.status);
  return (
    <div
      className="mt-1 flex flex-col gap-2 rounded-lg border px-2.5 py-2"
      style={{ borderColor: "#F0EDE8", background: "#FCFBF9", minWidth: 0 }}
    >
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]" style={{ color: "#847D77" }}>
        <span className="inline-flex items-center gap-1">
          {/* Operator words (To do / In progress / Done), with a non-canonical
              status still printed as itself -- see statusLabel. */}
          <StatusPill status={c.status} label={statusLabel(c.status)} />
        </span>
      </div>

      {/* THE PLAN, as a control. This line used to be dead text — "30d planned ·
          Due 14 Jul" and no way to change either — which is exactly where Amit
          went looking to postpone a running job and found nothing. It is now the
          click-to-edit affordance, in the same idiom as the stage rail's
          StageDateChip: click to open, amber preview, the old values struck
          through, Save dead until it actually differs.

          Only a TASK is editable here, and that is live's rule rather than a
          shortcut: live implements a step's date setters as empty bodies under
          "Step dates are read-only and calculated from sub-processes". A stage
          that owns tasks measures itself from them, so its card shows the plan as
          text and points at the rail chip, which moves the whole stage. A stage
          with NO tasks is its own unit of work and is edited on that same chip. */}
      <TaskDateControl
        card={c}
        capability={nodeScheduleCapability}
        draft={schedDraft}
        saving={schedSaving}
        error={schedError}
        onOpen={onSchedOpen}
        onClose={onSchedClose}
        onStart={onSchedStart}
        onDays={onSchedDays}
        onSave={onSchedSave}
      />

      {/* ACTUALS, named as such and always present. `formatEpoch(0)` already
          prints an em dash, and 0 IS the model's "never happened" sentinel
          (instantiateSteps is born with actualStartDate 0 / actualEndDate 0), so
          a node that has not started reads "—" rather than vanishing. That
          matters for the undo: clearing a date has to be VISIBLE. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
        <span>
          <span style={{ color: "#AAA39E" }}>Actual start </span>
          <span style={{ color: c.actualStartDate ? "#1A1714" : "#AAA39E" }}>{formatEpoch(c.actualStartDate)}</span>
        </span>
        <span>
          <span style={{ color: "#AAA39E" }}>Actual end </span>
          <span style={{ color: c.actualEndDate ? "#047857" : "#AAA39E" }}>{formatEpoch(c.actualEndDate)}</span>
        </span>
      </div>

      <CapturedDetails
        level={c.kind === "step" ? "stage" : "task"}
        nodeName={c.name}
        properties={c.properties}
        capability={nodeValuesCapability}
        saving={propBusy}
        onSave={onSaveProperties}
      />

      {/* THE UNDO. Amit: "the status here is done by default... We need a way to
          revert back if something is done by mistake." One state at a time, so
          the operator always knows exactly where the card lands, and it names
          the destination rather than saying "undo". */}
      {back && (
        <div className="border-t pt-1.5" style={{ borderColor: "#F0EDE8" }}>
          {revertable ? (
            <button
              type="button"
              disabled={revertBusy}
              onClick={() => onRevert(back)}
              className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold disabled:opacity-50"
              style={{ borderColor: "#E8E4DE", background: "#FFFFFF", color: "#847D77" }}
              title={
                up(c.status) === "COMPLETED"
                  ? "Marked done by mistake? Move it back to In progress and clear the completion date."
                  : "Move this back to To do and clear the start date."
              }
            >
              {revertBusy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Undo2 className="h-3 w-3" />
              )}
              Move back to {NODE_STATUS_LABEL[back]}
            </button>
          ) : (
            <p className="text-[10px] leading-snug" style={{ color: "#AAA39E" }}>
              This stage follows its tasks — move a TASK back and the stage re-opens with it. Reverting the stage on
              its own does not stick: the backend re-closes a stage whose tasks are all done, inside the same request.
            </p>
          )}
        </div>
      )}

      {/* THE CHECKPOINT. Opened by the card's own "Sign off" action, or from
          here on a task that is already done and is being re-examined. */}
      {c.feedbackRequired && !signOffOpen && (
        <div className="border-t pt-1.5" style={{ borderColor: "#F0EDE8" }}>
          <button
            type="button"
            onClick={onSignOffOpen}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "#F5F3FF", color: "#6D28D9" }}
          >
            <ShieldCheck className="h-3 w-3" />
            {up(c.status) === "COMPLETED" ? "Review sign-off" : "Open sign-off"}
          </button>
        </div>
      )}
      {c.feedbackRequired && signOffOpen && (
        <SignOffPanel
          nodeName={c.name}
          properties={c.properties}
          feedback={c.feedback}
          capability={signOffCapability}
          signedBy={signedBy}
          busy={revertBusy}
          onApprove={onSignOffApprove}
          onReject={onSignOffReject}
          onClose={onSignOffClose}
        />
      )}

      {/* Evidence already synced onto a NON-checkpoint node still renders here,
          exactly as before — a task can carry feedback without being flagged. */}
      {!c.feedbackRequired && c.feedback?.status && (
        <div className="border-t pt-1.5" style={{ borderColor: "#F0EDE8" }}>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: "#6D28D9" }}>
            <MessageSquare className="h-3 w-3" /> Feedback · {c.feedback.status}
          </span>
          {c.feedback.text && (
            <p className="mt-0.5 text-[10px] leading-snug" style={{ color: "#635D58" }}>
              {c.feedback.text}
            </p>
          )}
          <FeedbackMedia image={c.feedback.image} video={c.feedback.video} />
        </div>
      )}

      {assignments && (
        <div className="border-t pt-1.5" style={{ borderColor: "#F0EDE8" }}>
          <ArtisanAssignmentPanel
            variant="inline"
            kind={c.kind}
            elementId={c.id}
            workflowId={workflowId}
            elementName={c.name}
            initialAssignments={assignRows}
            artisans={assignments.artisans}
          />
        </div>
      )}
    </div>
  );
}
