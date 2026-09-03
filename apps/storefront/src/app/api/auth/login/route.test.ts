import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { useHandlers } from "@/test/msw";
import { LOOM_BASE_URL } from "@/lib/loom/config";
import { LOOM_JWT_COOKIE } from "@/lib/loom/config";

// The route sets the session cookie through next/headers, which has no request
// scope under vitest — this fake records what it was asked to set.
// lib/loom/client is server-only; vitest has no RSC boundary to satisfy.
vi.mock("server-only", () => ({}));

const cookieJar = new Map<string, { value: string; options: Record<string, unknown> }>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (name: string, value: string, options: Record<string, unknown>) =>
      cookieJar.set(name, { value, options }),
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)!.value } : undefined),
  }),
}));

const { POST } = await import("./route");

const post = (body: unknown) =>
  POST(new Request("http://localhost:3000/api/auth/login", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => cookieJar.clear());

describe("POST /api/auth/login", () => {
  it("calls Loom's /authenticate/email with {username,password} and parks the returned JWT in an httpOnly cookie", async () => {
    let capturedBody: unknown;
    let capturedUrl: string | undefined;
    useHandlers(
      http.post(`${LOOM_BASE_URL}/authenticate/email`, async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, message: "", jwt: "signed.jwt.token" });
      })
    );

    const res = await post({ email: "  Buyer@Example.com ", password: "hunter2" });

    expect(capturedUrl).toBe(`${LOOM_BASE_URL}/authenticate/email`);
    // Loom's NverseAuthenticationController binds exactly these two fields.
    expect(capturedBody).toEqual({ username: "buyer@example.com", password: "hunter2" });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });

    const cookie = cookieJar.get(LOOM_JWT_COOKIE);
    expect(cookie?.value).toBe("signed.jwt.token");
    expect(cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("answers 401 and sets no session when the backend rejects the credentials", async () => {
    useHandlers(
      http.post(`${LOOM_BASE_URL}/authenticate/email`, () =>
        HttpResponse.json({ success: false, message: "Bad credentials" }, { status: 401 })
      )
    );

    const res = await post({ email: "buyer@example.com", password: "wrong" });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ success: false, message: "Bad credentials" });
    expect(cookieJar.size).toBe(0);
  });

  it("never mints a session of its own when the backend is unreachable", async () => {
    useHandlers(
      http.post(`${LOOM_BASE_URL}/authenticate/email`, () => HttpResponse.error())
    );

    const res = await post({ email: "buyer@example.com", password: "hunter2" });

    expect(res.status).toBe(503);
    expect(cookieJar.size).toBe(0);
  });

  it("rejects a missing credential before touching the backend", async () => {
    // No MSW handler registered: onUnhandledRequest:"error" means any outbound
    // call fails the test.
    const res = await post({ email: "buyer@example.com" });
    expect(res.status).toBe(400);
    expect(cookieJar.size).toBe(0);
  });
});

describe("storefront auth never reads credentials from the filesystem", () => {
  const authDir = resolve(__dirname, "../../../../lib/auth");

  it("has no fs import anywhere under src/lib/auth", () => {
    const offenders = readdirSync(authDir)
      .filter((f) => f.endsWith(".ts"))
      .filter((f) => /from\s+["']node:fs["']|from\s+["']fs["']|require\(["']fs["']\)/.test(
        readFileSync(resolve(authDir, f), "utf8")
      ));
    expect(offenders).toEqual([]);
  });

  it("does not compare a password in the login route", () => {
    const src = readFileSync(resolve(__dirname, "route.ts"), "utf8");
    expect(src).not.toMatch(/===\s*password|password\s*===/);
    expect(src).not.toMatch(/user-store/);
    // No hardcoded host: the base URL comes from lib/loom/config.
    expect(src).not.toMatch(/https?:\/\/\d/);
  });
});
