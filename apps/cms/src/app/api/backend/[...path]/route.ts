import { NextRequest, NextResponse } from 'next/server';

const TARGET_HOST = process.env.BACKEND_URL || 'http://localhost:3000';

async function handleProxy(request: NextRequest, params: { path?: string[] }) {
  const pathArray = params?.path || [];
  const targetPath = pathArray.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${TARGET_HOST}/${targetPath}${search}`;

  // Clone headers and set origin/host to match backend Angular website origin
  const headers = new Headers(request.headers);
  headers.set('host', 'localhost:3000');
  // Do not override origin/referer for local development
  headers.delete('origin');
  headers.delete('referer');

  // Remove next.js / browser internal headers that cause backend conflicts
  headers.delete('x-forwarded-host');
  headers.delete('x-forwarded-proto');
  headers.delete('x-forwarded-port');
  headers.delete('x-forwarded-for');

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
