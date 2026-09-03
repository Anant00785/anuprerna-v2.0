/**
 * backend-call-token.ts — which credential the CMS sends on the CMS->backend hop.
 *
 * Server-only. Do NOT import from a client component.
 *
 * These eight route handlers used to write:
 *
 *     const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());
 *
 * i.e. the caller's `weave_token` cookie took precedence and the service token
 * was only a fallback. That inverted the correct order once the backend became
 * the v2 NestJS API (apps/api):
 *
 *   - `weave_token` holds a **Loom-signed** JWT. The v2 API verifies HS256
 *     against its own AUTH_JWT_SECRET (common/auth/roles.guard.ts ->
 *     GatekeeperService.verifyToken) and has no Loom key, so it rejects that
 *     cookie outright with `{"message":"Invalid token signature."}` / 401.
 *   - Because the cookie is present-but-unusable, `??` never reached the
 *     service token that *does* verify. Result: Logistics and Wholesale
 *     rendered "Failed to load: Request failed (401)" for a signed-in admin
 *     while the very same endpoints returned 200 for the service credential.
 *
 * So the service token goes FIRST, and the cookie remains the fallback for a
 * backend that can verify a Loom token (the legacy wrapper, during cutover).
 *
 * This is a transport credential for the CMS->backend hop ONLY. It is not the
 * user's authorization: who may reach a CMS page/route is decided separately
 * and earlier by src/middleware.ts against the session cookie. Nothing here
 * widens what a caller can see — an unauthenticated caller is already turned
 * away by the middleware before any of these handlers run.
 */

import { getServiceToken } from "./loom-service-token";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

/**
 * The bearer token for a server-side backend call.
 *
 * @param cookieToken the caller's `weave_token` value, if any.
 * @returns the service token when configured, else the caller's cookie.
 */
export async function getBackendCallToken(
  cookieToken?: string,
): Promise<string | undefined> {
  return (await getServiceToken()) ?? cookieToken;
}

export { COOKIE_NAME };
