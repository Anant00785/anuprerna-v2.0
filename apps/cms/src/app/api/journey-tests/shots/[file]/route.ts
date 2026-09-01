/**
 * GET /api/journey-tests/shots/[file] — serve a failure screenshot (READ-ONLY).
 *
 * Path-traversal guarded: resolveShotPath() only accepts a bare `*.png`
 * basename (regex allowlist) AND verifies the realpath resolves inside
 * journeys/shots/ before reading — so `..%2F..%2Fsomething` (which Next
 * decodes into the [file] param) is rejected rather than escaping the dir.
 */
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolveShotPath } from "@/lib/journey-tests-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ file: string }> },
) {
  const { file } = await ctx.params;
  const abs = await resolveShotPath(file);
  if (!abs) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const buf = await readFile(abs);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
