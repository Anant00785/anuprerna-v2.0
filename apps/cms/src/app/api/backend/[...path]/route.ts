import { NextRequest, NextResponse } from 'next/server';

// The CMS talks to the live legacy Java backend, not `apps/api` — see apps/cms/CLAUDE.md
// ("How data flows"). The old `localhost:3000` default pointed at the NestJS app, which
// nothing in this app calls, so every proxied request 502'd whenever it wasn't running.
const TARGET_HOST = process.env.BACKEND_URL || 'https://loom-v2.anuprerna.com';

async function handleProxy(request: NextRequest, params: { path?: string[] }) {
  const pathArray = params?.path || [];
  const targetPath = pathArray.join('/');
  const search = request.nextUrl.search;

  const springBase = 'https://loom-v2.anuprerna.com';
  const nestBase = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

  const isAuth = targetPath === 'authenticate/email' || targetPath === 'authenticate';

  // Build target URLs
  const primaryUrl = isAuth
    ? `${springBase}/authenticate/email${search}`
    : `${springBase}/${targetPath}${search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('origin', 'https://anuprerna.com');
  headers.set('referer', 'https://anuprerna.com/');

  // Remove internal Next.js headers
  headers.delete('x-forwarded-host');
  headers.delete('x-forwarded-proto');
  headers.delete('x-forwarded-port');
  headers.delete('x-forwarded-for');

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
    let backendResponse: Response;
    try {
      backendResponse = await fetch(primaryUrl, {
        method: request.method,
        headers: headers,
        body: body,
        redirect: 'follow',
      });
    } catch (primaryErr) {
      // If primary (SpringBoot) fails and is auth, try NestJS fallback
      if (isAuth) {
        backendResponse = await fetch(`${nestBase}/auth/authenticate${search}`, {
          method: request.method,
          headers: headers,
          body: body,
          redirect: 'follow',
        });
      } else {
        throw primaryErr;
      }
    }

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
