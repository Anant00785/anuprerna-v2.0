/**
 * order-artisan-roster — WHO is making each line of an order.
 *
 * Amit, 2026-08-17, on the custom-order detail table: the ARTISAN column
 * printed the literal word "Assigned" on every row. He wants the NAMES.
 *
 * ── WHY THIS IS NOT A ONE-LINE LOOKUP ──────────────────────────────────────
 * Two separate indirections have to be crossed, and each one is a place the
 * obvious implementation silently loses artisans:
 *
 * 1. THE NAME IS NOT ON THE ARTISAN. `relational.artisan` has no name column
 *    at all; the name lives on the artisan's TENANT (`artisan.tenant.name`).
 *    Measured 2026-08-17: /get/artisans returns 75 artisans, 75 with a real
 *    name — e.g. 104123646 "Akshoy Kumar Dey", 51657368 "Ananda Singha".
 *
 * 2. ASSIGNMENTS LIVE AT THREE LEVELS, not one — job, stage and task:
 *      workflow_artisan_mapping            (job)   — capped at 1 per workflow
 *      step_element_artisan_mapping        (stage)
 *      subprocess_element_artisan_mapping  (task)
 *    Reading only the job-level table is the trap WorkflowArtisanPanel's header
 *    documents at length: it is capped at ONE row per workflow, so a job with
 *    six artisans renders as one. Measured 2026-08-17: 76 workflows carry
 *    element-level assignments and NO job-level row at all — those would show
 *    as unassigned entirely. For order 132440539 specifically: 22 job-level and
 *    19 task-level assignments across its 24 workflows.
 *
 * ── THE JOIN, AND WHY IT IS FREE ───────────────────────────────────────────
 * The element tables key on `stepElementId` / `subProcessElementId`, not on
 * workflowId — so they cannot be filtered to an order server-side. But the
 * order's OWN workflow summaries (already fetched by the detail page for the
 * production table) carry `steps[].stepElementId` and
 * `steps[].subProcesses[].subProcessId`, and those ARE those element ids.
 * Verified 2026-08-17 against SQL: joining this way reproduces the 22 job-level
 * and 19 task-level counts exactly. So the workflow->node->artisan join costs
 * no extra upstream request.
 *
 * This module is PURE: fetching belongs to the page, so the rollup stays
 * server-renderable and unit-checkable.
 */

import type {
  Artisan,
  OrderWorkflowSummary,
  WorkflowArtisanMappingRow,
  StepElementArtisanMappingRow,
  SubProcessElementArtisanMappingRow,
} from "@/lib/artisanflow-api";

/** Where an assignment was recorded. Kept because it is what makes a roster
 *  auditable — "who" is only half the answer if nobody can find the row. */
export type AssignmentLevel = "job" | "stage" | "task";

export interface RosterArtisan {
  artisanId: number;
  /** Resolved tenant name, or null when no artisan record matched. A null here
   *  is a genuine data gap and MUST render differently from a resolved name. */
  name: string | null;
  levels: AssignmentLevel[];
  /** Stage/task node names this artisan is assigned on, for the tooltip. */
  where: string[];
}

const LEVEL_ORDER: Record<AssignmentLevel, number> = { job: 0, stage: 1, task: 2 };

/**
 * Build workflowId -> distinct artisan roster.
 *
 * DISTINCT BY ARTISAN, not by assignment row: the same person assigned to four
 * tasks of one job is one name on the line, not the same name four times.
 */
export function buildOrderArtisanRoster({
  workflows,
  artisans,
  workflowMappings,
  stepMappings,
  subProcessMappings,
}: {
  workflows: OrderWorkflowSummary[];
  artisans: Artisan[];
  workflowMappings: WorkflowArtisanMappingRow[];
  stepMappings: StepElementArtisanMappingRow[];
  subProcessMappings: SubProcessElementArtisanMappingRow[];
}): Map<number, RosterArtisan[]> {
  // artisanId -> name. Blank/whitespace tenant names collapse to null so they
  // take the honest "unnamed" path instead of rendering as an empty cell.
  const nameById = new Map<number, string | null>();
  for (const a of artisans) {
    const n = (a.tenant?.name || "").trim();
    nameById.set(a.id, n.length > 0 ? n : null);
  }

  // Index the two element tables ONCE by their element id. Without this the
  // lookup below is O(nodes x mappings) — ~137 nodes x 716 rows for a single
  // order — for no reason.
  const byStepElement = new Map<number, StepElementArtisanMappingRow[]>();
  for (const m of stepMappings) {
    const k = m.stepElementId;
    if (k == null) continue;
    (byStepElement.get(k) ?? byStepElement.set(k, []).get(k)!).push(m);
  }
  const bySubProcessElement = new Map<number, SubProcessElementArtisanMappingRow[]>();
  for (const m of subProcessMappings) {
    const k = m.subProcessElementId;
    if (k == null) continue;
    (bySubProcessElement.get(k) ?? bySubProcessElement.set(k, []).get(k)!).push(m);
  }
  const byWorkflow = new Map<number, WorkflowArtisanMappingRow[]>();
  for (const m of workflowMappings) {
    const k = m.workflowId;
    if (k == null) continue;
    (byWorkflow.get(k) ?? byWorkflow.set(k, []).get(k)!).push(m);
  }

  const out = new Map<number, RosterArtisan[]>();

  for (const wf of workflows) {
    if (wf.workflowId == null) continue;
    const acc = new Map<number, RosterArtisan>();

    const add = (artisanId: number, level: AssignmentLevel, where?: string) => {
      if (artisanId == null) return;
      let e = acc.get(artisanId);
      if (!e) {
        e = { artisanId, name: nameById.get(artisanId) ?? null, levels: [], where: [] };
        acc.set(artisanId, e);
      }
      if (!e.levels.includes(level)) e.levels.push(level);
      const w = (where || "").trim();
      if (w && !e.where.includes(w)) e.where.push(w);
    };

    for (const m of byWorkflow.get(wf.workflowId) ?? []) add(m.artisanId, "job");

    for (const s of wf.steps ?? []) {
      const stepEl = s.stepElementId != null ? Number(s.stepElementId) : null;
      if (stepEl != null) {
        for (const m of byStepElement.get(stepEl) ?? []) {
          add(m.artisanId, "stage", s.stepName || "Untitled stage");
        }
      }
      for (const sp of s.subProcesses ?? []) {
        const spEl = sp.subProcessId != null ? Number(sp.subProcessId) : null;
        if (spEl == null) continue;
        for (const m of bySubProcessElement.get(spEl) ?? []) {
          add(m.artisanId, "task", sp.subProcessName || "Untitled task");
        }
      }
    }

    // Named artisans first (a resolved name is the useful thing to show in the
    // two visible slots), then job-level before stage before task, then by name
    // so the order is stable across renders.
    const roster = Array.from(acc.values()).sort((a, b) => {
      if ((a.name == null) !== (b.name == null)) return a.name == null ? 1 : -1;
      const la = Math.min(...a.levels.map((l) => LEVEL_ORDER[l]));
      const lb = Math.min(...b.levels.map((l) => LEVEL_ORDER[l]));
      if (la !== lb) return la - lb;
      return (a.name || "").localeCompare(b.name || "");
    });

    if (roster.length > 0) out.set(wf.workflowId, roster);
  }

  return out;
}

/** Human label for an assignment level, for the tooltip/expanded list. */
export function levelLabel(l: AssignmentLevel): string {
  return l === "job" ? "job" : l === "stage" ? "stage" : "task";
}
