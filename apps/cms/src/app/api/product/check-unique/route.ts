/**
 * GET /api/product/check-unique?field=name|sku&value=<v>
 *
 * Server-side bridge to the native (public, no admin token needed) uniqueness
 * check endpoints — GET /check/unique-product/name/{name} and
 * GET /check/unique-product/sku/{sku}. Read-only; never writes.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const field = sp.get("field");
  const value = sp.get("value") ?? "";

  if ((field !== "name" && field !== "sku") || !value.trim()) {
    return NextResponse.json({ success: false, message: "field must be name|sku and value is required" }, { status: 400 });
  }

  const path = field === "name" ? "check/unique-product/name" : "check/unique-product/sku";
  try {
    const res = await fetch(`${BACKEND}/${path}/${encodeURIComponent(value.trim())}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({ success: false, message: "Empty response from backend" }));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : "Backend unreachable" }, { status: 503 });
  }
}
