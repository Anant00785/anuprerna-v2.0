"use client";

/**
 * FeedbackRow — one QC feedback in the Job Feedback queue, collapsed to a line
 * and expanded to live's review panel.
 *
 * PORTED FROM live-weave-ref manage-workflow-feedback/workflow-feedback-list.
 * The INFORMATION ARCHITECTURE is live's, the styling is this app's: live shows
 * User Name / Order # / Order Date / Est. Delivery (From,To) / SKU / Step / Sub
 * Process as table columns, then expands ONE row into Redirect-to-Workflow,
 * Description, Images, Videos, a remarks textarea and three buttons — Reject,
 * Approve, Approve & Notify. Same panel, same order, in parchment instead of
 * Material blue.
 *
 * TWO OF LIVE'S COLUMNS ARE NOT RENDERED, and that is a data fact rather than an
 * omission: Order Date and Est. Delivery (From/To) are not in the native queue
 * payload at all (workflow.mapper.ts elementFeedbackQueueRow emits neither), and
 * recovering them would cost one order read per row. They are listed as a
 * follow-up rather than faked from the feedback's own updatedAt.
 *
 * THE THREE BUTTONS, and exactly what each one does here:
 *
 *   Reject / Approve   PATCH update/element/feedback/admin { id, status, remarks }
 *                      through /api/crud, which attaches ?tenantId= and the
 *                      signer's identity server-side (signoff-identity.ts). This
 *                      is the same single endpoint live uses for all three
 *                      buttons — live has no separate notify route.
 *
 *   Approve & Notify   INERT ON THE NOTIFY HALF, deliberately. In live, the only
 *                      difference is that the component sets `notifyUser = true`
 *                      on the SAME payload (workflow-feedback-list.component.ts
 *                      onApproveAndNotify) and Loom fires an off-thread
 *                      notification after commit. MEASURED what that
 *                      notification is: relational.whatsapp_notification_history
 *                      holds 80 sends of template `bts_production_update_1`,
 *                      every one to tenant_type CUSTOMER, on the customer's own
 *                      mobile number, with metadata {stepName, subProcessName,
 *                      artisanName, userName, feedbackDescription,
 *                      isCustomOrder} — i.e. a real WhatsApp to a real buyer
 *                      about their order. A sandbox must not send that, so this
 *                      button performs the APPROVE and does NOT put `notifyUser`
 *                      in the payload at all. Belt and braces: the sandbox
 *                      backend drops the notification side effects anyway
 *                      (element-write.service.ts says so), so suppression does
 *                      not depend on either layer alone. The button carries a
 *                      visible label saying the message is suppressed — an inert
 *                      control that does not admit it is inert is worse than no
 *                      control.
 *
 * THE BAND. Actions are offered ONLY on a sandbox-minted feedback row. Every one
 * of the 2,728 rows currently in this queue was synced from live Loom and is
 * sub-floor, so on today's data every row renders read-only with the reason
 * printed next to it. That is the point rather than a defect: /api/crud refuses
 * the write server-side (WRITE_REGISTRY "update/element/feedback/admin"), and a
 * button that is going to be refused must never be offered — the same rule
 * WorkflowDeleteButton and the custom-order detail page already follow.
 */

import React, { useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import { Button, Textarea } from "@/components/ui";
import { formatEpoch } from "@/lib/utils";
import { isSandboxId, sandboxRefusal } from "@/lib/sandbox-floor";
import { normalizeFeedbackMediaList } from "@/lib/feedback-media";
import type { WorkflowFeedbackItem } from "@/lib/artisanflow-api";
import { feedbackUserName } from "./user-name";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImageOff,
  Lock,
  MessageSquare,
  Video,
} from "lucide-react";

/** Every shape /api/crud can hand back: a native write result, an error envelope
 *  (the read-only wrapper's 501), or neither. Same handling as
 *  WorkflowDeleteButton — read the body as TEXT first so a non-JSON error page
 *  still reaches the user instead of a generic "failed". */
interface CrudResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export type Verdict = "APPROVED" | "REJECTED";

