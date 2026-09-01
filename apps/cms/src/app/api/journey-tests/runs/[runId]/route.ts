/**
 * GET /api/journey-tests/runs/[runId] — the full run.json snapshot for one run
 * (all cases, per-step detail, video paths, plain-English failure). READ-ONLY.
 */
import { NextRequest, NextResponse } from "next/server";
import { readRun } from "@/lib/qa-center-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  const run = await readRun(runId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  return NextResponse.json(run);
}
