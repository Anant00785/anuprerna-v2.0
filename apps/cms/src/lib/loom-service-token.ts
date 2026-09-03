/**
 * Server-only Loom service token.
 *
 * Mints a bearer token using the service-account credentials stored in env
 * (LOOM_SERVICE_USERNAME / LOOM_SERVICE_PASSWORD) and caches it in-process
 * for 8 hours, or until the process restarts. Returns undefined (graceful
 * degradation to empty lists) when credentials are missing or auth fails.
 *
 * IMPORTANT — server-only: env vars are NOT NEXT_PUBLIC_ so they are never
 * bundled into the client. Only import from server components or route handlers.
 *
 * Pattern in a server component — go through the helper, do NOT hand-roll the
 * precedence. The service token must come FIRST; a `cookieToken ?? service`
 * fallback (what this comment used to recommend) breaks against the v2 API,
 * which cannot verify a Loom-signed cookie and answers 401:
 *
 *   const token = await getBackendCallToken(cookieStore.get(COOKIE)?.value);
 *
 * See src/lib/backend-call-token.ts.
 */

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

let _cache: { token: string; expiresAt: number } | null = null;

async function mint(): Promise<string> {
  const username = process.env.LOOM_SERVICE_USERNAME;
  const password = process.env.LOOM_SERVICE_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "LOOM_SERVICE_USERNAME / LOOM_SERVICE_PASSWORD not set in env",
    );
  }

  const res = await fetch(`${BACKEND}/authenticate/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "localhost",
    },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Loom auth failed — backend returned ${res.status}`);
  }

  const data = (await res.json()) as Record<string, unknown>;

  // Loom returns { jwt: "..." }; accept common aliases for resilience.
  const token =
    (data.jwt as string | undefined) ??
    (data.bearerToken as string | undefined) ??
    (data.token as string | undefined);

  if (!token) {
    throw new Error(
      `Loom auth response missing token field. Keys: ${Object.keys(data).join(", ")}`,
    );
  }

  return token;
}

/**
 * Return the cached service token, refreshing if stale.
 * Never throws — returns undefined on any error so callers degrade gracefully.
 */
let _warnedNoAdminToken = false;

export async function getServiceToken(): Promise<string | undefined> {
  // Sandbox backend (2026-07-03 cutover): /authenticate/email is a documented 501.
  // Super-user reads use the sandbox admin token (provisioned in env by the backend
  // lane). Fall back to the legacy mint only if the admin token is unset.
  const admin = process.env.SANDBOX_ADMIN_TOKEN;
  if (admin) return admin;

  // FAIL LOUD, once per process: the legacy LOOM_SERVICE_USERNAME/PASSWORD mint
  // below is a known-broken fallback (the sandbox backend's /authenticate/email
  // is a documented 501) — a dev who forgot to set SANDBOX_ADMIN_TOKEN gets a
  // confusing chain of downstream 401s otherwise, with nothing pointing at the
  // real cause. This is the ONE place that names the missing variable.
  if (!_warnedNoAdminToken) {
    _warnedNoAdminToken = true;
    console.error(
      "\n" +
        "=".repeat(78) + "\n" +
        "[loom-service-token] SANDBOX_ADMIN_TOKEN is NOT set in this app's env.\n" +
        "Every super-user read to the backend will fail auth (401) until it is set.\n" +
        "Fix: set SANDBOX_ADMIN_TOKEN in weave's .env.local to the EXACT SAME value\n" +
        "configured as SANDBOX_ADMIN_TOKEN on the backend it calls — the two must match.\n" +
        "(Falling back to a legacy username/password mint that is currently broken.)\n" +
        "=".repeat(78) + "\n",
    );
  }

  if (_cache && Date.now() < _cache.expiresAt) {
    return _cache.token;
  }

  try {
    const token = await mint();
    _cache = { token, expiresAt: Date.now() + TTL_MS };
    return token;
  } catch (err) {
    console.error(
      "[loom-service-token] failed to mint token:",
      err instanceof Error ? err.message : String(err),
    );
    _cache = null;
    return undefined;
  }
}

/** Evict the cached token (call on 401 from a downstream Loom request). */
export function invalidateServiceToken(): void {
  _cache = null;
}

/**
 * Server-internal fetch through the wrapper using the cached SERVICE token.
 * On a 401 (stale/rotated token) it evicts the cache and retries EXACTLY once
 * with a freshly minted token. For genuinely server-internal jobs only — NOT a
 * substitute for the caller session on browser-facing routes (see finding b).
 */
export async function fetchWithServiceToken(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const build = (t: string | undefined): RequestInit => ({
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Origin: "localhost",
      ...(init.headers as Record<string, string> | undefined),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
  });
  let res = await fetch(url, build(await getServiceToken()));
  if (res.status === 401) {
    invalidateServiceToken();
    res = await fetch(url, build(await getServiceToken()));
  }
  return res;
}

/**
 * Live-Loom service token — for reads proxied straight through to LIVE Loom
 * (order-feedback, and any future live super-user read).
 *
 * Distinct from getServiceToken(): that returns SANDBOX_ADMIN_TOKEN, which the
 * sandbox's OWNED native modules accept but LIVE Loom (reached via the :8090
 * read-proxy) rejects with "credentials have been tampered with" — the sandbox
 * token is not signed by live Loom. The order-feedback endpoints (feedback-list,
 * super-user/order/feedback/{id}) are transparently proxied to live Loom, so they
 * need a genuine live-Loom JWT minted from the service account (LOOM_SERVICE_*
 * via /authenticate/email, which the wrapper's auth passthrough forwards to live).
 *
 * Cached 8h in-process (separate cache from the sandbox token); returns undefined
 * on failure so callers degrade to an error banner, never a silent empty list.
 */
let _liveCache: { token: string; expiresAt: number } | null = null;

export async function getLiveLoomToken(): Promise<string | undefined> {
  if (_liveCache && Date.now() < _liveCache.expiresAt) return _liveCache.token;
  try {
    const token = await mint();
    _liveCache = { token, expiresAt: Date.now() + TTL_MS };
    return token;
  } catch (err) {
    console.error(
      "[loom-service-token] live mint failed:",
      err instanceof Error ? err.message : String(err),
    );
    _liveCache = null;
    return undefined;
  }
}
