/**
 * Shared classification for CMS -> backend fetch failures.
 *
 * PROBLEM this exists to solve: every `*-api.ts` client in this app used to
 * swallow ALL fetch failures (401/403 auth, network unreachable, 5xx, the
 * sandbox backend running isolated/outdated code) into a bare `null` / `[]`,
 * which pages then rendered as a generic "not found" — indistinguishable
 * from a genuinely empty record. A dev with a config mistake (mismatched
 * SANDBOX_ADMIN_TOKEN, backend not running, wrong BACKEND_URL, etc.) saw the
 * exact same screen as real empty data, with nothing to go on and no way to
 * self-diagnose from the screen alone.
 *
 * This module turns every backend fetch failure into a BackendFetchError
 * carrying a classified `kind` + a CAUSE-SPECIFIC, actionable plain-English
 * `message` that names the HTTP status and says what to do — a new
 * developer should be able to read it off the rendered page and fix the
 * problem without touching the console or the codebase. See SETUP.md's
 * troubleshooting table for the same four-way mapping.
 *
 * Genuine "this record doesn't exist" (a 200 OK response with no matching
 * row in the envelope) NEVER goes through here — it's an ordinary falsy
 * return from the caller's own envelope check (e.g. `j.order ?? null`),
 * untouched by this module. Only real fetch/HTTP failures land here.
 */

export type BackendErrorKind = "network" | "auth" | "isolated" | "server";

export class BackendFetchError extends Error {
  readonly kind: BackendErrorKind;
  readonly status?: number;
  readonly url: string;

  constructor(kind: BackendErrorKind, url: string, message: string, status?: number) {
    super(message);
    this.name = "BackendFetchError";
    this.kind = kind;
    this.url = url;
    this.status = status;
  }
}

/** Classify a non-2xx HTTP response from the backend into a cause-specific,
 *  actionable error. `clientLabel` names the calling *-api.ts module so a
 *  grep of the logs points straight at the right file. */
export function classifyHttpFailure(
  clientLabel: string,
  url: string,
  status: number,
  body: string,
): BackendFetchError {
  if (status === 401 || status === 403) {
    return new BackendFetchError(
      "auth",
      url,
      `[${clientLabel}] Backend rejected authentication (${status}) at ${url}. ` +
        `Your SANDBOX_ADMIN_TOKEN doesn't match the backend's — set the SAME token ` +
        `value in both the CMS (.env.local) and the backend it calls.`,
      status,
    );
  }
  if (status === 503 || status === 501 || /not_implemented|sandbox[^a-z]{0,12}isolat/i.test(body)) {
    return new BackendFetchError(
      "isolated",
      url,
      `[${clientLabel}] The backend is running isolated or outdated code for this route ` +
        `(${status} at ${url}). Pull latest and rebuild the backend.`,
      status,
    );
  }
  return new BackendFetchError(
    "server",
    url,
    `[${clientLabel}] Backend returned an unexpected error (${status}) at ${url}: ` +
      `${(body || "no body").slice(0, 200)}.`,
    status,
  );
}

/** Classify a fetch() that failed before an HTTP response came back at all
 *  (connection refused, DNS failure, timeout, etc). */
export function classifyNetworkFailure(clientLabel: string, url: string, err: unknown): BackendFetchError {
  const detail = err instanceof Error ? err.message : String(err);
  return new BackendFetchError(
    "network",
    url,
    `[${clientLabel}] Can't reach the backend at ${url} — is your backend running, ` +
      `and is BACKEND_URL / NEXT_PUBLIC_BACKEND_URL correct? (${detail})`,
    undefined,
  );
}

/**
 * Re-throw only SYSTEMIC (config/connectivity) failures instead of letting a
 * catch block silently swallow them into a misleading empty/"not found"
 * fallback. Callers that intentionally tolerate ONE specific, documented,
 * always-expected failure (e.g. a route that is known to permanently 401
 * until a migration lands) should check `e instanceof BackendFetchError`
 * themselves instead of using this helper — see getWorkflowFeedbackList in
 * artisanflow-api.ts for that documented exception.
 */
export function rethrowIfSystemic(e: unknown): void {
  if (e instanceof BackendFetchError) throw e;
}
