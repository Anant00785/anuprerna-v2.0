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
  const token = cookieToken ?? await getServiceToken();

  const detail = await getBlogById(numericId, token);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
