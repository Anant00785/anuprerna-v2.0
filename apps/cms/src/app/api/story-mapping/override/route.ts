/**
 * POST /api/story-mapping/override
 * Server-side bridge: forwards a manual craft/cluster override to the NestJS
 * wrapper (:8090), which removes stale tags, adds the new ones, and records the
 * override in our Postgres sandbox. NEVER touches live Loom.
 *
 * Body: { productId, craftStoryId, clusterStoryIds: number[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSandboxToken } from "@/lib/sandbox-token";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";

export async function POST(req: NextRequest) {
  const token = getSandboxToken(); // gated native write (override craft/cluster)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }
  const headers: Record<string, string> = { "Content-Type": "application/json", Origin: "localhost" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const upstream = await fetch(`${BACKEND}/override/story-product/craft-cluster`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await upstream.json().catch(() => ({ success: false, message: "Empty response from backend" }));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: `Backend unreachable: ${(err as Error).message}` },
      { status: 503 },
    );
  }
}
