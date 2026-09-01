/**
 * journey-tests-server.ts — server-only helpers for the /journey-tests screen.
 *
 * Talks to the Phase-1 journey runner living OUTSIDE weave, at
 * ../../../journeys (journeys/run.mjs, journeys/cases/*.journey.mjs,
 * journeys/results.json, journeys/history.log, journeys/shots/*.png). This
 * file NEVER edits anything under journeys/cases, journeys/lib, or
 * journeys/run.mjs — those are Phase 1 and owned elsewhere. It DOES create
 * journeys/.run-lock and journeys/logs/*.log at runtime (the run-trigger
 * feature's own bookkeeping), and reads results.json/history.log/shots/.
 *
 * Discovery of journey metadata (name/persona/step titles) is done by
 * spawning a throwaway `node --input-type=module` process that imports the
 * case files directly — this avoids bundling journeys/cases into weave's own
 * Next.js/webpack build (a dynamic import() of a runtime-computed absolute
 * path from inside a Next.js route handler is fragile across webpack/Turbopack
 * versions; a separate plain-Node child process sidesteps that entirely and
 * mirrors exactly what run.mjs's own discoverJourneys() does).
 */
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdir,
  readFile,
  writeFile,
  unlink,
  stat,
  realpath,
} from "node:fs/promises";
import { openSync, closeSync } from "node:fs";
import { join, resolve } from "node:path";

const execFileAsync = promisify(execFile);

// ── Paths ────────────────────────────────────────────────────────────────
export const JOURNEYS_DIR =
  process.env.JOURNEYS_DIR ||
  "/home/clawd/.openclaw/workspace/anuprerna-rebuild/journeys";
const CASES_DIR = join(JOURNEYS_DIR, "cases");
const SHOTS_DIR = join(JOURNEYS_DIR, "shots");
const LOG_DIR = join(JOURNEYS_DIR, "logs");
const LOCK_FILE = join(JOURNEYS_DIR, ".run-lock");
const RESULTS_FILE = join(JOURNEYS_DIR, "results.json");
const HISTORY_FILE = join(JOURNEYS_DIR, "history.log");
const RUNNER = join(JOURNEYS_DIR, "run.mjs");

const STALE_LOCK_MS = 30 * 60 * 1000; // 30 min
const BACKEND = process.env.BACKEND_URL || "http://localhost:8090";

// ── Types ────────────────────────────────────────────────────────────────
export interface JourneyDef {
  name: string;
  persona: "team" | "customer" | string;
  steps: { title: string; soft: boolean }[];
}

export interface StepResult {
  title: string;
  status: "pass" | "warn" | "fail";
  durationMs: number;
  error: string | null;
  screenshot: string | null;
}

export interface JourneyResult {
  journey: string;
  persona: string;
  status: "pass" | "fail";
  steps: StepResult[];
}

export interface ResultsSnapshot {
  run_at: string;
  scope: string;
  journeys: JourneyResult[];
}

export interface RunLock {
  pid: number;
  startedAt: string;
  journey: string; // "all" or a journey name
  logFile: string; // relative to JOURNEYS_DIR
}

// ── Journey discovery (read-only; spawns a throwaway node process) ───────
export async function discoverJourneyDefs(): Promise<JourneyDef[]> {
  const script = `
    import { readdirSync } from "node:fs";
    import { pathToFileURL } from "node:url";
    import { join } from "node:path";
    const CASES_DIR = ${JSON.stringify(CASES_DIR)};
    const files = readdirSync(CASES_DIR).filter((f) => f.endsWith(".journey.mjs"));
    const out = [];
    for (const f of files) {
      try {
        const mod = await import(pathToFileURL(join(CASES_DIR, f)).href);
        const j = mod.default;
        if (!j || !j.name || !Array.isArray(j.steps)) continue;
        out.push({
          name: j.name,
          persona: j.persona,
          steps: j.steps.map((s) => ({ title: s.title, soft: !!s.soft })),
        });
      } catch (e) {
        process.stderr.write("skip " + f + ": " + (e && e.message) + "\\n");
      }
    }
    process.stdout.write(JSON.stringify(out));
  `;
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--input-type=module", "-e", script],
      { cwd: JOURNEYS_DIR, timeout: 15000 },
    );
    return JSON.parse(stdout || "[]") as JourneyDef[];
  } catch (e) {
    throw new Error(`journey discovery failed: ${(e as Error).message}`);
  }
}

// ── results.json / history.log (read-only; written by run.mjs) ──────────
export async function readResultsSnapshot(): Promise<ResultsSnapshot | null> {
  try {
    const raw = await readFile(RESULTS_FILE, "utf8");
    return JSON.parse(raw) as ResultsSnapshot;
  } catch {
    return null;
  }
}

export async function resultsMtime(): Promise<string | null> {
  try {
    const st = await stat(RESULTS_FILE);
    return st.mtime.toISOString();
  } catch {
    return null;
  }
}

interface HistoryEntry {
  runAt: string;
  status: "pass" | "fail";
}

/** Last-mentioned status + timestamp for one journey, scanning history.log
 * from the newest line backwards (history.log only records journeys that were
 * actually part of that run's scope). */
