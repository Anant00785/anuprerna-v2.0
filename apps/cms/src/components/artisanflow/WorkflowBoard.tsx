import React from "react";
import { StatusPill } from "./StatusPill";
import { StepStatusControl } from "./StepStatusControl";
import { formatEpoch } from "@/lib/utils";
import { nodeDelay, orderWorkflowSteps, orderWorkflowSubProcesses, type WorkflowStep, type NodeDelay } from "@/lib/artisanflow-api";
import { MessageSquare, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { ArtisanAssignmentPanel, type AssignableArtisan, type AssignmentRow } from "./ArtisanAssignmentPanel";
import { FeedbackMedia } from "./FeedbackMedia";

/** Element-level artisan assignments, folded INTO the board so "advance stages"
 *  and "assign artisans" are one surface instead of two stacked sections. */
export interface BoardAssignments {
  artisans: AssignableArtisan[];
  /** keyed by step element id */
  step: Record<number, AssignmentRow[]>;
  /** keyed by subprocess element id */
  subprocess: Record<number, AssignmentRow[]>;
}

/**
 * Operational pipeline board for a workflow's STEPS + SUBPROCESSES.
 *
 * Linear/Asana feel: each Step is a column; its SubProcesses are cards stacked in
 * the column. Renders both template definitions (mode="template" — estimated days,
 * no live status) and live instances (mode="instance" — per-step/subprocess status,
 * actual dates, feedback state). Pure render (no client state of its own) so it
 * stays SSR-deterministic and harness-safe; when `workflowId` is supplied in
 * mode="instance" it additionally renders a StepStatusControl (client component)
 * per step/subprocess so status can be advanced right from the board -- the
 * native PATCH /update/{step,subprocess}-element write path (2026-07-06 gap-fill).
 */

function DelayBadge({ d }: { d: NodeDelay | null }) {
  if (!d || d.state === "pending" || d.state === "done") return null;
  const map: Record<string, { bg: string; fg: string; border: string; late?: boolean }> = {
    overdue: { bg: "#FEF2F2", fg: "#DC2626", border: "#FECACA", late: true },
    "late-done": { bg: "#FFF7ED", fg: "#B45309", border: "#FED7AA", late: true },
    "due-soon": { bg: "#FFFBEB", fg: "#B45309", border: "#FDE9C5" },
    "on-track": { bg: "#F0FDF4", fg: "#059669", border: "#BBF7D0" },
  };
  const c = map[d.state];
  if (!c) return null;
  const Icon = c.late ? AlertTriangle : Clock;
  return (
    <span
      className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
    >
      <Icon className="h-3 w-3" />
      {d.label}
    </span>
  );
}

function FeedbackChip({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: "#6D28D9" }}>
      <MessageSquare className="h-3 w-3" />
      Feedback
      <StatusPill status={status} />
    </span>
  );
}

function SubProcessCard({
  sp,
  mode,
  now,
  workflowId,
  assignments,
}: {
  sp: WorkflowStep["subProcesses"][number];
  mode: "template" | "instance";
  now?: number;
  workflowId?: number;
  assignments?: BoardAssignments;
}) {
  const fb = sp.element?.feedback;
  const d = mode === "instance" && now ? nodeDelay(sp, now) : null;
  const overdue = d?.state === "overdue";
  return (
    <div
      className="rounded-lg border bg-white px-3 py-2.5"
      style={{ borderColor: overdue ? "#FECACA" : "#E8E4DE", borderLeftWidth: overdue ? 3 : 1, borderLeftColor: overdue ? "#DC2626" : undefined }}
    >
      <p className="text-[13px] font-medium leading-tight" style={{ color: "#1A1714" }}>
        {sp.name || "Untitled subprocess"}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {mode === "instance" && workflowId != null ? (
          <StepStatusControl
            kind="subprocess"
            elementId={sp.id}
            workflowId={workflowId}
            status={sp.status}
            actualStartDate={sp.actualStartDate}
            actualEndDate={sp.actualEndDate}
          />
        ) : (
          mode === "instance" && sp.status && <StatusPill status={sp.status} />
        )}
        <DelayBadge d={d} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: "#847D77" }}>
        {mode === "template" && sp.estimatedDays != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {sp.estimatedDays}d est.
          </span>
        )}
        {mode === "instance" && sp.estimatedDays != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {sp.estimatedDays}d planned
          </span>
        )}
        {mode === "instance" && !sp.actualEndDate && sp.actualStartDate ? (
          <span>Started {formatEpoch(sp.actualStartDate)}</span>
        ) : null}
        {mode === "instance" && (sp.estimatedStartDate || sp.estimatedEndDate) && (
          <span>Due {formatEpoch(sp.estimatedEndDate)}</span>
        )}
        {mode === "instance" && sp.actualEndDate ? (
          <span className="inline-flex items-center gap-1" style={{ color: "#047857" }}>
            <CheckCircle2 className="h-3 w-3" />
            Done {formatEpoch(sp.actualEndDate)}
          </span>
        ) : null}
        {sp.feedbackRequired && mode === "template" && (
          <span style={{ color: "#6D28D9" }}>Feedback required</span>
        )}
      </div>
      {mode === "instance" && workflowId != null && assignments && (
        <div className="mt-2 border-t pt-2" style={{ borderColor: "#F3F1ED" }}>
          <ArtisanAssignmentPanel
            variant="inline"
            kind="subprocess"
            elementId={sp.id}
            workflowId={workflowId}
            elementName={sp.name}
            initialAssignments={assignments.subprocess[sp.id] || []}
            artisans={assignments.artisans}
          />
        </div>
      )}
      {mode === "instance" && fb?.status && (
        <div className="mt-2 border-t pt-2" style={{ borderColor: "#F3F1ED" }}>
          <FeedbackChip status={fb.status} />
          {fb.text && (
            <p className="mt-1 text-[11px] leading-snug" style={{ color: "#635D58" }}>
              {fb.text}
            </p>
          )}
          <FeedbackMedia image={fb.image} video={fb.video} />
        </div>
      )}
    </div>
  );
}

