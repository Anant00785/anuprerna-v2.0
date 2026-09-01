/**
 * POST /api/product/upload-image
 *
 * Server-side bridge for the product-image uploader (components/ui/ImageUpload).
 * Reads the weave session cookie (= SANDBOX_ADMIN_TOKEN) and forwards the
 * base64 image to our NestJS wrapper's admin-gated POST /upload/image, which
 * stores it in the sandbox MinIO bucket and returns a servable :8090 URL.
 * NEVER touches live Loom or its AWS S3. The admin token is added server-side
 * here and never exposed to the browser (same pattern as /api/product/save).
 *
 * Body: { filename?: string; contentType: string; dataBase64: string }
 * Returns the wrapper's { success, url, key, message } verbatim.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  let body: { filename?: string; contentType?: string; dataBase64?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  if (!body?.contentType || !body?.dataBase64) {
    return NextResponse.json(
      { success: false, message: "contentType and dataBase64 are required" },
      { status: 400 },
    );
  }

  const headers: Record<string, string> = { "Content-Type": "application/json", Origin: "localhost" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND}/upload/image`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: `Backend unreachable: ${(err as Error).message}` },
      { status: 503 },
    );
  }

  const data = await upstream.json().catch(() => ({ success: false, message: "Empty response from backend" }));
  return NextResponse.json(data, { status: upstream.status });
}