export async function lastHistoryFor(
  journeyName: string,
): Promise<HistoryEntry | null> {
  let raw: string;
  try {
    raw = await readFile(HISTORY_FILE, "utf8");
  } catch {
    return null;
  }
  const lines = raw.split("\n").filter(Boolean);
  const re = new RegExp(`(?:^|\\s)${escapeRegExp(journeyName)}=(pass|fail)(?:\\s|$)`);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const m = line.match(re);
    if (!m) continue;
    const tsMatch = line.match(/^(\S+)/);
    if (!tsMatch) continue;
    return { runAt: tsMatch[1], status: m[1] as "pass" | "fail" };
  }
  return null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function readHistoryTail(n = 20): Promise<string[]> {
  try {
    const raw = await readFile(HISTORY_FILE, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    return lines.slice(-n).reverse();
  } catch {
    return [];
  }
}

// ── Lock file (runtime bookkeeping owned by THIS feature) ────────────────
async function readLockRaw(): Promise<RunLock | null> {
  try {
    const raw = await readFile(LOCK_FILE, "utf8");
    return JSON.parse(raw) as RunLock;
  } catch {
    return null;
  }
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // ESRCH = no such process (dead). EPERM = exists but owned by another
    // user (treat as alive — we just can't signal it).
    return (e as NodeJS.ErrnoException).code !== "ESRCH";
  }
}

function isStale(lock: RunLock): boolean {
  const age = Date.now() - new Date(lock.startedAt).getTime();
  return !Number.isFinite(age) || age > STALE_LOCK_MS;
}

async function clearLock(): Promise<void> {
  try {
    await unlink(LOCK_FILE);
  } catch {
    /* already gone */
  }
}

/** Returns the LIVE lock, or null (clearing the lock file if it is stale or
 * its pid is dead). This is the single source of truth for "is a run active"
 * — independent of any in-process child.on('exit') listener, so it survives
 * a weave server restart mid-run. */
export async function getLiveLock(): Promise<RunLock | null> {
  const lock = await readLockRaw();
  if (!lock) return null;
  if (isStale(lock) || !pidAlive(lock.pid)) {
    await clearLock();
    return null;
  }
  return lock;
}

export interface StartRunResult {
  ok: boolean;
  lock?: RunLock;
  error?: string;
}

/** Spawns the runner as a DETACHED, unref'd background process, guarded by
 * the lock file. Refuses (ok:false) if a live run already exists. */
export async function startRun(journeyName?: string, suiteName?: string): Promise<StartRunResult> {
  const live = await getLiveLock();
  if (live) {
    return { ok: false, error: "A journey run is already in progress", lock: live };
  }

  await mkdir(LOG_DIR, { recursive: true });
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const logRelPath = join("logs", `run-${id}.log`);
  const logAbsPath = join(JOURNEYS_DIR, logRelPath);
  const logFd = openSync(logAbsPath, "a");

  const args = suiteName
    ? [RUNNER, "--suite", suiteName]
    : journeyName
      ? [RUNNER, "--journey", journeyName]
      : [RUNNER, "--all"];

  const child = spawn(process.execPath, args, {
    cwd: JOURNEYS_DIR,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env },
  });
  closeSync(logFd); // the child holds its own fd via stdio inheritance

  const lock: RunLock = {
    pid: child.pid as number,
    startedAt: new Date().toISOString(),
    journey: suiteName ? `suite:${suiteName}` : journeyName ?? "all",
    logFile: logRelPath,
  };
  await writeFile(LOCK_FILE, JSON.stringify(lock, null, 2));

  // Best-effort prompt cleanup if this weave process is still alive when the
  // child exits. Not load-bearing — getLiveLock()'s pid-liveness check is the
  // durable source of truth even if this listener is lost (server restart).
  child.on("exit", () => {
    readLockRaw()
      .then((cur) => {
        if (cur && cur.pid === lock.pid) return clearLock();
      })
      .catch(() => {});
  });

  child.unref();

  return { ok: true, lock };
}

// ── Feedback count (journey-test/* rows, open only) ───────────────────────
interface FeedbackRow {
  status?: string;
  route?: string;
}

async function listFeedback(app: string): Promise<FeedbackRow[]> {
  try {
    const res = await fetch(`${BACKEND}/feedback?app=${encodeURIComponent(app)}`, {
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { feedback?: FeedbackRow[] };
    return Array.isArray(data.feedback) ? data.feedback : [];
  } catch {
    return [];
  }
}

export async function countOpenJourneyFeedback(): Promise<number> {
  const [weave, storefront] = await Promise.all([
    listFeedback("weave"),
    listFeedback("storefront"),
  ]);
  const all = [...weave, ...storefront];
  return all.filter(
    (r) => (r.route ?? "").startsWith("journey-test/") && r.status !== "resolved",
  ).length;
}

// ── Screenshot path resolution (path-traversal guarded) ───────────────────
const SAFE_PNG = /^[a-zA-Z0-9_.-]+\.png$/;

/** Resolves a requested shot basename to an absolute path INSIDE SHOTS_DIR,
 * or null if it fails the basename allowlist or would resolve outside the
 * directory (defence in depth beyond the regex — e.g. a symlink escape). */
export async function resolveShotPath(basename: string): Promise<string | null> {
  if (!SAFE_PNG.test(basename)) return null;
  const candidate = resolve(SHOTS_DIR, basename);
  if (!candidate.startsWith(resolve(SHOTS_DIR) + "/") && candidate !== resolve(SHOTS_DIR)) {
    return null;
  }
  try {
    const real = await realpath(candidate);
    const realShots = await realpath(SHOTS_DIR);
    if (!real.startsWith(realShots + "/")) return null;
    return real;
  } catch {
    return null; // does not exist
  }
}
