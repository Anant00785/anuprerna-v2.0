/**
 * sandbox-floor.ts — the id band that separates SANDBOX-CREATED rows from
 * LIVE-SYNCED (Loom-derived) rows, mirrored from the native backend.
 *
 * The sandbox Postgres is reloaded from Loom, so every table holds two kinds of
 * row: ones Loom owns (real ids, small — e.g. workflow instance 133048758, which
 * is what the old .artisanflow-jobs.json fixture was full of) and ones the
 * sandbox minted itself, which are always allocated ABOVE the floor (id >= 1e12
 * == SANDBOX_FLOOR + 1). Destructive writes are only ever safe on the second
 * kind; hard-deleting a live-synced row destroys data the sandbox cannot
 * recreate and that a resync will not necessarily restore in place.
 *
 * These values are a DELIBERATE MIRROR of anuprerna-backend
 * src/workflow/workflow.service.ts (SANDBOX_FLOOR / guardSandboxWorkflow) and
 * src/orders/orders.service.ts (SANDBOX_FLOOR / guardSandboxOrder). The backend
 * is the enforcing layer and refuses a sub-floor id on its own; this copy exists
 * so the UI never OFFERS an action the backend is going to refuse, and so the
 * refusal the user reads is worded identically wherever it is produced. If the
 * backend constant ever moves, move this one in the same change.
 */

/** Ids <= this are LIVE-SYNCED. Sandbox-minted ids start at SANDBOX_FLOOR + 1. */
export const SANDBOX_FLOOR = 999_999_999_999;

/** True only for ids the sandbox minted itself, i.e. safe to destructively write. */
export function isSandboxId(id: number): boolean {
  return Number.isFinite(id) && id > SANDBOX_FLOOR;
}

/**
 * The backend's refusal wording, reproduced verbatim so a client-side pre-check
 * and a server-side refusal are indistinguishable to the user.
 * See WorkflowService.guardSandboxWorkflow.
 */
export function sandboxRefusal(verb: string, entity = 'workflow'): string {
  return `sandbox-only write: refusing to ${verb} a live-synced ${entity}`;
}
