/**
 * GET /api/users/[uid]/cart — read-only per-user cart drill data.
 *
 * Backs the /users/[id]/cart page (and is directly consumable). Delegates to the
 * shared server-only fetcher getUserCartDrill, which forwards to the :8090 wrapper
 * with a genuine live-Loom token (the sandbox admin token is rejected by the
 * live-proxied /get/tenant/cart-item/list/{uid} + /get/tenant/profile/{uid}
 * endpoints with "credentials tampered"). GET-only; no mutation path exists.
 * Returns the discriminated Result verbatim ({ ok, data } | { ok:false, error }).
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserCartDrill } from "@/app/users/[id]/cart/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ uid: string }> },
) {
  const { uid } = await ctx.params;
  const result = await getUserCartDrill(decodeURIComponent(uid));
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
