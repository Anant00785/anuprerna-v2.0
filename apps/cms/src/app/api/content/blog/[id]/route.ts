/**
 * GET /api/content/blog/[id]
 *
 * Client-callable proxy for a single Blog detail record.
 * Uses the authenticated cookie if present, falls back to the service token.
 * Calls Loom /get/blog-content/{id} (server-side only — backend is not
 * reachable from the browser). Read-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBlogById } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { BackendFetchError } from "@/lib/backend-fetch-error";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  const token = await getBackendCallToken(cookieToken);

  // A backend refusal/outage is 502 with the real reason — never a 404, which
  // would tell the caller the record does not exist when we simply couldn't ask.
  let detail: Awaited<ReturnType<typeof getBlogById>>;
  try {
    detail = await getBlogById(numericId, token);
  } catch (e) {
    if (!(e instanceof BackendFetchError)) throw e;
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
