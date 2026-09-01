/**
 * /artisanflow — Production (attention-first order board).
 *
 * The redesigned daily face of ArtisanFlow: DEAD SIMPLE, order-level,
 * attention-first. The complex workflow engine still lives underneath
 * (/artisanflow/workflow/*, per-item instance detail) — this surface answers
 * only the team's #1 daily question: which live production orders need
 * attention, and WHAT exactly. Read-only tracking; all attention flags are
 * derived from live Loom step/subprocess dates + pending feedback.
 *
 * No server-side data fetching (see /artisanflow/api/board) — this is an
 * internal tool, not a page anyone needs pre-rendered or indexed, so the
 * shell renders instantly and OrderBoardClient fetches + shows its own
 * loading state client-side instead of blocking navigation on the backend.
 */

import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { OrderBoardClient } from "./OrderBoardClient";

export default function ArtisanFlowHomePage() {
  return (
    <ArtisanFlowShell crumb="Production">
      <OrderBoardClient />
    </ArtisanFlowShell>
  );
}
