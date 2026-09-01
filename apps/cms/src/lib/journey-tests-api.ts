/**
 * journey-tests-api.ts — typed client for the Journey Tests screen.
 *
 * Talks ONLY to the Weave host API routes under /api/journey-tests/*. Those
 * routes read journeys/results.json + history.log (written by journeys/run.mjs)
 * and spawn the same runner as a detached background process, guarded by a
 * lock file — see src/lib/journey-tests-server.ts for the implementation.
 * Every fetcher returns a discriminated Result so a failure surfaces as an
 * error banner, never a misleading empty state.
 */
import type { Result } from "./result";

export type JourneyStatus = "pass" | "fail" | "never-run";
export type StepStatus = "pass" | "warn" | "fail";

export interface JourneyStepView {
  title: string;
  status: StepStatus;
  durationMs: number;
  error: string | null;
  screenshot: string | null;
}

export interface JourneyView {
  name: string;
  persona: string;
  stepTitles: string[];
  lastStatus: JourneyStatus;
  lastRunAt: string | null;
  /** true when `steps` reflects THIS journey's own last run (results.json is
   * overwritten by run.mjs on every run, so it only holds detail for whichever
   * journeys were in the most recent run's scope). */
  hasDetail: boolean;
  steps: JourneyStepView[] | null;
}

export interface RunLockView {
  pid: number;
  startedAt: string;
  journey: string;
}

export interface JourneyListResponse {
  journeys: JourneyView[];
  running: boolean;
  lock: RunLockView | null;
  openFeedbackCount: number;
  historyTail: string[];
}

export interface StatusResponse {
  running: boolean;
  lock: RunLockView | null;
  resultsUpdatedAt: string | null;
}

async function getJson<T>(url: string): Promise<Result<T>> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (!res.ok) return { ok: false, error: data?.error || `Request failed (${res.status})` };
    if (!data) return { ok: false, error: "Empty response" };
    return { ok: true, data: data as T };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function fetchJourneyList(): Promise<Result<JourneyListResponse>> {
  return getJson<JourneyListResponse>("/api/journey-tests/list");
}

export function fetchRunStatus(): Promise<Result<StatusResponse>> {
  return getJson<StatusResponse>("/api/journey-tests/status");
}

