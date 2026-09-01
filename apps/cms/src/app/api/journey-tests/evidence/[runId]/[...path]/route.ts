/**
 * GET /api/journey-tests/evidence/[runId]/[...path] — serve a per-step
 * screenshot (jpg) or a case video (mp4) from journeys/evidence/<runId>/.
 * Path-traversal guarded (runId format + extension allowlist + realpath
 * containment). READ-ONLY.
 */
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolveEvidencePath, contentTypeFor } from "@/lib/qa-center-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ runId: string; path: string[] }> },
) {
  const { runId, path } = await ctx.params;
  const abs = await resolveEvidencePath(runId, path || []);
  if (!abs) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const buf = await readFile(abs);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(abs),
        "Cache-Control": "private, max-age=300",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
