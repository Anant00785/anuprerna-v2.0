/**
 * /orders — Orders list (Server Component shell, Milestone 3)
 *
 * Renders the shell immediately. Data is loaded client-side from /api/orders
 * (the Loom order dump is ~33 MB / ~45 s — loading it server-side would block
 * the initial HTML response; client-side shows a loading state instead).
 *
 * Write actions are deferred to cutover — this is a read-only view.
 * Custom orders are a bespoke corner deferred to the bespoke-corners pause.
 */

import { OrdersClient } from "./OrdersClient";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return <OrdersClient />;
}
