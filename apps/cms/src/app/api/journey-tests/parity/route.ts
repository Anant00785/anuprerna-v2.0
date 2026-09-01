/**
 * GET /api/journey-tests/parity — the Data Parity harness report
 * (parity-harness/data-parity/report.json), rendered read-only in the QA
 * Center. Returns { present:false } if no parity run has been produced yet.
 */
import { NextResponse } from "next/server";
import { readParityReport } from "@/lib/qa-center-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const payload = await readParityReport();
  return NextResponse.json(payload);
}
