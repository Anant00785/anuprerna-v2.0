/**
 * GET /api/journey-tests/api-health — the backend test-registry health
 * (backend/rebuild-map/status.json), one row per suite/module. READ-ONLY.
 */
import { NextResponse } from "next/server";
import { readApiHealth } from "@/lib/qa-center-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const payload = await readApiHealth();
  return NextResponse.json(payload);
}