export async function triggerRun(
  journey?: string,
): Promise<Result<{ started: true; lock: RunLockView }>> {
  try {
    const res = await fetch("/api/journey-tests/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(journey ? { journey } : {}),
    });
    const data = (await res.json().catch(() => null)) as
      | { started?: true; lock?: RunLockView; error?: string }
      | null;
    if (!res.ok || !data?.lock) {
      return { ok: false, error: data?.error || `Request failed (${res.status})` };
    }
    return { ok: true, data: { started: true, lock: data.lock } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function shotUrl(filename: string): string {
  return `/api/journey-tests/shots/${encodeURIComponent(filename)}`;
}

export function feedbackRoutePrefix(): string {
  return "journey-test/";
}

// ─────────────────────────────────────────────────────────────────────────
// QA Center additions (Phase 2 — evidence runs + Data Parity + API Health +
// Open Issues). The journeys tab now reads the per-RUN evidence snapshots
// (journeys/evidence/<runId>/run.json) instead of the single overwritten
// results.json, so run history + per-step screenshots + video survive.
// ─────────────────────────────────────────────────────────────────────────

export interface RunTotals {
  journeys: { total: number; pass: number; fail: number };
  steps: { total: number; pass: number; warn: number; fail: number };
}
export interface RunIndexEntry {
  runId: string;
  run_at: string;
  scope: string;
  durationMs: number;
  totals: RunTotals;
}
export interface EvStep {
  n: number;
  title: string;
  status: StepStatus;
  durationMs: number;
  error: string | null;
  screenshot: string | null; // relative to the run dir, e.g. "customer-browse/step-01-x.jpg"
  liveScreenshot: string | null; // live-twin screenshot (run-dir-relative), present only for read-only customer browse/listing/PDP steps
  consoleErrors: string[];
  soft: boolean;
}
export interface EvFailure {
  failedStepIndex: number;
  stepTitle: string;
  assertion: string | null;
  consoleErrors: string[];
  plainEnglish: string;
  screenshot: string | null;
}
export interface EvCase {
  caseId: string;
  name: string;
  persona: string;
  suite: string;
  status: "pass" | "fail";
  durationMs: number;
  video: string | null;
  failure: EvFailure | null;
  steps: EvStep[];
}
export interface RunSnapshot {
  runId: string;
  run_at: string;
  scope: string;
  durationMs: number;
  totals: RunTotals;
  cases: EvCase[];
}

export function fetchRuns(): Promise<Result<{ runs: RunIndexEntry[] }>> {
  return getJson<{ runs: RunIndexEntry[] }>("/api/journey-tests/runs");
}
export function fetchRun(runId: string): Promise<Result<RunSnapshot>> {
  return getJson<RunSnapshot>(`/api/journey-tests/runs/${encodeURIComponent(runId)}`);
}
export function fetchSuites(): Promise<Result<{ suites: string[] }>> {
  return getJson<{ suites: string[] }>("/api/journey-tests/suites");
}

/** URL for a per-step screenshot / case video, given a run dir-relative path. */
export function evidenceUrl(runId: string, relPath: string): string {
  const parts = relPath.split("/").map(encodeURIComponent).join("/");
  return `/api/journey-tests/evidence/${encodeURIComponent(runId)}/${parts}`;
}

/** Trigger a run: whole suite of everything, one suite, or one journey. */
export async function triggerQaRun(
  opts: { journey?: string; suite?: string } = {},
): Promise<Result<{ started: true; lock: RunLockView }>> {
  try {
    const res = await fetch("/api/journey-tests/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    const data = (await res.json().catch(() => null)) as
      | { started?: true; lock?: RunLockView; error?: string }
      | null;
    if (!res.ok || !data?.lock) return { ok: false, error: data?.error || `Request failed (${res.status})` };
    return { ok: true, data: { started: true, lock: data.lock } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Data Parity ────────────────────────────────────────────────────────────
export interface ParityNode {
  key: string;
  module: string;
  tab: string;
  subtab: string;
  storage: string;
  note: string;
}
export interface ParityRow {
  node: ParityNode;
  verdict: string;
  reason: string;
  liveCount: number | null;
  sbCount: number | null;
  sbAdj: number | null;
  drill: string | null;
}
export interface ParityPayload {
  present: boolean;
  generatedAt?: string;
  liveBase?: string;
  sandboxBase?: string;
  liveTokenOk?: boolean;
  rows?: ParityRow[];
  error?: string;
}
export function fetchParity(): Promise<Result<ParityPayload>> {
  return getJson<ParityPayload>("/api/journey-tests/parity");
}

// ── API Health ───────────────────────────────────────────────────────────
// isolationFailed/realFailed (2026-07-21): backend/rebuild-map/scan-status.mjs
// now DETECTS the real "Sandbox isolated: live Loom is disabled" 503 marker in
// each failing test's captured output (never a hardcoded guess-list -- see
// detectIsolationFailures() there) and splits each suite's `failed` count into
// isolationFailed (expected, sandbox can't reach live Loom) vs realFailed
// (genuine). Older status.json snapshots won't have these fields -- treat
// their absence as "unknown split, count everything as real" (optional).
export interface ApiHealthSuite {
  name: string;
  passed: number;
  failed: number;
  isolationFailed?: number;
  realFailed?: number;
  isolationTests?: string[];
  ok: boolean;
  exercisesRoutes?: number;
}
export interface ApiHealthPayload {
  present: boolean;
  generatedAt?: string;
  ran?: boolean;
  passed?: number;
  failed?: number;
  isolationFailed?: number;
  realFailed?: number;
  ok?: boolean;
  suites?: ApiHealthSuite[];
  error?: string;
}
export function fetchApiHealth(): Promise<Result<ApiHealthPayload>> {
  return getJson<ApiHealthPayload>("/api/journey-tests/api-health");
}

// ── Open Issues (journey-test-filed page feedback, still open) ───────────────
export interface IssueRow {
  id: string;
  app: "weave" | "storefront";
  route: string;
  pageLabel?: string;
  text?: string;
  status?: string;
  submitterName?: string;
  createdAt?: string;
}
export async function fetchOpenIssues(): Promise<Result<{ issues: IssueRow[] }>> {
  try {
    const res = await fetch("/api/feedback/all", { cache: "no-store" });
    const d = (await res.json().catch(() => null)) as
      | { weave?: IssueRow[]; storefront?: IssueRow[] }
      | null;
    if (!d) return { ok: false, error: "Empty response" };
    const all = [
      ...(d.weave ?? []).map((x) => ({ ...x, app: "weave" as const })),
      ...(d.storefront ?? []).map((x) => ({ ...x, app: "storefront" as const })),
    ];
    const issues = all.filter(
      (r) => (r.route ?? "").startsWith("journey-test/") && r.status !== "resolved",
    );
    return { ok: true, data: { issues } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Fix Log (historical ledger of journeys that went RED → GREEN) ────────────
export interface FixLogCommit {
  repo: string;
  sha: string;
  subject: string;
  date: string;
}
export interface FixLogFailure {
  stepTitle: string;
  assertion: string | null;
  plainEnglish: string;
  screenshot: string | null;
}
export interface FixLogEntry {
  journeyId: string;
  journeyName: string;
  suite: string;
  persona: string;
  firstRedAt: string;
  lastRedAt: string;
  greenAt: string;
  firstRedRunId: string | null;
  lastRedRunId: string | null;
  greenRunId: string | null;
  lastRedEvidenceRetained: boolean;
  greenEvidenceRetained: boolean;
  failure: FixLogFailure | null;
  commits: FixLogCommit[];
  commitWindowNote: string;
  laterRegressed: boolean;
}
export interface FixLogPayload {
  present: boolean;
  generatedAt?: string;
  entries?: FixLogEntry[];
  error?: string;
}
export function fetchFixLog(): Promise<Result<FixLogPayload>> {
  return getJson<FixLogPayload>("/api/journey-tests/fixlog");
}

// ── Refresh sandbox from live (Data Parity tab) ──────────────────────────────
// Reuses the host /api/sync/* plumbing. POST /api/sync/run spawns the SAFE,
// COMPLETE `bash sync/db-refresh.sh` (snapshots first, additive upsert from live
// Loom, atomic relational re-derive, NO schema drop, never deletes owned data —
// writes SANDBOX pg only, zero live writes). ~15-20 min; polled via the job route.
export interface RefreshJob {
  id: string;
  status: "running" | "done" | "failed";
  kind?: string;
  startedAt: string;
  finishedAt: string | null;
  exitCode: number | null;
  error?: string;
  log: string[];
}

/** Kick off the full sandbox-from-live refresh. Returns the job id to poll. */
export async function triggerRefresh(): Promise<Result<{ jobId: string }>> {
  try {
    const res = await fetch("/api/sync/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = (await res.json().catch(() => null)) as { jobId?: string; error?: string } | null;
    if (!res.ok || !data?.jobId) return { ok: false, error: data?.error || `Request failed (${res.status})` };
    return { ok: true, data: { jobId: data.jobId } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Poll one refresh job's progress/result. */
export function fetchRefreshJob(id: string): Promise<Result<RefreshJob>> {
  return getJson<RefreshJob>(`/api/sync/job/${encodeURIComponent(id)}`);
}
