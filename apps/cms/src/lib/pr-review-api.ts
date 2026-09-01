/**
 * pr-review-api.ts — SERVER-ONLY typed fetchers for the Code Review dashboard.
 *
 * Talks to the :8090 wrapper's net-new pr-review module (admin-gated,
 * sandbox-token tier). AUTH: getServiceToken() returns SANDBOX_ADMIN_TOKEN,
 * which the wrapper's SandboxAuthGuard requires for every pr-review/* route.
 *
 * The initial page list is server-fetched here (force-dynamic). Mutations
 * (enqueue / merge) and the client Refresh go through the same-origin
 * /api/pr-review/* proxy routes so the admin token never reaches the browser.
 *
 * Returns a discriminated Result<T> so a wrapper/gh/DB outage surfaces as an
 * ErrorBanner, never a misleading empty table.
 */
import type { Result } from './result';
import { getServiceToken } from './loom-service-token';

const BACKEND = (process.env.BACKEND_URL ?? 'http://localhost:8090').replace(/\/+$/, '');
const LIST_TIMEOUT_MS = 30000; // 3 gh calls to GitHub

export interface PrReviewRow {
  id: string;
  repo: string;
  prNumber: number;
  title: string;
  author: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  url: string | null;
  status: string;                       // 'new' | 'pending' | 'reviewing' | 'reviewed'
  confidence: number | null;            // 1-5
  securityVerdict: string | null;       // 'clean' | 'flagged'
  findings: string[] | null;
  reviewedAt: number | null;
}

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function mapRow(r: Record<string, unknown>): PrReviewRow {
  return {
    id: String(r.id ?? ''),
    repo: String(r.repo ?? ''),
    prNumber: Number(r.prNumber ?? 0),
    title: String(r.title ?? ''),
    author: r.author == null ? null : String(r.author),
    additions: Number(r.additions ?? 0),
    deletions: Number(r.deletions ?? 0),
    changedFiles: Number(r.changedFiles ?? 0),
    url: r.url == null ? null : String(r.url),
    status: String(r.status ?? 'new'),
    confidence: r.confidence == null ? null : Number(r.confidence),
    securityVerdict: r.securityVerdict == null ? null : String(r.securityVerdict),
    findings: Array.isArray(r.findings) ? (r.findings as unknown[]).map(String) : null,
    reviewedAt: r.reviewedAt == null ? null : new Date(String(r.reviewedAt)).getTime(),
  };
}

/** Refresh + return currently-open PRs across the three repos. */
export async function fetchPrReviewList(): Promise<Result<{ rows: PrReviewRow[]; syncErrors: { repo: string; error: string }[] }>> {
  const token = await getServiceToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LIST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND}/pr-review/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'localhost',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Wrapper returned ${res.status}`);
    const data = rec(await res.json());
    const rows = (Array.isArray(data.prReviews) ? data.prReviews : []).map((r) => mapRow(rec(r)));
    const syncErrors = Array.isArray(data.syncErrors)
      ? (data.syncErrors as unknown[]).map((e) => {
          const o = rec(e);
          return { repo: String(o.repo ?? ''), error: String(o.error ?? '') };
        })
      : [];
    // If gh failed for every repo AND nothing came back, surface it as an error
    // (never render a total outage as an empty 'no open PRs' table).
    if (rows.length === 0 && syncErrors.length > 0) {
      return { ok: false, error: 'GitHub sync failed: ' + syncErrors.map((e) => `${e.repo}: ${e.error}`).join('; ') };
    }
    return { ok: true, data: { rows, syncErrors } };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return { ok: false, error: 'Code Review request timed out' };
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}
