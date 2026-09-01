/**
 * GET /api/journey-tests/status — cheap poll target while a run is in flight.
 *
 * Reports whether a run is currently live (lock file present + pid alive +
 * not stale) and the results.json mtime, so the UI can detect "run finished"
 * (lock cleared) without re-fetching the full /list payload every 2s.
 */
import { NextResponse } from "next/server";
import { getLiveLock, resultsMtime } from "@/lib/journey-tests-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [lock, updatedAt] = await Promise.all([getLiveLock(), resultsMtime()]);
  return NextResponse.json({ running: !!lock, lock, resultsUpdatedAt: updatedAt });
}
