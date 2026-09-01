/**
 * POST /api/product/save
 *
 * Server-side bridge: reads auth cookie, forwards the PATCH to our NestJS
 * wrapper (:8090) which writes to our Postgres sandbox. NEVER touches live Loom.
 *
 * Body: { type: "fabric" | "finished", payload: WritePayload }
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  let body: { type?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  const { type, payload } = body;
  if (type !== "fabric" && type !== "finished") {
    return NextResponse.json(
      { success: false, message: "type must be fabric or finished" },
      { status: 400 },
    );
  }
  if (!payload) {
    return NextResponse.json(
      { success: false, message: "payload is required" },
      { status: 400 },
    );
  }

  const path =
    type === "fabric" ? "/update/fabric-product" : "/update/finished-product";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: "localhost",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND}${path}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: `Backend unreachable: ${(err as Error).message}`,
      },
      { status: 503 },
    );
  }

  const data = await upstream.json().catch(() => ({
    success: false,
    message: "Empty response from backend",
  }));
  return NextResponse.json(data, { status: upstream.status });
}
