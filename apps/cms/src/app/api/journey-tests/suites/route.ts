/**
 * GET /api/journey-tests/suites — distinct suite names in the newest run
 * (used to offer per-suite Run buttons). READ-ONLY.
 */
import { NextResponse } from "next/server";
import { listSuites } from "@/lib/qa-center-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const suites = await listSuites();
  return NextResponse.json({ suites });
}
