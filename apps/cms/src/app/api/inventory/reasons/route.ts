/**
 * GET /api/inventory/reasons
 *
 * Returns the list of inventory adjustment reasons from Loom.
 * Auth: caller session cookie -> sandbox admin token (SANDBOX_ADMIN_TOKEN).
 * Read-only -- GET only, no writes.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInventoryAdjustmentReasons } from "@/lib/api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  const token = await getBackendCallToken(cookieToken);

  const reasons = await getInventoryAdjustmentReasons(token);
  return NextResponse.json(reasons);
}
