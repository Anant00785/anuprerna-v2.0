"use client";

/**
 * DiscussionPanel — threaded comments for a job (workflow instance), rendered
 * as a collapsible right-side drawer (mirrors PageFeedbackWidget's slide-over
 * pattern) so it never squeezes the production-pipeline board. Backed by
 * relational.workflow_comment (native-only, no Loom counterpart) via
 * POST /api/crud add/workflow-comment + GET /get/workflow/{id}/comments.
 * Shared by both ORDER and CUSTOM_ORDER job detail pages (one workflowId space).
 *
 * ATTRIBUTION IS SERVER-DERIVED. This panel deliberately does NOT send an
 * authorName: /api/crud resolves the author from the session (getIdentity) and
 * overwrites whatever the body carried. Sending it from here made the byline a
 * client-supplied string, so any caller that could reach /api/crud could post a
 * comment attributed to anyone. `currentUserName` is still passed in, but it is
 * now DISPLAY-ONLY — used to render the optimistic row before the refresh, and
 * replaced by the server's value when the write echoes one back.
 */

import React, { useState } from "react";
import { MessageSquare, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { formatEpoch } from "@/lib/utils";
import type { WorkflowComment } from "@/lib/artisanflow-api";

function initialsOf(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || name[0]!.toUpperCase();
}

export function DiscussionPanel({
  workflowId,
  initialComments,
  currentUserName,
}: {
  workflowId: number;
  initialComments: WorkflowComment[];
  currentUserName: string;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<WorkflowComment[]>(initialComments);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "add/workflow-comment",
          method: "POST",
          // No authorName — the server derives it from the session. See header.
          body: { workflowId, text: trimmed },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || "Could not post comment");
      setComments((prev) => [
        ...prev,
        {
          id: j.id ?? -Date.now(),
          workflowId,
          text: trimmed,
          // Server-derived when the write echoes it back; the prop is only a
          // display fallback for the optimistic row.
          authorName: (typeof j.authorName === "string" && j.authorName) || currentUserName,
          authorTenantId: null,
          createdAt: Date.now(),
        },
      ]);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post comment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Trigger — icon + count badge, placed inline in the page header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Discussion"
        className="relative inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-white"
        style={{ borderColor: "#E8E4DE", color: "#635D58", background: "#FAF9F7" }}
      >
        <MessageSquare className="h-4 w-4" />
        {comments.length > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white"
            style={{ background: "#A86120" }}
          >
            {comments.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
            style={{ borderLeft: "1px solid #E8E4DE" }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#E8E4DE" }}>
              <h2 className="flex items-center gap-1.5 font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
                <MessageSquare className="h-4 w-4" /> Discussion {comments.length > 0 ? `(${comments.length})` : ""}
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-2 hover:bg-stone-100" style={{ color: "#847D77" }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
              {comments.length === 0 && (
                <p className="text-xs" style={{ color: "#AAA39E" }}>No discussion yet — leave the first note.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{ background: "#FEF3E2", color: "#A86120" }}
                  >
                    {initialsOf(c.authorName)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold" style={{ color: "#1A1714" }}>{c.authorName || "Someone"}</span>
                      <span className="text-[10px]" style={{ color: "#AAA39E" }}>{formatEpoch(c.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs" style={{ color: "#4A4640" }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t px-5 py-4" style={{ borderColor: "#E8E4DE" }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a note for this job…"
                rows={3}
                className="form-input resize-none text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); post(); }
                }}
              />
              <div className="flex items-center justify-between gap-2">
                {error && <span className="text-[10px]" style={{ color: "#B91C1C" }}>{error}</span>}
                <div className="ml-auto">
                  <Button variant="primary" size="sm" onClick={post} disabled={busy || !text.trim()}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
