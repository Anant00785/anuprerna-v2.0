/**
 * GET /api/journey-tests/list — journey inventory + last-run status (READ-ONLY).
 *
 * Merges three sources: case-file metadata (name/persona/step titles, via
 * discoverJourneyDefs), the last-run snapshot (results.json — full per-step
 * detail, but ONLY for whichever journeys were in that run's scope), and
 * history.log (coarse pass/fail per journey, every run, used as the status
 * source for journeys not covered by the current results.json snapshot).
 */
import { NextResponse } from "next/server";
import {
  discoverJourneyDefs,
  readResultsSnapshot,
  lastHistoryFor,
  readHistoryTail,
  getLiveLock,
  countOpenJourneyFeedback,
  type JourneyResult,
} from "@/lib/journey-tests-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const [defs, snapshot, lock, openFeedbackCount, historyTail] = await Promise.all([
      discoverJourneyDefs(),
      readResultsSnapshot(),
      getLiveLock(),
      countOpenJourneyFeedback(),
      readHistoryTail(20),
    ]);

    const byName = new Map<string, JourneyResult>();
    for (const j of snapshot?.journeys ?? []) byName.set(j.journey, j);

    const journeys = await Promise.all(
      defs.map(async (d) => {
        const inSnapshot = byName.get(d.name);
        if (inSnapshot) {
          return {
            name: d.name,
            persona: d.persona,
            stepTitles: d.steps.map((s) => s.title),
            lastStatus: inSnapshot.status,
            lastRunAt: snapshot?.run_at ?? null,
            hasDetail: true,
            steps: inSnapshot.steps,
          };
        }
        const hist = await lastHistoryFor(d.name);
        return {
          name: d.name,
          persona: d.persona,
          stepTitles: d.steps.map((s) => s.title),
          lastStatus: hist?.status ?? ("never-run" as const),
          lastRunAt: hist?.runAt ?? null,
          hasDetail: false,
          steps: null,
        };
      }),
    );

    return NextResponse.json({
      journeys,
      running: !!lock,
      lock,
      openFeedbackCount,
      historyTail,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
