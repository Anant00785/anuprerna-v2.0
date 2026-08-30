import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://loom-v2.anuprerna.com' : 'http://localhost:3000')).replace(/\/$/, '');
const FALLBACK_URL = 'https://loom-v2.anuprerna.com';

async function handleProxy(request: NextRequest, params: { path?: string[] }) {
  const pathArray = params?.path || [];
  const targetPath = pathArray.join('/');
  const search = request.nextUrl.search;

  // Handle auth route mapping: NestJS uses /auth/authenticate
  const isAuth = targetPath === 'authenticate/email' || targetPath === 'authenticate';
  const nestPath = isAuth && BACKEND_URL.includes('localhost') ? 'auth/authenticate' : targetPath;

  const targetUrl = `${BACKEND_URL}/${nestPath}${search}`;
  const fallbackUrl = isAuth ? `${FALLBACK_URL}/authenticate/email${search}` : `${FALLBACK_URL}/${targetPath}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (
      ![
        'host',
        'content-length',
        'connection',
        'transfer-encoding',
        'x-forwarded-host',
        'x-forwarded-proto',
        'x-forwarded-port',
        'x-forwarded-for',
      ].includes(k)
    ) {
      headers.set(key, value);
    }
  });

  headers.set('origin', 'https://anuprerna.com');
  headers.set('referer', 'https://anuprerna.com/');

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
      const isLocal = BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1');
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: headers,
        body: body,
        redirect: 'follow',
      };

      if (isLocal) {
        fetchOptions.signal = AbortSignal.timeout(2500);
      }

      backendResponse = await fetch(targetUrl, fetchOptions);

      // If 404 on primary, or if auth fails on primary local DB, attempt fallback to Loom production backend
      if ((backendResponse.status === 404 || (isAuth && backendResponse.status === 401)) && BACKEND_URL !== FALLBACK_URL) {
        backendResponse = await fetch(fallbackUrl, {
          method: request.method,
          headers: headers,
          body: body,
          redirect: 'follow',
        });
      } else if (backendResponse.ok && targetPath.includes('preview-list') && BACKEND_URL !== FALLBACK_URL) {
        const clone = backendResponse.clone();
        try {
          const json = await clone.json();
          const list = json.productPreviewList || json.fabricOverviewList || json.products || [];
          if (!list || list.length === 0) {
            const fbRes = await fetch(fallbackUrl, {
              method: request.method,
              headers: headers,
              body: body,
              redirect: 'follow',
            });
            if (fbRes.ok) {
              backendResponse = fbRes;
            }
          }
        } catch {
          // ignore json parse error
        }
      }
    } catch (primaryErr) {
      // Fallback to production backend if primary server connection fails or times out
      backendResponse = await fetch(fallbackUrl, {
        method: request.method,
        headers: headers,
        body: body,
        redirect: 'follow',
      });
    }

    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

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
