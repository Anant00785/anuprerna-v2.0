"use client";

/**
 * WorkflowDeleteButton — client-side delete control for a workflow instance
 * detail page (standard `delete/workflow/{id}` or custom
 * `delete/custom-workflow/{id}`, both via /api/crud).
 *
 * WHEN IT IS OFFERED. Only while the job has NOT started, i.e. status is still
 * CREATED. CREATED is the PRE-start state: the backend's recomputeProcessStatus
 * flips CREATED -> INITIATED the moment the first step leaves PENDING, and this
 * codebase surfaces INITIATED to staff as "In progress" (see JobsClient
 * STATUS_TABS). An earlier revision of this header claimed the opposite
 * ("hasn't started yet (status === INITIATED)") and the caller rendered the
 * button for CREATED *and* INITIATED — which offered a hard delete on jobs with
 * live step / subprocess / artisan-assignment rows hanging off them. Both are
 * fixed; the backend independently enforces status === 'CREATED' too.
 *
 * SANDBOX FLOOR. Workflow instances synced from live Loom carry small ids (the
 * old .artisanflow-jobs.json fixture was full of them, e.g. 133048758). Only
 * sandbox-minted ids (> SANDBOX_FLOOR) may be destructively written. The native
 * backend refuses a sub-floor id in BOTH its service and its repository
 * (WorkflowService.guardSandboxWorkflow / WorkflowRepository.deleteWorkflowInstance);
 * this component refuses at the trigger with the same constant and the same
 * wording so the two layers agree and the user never gets offered a button that
 * is going to be refused.
 *
 * BACKEND AVAILABILITY. Verified against the sandbox wrapper on :8090 (2026-08-16):
 * DELETE delete/workflow/{id} and delete/custom-workflow/{id} currently return
 * HTTP 501 {"error":"not_implemented","message":"Wrapper is READ-ONLY. Write
 * methods are disabled."} — the routes are NOT deployed; they live only on
 * anuprerna-backend branch `workflow-modification`, unmerged. So this control is
 * behind a server-side flag (WORKFLOW_INSTANCE_DELETE_ENABLED, default OFF) at
 * its single render site; see workflow/instance/[id]/page.tsx. Turn the flag on
 * once that backend branch is merged and deployed. Whatever the backend answers
 * — refusal, 501, or an HTML error page — is surfaced verbatim rather than
 * collapsed into a generic "Delete failed".
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button, ConfirmDialog } from "@/components/ui";
import { isSandboxId, sandboxRefusal } from "@/lib/sandbox-floor";

/** Every shape /api/crud can hand back: a native write result, an error
 *  envelope (e.g. the read-only wrapper's 501), or neither. */
interface CrudResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export function WorkflowDeleteButton({
  workflowId,
  workflowName,
  kind,
}: {
  workflowId: number;
  workflowName: string;
  kind: "order" | "custom-order";
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const isCustom = kind === "custom-order";
  const path = isCustom ? `delete/custom-workflow/${workflowId}` : `delete/workflow/${workflowId}`;
  const backHref = "/artisanflow";

  // Live-synced job -> never open the dialog at all. Same constant and same
  // refusal wording the backend guard uses, so the two layers cannot disagree.
  const liveSynced = !isSandboxId(workflowId);
  const refusal = sandboxRefusal("delete", isCustom ? "custom workflow" : "workflow");

  const doDelete = async () => {
    if (liveSynced) {
      setError(refusal);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method: "DELETE" }),
      });
      // The backend can answer with a JSON refusal ({success:false,message}), a
      // JSON error envelope ({error,message} — e.g. the read-only wrapper's 501),
      // or, if something upstream dies, a non-JSON error page. Read the body as
      // TEXT first so the third case still shows the user what actually came
      // back instead of a generic failure.
      const raw = await res.text();
      let parsed: CrudResponse | null = null;
      try {
        parsed = raw ? (JSON.parse(raw) as CrudResponse) : null;
      } catch {
        parsed = null;
      }
      if (!res.ok || parsed?.success === false || parsed?.error) {
        const detail =
          parsed?.message ||
          parsed?.error ||
          (raw ? raw.slice(0, 200).trim() : "") ||
          `Delete failed (${res.status})`;
        throw new Error(detail);
      }
      setConfirm(false);
      setDeleted(true);
      setTimeout(() => {
        router.push(backHref);
        router.refresh();
      }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (liveSynced) {
    return (
      <Button variant="secondary" size="sm" disabled title={refusal}>
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </Button>
    );
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setConfirm(true)} disabled={deleted}>
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </Button>
      <ConfirmDialog
        open={confirm}
        title="Delete this job?"
        message={<>&ldquo;{workflowName}&rdquo; hasn&apos;t started yet — deleting it removes the job entirely. This cannot be undone.</>}
        confirmLabel="Delete"
        danger
        loading={deleting}
        error={error}
        onConfirm={doDelete}
        onCancel={() => { setConfirm(false); setError(null); }}
      />
      {deleted && (
        <div
          className="fixed bottom-6 right-6 z-[60] rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg"
          style={{ borderColor: "#A7F3D0", background: "#ECFDF5", color: "#047857" }}
        >
          Job deleted.
        </div>
      )}
    </>
  );
}
