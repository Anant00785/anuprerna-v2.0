"use client";

/**
 * TemplateDeleteButton — client-side delete control for a workflow template
 * detail page. Wired to DELETE /delete/workflow-template/{id} via /api/crud
 * (native, sandbox pg only; Loom soft-deletes templates — sets deleted=true).
 *
 * SANDBOX FLOOR. Templates split cleanly in two: the ones Loom owns, which all
 * carry sub-floor ids and are all still referenced by live workflow rows, and
 * the ones this sandbox minted, which WorkflowRepository.nextTemplateSandboxId()
 * always allocates at >= 1e12. Only the second kind may be deleted. This is the
 * same rule and the same wording WorkflowDeleteButton applies to job instances,
 * and /api/crud re-checks it server-side — a disabled button is UX, not a
 * control. It replaces the WORKFLOW_TEMPLATE_DELETE_ENABLED opt-in flag that
 * used to gate this button: an env flag is a switch, not a floor.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button, ConfirmDialog } from "@/components/ui";
import { isSandboxId, sandboxRefusal } from "@/lib/sandbox-floor";

export function TemplateDeleteButton({ templateId, templateName }: { templateId: number; templateName: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loom-derived template -> never open the dialog at all. Same constant and
  // wording /api/crud refuses with, so the two layers cannot disagree.
  const liveSynced = !isSandboxId(templateId);
  const refusal = sandboxRefusal("delete", "workflow template");

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
        body: JSON.stringify({ path: `delete/workflow-template/${templateId}`, method: "DELETE" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || `Delete failed (${res.status})`);
      router.push("/artisanflow/workflow");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // LOOM-DERIVED TEMPLATE — the refusal is real, but it used to be delivered as
  // `disabled` + a `title` tooltip. That reads as a DEAD CONTROL: the 2026-08-16
  // audit clicked it, got a 30-second timeout (a disabled button never fires),
  // and logged it as "Delete does not respond — wire it or remove it". Nothing
  // was broken; the explanation was simply invisible unless you hovered, and a
  // tooltip is not reachable at all by touch or by keyboard-free clicking.
  //
  // So the button stays ENABLED and answers in the open. The floor itself has
  // not moved a millimetre — no fetch is issued on this path, and /api/crud
  // re-checks the same rule server-side regardless of what this component does.
  // "Each control acts, or explains its refusal" — this one now explains it.
  if (liveSynced) {
    return (
      <div className="relative">
        <Button
          variant="secondary"
          size="md"
          onClick={() => setError((e) => (e ? null : refusal))}
          aria-expanded={!!error}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
        {error && (
          <div
            className="absolute right-0 z-20 mt-2 w-72 rounded-lg border px-3 py-2 text-xs shadow-lg"
            style={{ background: "#FFFBEB", borderColor: "#FCD34D", color: "#78350F" }}
            role="status"
          >
            {refusal}
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-1.5 block font-semibold underline"
              style={{ color: "#92400E" }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Button variant="secondary" size="md" onClick={() => setConfirm(true)}>
        <Trash2 className="h-4 w-4" /> Delete
      </Button>
      <ConfirmDialog
        open={confirm}
        title="Delete job template?"
        message={<>&ldquo;{templateName}&rdquo; will be soft-deleted in the sandbox database (marked deleted, matching live Loom&apos;s behavior since templates are referenced by past workflows).</>}
        confirmLabel="Delete"
        danger
        loading={deleting}
        error={error}
        onConfirm={doDelete}
        onCancel={() => { setConfirm(false); setError(null); }}
      />
    </>
  );
}
