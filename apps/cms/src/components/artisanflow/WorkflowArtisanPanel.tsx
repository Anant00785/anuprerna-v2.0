"use client";

/**
 * WorkflowArtisanPanel — WHO is making this job, and HOW MUCH each of them is
 * doing. Rolled up to the WORKFLOW level, multi-artisan, editable.
 *
 * Amit, 2026-08-16: "If the artisan is assigned, it should be mentioned who the
 * artisan is, and it should be visible there... If the artisan is not assigned,
 * those assignments have to be there... We can add multiple artisans." He put
 * assignment at the WORKFLOW level explicitly, so this panel is the one roster
 * for the job — but "workflow level" describes where it is SHOWN, not where the
 * rows are stored.
 *
 * ── WHERE THE ARTISANS ACTUALLY ARE ────────────────────────────────────────
 * Reading `workflow.artisanAssignments` alone is the trap. That field is backed
 * by ONE mapping table (workflow_artisan_mapping, 664 rows, exactly one per
 * workflow) and is CAPPED AT 1 — measured over all 2,082 jobs, it is never 2.
 * Build against it and you ship a single-artisan UI for jobs that have six.
 *
 * The real multiplicity lives in two further mapping tables, exposed per node
 * by GET /get/{step,subprocess}-element/{id}/artisan-assignments:
 *   workflow_artisan_mapping            — job level
 *   step_element_artisan_mapping        — stage level
 *   subprocess_element_artisan_mapping  — task level
 *
 * Rolled up per workflow (measured 2026-08-16, after the step-detail resync):
 *   assignment count 0 -> 1,135 jobs · 1 -> 628 · 2 -> 150 · 3 -> 46
 *                    4 ->    89 jobs · 5 ->  32 · 6 ->   2
 *   319 jobs carry >= 2 assignments; 269 carry >= 2 DISTINCT artisans;
 *   the busiest job has 6 assignments across 5 distinct artisans.
 * So this panel takes all three sources and renders the DISTINCT roster.
 *
 * ── WHAT IS EDITABLE HERE, AND WHY NOT EVERYTHING ──────────────────────────
 * Job-level rows are edited here (PATCH /update/{custom-,}workflow with the
 * full artisanAssignments array — full-replace semantics; verified 2026-08-16
 * on sandbox job 1000000000190 that a TWO-artisan array round-trips intact).
 *
 * Stage- and task-level rows are written by DIFFERENT endpoints scoped to a
 * node (PATCH /update/{step,subprocess}-element/artisan-assignments), and they
 * are already editable in place on the matching pipeline card. Duplicating that
 * write here would give two controls the power to clobber each other's
 * full-replace array, so they are shown READ-ONLY with the node they belong to
 * named, which is what makes the roster complete without making it lossy.
 *
 * ── FRESHNESS ──────────────────────────────────────────────────────────────
 * These mapping tables are MIRRORS of live Loom and are not resynced with the
 * step detail. Stated in the UI rather than implied away — see ASSIGNMENT_SYNC.
 *
 * ── QUANTITY (Amit: "if I want, I can edit it") ────────────────────────────
 * The order-item quantity is the INHERITED default and stays visible with its
 * provenance; what is editable is the quantity committed to artisans, which is
 * the only quantity a workflow row can persist (the workflow has no quantity
 * column of its own; ArtisanAssignmentResponse carries quantityOfFabricInMeters
 * / quantityOfProducts). Divergence from the order line is SHOWN, never
 * silently tolerated — a second copy that can quietly disagree with the order
 * is the exact failure mode this panel is built to make impossible to miss.
 */

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, X, Plus, Lock, AlertTriangle, Package, Info } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { StatusPill } from "./StatusPill";
import type { AssignableArtisan } from "./ArtisanAssignmentPanel";
import type { WriteCapability } from "@/lib/workflow-ops";

