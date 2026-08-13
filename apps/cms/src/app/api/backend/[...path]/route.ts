import { NextRequest, NextResponse } from 'next/server';

// The CMS talks to the live legacy Java backend, not `apps/api` — see apps/cms/CLAUDE.md
// ("How data flows"). The old `localhost:3000` default pointed at the NestJS app, which
// nothing in this app calls, so every proxied request 502'd whenever it wasn't running.
const TARGET_HOST = process.env.BACKEND_URL || 'https://loom-v2.anuprerna.com';

async function handleProxy(request: NextRequest, params: { path?: string[] }) {
  const pathArray = params?.path || [];
  const targetPath = pathArray.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${TARGET_HOST}/${targetPath}${search}`;

  // Clone headers and set origin to match the legacy Weave console's origin.
  // Load-bearing, per apps/cms/CLAUDE.md rule 3: the backend applies
  // `@NVerseDomainValidated` to 114 of 249 controllers, and that check needs a
  // *present and allowlisted* Origin. `http://localhost:4201` is Weave's dev
  // origin and is on the allowlist (`loom/support/CORSOrigin.java:51`).
  // Deleting these headers — as this did — fails that check outright.
  const headers = new Headers(request.headers);
  headers.delete('host'); // let fetch derive it from TARGET_HOST
  headers.set('origin', 'http://localhost:4201');
  headers.set('referer', 'http://localhost:4201/');

  // Remove next.js / browser internal headers that cause backend conflicts
  headers.delete('x-forwarded-host');
  headers.delete('x-forwarded-proto');
  headers.delete('x-forwarded-port');
  headers.delete('x-forwarded-for');

  // Every Table Explorer endpoint requires this alongside the Super-User bearer
  // token (Loom change of 2026-08-01, after the previous token leaked). Injected
  // unconditionally: the proxy can't tell a table-explorer path from any other,
  // and Loom ignores it elsewhere. Server-side only — never NEXT_PUBLIC_.
  const tableExplorerToken = process.env.LOOM_TABLE_EXPLORER_TOKEN;
  if (tableExplorerToken) {
    headers.set('X-Loom-Table-Explorer-Token', tableExplorerToken);
  }

  let body: ArrayBuffer | undefined = undefined;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    try {
      body = await request.arrayBuffer();
    } catch {
      // no body
    }
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      redirect: 'follow',
    });

    const responseHeaders = new Headers(backendResponse.headers);
    // Delete content-encoding and content-length because Node fetch decompresses the ArrayBuffer
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    // Ensure browser CORS allows client access
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const data = await backendResponse.arrayBuffer();
    return new NextResponse(data, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Proxy connection error: ${err.message}` },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return handleProxy(request, params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return handleProxy(request, params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return handleProxy(request, params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return handleProxy(request, params);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
