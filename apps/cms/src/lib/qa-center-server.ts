/**
 * qa-center-server.ts — server-only readers for the QA Center's non-journey
 * tabs and the journey EVIDENCE store (Phase-2 witness layer).
 *
 * READ-ONLY. This module never writes anything. It reads:
 *   - journeys/evidence/index.json          run history (newest-first)
 *   - journeys/evidence/<runId>/run.json    full per-run snapshot
 *   - journeys/evidence/<runId>/<file>      per-step screenshots + videos (served, path-guarded)
 *   - parity-harness/data-parity/report.json  Data Parity tab (produced by a separate harness)
 *   - backend/rebuild-map/status.json         API Health tab (test registry output)
 *
 * All three artefacts are produced by OTHER processes; if one is absent the
 * reader returns a { present:false } shape so the UI shows "no run yet" rather
 * than an error.
 */
import { readFile, stat, realpath } from "node:fs/promises";
import { join, resolve } from "node:path";
import { JOURNEYS_DIR } from "./journey-tests-server";

const EVIDENCE_DIR = join(JOURNEYS_DIR, "evidence");
const REBUILD_ROOT = resolve(JOURNEYS_DIR, "..");
const PARITY_REPORT =
  process.env.PARITY_REPORT || join(REBUILD_ROOT, "parity-harness", "data-parity", "report.json");
const API_HEALTH_FILE =
  process.env.API_HEALTH_FILE || join(REBUILD_ROOT, "backend", "rebuild-map", "status.json");

const RUN_ID_RE = /^[0-9]{8}-[0-9]{6}-[a-z0-9]{4}$/;
const EVIDENCE_EXT = /\.(jpe?g|png|mp4|webm|json)$/i;

// ── Run history / snapshots ────────────────────────────────────────────────
export interface RunIndexEntry {
  runId: string;
  run_at: string;
  scope: string;
  durationMs: number;
  totals: {
    journeys: { total: number; pass: number; fail: number };
    steps: { total: number; pass: number; warn: number; fail: number };
  };
}

export async function readRunsIndex(): Promise<RunIndexEntry[]> {
  try {
    const raw = await readFile(join(EVIDENCE_DIR, "index.json"), "utf8");
    const parsed = JSON.parse(raw) as { runs?: RunIndexEntry[] };
    return Array.isArray(parsed.runs) ? parsed.runs : [];
  } catch {
    return [];
  }
}

/** Full run.json for one runId, or null (bad id / missing). */
export async function readRun(runId: string): Promise<unknown | null> {
  if (!RUN_ID_RE.test(runId)) return null;
  try {
    const raw = await readFile(join(EVIDENCE_DIR, runId, "run.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Suites present in the newest run (for the per-suite Run buttons). */
export async function listSuites(): Promise<string[]> {
  const idx = await readRunsIndex();
  if (idx.length === 0) return [];
  const run = (await readRun(idx[0].runId)) as { cases?: { suite?: string }[] } | null;
  if (!run || !Array.isArray(run.cases)) return [];
  return [...new Set(run.cases.map((c) => c.suite || "").filter(Boolean))].sort();
}

// ── Evidence file serving (path-traversal guarded) ─────────────────────────
/**
 * Resolve a requested evidence file (runId + relative path segments) to an
 * absolute path INSIDE journeys/evidence/<runId>/, or null. Guards: runId
 * format, extension allowlist, and a realpath containment check (symlink-safe).
 */
export async function resolveEvidencePath(runId: string, relSegments: string[]): Promise<string | null> {
  if (!RUN_ID_RE.test(runId)) return null;
  const rel = relSegments.join("/");
  if (!EVIDENCE_EXT.test(rel)) return null;
  if (rel.includes("..") || rel.includes("\0")) return null;
  const runDir = join(EVIDENCE_DIR, runId);
  const candidate = resolve(runDir, rel);
  if (!candidate.startsWith(resolve(runDir) + "/")) return null;
  try {
    const real = await realpath(candidate);
    const realRun = await realpath(runDir);
    if (!real.startsWith(realRun + "/")) return null;
    return real;
  } catch {
    return null;
  }
}

export function contentTypeFor(pathname: string): string {
  const p = pathname.toLowerCase();
  if (p.endsWith(".mp4")) return "video/mp4";
  if (p.endsWith(".webm")) return "video/webm";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

// ── Data Parity tab ────────────────────────────────────────────────────────
export interface ParityPayload {
  present: boolean;
  generatedAt?: string;
  liveBase?: string;
  sandboxBase?: string;
  liveTokenOk?: boolean;
  liveTokenError?: string | null;
  rows?: unknown[];
  error?: string;
}

export async function readParityReport(): Promise<ParityPayload> {
  try {
    const st = await stat(PARITY_REPORT).catch(() => null);
    if (!st) return { present: false };
    const raw = await readFile(PARITY_REPORT, "utf8");
    const j = JSON.parse(raw) as ParityPayload;
    return { ...j, present: true };
  } catch (e) {
    return { present: false, error: (e as Error).message };
  }
}

// ── API Health tab ─────────────────────────────────────────────────────────
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

export async function readApiHealth(): Promise<ApiHealthPayload> {
  try {
    const st = await stat(API_HEALTH_FILE).catch(() => null);
    if (!st) return { present: false };
    const raw = await readFile(API_HEALTH_FILE, "utf8");
    const j = JSON.parse(raw) as {
      generatedAt?: string;
      test?: {
        ran?: boolean;
        passed?: number;
        failed?: number;
        isolationFailed?: number;
        realFailed?: number;
        ok?: boolean;
        suites?: Record<string, {
          passed: number; failed: number; isolationFailed?: number; realFailed?: number;
          isolationTests?: string[]; ok: boolean; exercisesRoutes?: number;
        }>;
      };
    };
    const test = j.test || {};
    const suites: ApiHealthSuite[] = Object.entries(test.suites || {}).map(([name, v]) => ({
      name: name.replace(/\.test\.ts$/, ""),
      passed: v.passed,
      failed: v.failed,
      isolationFailed: v.isolationFailed,
      realFailed: v.realFailed,
      isolationTests: v.isolationTests,
      ok: v.ok,
      exercisesRoutes: v.exercisesRoutes,
    }));
    suites.sort((a, b) => (a.failed === b.failed ? a.name.localeCompare(b.name) : b.failed - a.failed));
    return {
      present: true,
      generatedAt: j.generatedAt,
      ran: test.ran,
      passed: test.passed,
      failed: test.failed,
      isolationFailed: test.isolationFailed,
      realFailed: test.realFailed,
      ok: test.ok,
      suites,
    };
  } catch (e) {
    return { present: false, error: (e as Error).message };
  }
}

// ── Fix Log tab ─────────────────────────────────────────────────────────────
// Reads journeys/evidence/fixlog.json (produced by the journeys runner): a
// durable historical ledger of journeys that went RED then GREEN, with the
// commits that landed in the window (correlated-by-timing, not proven-causal).
// Same defensive { present:false } pattern as the other read-only artefacts.
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

export async function readFixLog(): Promise<FixLogPayload> {
  try {
    const file = join(EVIDENCE_DIR, "fixlog.json");
    const st = await stat(file).catch(() => null);
    if (!st) return { present: false };
    const raw = await readFile(file, "utf8");
    const j = JSON.parse(raw) as { generatedAt?: string; entries?: FixLogEntry[] };
    return {
      present: true,
      generatedAt: j.generatedAt,
      entries: Array.isArray(j.entries) ? j.entries : [],
    };
  } catch (e) {
    return { present: false, error: (e as Error).message };
  }
}
