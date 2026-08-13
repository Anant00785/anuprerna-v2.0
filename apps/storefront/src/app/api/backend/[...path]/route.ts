import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

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
  const token = process.env.LOOM_TABLE_EXPLORER_TOKEN;
  if (!token) {
    throw new Error(
      "LOOM_TABLE_EXPLORER_TOKEN is not set. The storefront proxy cannot authenticate " +
        "against the legacy backend without it — see apps/storefront/.env.example.",
    );
  }
  return token;
}

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join("/");
  const url = new URL(request.url);
  const targetUrl = `${env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "")}/${targetPath}${url.search}`;

  const requestHeaders = new Headers(request.headers);
  
  // Clean host header for proxy target
  requestHeaders.delete("host");
  
  // Set origin & referer to http://localhost:4200 so Spring Boot CORS filter accepts the request
  requestHeaders.set("origin", "http://localhost:4200");
  requestHeaders.set("referer", "http://localhost:4200/");
  
  // Inject required Loom Table Explorer Header
  requestHeaders.set("X-Loom-Table-Explorer-Token", loomTableExplorerToken());

  // Preserve fingerprint header if passed for tenant email decryption
  if (requestHeaders.has("x-loom-tenant-decrypt-fingerprint")) {
    requestHeaders.set(
      "X-Loom-Tenant-Decrypt-Fingerprint",
      requestHeaders.get("x-loom-tenant-decrypt-fingerprint") || ""
    );
  }

  // Forward Auth token from cookie if available and header not set.
  //
  // Never on the authentication/registration routes: a stale or expired
  // `jwt_token` cookie would be attached to the login request itself, and Loom
  // rejects the bad bearer before it ever checks the credentials — so a correct
  // password comes back 401 and the only way out is clearing cookies by hand.
  const isAuthEntryPoint = /^(authenticate|customer\/registration|check-email|validate\/provider|send\/password-reset|reset\/password)\b/.test(
    targetPath
  );
  const authCookie = request.cookies.get("jwt_token")?.value;
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
    // Node's fetch has already decompressed the body, so forwarding Loom's
    // `content-encoding: gzip` makes the browser try to gunzip plain JSON and
    // fail the request with a bare "Failed to fetch" — no status, no body, so it
    // surfaces as a network outage rather than an API error. `content-length`
    // goes for the same reason: it describes the compressed bytes.
    // The CMS proxy already does this; this one only dropped transfer-encoding.
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: true, message: err?.message || "Proxy request failed" },
      { status: 500 }
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
