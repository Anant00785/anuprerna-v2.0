"use client";

/**
 * WorkflowNotePanel — the job's own free-text note, and the Add Note control
 * live Weave has on the workflow and we did not.
 *
 * Amit, 2026-08-17: live has an "Add Note" button on the workflow; we have none,
 * and he flagged the note data as missing.
 *
 * WHERE THE NOTE LIVES, and why this is one field rather than a new one:
 * `note` is a first-class column on the job detail (workflow_step_detail's
 * rest_embed), served by GET /get/workflow/{id} and already declared on
 * WorkflowInstance. It is the SAME value that surfaces as
 * OrderWorkflowSummary.note — the italic line under a job row in Order Watch
 * (OrderProductionWatch), which reads it straight off `full.note`. So a note
 * written here shows up on the order screens too, without a second field and
 * without a sync. The custom order's own `note` / `globalNote` are a DIFFERENT,
 * order-level pair (CustomOrderDetailView) and are deliberately untouched.
 *
 * IT PERSISTS ON A RUNNING JOB — measured against the deployed wrapper on :8090,
 * 2026-08-17, on sandbox job 1000000000000: PATCH /update/custom-workflow
 * { id, note } round-tripped while the job was CREATED *and* again after it had
 * moved to INITIATED, and the same is true of PATCH /update/workflow on the
 * standard-order job 1000000000001. mergeWorkflowUpdate / mergeCustomWorkflowUpdate
 * both apply `note` on presence with no status gate — unlike `steps`, which is
 * CREATED-only. So this control is gated by the sandbox floor ALONE.
 *
 * The write carries `note` and NOTHING else. Sending the steps tree alongside it
 * would drag the whole job through mergeStepTrees for a text edit, and on a
 * started job it would turn a legal note write into a 400.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Lock, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import type { WriteCapability } from "@/lib/workflow-ops";

const INK = "#1A1714";
const MUTED = "#847D77";
const FAINT = "#AAA39E";

/** Same ceiling the discussion thread enforces server-side, applied here so the
 *  operator sees the limit while typing instead of after a refusal. */
const MAX = 8000;

export function WorkflowNotePanel({
  workflowId,
  kind,
  initialNote,
  capability,
}: {
  workflowId: number;
  /** Which PATCH family this job saves through — the two are not interchangeable. */
  kind: "order" | "custom-order";
  initialNote?: string | null;
  capability: WriteCapability;
}) {
  const router = useRouter();
  const stored = (initialNote ?? "").trim();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stored);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const dirty = draft.trim() !== stored;
  const tooLong = draft.length > MAX;

  async function save() {
    if (!capability.ok || !dirty || tooLong) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: kind === "custom-order" ? "update/custom-workflow" : "update/workflow",
          method: "PATCH",
          // note ONLY — see the header note on why `steps` must not ride along.
          body: { id: workflowId, note: draft.trim() },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || "Save failed");
      setOk(draft.trim() ? "Note saved." : "Note cleared.");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5" style={{ minWidth: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
          <StickyNote className="h-3.5 w-3.5" /> Job note
        </p>
        {!editing &&
          (capability.ok ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDraft(stored);
                setError(null);
                setOk(null);
                setEditing(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" /> {stored ? "Edit note" : "Add note"}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" disabled title={capability.reason}>
              <Lock className="h-3.5 w-3.5" /> {stored ? "Edit note" : "Add note"}
            </Button>
          ))}
      </div>

      {!editing && (
        <>
          {stored ? (
            <p className="whitespace-pre-wrap text-xs leading-relaxed" style={{ color: "#635D58" }}>
              {stored}
            </p>
          ) : (
            <p className="text-xs italic" style={{ color: FAINT }}>
              No note on this job yet. A note here also shows against the job on the order screens.
            </p>
          )}
          {ok && (
            <p className="rounded-md px-2.5 py-1 text-[11px]" style={{ background: "#ECFDF5", color: "#047857" }}>
              {ok}
            </p>
          )}
        </>
      )}

      {editing && (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={draft}
            rows={3}
            aria-label="Job note"
            placeholder="e.g. Dispatch committed for 12 Sept — customer confirmed the shade on 2 Sept."
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border px-2.5 py-2 text-xs outline-none"
            style={{ borderColor: "#E8E4DE", color: INK, minWidth: 0 }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={save} disabled={!dirty || saving || tooLong} loading={saving}>
              {saving ? "Saving…" : "Save note"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setDraft(stored);
                setEditing(false);
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
              style={{ color: MUTED }}
            >
              <RotateCcw className="h-3 w-3" /> Cancel
            </button>
            <span className="text-[10px]" style={{ color: tooLong ? "#B91C1C" : FAINT }}>
              {draft.length}/{MAX}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-md px-2.5 py-1 text-[11px]" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </p>
      )}

      {!capability.ok && (
        <p className="inline-flex items-start gap-1.5 text-[10px] leading-snug" style={{ color: FAINT }}>
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>{capability.reason}</span>
        </p>
      )}
    </div>
  );
}