/** Muted chip shown when a QC image will not load, so a dead thumbnail still
 *  offers the raw link instead of a broken-image glyph. */
function UnavailableChip({ url }: { url: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px]"
      style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#847D77" }}
      title="QC image could not be loaded"
    >
      <ImageOff className="h-3 w-3" />
      QC image unavailable
      <a href={url} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "#1D4ED8" }}>
        link
      </a>
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#AAA39E" }}>
        {label}
      </p>
      <p className="truncate text-xs" style={{ color: "#1A1714" }}>
        {value}
      </p>
    </div>
  );
}

export function FeedbackRow({
  item,
  expanded,
  onToggle,
  onResolved,
  onImage,
  onVideo,
  failed,
  onMediaFailed,
}: {
  item: WorkflowFeedbackItem;
  expanded: boolean;
  onToggle: () => void;
  /** Called after the backend confirms the write, with the row's new state. */
  onResolved: (id: number, verdict: Verdict, remarks: string) => void;
  onImage: (url: string) => void;
  onVideo: (url: string) => void;
  failed: Record<string, boolean>;
  onMediaFailed: (url: string) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState<Verdict | "NOTIFY" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imgs = normalizeFeedbackMediaList(item.feedbackImage);
  const videos = normalizeFeedbackMediaList(item.feedbackVideo);
  const userName = feedbackUserName(item);

  // Live-synced feedback -> never offer the write. Same constant and the same
  // wording /api/crud refuses with, so the two layers cannot disagree.
  const writable = isSandboxId(item.id);
  const refusal = sandboxRefusal("update", "feedback");
  const pending = item.status === "PENDING";

  const jobHref = `/artisanflow/workflow/instance/${item.workflowId}`;

  async function submit(verdict: Verdict, key: Verdict | "NOTIFY") {
    if (!writable) {
      setError(refusal);
      return;
    }
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "update/element/feedback/admin",
          method: "PATCH",
          // NO notifyUser, on any of the three buttons. See the header: that flag
          // is the whole difference between Approve and Approve & Notify in live,
          // and it is what sends a real customer a real WhatsApp.
          body: { id: item.id, status: verdict, remarks: remarks.trim() },
        }),
      });
      const raw = await res.text();
      let parsed: CrudResponse | null = null;
      try {
        parsed = raw ? (JSON.parse(raw) as CrudResponse) : null;
      } catch {
        parsed = null;
      }
      if (!res.ok || parsed?.success === false || parsed?.error) {
        throw new Error(
          parsed?.message || parsed?.error || (raw ? raw.slice(0, 200).trim() : "") || `Write failed (${res.status})`,
        );
      }
      onResolved(item.id, verdict, remarks.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Write failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border bg-white" style={{ borderColor: expanded ? "#D9CFC2" : "#E8E4DE" }}>
      {/* ── Collapsed line: live's table columns, compressed ──────────────── */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#6D28D9" }} />
            <p className="truncate text-sm font-medium" style={{ color: "#1A1714" }}>
              {item.stepName || "Step"}
              {item.subProcessName ? ` · ${item.subProcessName}` : ""}
            </p>
            <StatusPill status={item.status} />
          </div>
          <p className="mt-1 truncate text-xs" style={{ color: "#847D77" }}>
            {userName || "—"}
            {item.orderId ? ` · Order #${item.orderId}` : ""}
            {item.productSku ? ` · ${item.productSku}` : ""}
            {imgs.length > 0 ? ` · ${imgs.length} image${imgs.length > 1 ? "s" : ""}` : ""}
            {videos.length > 0 ? ` · ${videos.length} video${videos.length > 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 pt-0.5 text-xs" style={{ color: "#847D77" }}>
          <span>{formatEpoch(item.updatedAt)}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* ── Expanded review panel ─────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "#E8E4DE" }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="User name" value={userName || "—"} />
              <Field label="Order #" value={item.orderId || "—"} />
              <Field label="SKU" value={item.productSku || "—"} />
              <Field label="Step" value={item.stepName || "—"} />
              <Field label="Sub process" value={item.subProcessName || "—"} />
              <Field
                label="Job"
                value={item.workflowType === "custom" ? "Custom workflow" : item.workflowType === "order" ? "Order workflow" : "—"}
              />
              <Field label="Updated" value={formatEpoch(item.updatedAt)} />
              <Field label="Feedback id" value={item.id} />
            </div>
            {/* live's "Redirect to Workflow". A styled Link, not a <Button> inside
                an <a> — interactive content may not nest. */}
            {item.workflowId ? (
              <Link
                href={jobHref}
                className="inline-flex h-7 flex-shrink-0 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-xs font-medium transition-colors hover:bg-stone-50"
                style={{ borderColor: "#E8E4DE", color: "#57534E" }}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Redirect to workflow
              </Link>
            ) : null}
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#AAA39E" }}>
              Description
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "#635D58" }}>
              {item.feedbackDescription || "N/A"}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#AAA39E" }}>
              Images
            </p>
            {imgs.length === 0 ? (
              <p className="mt-1 text-xs" style={{ color: "#847D77" }}>
                N/A
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {imgs.map((img, i) =>
                  failed[img] ? (
                    <UnavailableChip key={img} url={img} />
                  ) : (
                    <button
                      key={img}
                      type="button"
                      onClick={() => onImage(img)}
                      className="h-20 w-20 overflow-hidden rounded-lg border transition-transform hover:scale-[1.03]"
                      style={{ borderColor: "#E8E4DE" }}
                      title={`View QC image ${i + 1} of ${imgs.length}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`QC ${i + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={() => onMediaFailed(img)}
                      />
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#AAA39E" }}>
              Videos
            </p>
            {videos.length === 0 ? (
              <p className="mt-1 text-xs" style={{ color: "#847D77" }}>
                N/A
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {videos.map((video, i) => (
                  <button
                    key={video}
                    type="button"
                    onClick={() => onVideo(video)}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors hover:bg-stone-50"
                    style={{ borderColor: "#E8E4DE", color: "#1D4ED8" }}
                  >
                    <Video className="h-3 w-3" /> Play video{videos.length > 1 ? ` ${i + 1}` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Remarks: editable while the verdict is still open, read-back once it
              is not — live makes the same split on `status == 'PENDING'`. */}
          <div className="mt-4">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#AAA39E" }}>
              Remarks
            </p>
            {pending && writable ? (
              <Textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter your remarks (optional)"
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-xs" style={{ color: "#635D58" }}>
                {item.remarks || "—"}
              </p>
            )}
          </div>

          {pending && (
            <div className="mt-4 flex flex-col gap-2">
              {!writable && (
                <div
                  className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
                  style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#847D77" }}
                >
                  <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {refusal}. This record was synced from live Loom, so a verdict recorded here would be a sandbox
                    edit to production data. Approving it for real belongs in live Weave.
                  </span>
                </div>
              )}
              {error && (
                <div
                  className="rounded-lg border px-3 py-2 text-xs"
                  style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}
                >
                  {error}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="mr-auto text-[11px]" style={{ color: "#AAA39E" }}>
                  Approve &amp; Notify sends the customer a WhatsApp in live — suppressed here.
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!writable || busy !== null}
                  title={writable ? undefined : refusal}
                  onClick={() => submit("REJECTED", "REJECTED")}
                >
                  {busy === "REJECTED" ? "Rejecting…" : "Reject"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!writable || busy !== null}
                  title={writable ? undefined : refusal}
                  onClick={() => submit("APPROVED", "APPROVED")}
                >
                  {busy === "APPROVED" ? "Approving…" : "Approve"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!writable || busy !== null}
                  title={
                    writable
                      ? "Approves the feedback. The customer WhatsApp live would send is suppressed in the sandbox."
                      : refusal
                  }
                  onClick={() => submit("APPROVED", "NOTIFY")}
                >
                  {busy === "NOTIFY" ? "Approving…" : "Approve & Notify"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
