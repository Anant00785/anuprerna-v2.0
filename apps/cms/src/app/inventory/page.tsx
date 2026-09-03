/**
 * /inventory — Inventory management (Server Component, Milestone 3)
 *
 * Fetches adjustments, out-of-stock requests, warehouses, and adjustment
 * reasons in parallel using service token. Renders in tabbed InventoryClient.
 * Write-safety: no Loom writes — read + validate-payload only.
 */

import React from "react";
import { cookies } from "next/headers";
import {
  getInventoryAdjustments,
  getInventoryAdjustmentReasons,
  getOOSRequests,
  getWarehouses,
} from "@/lib/api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { InventoryClient } from "./InventoryClient";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function InventoryPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  const token = await getBackendCallToken(cookieToken);

  const [adjustments, oosRequests, warehouses, reasons] = await Promise.all([
    getInventoryAdjustments(token),
    getOOSRequests(token),
    getWarehouses(token),
    getInventoryAdjustmentReasons(token),
  ]);

  return (
    <InventoryClient
      adjustments={adjustments}
      oosRequests={oosRequests}
      warehouses={warehouses}
      reasons={reasons}
    />
  );
}
