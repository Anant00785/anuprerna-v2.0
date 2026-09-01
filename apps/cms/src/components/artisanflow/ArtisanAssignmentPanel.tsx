"use client";

/**
 * ArtisanAssignmentPanel — assign/reassign artisan(s) to a production STEP or
 * SUBPROCESS element. Wired to the native (2026-07 gap-fill) endpoints:
 *   PATCH /update/step-element/artisan-assignments        {id, workflowId, artisanAssignments:[{artisanId,...}]}
 *   PATCH /update/subprocess-element/artisan-assignments  {id, workflowId, artisanAssignments:[{artisanId,...}]}
 * via /api/crud. `workflowId` is REQUIRED here (not optional on the backend --
 * it disambiguates which workflow's step/subprocess node id to mutate; an
 * ambiguous id without it is refused by design, see workflow.mapper.ts
 * resolveWorkflowScope). Full-replace semantics: the array you save becomes the
 * new assignment set (dedupe by artisanId; anything omitted is unassigned) --
 * matches Loom's AbstractElementArtisanAssignmentDAOController.synchronizeAssignments.
 * Covers artisanflow-workflow's + artisanflow-production's
 * assign-artisan-step/subprocess-element contract items (same two endpoints,
 * used from the template-process view, the live execution view AND the Custom
 * Process detail page -- workflowId scoping is what makes it safe to reuse
 * across all three without cross-workflow collisions).
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, X } from "lucide-react";
import { Button, Select } from "@/components/ui";

export interface AssignableArtisan {
  id: number;
  name: string;
}

export interface AssignmentRow {
  artisanId: number;
  quantityOfFabricInMeters?: number | null;
  quantityOfProducts?: number | null;
}

export function ArtisanAssignmentPanel({
  kind, elementId, workflowId, elementName, initialAssignments, artisans, variant = "card",
}: {
  kind: "step" | "subprocess";
  elementId: number;
  /** The owning workflow instance's id -- always sent so the write is unambiguous. */
  workflowId: number;
  elementName: string;
  initialAssignments: AssignmentRow[];
  artisans: AssignableArtisan[];
  /** "card" = standalone bordered panel (own section). "inline" = compact strip
   *  rendered INSIDE a WorkflowBoard step/subprocess node, where the element name
   *  is already on screen -- the two sections are clubbed into one pipeline. */
  variant?: "card" | "inline";
}) {
  const router = useRouter();
  const [rows, setRows] = useState<AssignmentRow[]>(initialAssignments);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const nameFor = (id: number) => artisans.find((a) => a.id === id)?.name ?? `Artisan #${id}`;
  const unassigned = artisans.filter((a) => !rows.some((r) => r.artisanId === a.id));

  const addArtisan = (id: number) => {
    if (!id) return;
    setRows((cur) => [...cur, { artisanId: id }]);
  };
  const removeArtisan = (id: number) => setRows((cur) => cur.filter((r) => r.artisanId !== id));

  const doSave = async () => {
    setSaving(true);
    setError(null);
    const path = kind === "step" ? "update/step-element/artisan-assignments" : "update/subprocess-element/artisan-assignments";
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method: "PATCH", body: { id: elementId, workflowId, artisanAssignments: rows } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || "Save failed");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (variant === "inline") {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Users className="h-3 w-3 flex-shrink-0" style={{ color: "#AAA39E" }} />
          {rows.length === 0 && !editing ? (
            <button
              className="text-[11px] font-medium hover:underline"
              style={{ color: "#A86120" }}
              onClick={() => setEditing(true)}
            >
              Assign artisan
            </button>
          ) : (
            <>
              {rows.map((r) => (
                <span
                  key={r.artisanId}
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: "#FEF3E2", color: "#A86120" }}
                >
                  {nameFor(r.artisanId)}
                  {editing && (
                    <button onClick={() => removeArtisan(r.artisanId)} className="ml-0.5">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </span>
              ))}
              <button
                className="text-[10px] font-medium hover:underline"
                style={{ color: "#847D77" }}
                onClick={() => setEditing((e) => !e)}
              >
                {editing ? "Cancel" : "Edit"}
              </button>
            </>
          )}
        </div>

        {editing && (
          <div className="flex flex-col gap-1.5">
            {unassigned.length > 0 && (
              <Select
                options={unassigned.map((a) => ({ value: a.id, label: a.name }))}
                placeholder="+ Add artisan…"
                value=""
                onChange={(e) => addArtisan(Number(e.target.value))}
              />
            )}
            {error && <span className="text-[10px]" style={{ color: "#B91C1C" }}>{error}</span>}
            <Button variant="primary" size="sm" onClick={doSave} disabled={saving} loading={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: "#E8E4DE" }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#635D58" }}>
          <Users className="h-3.5 w-3.5" style={{ color: "#847D77" }} />
          {elementName}
        </div>
        <button
          className="text-[11px] font-medium hover:underline"
          style={{ color: "#A86120" }}
          onClick={() => setEditing((e) => !e)}
        >
          {editing ? "Cancel" : rows.length ? "Edit" : "Assign"}
        </button>
      </div>

      {rows.length === 0 && !editing && (
        <p className="text-xs" style={{ color: "#AAA39E" }}>No artisan assigned.</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {rows.map((r) => (
          <span
            key={r.artisanId}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: "#FEF3E2", color: "#A86120" }}
          >
            {nameFor(r.artisanId)}
            {editing && (
              <button onClick={() => removeArtisan(r.artisanId)} className="ml-0.5">
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {editing && (
        <div className="flex flex-col gap-2 pt-1">
          {unassigned.length > 0 && (
            <Select
              options={unassigned.map((a) => ({ value: a.id, label: a.name }))}
              placeholder="+ Add artisan…"
              value=""
              onChange={(e) => addArtisan(Number(e.target.value))}
            />
          )}
          <div className="flex items-center gap-2">
            {error && <span className="text-xs" style={{ color: "#B91C1C" }}>{error}</span>}
            <Button variant="primary" size="sm" onClick={doSave} disabled={saving} loading={saving}>
              {saving ? "Saving…" : "Save assignment"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
