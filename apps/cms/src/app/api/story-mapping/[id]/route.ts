/**
 * GET /api/story-mapping/[id]
 * Server-side bridge: reads auth cookie, forwards to the NestJS wrapper (:8090)
 * mapping-detail endpoint. Used to refetch the craft/cluster mapping after a save.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const headers: Record<string, string> = { "Content-Type": "application/json", Origin: "localhost" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const upstream = await fetch(`${BACKEND}/get/story/mapping-detail/product/${id}`, {
      headers,
      cache: "no-store",
    });
    const data = await upstream.json().catch(() => ({ success: false }));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: `Backend unreachable: ${(err as Error).message}` },
      { status: 503 },
    );
  }
}