/**
 * Last time each artisan mapping table was mirrored from live Loom, as reported
 * by the backend sync lane on 2026-08-16. The step DETAIL was resynced that day;
 * these mapping tables were NOT, so a name here can lag reality. Hard-coded on
 * purpose: there is no per-row sync timestamp on the read endpoints, and a
 * silently-absent freshness note is worse than one that has to be updated by
 * hand when the assignment resync lands.
 */
const ASSIGNMENT_SYNC = "17 Jul 2026 (job & stage) · 27 Jul 2026 (task)";

export interface WorkflowAssignmentRow {
  artisanId: number;
  quantityOfFabricInMeters?: number | null;
  quantityOfProducts?: number | null;
  basePayStatus?: string;
}

/** An assignment that lives on a STAGE or TASK node rather than on the job. */
export interface ElementAssignmentRow {
  artisanId: number;
  kind: "step" | "subprocess";
  elementName: string;
  quantityOfFabricInMeters?: number | null;
  quantityOfProducts?: number | null;
}

/** Which quantity key this job measures work in. Loom keeps the two mutually
 *  exclusive (applyWorkflowPlanningDetails nulls the loser), so we pick one and
 *  never write both. */
export type QuantityMode = "fabric" | "products";

export function WorkflowArtisanPanel({
  workflowId,
  kind,
  initialAssignments,
  elementAssignments,
  artisans,
  capability,
  quantityMode,
  orderQuantity,
}: {
  workflowId: number;
  kind: "order" | "custom-order";
  /** workflow_artisan_mapping — the JOB-level rows, editable here. */
  initialAssignments: WorkflowAssignmentRow[];
  /** step_element_ + subprocess_element_artisan_mapping, rolled up. Read-only
   *  here; edited on the pipeline card that owns the node. */
  elementAssignments: ElementAssignmentRow[];
  artisans: AssignableArtisan[];
  /** Whether PATCH /update/{custom-,}workflow can actually land for this job. */
  capability: WriteCapability;
  quantityMode: QuantityMode;
  /** The order line this job inherits from, for the default + divergence check. */
  orderQuantity: { quantity: number; unit?: string } | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<WorkflowAssignmentRow[]>(initialAssignments);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qtyKey = quantityMode === "fabric" ? "quantityOfFabricInMeters" : "quantityOfProducts";
  const unit = orderQuantity?.unit || (quantityMode === "fabric" ? "m" : "pcs");

  const nameFor = (id: number) => artisans.find((a) => a.id === id)?.name ?? `Artisan #${id}`;
  const qtyOf = (r: { quantityOfFabricInMeters?: number | null; quantityOfProducts?: number | null }): number =>
    Number(r[qtyKey] ?? 0) || 0;

  /**
   * The DISTINCT roster — the answer to "who is on this job?". One entry per
   * artisan, carrying every place they are assigned, so a weaver assigned both
   * at job level and on two tasks appears ONCE with three provenance chips
   * rather than three times.
   */
  const roster = useMemo(() => {
    const byArtisan = new Map<
      number,
      { artisanId: number; job: WorkflowAssignmentRow | null; elements: ElementAssignmentRow[] }
    >();
    const slot = (id: number) => {
      let e = byArtisan.get(id);
      if (!e) {
        e = { artisanId: id, job: null, elements: [] };
        byArtisan.set(id, e);
      }
      return e;
    };
    for (const r of rows) slot(r.artisanId).job = r;
    for (const e of elementAssignments) slot(e.artisanId).elements.push(e);
    return [...byArtisan.values()].sort((a, b) => nameFor(a.artisanId).localeCompare(nameFor(b.artisanId)));
    // nameFor depends on `artisans`, which is stable for a render of this page.
  }, [rows, elementAssignments, artisans]);

  const unassigned = artisans.filter((a) => !rows.some((r) => r.artisanId === a.id));

  // Quantity is only committed at JOB level here, so the total that can diverge
  // from the order line is the job-level total. Element quantities belong to
  // their node and are reported beside them.
  const totalAssigned = rows.reduce((t, r) => t + qtyOf(r), 0);
  const anyQty = rows.some((r) => qtyOf(r) > 0);
  const orderQty = orderQuantity?.quantity ?? null;
  const diverges = anyQty && orderQty != null && Math.abs(totalAssigned - orderQty) > 1e-9;

  const addArtisan = (id: number) => {
    if (!id || rows.some((r) => r.artisanId === id)) return;
    // The first artisan on an empty job inherits the whole order line — that is
    // what "defaults from the order item" means in practice. Later artisans
    // start at 0 so the operator splits the work explicitly instead of the
    // panel silently doubling the committed quantity.
    const seed = rows.length === 0 && orderQty != null ? orderQty : 0;
    setRows((cur) => [...cur, { artisanId: id, [qtyKey]: seed } as WorkflowAssignmentRow]);
  };
  const removeArtisan = (id: number) => setRows((cur) => cur.filter((r) => r.artisanId !== id));
  const setQty = (id: number, v: string) => {
    const n = v === "" ? 0 : Number(v);
    if (!Number.isFinite(n) || n < 0) return;
    setRows((cur) => cur.map((r) => (r.artisanId === id ? { ...r, [qtyKey]: n } : r)));
  };

  const doSave = async () => {
    setSaving(true);
    setError(null);
    const path = kind === "custom-order" ? "update/custom-workflow" : "update/workflow";
    // Send ONLY the assignment array (plus the id). A workflow PATCH merges
    // field-by-field on the backend, so omitting everything else is what keeps
    // this from touching the name, the dates or the stage tree.
    const artisanAssignments = rows.map((r) => ({
      artisanId: r.artisanId,
      [qtyKey]: qtyOf(r),
      ...(r.basePayStatus ? { basePayStatus: r.basePayStatus } : {}),
    }));
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method: "PATCH", body: { id: workflowId, artisanAssignments } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || `Save failed (${res.status})`);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const locked = !capability.ok;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
          <Users className="h-3.5 w-3.5" /> Artisan assignment ({roster.length})
        </p>
        {!locked &&
          (editing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-[11px] font-medium hover:underline"
                style={{ color: "#847D77" }}
                onClick={() => {
                  setRows(initialAssignments);
                  setEditing(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <Button variant="primary" size="sm" onClick={doSave} disabled={saving} loading={saving}>
                {saving ? "Saving…" : "Save assignment"}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="text-[11px] font-medium hover:underline"
              style={{ color: "#A86120" }}
              onClick={() => setEditing(true)}
            >
              {rows.length ? "Edit job-level assignment" : "Assign artisan"}
            </button>
          ))}
      </div>

      {/* Nobody at all — lead with the ACTION, not an empty state. */}
      {roster.length === 0 && !editing && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-3 py-3" style={{ borderColor: "#E8D9C4", background: "#FFFDF9" }}>
          <span className="text-sm" style={{ color: "#847D77" }}>
            No artisan is assigned to this job yet.
          </span>
          {!locked && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Plus className="h-3.5 w-3.5" /> Assign artisan
            </Button>
          )}
        </div>
      )}

      {roster.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {roster.map((entry) => {
            const name = nameFor(entry.artisanId);
            const jobRow = entry.job;
            return (
              <div
                key={entry.artisanId}
                className="flex flex-col gap-1.5 rounded-lg border px-3 py-2"
                style={{ borderColor: "#E8E4DE" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{ background: "#FEF3E2", color: "#A86120" }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </span>
                    {/* The NAME, which is the whole point of the card. */}
                    <span className="truncate text-sm font-medium" style={{ color: "#1A1714" }} title={name}>
                      {name}
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2 text-xs" style={{ color: "#635D58" }}>
                    {editing && jobRow ? (
                      <>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          aria-label={`Quantity for ${name}`}
                          value={String(qtyOf(jobRow))}
                          onChange={(e) => setQty(entry.artisanId, e.target.value)}
                          className="w-20 rounded border px-1.5 py-0.5 text-right text-xs outline-none"
                          style={{ borderColor: "#E8E4DE" }}
                        />
                        <span style={{ color: "#AAA39E" }}>{unit}</span>
                        <button type="button" onClick={() => removeArtisan(entry.artisanId)} aria-label={`Remove ${name}`}>
                          <X className="h-3.5 w-3.5" style={{ color: "#B91C1C" }} />
                        </button>
                      </>
                    ) : (
                      <>
                        {jobRow && qtyOf(jobRow) > 0 && (
                          <span>
                            {qtyOf(jobRow)} {unit}
                          </span>
                        )}
                        {jobRow?.basePayStatus && <StatusPill status={jobRow.basePayStatus} />}
                      </>
                    )}
                  </div>
                </div>

                {/* WHERE each assignment comes from. Job-level is editable
                    above; stage/task rows are edited on their pipeline card. */}
                <div className="flex flex-wrap items-center gap-1">
                  {jobRow && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "#FEF3E2", color: "#A86120" }}>
                      Job level
                    </span>
                  )}
                  {entry.elements.map((el, i) => (
                    <span
                      key={`${el.kind}-${el.elementName}-${i}`}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ background: "#F3F1ED", color: "#635D58" }}
                      title={`Assigned on the ${el.kind === "step" ? "stage" : "task"} "${el.elementName}". Edit it on that card in the pipeline below.`}
                    >
                      {el.kind === "step" ? "Stage" : "Task"}: {el.elementName}
                      {qtyOf(el) > 0 ? ` · ${qtyOf(el)} ${unit}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && unassigned.length > 0 && (
        <Select
          options={unassigned.map((a) => ({ value: a.id, label: a.name }))}
          placeholder="+ Add artisan…"
          value=""
          onChange={(e) => addArtisan(Number(e.target.value))}
        />
      )}
      {editing && unassigned.length === 0 && (
        <p className="text-xs" style={{ color: "#AAA39E" }}>
          Every artisan on record is already assigned at job level.
        </p>
      )}

      {/* QUANTITY — inherited from the order line, editable above, and the
          disagreement between the two is stated out loud. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-2 text-xs" style={{ borderColor: "#F0EDE8" }}>
        <span className="inline-flex items-center gap-1.5" style={{ color: "#847D77" }}>
          <Package className="h-3.5 w-3.5" />
          Order line:{" "}
          <strong style={{ color: "#1A1714" }}>{orderQty != null ? `${orderQty} ${unit}` : "not set"}</strong>
        </span>
        <span style={{ color: "#847D77" }}>
          Committed at job level:{" "}
          <strong style={{ color: diverges ? "#B45309" : "#1A1714" }}>
            {totalAssigned} {unit}
          </strong>
        </span>
        {diverges && (
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium"
            style={{ background: "#FFFBEB", color: "#92400E" }}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Overridden — differs from the order line by{" "}
            {Math.abs(Math.round((totalAssigned - orderQty!) * 1000) / 1000)} {unit}
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-md px-3 py-1.5 text-xs" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </p>
      )}

      {/* Freshness, stated rather than implied. */}
      {roster.length > 0 && (
        <p className="inline-flex items-start gap-1.5 text-[10px]" style={{ color: "#AAA39E" }}>
          <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>
            Assignments are mirrored from live Loom; last mirror sync {ASSIGNMENT_SYNC}. A name here can lag live.
          </span>
        </p>
      )}

      {/* A control that cannot persist must say so rather than look broken. */}
      {locked && (
        <p className="inline-flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-[11px]" style={{ background: "#F5F5F4", color: "#57534E" }}>
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>{capability.reason}</span>
        </p>
      )}
    </div>
  );
}
