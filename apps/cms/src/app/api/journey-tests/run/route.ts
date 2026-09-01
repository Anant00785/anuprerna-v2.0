/**
 * POST /api/journey-tests/run — trigger a journey run (async, backgrounded).
 *
 * Body: {}                    → run --all
 *       { journey: "<name>" } → run just that one journey
 *       { suite:  "<suite>" } → run every journey in that QA-Center suite
 *
 * Spawns journeys/run.mjs as a DETACHED, unref'd background process guarded by
 * journeys/.run-lock. Refuses with 409 if a run is already live. The UI polls
 * /api/journey-tests/status and re-fetches once the lock clears.
 */
import { NextRequest, NextResponse } from "next/server";
import { discoverJourneyDefs, startRun } from "@/lib/journey-tests-server";
import { listSuites } from "@/lib/qa-center-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { journey?: string; suite?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const journey = typeof body.journey === "string" && body.journey ? body.journey : undefined;
  const suite = typeof body.suite === "string" && body.suite ? body.suite : undefined;

  if (journey) {
    const defs = await discoverJourneyDefs();
    if (!defs.some((d) => d.name === journey)) {
      return NextResponse.json({ error: `Unknown journey: ${journey}` }, { status: 400 });
    }
  }
  if (suite) {
    const suites = await listSuites();
    // Only validate when we actually have a known suite set; if no run exists
    // yet (empty set) we let the runner filter and no-op safely.
    if (suites.length > 0 && !suites.includes(suite)) {
      return NextResponse.json({ error: `Unknown suite: ${suite}` }, { status: 400 });
    }
  }

  const result = await startRun(journey, suite);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, lock: result.lock }, { status: 409 });
  }
  return NextResponse.json({ started: true, lock: result.lock });
}
