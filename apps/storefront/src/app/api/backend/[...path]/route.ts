import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

const LOOM_TABLE_EXPLORER_TOKEN =
  "OynUbIy8QLa3OzJOwrzKxYKBrvk468dD8obJVRg1U7eI8RdInEP6X4gbtACXiqIZtRJHu9G7EEdeC5vHeKT951lhRETLMzWgbpfhXlf1B9UvyxlWpo5Q3nVqelPF6bgC";

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
  requestHeaders.set("X-Loom-Table-Explorer-Token", LOOM_TABLE_EXPLORER_TOKEN);

  // Preserve fingerprint header if passed for tenant email decryption
  if (requestHeaders.has("x-loom-tenant-decrypt-fingerprint")) {
    requestHeaders.set(
      "X-Loom-Tenant-Decrypt-Fingerprint",
      requestHeaders.get("x-loom-tenant-decrypt-fingerprint") || ""
    );
  }

  // Forward Auth token from cookie if available and header not set
  const authCookie = request.cookies.get("jwt_token")?.value;
  if (authCookie && !requestHeaders.has("authorization")) {
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
