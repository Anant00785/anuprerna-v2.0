"use client";

/**
 * SignOffPanel — the approval checkpoint a `feedbackRequired` task has to pass
 * before it can be marked Done.
 *
 * Amit, 2026-08-17: "whatever is in that QC... completion needs a complete
 * sign-off." Before this, a QC task was advanced by the same one-click arrow
 * and the same drag as any other card — the flag the template carries had no
 * effect anywhere on the board.
 *
 * WHAT THIS ENFORCES (real, on every job):
 *   • A task flagged `feedbackRequired` is NOT draggable into Done and its
 *     inline "Mark done" is replaced by "Sign off" — the checkpoint is the only
 *     route to Done.
 *   • Signing off is an explicit, deliberate act: a verdict has to be chosen and
 *     the panel names who is signing (the session identity) and what is being
 *     signed for.
 *   • APPROVED completes the task. REJECTED does not — it leaves the task In
 *     progress, which is what a rejection means.
 *
 * WHAT IT SHOWS: the capture fields the template attached to this task (the
 * instruction, in live's own words — e.g. "Comments on the Quality", deferred,
 * on QC Fabric), and any evidence Loom has already synced onto the node —
 * photos, video, description, remarks, verdict, approver — through the SAME
 * FeedbackMedia component the Job Feedback queue uses.
 *
 * WHAT IT RECORDS, as of 2026-08-17. A real row in relational.element_feedback:
 * the VERDICT, the REMARKS typed here, the TIME, and the APPROVER — the acting
 * tenant in `approved_by` plus the signer's name written into the record's text
 * server-side. Until this date the panel said "The approver's name is not stored"
 * and the button read "Complete — time stamped, name not stored", because the
 * backend genuinely could not store it; anuprerna-backend 8b5cf83 closed all four
 * of those measured blockers 27 minutes after canRecordSignOff was written, and
 * this panel was left quoting the stale list. It now prints a refusal only in the
 * cases that still refuse — chiefly a live-mirrored job, where a sign-off is a
 * write the sandbox has no business making.
 *
 * The record is written BEFORE the status moves, so a failed sign-off leaves the
 * task in progress rather than completing it with no approver.
 */

