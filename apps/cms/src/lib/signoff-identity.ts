/**
 * signoff-identity.ts — WHO a QC sign-off is recorded as.
 *
 * THE PROBLEM THIS SOLVES, in the words of the audit that found it: the sign-off
 * panel said "The approver's name is not stored" and the commit button read
 * "Complete — time stamped, name not stored". Driving the flow twice on two jobs
 * left `element.feedback = null` and ZERO rows in relational.element_feedback.
 * A QC checkpoint that cannot say who approved it is a compliance artifact with
 * the compliance removed.
 *
 * The backend can record it — anuprerna-backend 8b5cf83, verified present in the
 * RUNNING :8090 image (materialiseSandboxElement / mirrorFeedbackOntoNode /
 * guardPropertyCapture all compiled in). Two calls do it:
 *
 *   POST  /add/element/feedback?tenantId=<id>          { elementId, text }
 *   PATCH /update/element/feedback/admin?tenantId=<id> { id, status, remarks }
 *
 * ⚠ `tenantId` is a QUERY PARAMETER (`@Query('tenantId')`, workflow.controller.ts
 * :551), NOT a body field. Sent in the body it is ignored, the write answers HTTP
 * 200, and `relational.element_feedback.approved_by` stays NULL — a sign-off that
 * looks recorded and is not. /api/crud puts it on the query for exactly that
 * reason; this module only decides the VALUE.
 *
 * ── WHY THE TENANT IS CONFIGURATION AND THE NAME IS NOT ────────────────────
 *
 * `approved_by` is a bare Loom tenant id, and this sandbox CANNOT resolve a Weave
 * login to one. Measured 2026-08-17 against the sandbox copy: every operator row
 * in relational.loom_tenant stores an AES-ciphertext email (tenant 49113's is
 * "ombAPf3X1pUVc/7AjeDaJ/qcwBas4ys7BHozfAwLNcY="), the NVerse key is not in the
 * sandbox (see orders.mapper.ts and auth.service.ts, which refuses to issue by
 * email for this exact reason), and `user_name` is not a key — there are five
 * separate tenants named "Amit Singha". Guessing one from the login email would
 * be inventing a person, which is precisely the failure mode flagged elsewhere in
 * the same audit ("do not invent a person").
 *
 * So the two halves are resolved differently, each where it can be known:
 *
 *   • THE TENANT ID is CONFIGURATION. `WEAVE_SIGNOFF_TENANT_MAP` maps a login
 *     email to a Loom tenant when the operator knows it; `WEAVE_SIGNOFF_TENANT_ID`
 *     sets one for the whole install. The built-in default is 23483 — the tenant
 *     that actually performs QC sign-offs in this dataset (946 of the 1,318
 *     approvals in relational.element_feedback, user_name "Analyst Anuprerna")
 *     and the one anuprerna-backend's own workflow-node-capture suite signs off
 *     as. It is a DEFAULT, not a claim about whoever happens to be logged in,
 *     which is why the panel shows it and why the name below exists.
 *
 *   • THE NAME is the SESSION's, and it is stored IN THE RECORD (the `text`
 *     field, written server-side in /api/crud so a client cannot spoof it). That
 *     is the part that was missing and the part an operator actually reads back.
 *     Same guarantee and same limitation as workflow-comment attribution: this is
 *     who the SESSION says it is, stable and server-controlled for the life of a
 *     session, not a cryptographically attested identity — /api/auth/login writes
 *     the identity cookie from the typed email without a credential check,
 *     because the sandbox copy has no credential store.
 */
import { getIdentity } from "@/lib/feedback-identity";

/**
 * Loom tenant that QC sign-offs are recorded as when nothing more specific is
 * configured. See the header for the evidence behind this number; override it
 * with WEAVE_SIGNOFF_TENANT_ID rather than editing it here.
 */
export const DEFAULT_SIGNOFF_TENANT_ID = 23483;

function parseTenant(v: unknown): number | null {
  if (v == null) return null;
  const t = String(v).trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Per-email overrides, e.g. WEAVE_SIGNOFF_TENANT_MAP='{"amit@anuprerna.com":49113}'.
 *  A malformed value is IGNORED rather than throwing — a bad env var must not take
 *  the sign-off flow down, and the fallback below is always a valid tenant. */
function mappedTenant(email: string): number | null {
  const raw = process.env.WEAVE_SIGNOFF_TENANT_MAP;
  if (!raw || !email) return null;
  try {
    const map = JSON.parse(raw) as Record<string, unknown>;
    for (const [k, v] of Object.entries(map)) {
      if (k.toLowerCase() === email.toLowerCase()) return parseTenant(v);
    }
  } catch {
    /* malformed map — fall through to the install-wide value */
  }
  return null;
}

/** The tenant id a sign-off by this session is recorded under. */
export function signOffTenantId(email: string): number {
  return (
    mappedTenant(email) ??
    parseTenant(process.env.WEAVE_SIGNOFF_TENANT_ID) ??
    DEFAULT_SIGNOFF_TENANT_ID
  );
}

/** The human sentence written INTO the feedback record, so the row names its
 *  approver rather than only carrying a tenant number. */
export function signOffStamp(name: string, email: string): string {
  const who = name || email || "Team member";
  return email && email.toLowerCase() !== who.toLowerCase()
    ? `Signed off by ${who} (${email})`
    : `Signed off by ${who}`;
}

export interface SignOffActor {
  ok: true;
  tenantId: number;
  name: string;
  email: string;
  /** The server-composed "Signed off by …" sentence. */
  stamp: string;
}

/**
 * Resolve the acting signer from the session. Server-only (reads cookies).
 * Refuses when there is no session at all — an unauthenticated sign-off would be
 * an approval with no actor, which is the thing being fixed.
 */
export async function resolveSignOff(): Promise<SignOffActor | { ok: false; message: string }> {
  const me = await getIdentity();
  if (!me.authenticated) {
    return { ok: false, message: "Sign in to record a sign-off." };
  }
  const name = me.name || me.email || "Team member";
  return {
    ok: true,
    tenantId: signOffTenantId(me.email),
    name,
    email: me.email,
    stamp: signOffStamp(name, me.email),
  };
}
