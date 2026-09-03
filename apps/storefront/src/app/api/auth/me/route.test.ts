import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers } from "@/test/msw";
import { LOOM_BASE_URL, LOOM_JWT_COOKIE } from "@/lib/loom/config";
import { BUYER_MODE_COOKIE } from "@/lib/buyer-mode";

// lib/loom/client is server-only; vitest has no RSC boundary to satisfy.
vi.mock("server-only", () => ({}));

// next/headers has no request scope under vitest — this fake is the cookie jar
// the route reads the session out of.
let sessionCookie: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "loom_jwt" && sessionCookie !== undefined ? { name, value: sessionCookie } : undefined,
    set: () => {},
    delete: () => {},
  }),
}));

process.env.AUTH_JWT_SECRET = "test-secret-do-not-ship";
const { signToken } = await import("@/lib/auth/token-helper");
const { GET } = await import("./route");

const future = () => Math.floor(Date.now() / 1000) + 3600;
const past = () => Math.floor(Date.now() / 1000) - 1;

beforeEach(() => {
  sessionCookie = undefined;
});

describe("GET /api/auth/me", () => {
  it("reports an anonymous visitor without calling the backend", async () => {
    // No MSW handler: onUnhandledRequest:"error" fails the test on any egress.
    const res = await GET();
    await expect(res.json()).resolves.toEqual({ authenticated: false });
  });

  it("tears the session down when the cookie is not a JWT at all", async () => {
    sessionCookie = "garbage";
    const res = await GET();

    await expect(res.json()).resolves.toEqual({ authenticated: false });
    // Both the session and the buyer-mode must be reset, not just ignored.
    expect(res.cookies.get(LOOM_JWT_COOKIE)?.value).toBe("");
    expect(res.cookies.get(LOOM_JWT_COOKIE)?.maxAge).toBe(0);
    expect(res.cookies.get(BUYER_MODE_COOKIE)?.value).toBe("guest");
  });

  it("reads a passwordless identity out of a token this server signed", async () => {
    sessionCookie = signToken({
      email: "  Buyer@Example.com ",
      name: "Asha Rao",
      contactNumber: "9990001111",
      buyerType: "b2b",
      exp: future(),
    });

    const res = await GET();
    const body = (await res.json()) as { authenticated: boolean; profile: Record<string, unknown> };

    expect(body.authenticated).toBe(true);
    expect(body.profile).toMatchObject({
      email: "buyer@example.com",
      name: "Asha Rao",
      firstName: "Asha",
      phone: "9990001111",
      buyerType: "b2b",
    });
    expect(res.cookies.get(BUYER_MODE_COOKIE)?.value).toBe("b2b");
  });

  it("does NOT trust a forged token's claims — it falls through to the backend", async () => {
    // Valid JWS shape, email + name present, signature from nobody.
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ email: "attacker@example.com", name: "Not Me", buyerType: "b2b", exp: future() })
    ).toString("base64url");
    sessionCookie = `${header}.${payload}.ZmFrZQ`;

    let sawBackendCall = false;
    useHandlers(
      http.get(`${LOOM_BASE_URL}/get/customer/profile`, () => {
        sawBackendCall = true;
        return HttpResponse.json({ success: false }, { status: 401 });
      })
    );

    const res = await GET();

    // The forged claims must never become the profile.
    expect(sawBackendCall).toBe(true);
    await expect(res.json()).resolves.toEqual({ authenticated: false });
  });

  it("falls back to the Loom profile for a legacy token and maps b2c by default", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "opaque" })).toString("base64url");
    sessionCookie = `${header}.${payload}.c2ln`;

    useHandlers(
      http.get(`${LOOM_BASE_URL}/get/customer/profile`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${sessionCookie}`);
        return HttpResponse.json({ entity: { name: "Ravi Kumar", email: "ravi@example.com" } });
      })
    );

    const res = await GET();
    const body = (await res.json()) as { authenticated: boolean; profile: Record<string, unknown> };

    expect(body.authenticated).toBe(true);
    expect(body.profile).toMatchObject({
      name: "Ravi Kumar",
      firstName: "Ravi",
      email: "ravi@example.com",
      buyerType: "b2c",
    });
    expect(res.cookies.get(BUYER_MODE_COOKIE)?.value).toBe("b2c");
  });

  it("reports logged-out (never a half-session) when the profile call fails", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "opaque" })).toString("base64url");
    sessionCookie = `${header}.${payload}.c2ln`;

    useHandlers(http.get(`${LOOM_BASE_URL}/get/customer/profile`, () => HttpResponse.error()));

    const res = await GET();
    await expect(res.json()).resolves.toEqual({ authenticated: false });
  });
});

describe("GET /api/auth/me — an expired session is torn down, not merely ignored", () => {
  it("clears the cookie and the buyer-mode for OUR OWN token once its exp has passed", async () => {
    // Signature genuinely ours; the clock has run out. Falling through to the
    // Loom profile fetch would answer authenticated:false while LEAVING the
    // dead cookie in the browser — a session that never actually ends.
    // No MSW handler is registered: any backend call fails the test.
    sessionCookie = signToken({ email: "buyer@example.com", name: "Asha Rao", exp: past() });

    const res = await GET();

    await expect(res.json()).resolves.toEqual({ authenticated: false });
    expect(res.cookies.get(LOOM_JWT_COOKIE)?.value).toBe("");
    expect(res.cookies.get(LOOM_JWT_COOKIE)?.maxAge).toBe(0);
    expect(res.cookies.get(BUYER_MODE_COOKIE)?.value).toBe("guest");
  });

  it("never serves the profile carried by an expired token", async () => {
    sessionCookie = signToken({
      email: "buyer@example.com",
      name: "Asha Rao",
      buyerType: "b2b",
      exp: past(),
    });

    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(body.authenticated).toBe(false);
    expect(body).not.toHaveProperty("profile");
  });
});