import React, { useState } from "react";
import { ShieldCheck, Lock, MessageSquare, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import type { NodeProperty, SubProcessFeedback } from "@/lib/artisanflow-api";
import { formatEpoch } from "@/lib/utils";
import { hasPropertyValue, propertyValueText, type WriteCapability } from "@/lib/workflow-ops";
import { FeedbackMedia } from "./FeedbackMedia";
import { StatusPill } from "./StatusPill";

const INK = "#1A1714";
const MUTED = "#847D77";
const FAINT = "#AAA39E";
const PURPLE = "#6D28D9";

type Verdict = "APPROVED" | "REJECTED";

export function SignOffPanel({
  nodeName,
  properties,
  feedback,
  capability,
  signedBy,
  busy,
  onApprove,
  onReject,
  onClose,
}: {
  nodeName: string;
  /** The template's capture fields for this task — what a signer is meant to
   *  have recorded before approving. */
  properties?: NodeProperty[];
  /** Evidence Loom has already synced onto this node, if any. */
  feedback?: SubProcessFeedback;
  /** Whether an approval RECORD can be stored. See canRecordSignOff. */
  capability: WriteCapability;
  /** Who the session says is signing. Shown here and written into the record. */
  signedBy: string;
  busy: boolean;
  /** Record APPROVED and complete the task. Called only after a verdict of APPROVED. */
  onApprove: (remarks: string) => Promise<void>;
  /** Record REJECTED and move the task back to In progress. A rejection is not a
   *  completion, and the backend deliberately leaves approved_by null for it. */
  onReject: (remarks: string) => Promise<void>;
  onClose: () => void;
}) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const props = properties ?? [];
  const uncaptured = props.filter((p) => !hasPropertyValue(p));
  const blocking = uncaptured.filter((p) => (p.valuetype || "").toLowerCase() !== "deferred");

  async function submit() {
    if (!verdict) return;
    setError(null);
    try {
      if (verdict === "APPROVED") await onApprove(remarks);
      else await onReject(remarks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div
      className="mt-1 flex flex-col gap-2 rounded-lg border px-2.5 py-2"
      style={{ borderColor: "#DDD6FE", background: "#FAF8FF", minWidth: 0 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: PURPLE }}>
          <ShieldCheck className="h-3.5 w-3.5" /> Sign-off required
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-[10px] font-medium hover:underline"
          style={{ color: MUTED }}
        >
          <X className="h-3 w-3" /> Close
        </button>
      </div>

      <p className="text-[10px] leading-snug" style={{ color: MUTED }}>
        <strong style={{ color: INK }}>{nodeName}</strong> is a checkpoint the template marked as needing
        approval, so it does not flip to Done on its own. Signing off is what completes it.
      </p>

      {/* WHAT THE TEMPLATE ASKED TO BE RECORDED — the instruction, in the words
          live already carries on the node. */}
      {props.length > 0 && (
        <div className="rounded-md border px-2 py-1.5" style={{ borderColor: "#EDE9FE", background: "#FFFFFF" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
            What this checkpoint records
          </p>
          <ul className="mt-0.5 flex flex-col gap-0.5">
            {props.map((p, i) => {
              const v = propertyValueText(p);
              return (
                <li key={`${p.key}-${i}`} className="flex flex-wrap items-baseline gap-x-1.5 text-[10px] leading-snug">
                  <span style={{ color: MUTED }}>{p.key}:</span>
                  {v !== null ? (
                    <span className="font-semibold" style={{ color: INK }}>
                      {v}
                    </span>
                  ) : (
                    <span className="italic" style={{ color: FAINT }}>
                      not captured yet
                      {(p.valuetype || "").toLowerCase() === "deferred" ? " · deferred, does not block" : ""}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {blocking.length > 0 && (
            <p className="mt-1 inline-flex items-start gap-1 text-[10px] leading-snug" style={{ color: "#B45309" }}>
              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              <span>
                {blocking.length} required {blocking.length === 1 ? "field is" : "fields are"} still empty. Fill them in
                under <strong>Captured details</strong> above before approving.
              </span>
            </p>
          )}
        </div>
      )}

      {/* EVIDENCE ALREADY ON THE NODE — same shape and same renderer as the Job
          Feedback queue, never a second vocabulary. */}
      <div className="rounded-md border px-2 py-1.5" style={{ borderColor: "#EDE9FE", background: "#FFFFFF" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
          Evidence on this task
        </p>
        {feedback ? (
          <div className="mt-0.5 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill status={feedback.status} />
              {feedback.updatedAt ? (
                <span className="text-[10px]" style={{ color: MUTED }}>
                  {formatEpoch(feedback.updatedAt)}
                </span>
              ) : null}
              {feedback.uploader ? (
                <span className="text-[10px]" style={{ color: FAINT }}>
                  submitted by {feedback.uploader.toLowerCase()}
                </span>
              ) : null}
              {feedback.approvedBy != null ? (
                <span className="text-[10px]" style={{ color: "#047857" }}>
                  approved by tenant #{feedback.approvedBy}
                </span>
              ) : null}
            </div>
            {feedback.text ? (
              <p className="text-[10px] leading-snug" style={{ color: "#635D58" }}>
                {feedback.text}
              </p>
            ) : null}
            {feedback.remarks ? (
              <p className="inline-flex items-start gap-1 text-[10px] leading-snug" style={{ color: MUTED }}>
                <MessageSquare className="mt-0.5 h-3 w-3 flex-shrink-0" /> {feedback.remarks}
              </p>
            ) : null}
            <FeedbackMedia image={feedback.image} video={feedback.video} />
          </div>
        ) : (
          <p className="mt-0.5 text-[10px] italic" style={{ color: FAINT }}>
            Nothing has been submitted against this task yet.
          </p>
        )}
      </div>

      {/* THE VERDICT */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
          Your decision
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(["APPROVED", "REJECTED"] as Verdict[]).map((v) => {
            const on = verdict === v;
            const ok = v === "APPROVED";
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVerdict(v)}
                aria-pressed={on}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold"
                style={{
                  borderColor: on ? (ok ? "#BBF7D0" : "#FECACA") : "#E8E4DE",
                  background: on ? (ok ? "#F0FDF4" : "#FEF2F2") : "#FFFFFF",
                  color: on ? (ok ? "#047857" : "#B91C1C") : MUTED,
                }}
              >
                {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {ok ? "Approve — complete this task" : "Reject — send it back"}
              </button>
            );
          })}
        </div>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px]" style={{ color: MUTED }}>
            Remarks (optional) — stored on the record
          </span>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            aria-label={`Sign-off remarks for ${nodeName}`}
            className="w-full rounded-md border px-2 py-1 text-[11px]"
            style={{ borderColor: "#E8E4DE", color: INK, background: "#FFFFFF", minWidth: 0 }}
          />
        </label>
        <p className="text-[10px]" style={{ color: FAINT }}>
          {capability.ok ? (
            <>
              Signing as <strong style={{ color: MUTED }}>{signedBy}</strong>. The verdict, these remarks,
              the time and the approver are written to this task&rsquo;s record.
            </>
          ) : (
            <>
              Signing as <strong style={{ color: MUTED }}>{signedBy}</strong>.
            </>
          )}
        </p>
      </div>

      {/* THE HONEST LIMIT, when there still is one. Printed BEFORE the commit
          button, not after it. */}
      {!capability.ok && (
        <p
          className="inline-flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[10px] leading-snug"
          style={{ background: "#F5F5F4", color: "#57534E" }}
        >
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>
            <strong>The approval cannot be recorded on this job.</strong> {capability.reason}
          </span>
        </p>
      )}

      {error && (
        <p className="rounded-md px-2 py-1 text-[10px]" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={submit}
          disabled={!verdict || busy || !capability.ok}
          loading={busy}
        >
          {busy
            ? "Saving…"
            : verdict === "REJECTED"
              ? "Record rejection and send back"
              : "Record sign-off and complete"}
        </Button>
        {!verdict && (
          <span className="text-[10px]" style={{ color: FAINT }}>
            Choose approve or reject first.
          </span>
        )}
      </div>
    </div>
  );
}
