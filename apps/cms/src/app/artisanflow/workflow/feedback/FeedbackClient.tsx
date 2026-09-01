"use client";

/**
 * FeedbackClient — the Job Feedback review queue: three status tabs, one
 * expandable row per feedback (FeedbackRow), a shared lightbox.
 *
 * WHAT CHANGED, 2026-08-17. This was a flat read-only list of cards. It is now
 * live's review surface: a row expands into the full record — user name, order,
 * SKU, step, sub process, Redirect to Workflow, description, images, videos,
 * remarks — with Reject / Approve / Approve & Notify underneath. See
 * FeedbackRow's header for what each button does and why Approve & Notify does
 * NOT notify here.
 *
 * WHY A RESOLVED ROW IS MOVED IN STATE RATHER THAN REFETCHED. The list comes
 * from GET /get/element-feedback/queue, which reads `public.element_feedback` —
 * a ONE-SHOT SNAPSHOT pulled from live Loom by sync/sync-element-feedback.ts and
 * never written again. The approve/reject write lands in
 * `relational.element_feedback` (element-write.repository.ts shreds into the
 * relational columns, "NEVER the public.* blob"), and NO read endpoint in the
 * backend serves that table. So a router.refresh() after a successful write
 * would re-read the pre-write snapshot and silently put the row back where it
 * was — showing the reviewer a verdict that did not stick, when in fact it did.
 * Moving the row from the write RESULT is the honest render of what the system
 * actually knows. Reconciling the two copies is a backend change (the queue
 * needs to read relational.element_feedback_full) and is flagged as such rather
 * than papered over here.
 */

import React, { useState } from "react";
import { formatCount } from "@/lib/utils";
import type { WorkflowFeedbackItem } from "@/lib/artisanflow-api";
import { FeedbackRow, type Verdict } from "./FeedbackRow";

type Status = "PENDING" | "APPROVED" | "REJECTED";
type Counts = { PENDING: number; APPROVED: number; REJECTED: number };

export function FeedbackClient({
  pending,
  approved,
  rejected,
  counts,
}: {
  pending: WorkflowFeedbackItem[];
  approved: WorkflowFeedbackItem[];
  rejected: WorkflowFeedbackItem[];
  /** Totals over the WHOLE table — the rows above may be a capped page. */
  counts: Counts;
}) {
  const [status, setStatus] = useState<Status>("PENDING");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [videoLightbox, setVideoLightbox] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // URLs that failed to load — render the graceful fallback, not a broken img.
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const markFailed = (url: string) => setFailed((prev) => (prev[url] ? prev : { ...prev, [url]: true }));

  const [rows, setRows] = useState<Record<Status, WorkflowFeedbackItem[]>>({
    PENDING: pending,
    APPROVED: approved,
    REJECTED: rejected,
  });
  const [tally, setTally] = useState<Counts>({
    PENDING: counts?.PENDING ?? pending.length,
    APPROVED: counts?.APPROVED ?? approved.length,
    REJECTED: counts?.REJECTED ?? rejected.length,
  });

  /** A verdict came back confirmed: move the row to its new tab and re-tally.
   *  The row carries the remarks that were actually written, so the read-back
   *  panel shows the stored text rather than an empty field. */
  function handleResolved(id: number, verdict: Verdict, remarks: string) {
    setRows((prev) => {
      const from = prev.PENDING;
      const row = from.find((r) => r.id === id);
      if (!row) return prev;
      const moved: WorkflowFeedbackItem = { ...row, status: verdict, remarks };
      return {
        ...prev,
        PENDING: from.filter((r) => r.id !== id),
        [verdict]: [moved, ...prev[verdict]],
      } as Record<Status, WorkflowFeedbackItem[]>;
    });
    setTally((prev) => ({ ...prev, PENDING: Math.max(0, prev.PENDING - 1), [verdict]: prev[verdict] + 1 }));
    setExpanded(null);
    setToast(verdict === "APPROVED" ? "Feedback approved." : "Feedback rejected.");
    window.setTimeout(() => setToast(null), 2600);
  }

  const list = rows[status];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
          Job Feedback
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
          Subprocess QC feedback submitted by artisans &amp; admins. Expand a row to review the photos and record a
          verdict.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b" style={{ borderColor: "#E8E4DE" }}>
        {(["PENDING", "APPROVED", "REJECTED"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setExpanded(null);
            }}
            className="relative px-3 pb-2.5 pt-1 text-sm font-medium transition-colors"
            style={{ color: status === s ? "#1A1714" : "#847D77" }}
          >
            <span className="flex items-center gap-1.5">
              {s.charAt(0) + s.slice(1).toLowerCase()}
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: "#F3F1ED", color: "#847D77" }}
              >
                {formatCount(tally[s])}
              </span>
            </span>
            {status === s && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: "#A86120" }} />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {list.map((f) => (
          <FeedbackRow
            key={f.id}
            item={f}
            expanded={expanded === f.id}
            onToggle={() => setExpanded((cur) => (cur === f.id ? null : f.id))}
            onResolved={handleResolved}
            onImage={setLightbox}
            onVideo={setVideoLightbox}
            failed={failed}
            onMediaFailed={markFailed}
          />
        ))}
        {list.length > 0 && tally[status] > list.length && (
          <p className="pt-1 text-center text-xs" style={{ color: "#AAA39E" }}>
            Showing the {formatCount(list.length)} most recent of {formatCount(tally[status])}.
          </p>
        )}
        {list.length === 0 && (
          <div
            className="rounded-xl border py-10 text-center text-sm"
            style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#AAA39E" }}
          >
            No {status.toLowerCase()} feedback.
          </div>
        )}
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[60] rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg"
          style={{ borderColor: "#A7F3D0", background: "#ECFDF5", color: "#047857" }}
        >
          {toast}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(20,17,14,0.72)" }}
          onClick={() => setLightbox(null)}
        >
          {failed[lightbox] ? (
            <div
              className="rounded-lg bg-white px-4 py-3 text-sm"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#847D77" }}
            >
              QC image could not be loaded.
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={lightbox}
              alt="QC full"
              className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={() => markFailed(lightbox)}
            />
          )}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 rounded-full px-3 py-1 text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.9)", color: "#1A1714" }}
          >
            Close ✕
          </button>
        </div>
      )}

      {videoLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(20,17,14,0.82)" }}
          onClick={() => setVideoLightbox(null)}
        >
          <video
            src={videoLightbox}
            controls
            autoPlay
            className="max-h-[88vh] max-w-[92vw] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setVideoLightbox(null)}
            className="absolute right-5 top-5 rounded-full px-3 py-1 text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.9)", color: "#1A1714" }}
          >
            Close ✕
          </button>
        </div>
      )}
    </div>
  );
}
