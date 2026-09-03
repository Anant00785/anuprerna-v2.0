import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { useHandlers } from "@/test/msw";

// The proxy targets NEXT_PUBLIC_API_URL. Pin it so the MSW handlers below are
// the only thing this test can ever reach.
const TARGET = "http://backend.test";
process.env.NEXT_PUBLIC_API_URL = TARGET;
process.env.LOOM_TABLE_EXPLORER_TOKEN = "table-explorer-token";

// The route logs every hop; keep the test output readable.
vi.spyOn(console, "log").mockImplementation(() => {});

const { GET, POST, DELETE } = await import("./route");

const params = (...path: string[]) => ({ params: Promise.resolve({ path }) });

function req(url: string, init: RequestInit = {}) {
  return new NextRequest(new Request(url, init));
}

afterAll(() => {
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.LOOM_TABLE_EXPLORER_TOKEN;
});

describe("/api/backend/[...path] — the strangler boundary", () => {
  it("rejoins the catch-all segments and preserves the query string", async () => {
    let seen: string | undefined;
    useHandlers(
      http.get(`${TARGET}/get/product/list`, ({ request }) => {
        seen = request.url;
        return HttpResponse.json({ success: true });
      })
    );

    const res = await GET(
      req("http://localhost:3000/api/backend/get/product/list?page=2&size=10"),
      params("get", "product", "list")
    );

    expect(seen).toBe(`${TARGET}/get/product/list?page=2&size=10`);
    expect(res.status).toBe(200);
  });

  it("rewrites Origin/Referer and injects the table-explorer token the backend demands", async () => {
    let headers: Headers | undefined;
    useHandlers(
      http.get(`${TARGET}/get/forex-exchange-rate/latest`, ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({ success: true });
      })
    );

    await GET(
      req("http://localhost:3000/api/backend/get/forex-exchange-rate/latest", {
        headers: { origin: "http://localhost:3000" },
      }),
      params("get", "forex-exchange-rate", "latest")
    );

    expect(headers?.get("origin")).toBe("https://anuprerna.com");
    expect(headers?.get("referer")).toBe("https://anuprerna.com/");
    expect(headers?.get("x-loom-table-explorer-token")).toBe("table-explorer-token");
    // The inbound Host must not follow the request to a different host.
    expect(headers?.get("host")).not.toBe("localhost:3000");
  });

  it("promotes the jwt_token cookie to an Authorization header", async () => {
    let auth: string | null = null;
    useHandlers(
      http.get(`${TARGET}/get/cart-item/list`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ success: true });
      })
    );

    await GET(
      req("http://localhost:3000/api/backend/get/cart-item/list", {
        headers: { cookie: "jwt_token=session-jwt" },
      }),
      params("get", "cart-item", "list")
    );

    expect(auth).toBe("Bearer session-jwt");
  });

  it("does NOT attach a stale session to an auth entry point", async () => {
    // Sending the caller's existing session to /authenticate would let the
    // backend answer for the wrong identity.
    let auth: string | null = "unset";
    useHandlers(
      http.post(`${TARGET}/authenticate/email`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ success: true, jwt: "new" });
      })
    );

    await POST(
      req("http://localhost:3000/api/backend/authenticate/email", {
        method: "POST",
        headers: { cookie: "jwt_token=old-session", "content-type": "application/json" },
        body: JSON.stringify({ username: "a@b.c", password: "x" }),
      }),
      params("authenticate", "email")
    );

    expect(auth).toBeNull();
  });

  it("does not overwrite an Authorization header the caller already set", async () => {
    let auth: string | null = null;
    useHandlers(
      http.get(`${TARGET}/get/address-list`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ success: true });
      })
    );

    await GET(
      req("http://localhost:3000/api/backend/get/address-list", {
        headers: { cookie: "jwt_token=cookie-jwt", authorization: "Bearer explicit-jwt" },
      }),
      params("get", "address-list")
    );

    expect(auth).toBe("Bearer explicit-jwt");
  });

  it("forwards the request body on a write", async () => {
    let body: unknown;
    useHandlers(
      http.post(`${TARGET}/add/cart-item`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    await POST(
      req("http://localhost:3000/api/backend/add/cart-item", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sku: "ABC", quantity: 2 }),
      }),
      params("add", "cart-item")
    );

    expect(body).toEqual({ sku: "ABC", quantity: 2 });
  });

  it("passes a backend rejection through unchanged instead of masking it as success", async () => {
    useHandlers(
      http.get(`${TARGET}/get/cart-item/list`, () =>
        HttpResponse.json({ success: false, message: "unauthorized" }, { status: 401 })
      )
    );

    const res = await GET(
      req("http://localhost:3000/api/backend/get/cart-item/list"),
      params("get", "cart-item", "list")
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ success: false, message: "unauthorized" });
  });

  it("answers 502 with the legacy envelope when the backend is unreachable", async () => {
    useHandlers(http.delete(`${TARGET}/delete/cart-item/7`, () => HttpResponse.error()));

    const res = await DELETE(
      req("http://localhost:3000/api/backend/delete/cart-item/7", { method: "DELETE" }),
      params("delete", "cart-item", "7")
    );

    expect(res.status).toBe(502);
    // Callers destructure payload/entity off the envelope; a bare {error} would crash them.
    await expect(res.json()).resolves.toMatchObject({
      error: true,
      success: false,
      payload: [],
      entity: [],
    });
  });
});