export function WorkflowBoard({
  steps,
  mode,
  now,
  workflowId,
  assignments,
}: {
  steps: WorkflowStep[];
  mode: "template" | "instance";
  now?: number;
  /** Owning workflow instance id. When present in mode="instance", renders a
   *  live status control (advance PENDING -> IN_PROGRESS -> COMPLETED etc.)
   *  next to each step/subprocess instead of the plain read-only StatusPill. */
  workflowId?: number;
  /** When supplied (with workflowId, mode="instance"), each step/subprocess node
   *  also carries its own inline artisan assignment control. */
  assignments?: BoardAssignments;
}) {
  // Template order comes from the step chain, NOT from the id -- same rule as
  // PipelineSwimlane, so the two views can never disagree about stage order.
  // (Supersedes an earlier id-ascending sort here: the backend returns steps in
  // insertion order, and the chain walk fixes that case too, without the risk of
  // this board disagreeing with the swimlane.)
  const live = orderWorkflowSteps(steps || []).filter((s) => !s.deleted);
  if (live.length === 0) {
    return (
      <div
        className="rounded-xl border py-10 text-center text-sm"
        style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#AAA39E" }}
      >
        No steps defined for this workflow.
      </div>
    );
  }
  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {live.map((step, i) => {
        const subs = orderWorkflowSubProcesses(step.subProcesses || []).filter((sp) => !sp.deleted);
        const sd = mode === "instance" && now ? nodeDelay(step, now) : null;
        const stepOverdue = sd?.state === "overdue";
        return (
          <div
            key={step.id ?? i}
            className="flex w-80 flex-shrink-0 flex-col rounded-xl border"
            style={{ background: "#FAF9F7", borderColor: stepOverdue ? "#FECACA" : "#E8E4DE" }}
          >
            {/* Step header */}
            <div className="border-b px-3.5 py-3" style={{ borderColor: "#E8E4DE" }}>
              <div className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-semibold"
                  style={{ background: "#FEF3E2", color: "#A86120" }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug" style={{ color: "#1A1714" }}>
                    {step.name || "Untitled step"}
                  </p>
                  {step.primaryStep && (
                    <span className="mt-0.5 inline-block text-[10px] font-medium uppercase tracking-wide" style={{ color: "#A86120" }}>
                      Primary
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {mode === "instance" && workflowId != null ? (
                  <StepStatusControl
                    kind="step"
                    elementId={step.id}
                    workflowId={workflowId}
                    status={step.status}
                    actualStartDate={step.actualStartDate}
                    actualEndDate={step.actualEndDate}
                  />
                ) : (
                  mode === "instance" && step.status && <StatusPill status={step.status} />
                )}
                <DelayBadge d={sd} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: "#847D77" }}>
                {mode === "template" && step.estimatedDays != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {step.estimatedDays}d est.
                  </span>
                )}
                {mode === "instance" && step.estimatedDays != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {step.estimatedDays}d planned
                  </span>
                )}
                {mode === "instance" && (step.estimatedStartDate || step.estimatedEndDate) && (
                  <span>Due {formatEpoch(step.estimatedEndDate)}</span>
                )}
                <span>{subs.length} subprocess{subs.length === 1 ? "" : "es"}</span>
              </div>
              {mode === "instance" && workflowId != null && assignments && (
                <div className="mt-2">
                  <ArtisanAssignmentPanel
                    variant="inline"
                    kind="step"
                    elementId={step.id}
                    workflowId={workflowId}
                    elementName={step.name}
                    initialAssignments={assignments.step[step.id] || []}
                    artisans={assignments.artisans}
                  />
                </div>
              )}
            </div>
            {/* Subprocess cards */}
            <div className="flex flex-col gap-2 p-2.5">
              {subs.length === 0 ? (
                <p className="px-1 py-3 text-center text-[11px]" style={{ color: "#AAA39E" }}>
                  No subprocesses
                </p>
              ) : (
                subs.map((sp, j) => <SubProcessCard key={sp.id ?? j} sp={sp} mode={mode} now={now} workflowId={workflowId} assignments={assignments} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
