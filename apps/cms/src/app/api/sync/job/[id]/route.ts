/**
 * GET /api/sync/job/[id] — progress/result of a sync job (READ-ONLY).
 *
 * Reads rebuild-map/sync-jobs/<id>.json written by POST /api/sync/run.
 */
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSandboxToken } from "@/lib/sandbox-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_DIR =
  process.env.BACKEND_SCRIPTS_DIR ||
  "/home/clawd/.openclaw/workspace/anuprerna-rebuild/backend";
const JOBS_DIR = join(BACKEND_DIR, "rebuild-map", "sync-jobs");

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!getSandboxToken()) {
    return NextResponse.json({ error: "SANDBOX_ADMIN_TOKEN not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]+$/i.test(id)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }
  try {
    const raw = await readFile(join(JOBS_DIR, `${id}.json`), "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
}
