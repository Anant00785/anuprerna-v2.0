/**
 * sandbox-token.ts — server-only accessor for the wrapper admin token.
 *
 * The NestJS wrapper (:8090) gates its admin/native endpoints behind
 * Authorization: Bearer <SANDBOX_ADMIN_TOKEN> (see backend auth.matrix.ts).
 * Weave holds this shared secret server-side and attaches it ONLY when calling
 * those gated native endpoints from route handlers / server components.
 *
 * User-facing auth (who may reach a Weave page/route) is enforced SEPARATELY by
 * middleware.ts via the session cookie. This token is the SERVICE credential
 * for the Weave -> wrapper hop; it is NEVER exposed to the browser (no
 * NEXT_PUBLIC_ prefix).
 *
 * SEAM: when the wrapper verifies real Loom-JWT roles, gated native calls will
 * forward the caller role-bearing token instead of this shared secret.
 */
export function getSandboxToken(): string | undefined {
  return process.env.SANDBOX_ADMIN_TOKEN || undefined;
}
