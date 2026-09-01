/**
 * POST /api/sync/run — trigger the SAFE, COMPLETE sandbox refresh from live (async job).
 *
 * Spawns `bash sync/db-refresh.sh` on the HOST (pm2, not the dockerized wrapper).
 * That script is the live-SAFE refresh of the already-populated sandbox DB:
 *   0. pre-refresh pg_dump snapshot (rollback point)
 *   3. additive upsert of public.* from live Loom (read-only source)
 *   4. atomic, FK-suspended re-derive of relational.* (NO schema drop, never deletes owned data)
 *   6. re-assert fixture + service-account logins (loud fail otherwise)
 * ~15-20 min. It NEVER drops a schema, NEVER deletes owned/sandbox-created data, and
 * writes to the SANDBOX pg ONLY — live Loom is a read source, zero live writes anywhere.
 *
 * This intentionally does NOT use the old rebuild-map/resync.mjs (partial, delete-prone).
 *
 * Only ONE job at a time (409 on concurrent). Progress is written to
 * rebuild-map/sync-jobs/<id>.json for GET /api/sync/job/<id>. Admin-gated (Weave
 * session middleware + SANDBOX_ADMIN_TOKEN must be configured).
 *
 * Body: { dry?: true } — dry:true does NOT run the refresh; it resolves and
 * X_OK-checks the db-refresh.sh path and returns { ok, script, executable }.
 * Use it to verify wiring without paying the ~20-min cost.
 */
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile, readdir, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { join } from "node:path";
import { getSandboxToken } from "@/lib/sandbox-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_DIR =
  process.env.BACKEND_SCRIPTS_DIR ||
  "/home/clawd/.openclaw/workspace/anuprerna-rebuild/backend";
const JOBS_DIR = join(BACKEND_DIR, "rebuild-map", "sync-jobs");
const REFRESH_SCRIPT = "sync/db-refresh.sh"; // relative to BACKEND_DIR (cwd of the spawn)
const REFRESH_SCRIPT_ABS = join(BACKEND_DIR, REFRESH_SCRIPT);

interface Job {
  id: string;
  status: "running" | "done" | "failed";
  kind: "db-refresh";
  startedAt: string;
  finishedAt: string | null;
  exitCode: number | null;
  error?: string;
  log: string[];
}

async function runningJobId(): Promise<string | null> {
  try {
    for (const f of await readdir(JOBS_DIR)) {
      if (!f.endsWith(".json")) continue;
      try {
        const j = JSON.parse(await readFile(join(JOBS_DIR, f), "utf8")) as Job;
        if (j.status === "running") return j.id;
      } catch { /* skip unreadable */ }
    }
  } catch { /* dir may not exist yet */ }
  return null;
}

export async function POST(req: NextRequest) {
  if (!getSandboxToken()) {
    return NextResponse.json({ error: "SANDBOX_ADMIN_TOKEN not configured" }, { status: 503 });
  }

  let body: { dry?: boolean } = {};
  try { body = (await req.json()) as { dry?: boolean }; } catch { /* empty body OK */ }

  // Verify the refresh script is present + executable BEFORE we commit to a job.
  let executable = true;
  let scriptError: string | undefined;
  try {
    await access(REFRESH_SCRIPT_ABS, FS.X_OK);
  } catch (e) {
    executable = false;
    scriptError = (e as Error).message;
  }

  // DRY: prove wiring (path resolves + executable) without running the 20-min refresh.
  if (body.dry === true) {
    return NextResponse.json(
      { ok: executable, script: REFRESH_SCRIPT_ABS, executable, error: scriptError },
      { status: executable ? 200 : 500 },
    );
  }

  if (!executable) {
    return NextResponse.json(
      { error: `refresh script not runnable: ${REFRESH_SCRIPT_ABS} (${scriptError})` },
      { status: 500 },
    );
  }

  await mkdir(JOBS_DIR, { recursive: true });
  const running = await runningJobId();
  if (running) return NextResponse.json({ error: "A refresh job is already running", jobId: running }, { status: 409 });

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const jobFile = join(JOBS_DIR, `${id}.json`);

  const job: Job = {
    id, status: "running", kind: "db-refresh",
    startedAt: new Date().toISOString(), finishedAt: null, exitCode: null, log: [],
  };
  await writeFile(jobFile, JSON.stringify(job, null, 2));

  const persist = () => writeFile(jobFile, JSON.stringify(job, null, 2)).catch(() => {});
  const child = spawn("bash", [REFRESH_SCRIPT], { cwd: BACKEND_DIR, env: { ...process.env } });
  const append = (chunk: Buffer) => {
    const lines = chunk.toString().split("\n").filter((l) => l.length);
    if (lines.length) { job.log.push(...lines); if (job.log.length > 500) job.log = job.log.slice(-500); persist(); }
  };
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  child.on("error", (e) => { job.status = "failed"; job.error = e.message; job.finishedAt = new Date().toISOString(); persist(); });
  child.on("exit", (code) => {
    job.exitCode = code;
    job.status = code === 0 ? "done" : "failed";
    job.finishedAt = new Date().toISOString();
    job.log.push(code === 0
      ? "[refresh] db:refresh done — live data refreshed, no schemas dropped, owned data intact."
      : `[refresh] db:refresh FAILED (exit ${code}).`);
    persist();
  });

  return NextResponse.json({ jobId: id, status: "running", kind: "db-refresh" });
}
