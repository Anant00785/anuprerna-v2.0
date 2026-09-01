"use client";

/**
 * StepStatusControl -- advance a production STEP or SUBPROCESS status during
 * live execution. Wired to the native (2026-07-06 gap-fill) endpoints:
 *   PATCH /update/step-element        {id, workflowId, status, actualStartDate?, actualEndDate?}
 *   PATCH /update/subprocess-element  {id, workflowId, status, actualStartDate?, actualEndDate?}
 * via /api/crud. `workflowId` is always sent (RECOMMENDED by the backend --
 * disambiguates which instance's node to mutate, see workflow.mapper.ts
 * resolveWorkflowScope). Covers production-write-update-step-status /
 * production-write-update-subprocess-status.
 *
 * Transitioning INTO "IN_PROGRESS" stamps actualStartDate = now (if not
 * already set); transitioning INTO "COMPLETED" stamps actualEndDate = now.
 * These mirror the fields the delay-tracking math (workflowDelaySummary /
 * nodeDelay in artisanflow-api.ts) already reads, so the schedule strip and
 * delay badges update consistently as soon as the status changes.
 *
 * THREE STATES ONLY (2026-08-16, Amit): To do / In progress / Done. The option
 * list is NODE_STATUSES from @/lib/workflow-ops -- HALTED is no longer
 * offered, because it is not part of how production is run ("We're not using
 * the HALTED thing... if it's green, it means it's already done").
 *
 * What this control must NOT do is pretend a value it cannot offer does not
 * exist. If the node currently carries a status outside the three (a HALTED row
 * reintroduced by a Loom resync -- there are zero in the sandbox today, but the
 * backend enum still accepts them), that value is rendered as an extra,
 * DISABLED option showing its own label and is left SELECTED. So the operator
 * reads the truth, cannot accidentally re-select it, and can move the node into
 * any of the three real states. Silently defaulting the select to "To do" would
 * have told them halted work had never been started.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { NODE_STATUSES, isCanonicalStatus, statusLabel, up, type NodeStatus } from "@/lib/workflow-ops";

export function StepStatusControl({
  kind,
  elementId,
  workflowId,
  status,
  actualStartDate,
  actualEndDate,
}: {
  kind: "step" | "subprocess";
  elementId: number;
  workflowId: number;
  status?: string;
  actualStartDate?: number;
  actualEndDate?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = up(status);
  const foreign = !isCanonicalStatus(current);

  const setStatus = async (next: NodeStatus) => {
    if (next === current || busy) return;
    setBusy(true);
    setError(null);
    const now = Date.now();
    const path = kind === "step" ? "update/step-element" : "update/subprocess-element";
    const body: Record<string, unknown> = { id: elementId, workflowId, status: next };
    if (next === "IN_PROGRESS" && !actualStartDate) body.actualStartDate = now;
    if (next === "COMPLETED" && !actualEndDate) body.actualEndDate = now;
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method: "PATCH", body }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || "Update failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end gap-0.5">
      <div className="inline-flex items-center gap-0.5 rounded-md border p-0.5" style={{ borderColor: "#E8E4DE", background: "white" }}>
        {busy && <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin" style={{ color: "#AAA39E" }} />}
        <select
          value={current}
          disabled={busy}
          onChange={(e) => setStatus(e.target.value as NodeStatus)}
          className="rounded bg-transparent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide outline-none disabled:opacity-50"
          style={{ color: "#635D58" }}
          title="Advance this element's live status"
        >
          {/* The node's real status, when it is not one of the three we offer.
              Kept visible and selected, but not choosable. */}
          {foreign && (
            <option value={current} disabled>
              {statusLabel(current)} (not offered)
            </option>
          )}
          {NODE_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>
      {error && <span className="text-[10px]" style={{ color: "#B91C1C" }}>{error}</span>}
    </div>
  );
}
