/**
 * GET /api/journey-tests/runs — evidence run history (newest-first).
 * Reads journeys/evidence/index.json. READ-ONLY.
 */
import { NextResponse } from "next/server";
import { readRunsIndex } from "@/lib/qa-center-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const runs = await readRunsIndex();
  return NextResponse.json({ runs });
}
