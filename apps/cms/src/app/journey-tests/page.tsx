/**
 * /journey-tests — Journey Tests (server entry).
 *
 * Client-shell page (like /data-sync): data loads client-side from the
 * /api/journey-tests/* host routes so the run-trigger + polling can live in
 * one component. The WeaveShell chrome is applied by the layout via
 * JourneyTestsClient itself (mirrors DataSyncClient's pattern).
 */
import React from "react";
import { JourneyTestsClient } from "./JourneyTestsClient";

export const dynamic = "force-dynamic";

export default function JourneyTestsPage() {
  return <JourneyTestsClient />;
}
