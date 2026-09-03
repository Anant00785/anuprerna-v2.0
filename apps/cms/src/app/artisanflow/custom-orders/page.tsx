/**
 * /artisanflow/custom-orders — Custom (made-to-order) order list.
 *
 * Server component: the full list (a few hundred rows) fetched once via the
 * Loom service token through the read-only :8090 wrapper, then handed to a
 * client table for filter/sort/search/pagination. READ-ONLY.
 *
 * The per-order DELAY MAGNITUDE that ranks the list is computed here, server
 * side, against one explicit `now` (see orderDelay.ts) and shipped as plain
 * numbers — no component does date math, so SSR and the client cannot diverge.
 */

import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { getCustomOrderList, BackendFetchError, type CustomOrderPreview } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { CustomOrdersClient } from "./CustomOrdersClient";
import { getCustomOrderDelays, type CustomOrderDelayMap } from "./orderDelay";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

/** Rows per upstream call. The endpoint has no server-side cap (verified
 *  2026-08-17: pageSize=1000 returns every row), so this bounds one hop only.
 *  Sized ABOVE the current table (323 rows) on purpose: this query is
 *  expensive upstream -- it explodes every order into its items and joins the
 *  workflow mapping, measured at ~2.0-2.3 s per call regardless of page size --
 *  so a page size that needs two round trips doubles the page's whole cost for
 *  no benefit. At 500 the loop makes exactly ONE call today and only starts
 *  paging if the table grows past it, which is the cheap case either way. */
const FETCH_PAGE = 500;
/** Safety stop, in PAGES, so a backend that stopped honouring the offset can
 *  never spin this loop forever. 20 x 500 = 10,000 orders of headroom. */
const MAX_PAGES = 20;

/**
 * Fetch EVERY custom order, not the first N.
 *
 * This previously asked for `pageSize: 300` and stopped there, which silently
 * truncated a 323-row table: 23 real, non-deleted orders were unreachable on
 * the page and the header confidently read "300". A hard-coded page size is
 * always a latent version of that bug, so page through instead.
 *
 * ⚠️ `pageNumber` on this endpoint is a RAW ROW OFFSET, not a page index —
 * Loom binds :pageNo straight into OFFSET and the wrapper reproduces it
 * faithfully (backend orders.controller.ts). Incrementing it by 1 per page, as
 * a page index, re-reads the same window shifted by one row. Advance it by
 * FETCH_PAGE.
 */
async function getAllCustomOrders(token?: string): Promise<CustomOrderPreview[]> {
  const all: CustomOrderPreview[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await getCustomOrderList(
      { pageNumber: page * FETCH_PAGE, pageSize: FETCH_PAGE },
      token,
    );
    all.push(...batch);
    if (batch.length < FETCH_PAGE) break;
  }
  return all;
}

export default async function CustomOrdersPage() {
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);
  // Bare await -> opaque Next 500 on a wrapper outage. Render the shared
  // ErrorBanner instead, like the rest of this tree.
  let orders: CustomOrderPreview[] = [];
  let fetchError: BackendFetchError | null = null;
  try {
    orders = await getAllCustomOrders(token);
  } catch (e) {
    if (e instanceof BackendFetchError) fetchError = e;
    else throw e;
  }

  // Ranking data. Supplementary by design: if it fails the list still renders,
  // just unranked — the delay map degrades to empty rather than 500ing a page
  // whose primary job is showing orders.
  let delays: CustomOrderDelayMap = { now: Date.now(), byOrder: {}, jobsInspected: 0 };
  if (!fetchError && orders.length) {
    try {
      delays = await getCustomOrderDelays(orders, token);
    } catch (e) {
      if (!(e instanceof BackendFetchError)) throw e;
      console.error("[custom-orders] delay ranking unavailable:", e.message);
    }
  }

  return (
    <ArtisanFlowShell crumb="Custom Orders">
      {fetchError ? (
        <ErrorBanner message={fetchError.message} />
      ) : (
        <CustomOrdersClient orders={orders} delays={delays.byOrder} />
      )}
    </ArtisanFlowShell>
  );
}
