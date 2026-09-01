/**
 * GET /api/journey-tests/fixlog — the Fix Log ledger
 * (journeys/evidence/fixlog.json), rendered read-only in the QA Center.
 * Returns { present:false } if the runner has not produced a fixlog yet.
 */
import { NextResponse } from "next/server";
import { readFixLog } from "@/lib/qa-center-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const payload = await readFixLog();
  return NextResponse.json(payload);
}
