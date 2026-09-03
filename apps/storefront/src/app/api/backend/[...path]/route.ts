import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { LOOM_JWT_COOKIE } from "@/lib/loom/config";

// The legacy backend's `loom.config.table-explorer.access-token`. This was
// hardcoded here and pushed in aa17d9d; it is in git history permanently and
// cannot be rotated (it is shared with other systems), so the exposure is
// recorded as accepted in docs/KNOWN-GAPS.md. Reading it from the environment
// stops it spreading into new diffs, builds and doc examples.
//
// Server-side only: this file is a route handler, so the value is never sent
// to the browser. Do NOT rename this to NEXT_PUBLIC_*, which would inline it
// into the client bundle.
// Checked per request rather than at module load: this module is evaluated
// during `next build`, where the variable is legitimately absent, so throwing
// at load time would break the build instead of the request.
function loomTableExplorerToken(): string {
  return process.env.LOOM_TABLE_EXPLORER_TOKEN || "";
}

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join("/");
  const url = new URL(request.url);

  const nestBase = (
    process.env.NEXT_PUBLIC_API_URL ||
    env.NEXT_PUBLIC_API_URL ||
    env.NEXT_PUBLIC_NEST_API_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");

  const targetUrl = `${nestBase}/${targetPath}${url.search}`;
  console.log(`[Storefront Proxy] ${request.method} ${targetPath} -> ${targetUrl}`);

  const requestHeaders = new Headers(request.headers);
  
  // Clean host header for proxy target
  requestHeaders.delete("host");
  
  // Set origin & referer to https://anuprerna.com so Spring Boot CORS & domain filter accepts the request
  requestHeaders.set("origin", "https://anuprerna.com");
  requestHeaders.set("referer", "https://anuprerna.com/");
  
  // Inject required Loom Table Explorer Header if available
  const token = process.env.LOOM_TABLE_EXPLORER_TOKEN;
  if (token) {
    requestHeaders.set("X-Loom-Table-Explorer-Token", token);
  }

  // Preserve fingerprint header if passed for tenant email decryption
  if (requestHeaders.has("x-loom-tenant-decrypt-fingerprint")) {
    requestHeaders.set(
      "X-Loom-Tenant-Decrypt-Fingerprint",
      requestHeaders.get("x-loom-tenant-decrypt-fingerprint") || ""
    );
  }

  // Forward Auth token from cookie if available and header not set.
  const isAuthEntryPoint = /^(authenticate|customer\/registration|check-email|validate\/provider|send\/password-reset|reset\/password)\b/.test(
    targetPath
  );
  // `loom_jwt` is the ONE session cookie (httpOnly, set by /api/auth/*). It is
  // deliberately unreadable from JS, so the browser cannot attach the bearer
  // itself — this proxy is what turns the session into an Authorization header.
  // The old `jwt_token` cookie this used to read was written by a login form
  // that is no longer mounted, so it was always absent and every proxied call
  // went out unauthenticated (401). See docs/KNOWN-GAPS.md.
  const authCookie = request.cookies.get(LOOM_JWT_COOKIE)?.value
    ?? request.cookies.get("jwt_token")?.value;
  if (authCookie && !requestHeaders.has("authorization") && !isAuthEntryPoint) {
    requestHeaders.set("Authorization", `Bearer ${authCookie}`);
  }

  let body: BodyInit | undefined = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: true, success: false, payload: [], entity: [], message: err?.message || "Backend request failed" },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}
