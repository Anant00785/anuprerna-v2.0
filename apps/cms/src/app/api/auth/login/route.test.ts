/**
 * /api/auth/login mints the `weave_token` session cookie that middleware.ts
 * gates every page and every /api/* route on, so what this route will and will
 * NOT accept IS the CMS auth model.
 *
 * The `describe("… sandbox fallback")` block below is the important one. This
 * route used to seed `token` from SANDBOX_ADMIN_TOKEN *before* checking any
 * credential and never clear it, so with that env var set any email and any
 * password minted a valid session — an authentication bypass on an admin CMS.
 * It was FIXED on 2026-09-02, and those tests assert the bypass is CLOSED:
 * a wrong password is rejected even with the sandbox token present, and the
 * sandbox path is unavailable unless an explicit non-production sandbox
 * credential is configured and matched.
 *
 * These are the tests to read before touching the credential logic.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server, useHandlers } from "@/test/msw";

const jar = new Map<string, { value: string; opts: Record<string, unknown> }>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)!.value } : undefined),
    set: (name: string, value: string, opts: Record<string, unknown>) =>
      jar.set(name, { value, opts }),
    delete: (name: string) => jar.delete(name),
  }),
}));

import { POST, DELETE } from "./route";

function login(body: unknown): Promise<Response> {
  return POST(
    new NextRequest("http://localhost:3004/api/auth/login", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  ) as unknown as Promise<Response>;
}

/** Both auth endpoints the route tries, matched without naming a live host. */
function authReturns(handler: () => Response) {
  server.use(http.post("*/authenticate/email", handler));
}

describe("/api/auth/login", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    jar.clear();
    delete process.env.SANDBOX_ADMIN_TOKEN;
    delete process.env.CMS_SANDBOX_LOGIN;
    delete process.env.CMS_SANDBOX_LOGIN_EMAIL;
    delete process.env.CMS_SANDBOX_LOGIN_PASSWORD;
  });
  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it("rejects a malformed JSON body without touching the backend", async () => {
    const res = await login("not json");

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ message: "Invalid request body" });
    expect(jar.size).toBe(0);
  });

  it("requires both email and password", async () => {
    const res = await login({ email: "a@b.com" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "Email and password are required",
    });
  });

  it("sends the backend BOTH username and email — the Loom contract keys the lookup on username", async () => {
    let sent: unknown;
    useHandlers(
      http.post("*/authenticate/email", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ jwt: "a.b.c" });
      }),
    );

    await login({ email: "amit@anuprerna.com", password: "pw" });

    expect(sent).toEqual({
      username: "amit@anuprerna.com",
      email: "amit@anuprerna.com",
      password: "pw",
    });
  });

  it("stores the backend JWT in an httpOnly session cookie", async () => {
    authReturns(() => HttpResponse.json({ jwt: "header.payload.sig" }));

    const res = await login({ email: "amit@anuprerna.com", password: "pw" });

    expect(res.status).toBe(200);
    expect(jar.get("weave_token")?.value).toBe("header.payload.sig");
    expect(jar.get("weave_token")?.opts).toMatchObject({ httpOnly: true, sameSite: "lax" });
  });

  it("accepts the backend's alternate token keys (bearerToken / token), not just jwt", async () => {
    authReturns(() => HttpResponse.json({ bearerToken: "from-bearer-key" }));

    await login({ email: "a@b.com", password: "pw" });

    expect(jar.get("weave_token")?.value).toBe("from-bearer-key");
  });

  it("writes an httpOnly identity cookie carrying the email and a derived display name", async () => {
    authReturns(() => HttpResponse.json({ jwt: "a.b.c" }));

    await login({ email: "amit.singha@anuprerna.com", password: "pw" });

    const user = jar.get("weave_user")!;
    expect(user.opts).toMatchObject({ httpOnly: true });
    expect(JSON.parse(Buffer.from(user.value, "base64").toString("utf-8"))).toEqual({
      email: "amit.singha@anuprerna.com",
      name: "Amit Singha",
    });
  });

  it("rejects the login when the backend refuses and no sandbox fallback token is configured", async () => {
    authReturns(() => new HttpResponse(null, { status: 401 }));

    const res = await login({ email: "a@b.com", password: "wrong" });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ message: "Invalid email or password" });
    expect(jar.size).toBe(0);
  });

  it("rejects the login when the backend is unreachable entirely", async () => {
    useHandlers(http.post("*/authenticate/email", () => HttpResponse.error()));

    const res = await login({ email: "a@b.com", password: "pw" });

    expect(res.status).toBe(401);
    expect(jar.size).toBe(0);
  });

  it("DELETE clears both session cookies", async () => {
    jar.set("weave_token", { value: "t", opts: {} });
    jar.set("weave_user", { value: "u", opts: {} });

    const res = (await DELETE()) as unknown as Response;

    expect(res.status).toBe(200);
    expect(jar.size).toBe(0);
  });
});

describe("/api/auth/login — the sandbox fallback fails closed", () => {
  const savedEnv = { ...process.env };

  /** An explicitly-declared, non-production sandbox with a configured credential. */
  function configureSandbox() {
    process.env.SANDBOX_ADMIN_TOKEN = "shared-service-secret";
    process.env.CMS_SANDBOX_LOGIN = "true";
    process.env.CMS_SANDBOX_LOGIN_EMAIL = "sandbox@anuprerna.com";
    process.env.CMS_SANDBOX_LOGIN_PASSWORD = "sandbox-password";
    // The backend refuses everything, so ONLY the sandbox path can succeed.
    server.use(http.post("*/authenticate/email", () => new HttpResponse(null, { status: 401 })));
  }

  beforeEach(() => {
    jar.clear();
    for (const k of [
      "SANDBOX_ADMIN_TOKEN",
      "CMS_SANDBOX_LOGIN",
      "CMS_SANDBOX_LOGIN_EMAIL",
      "CMS_SANDBOX_LOGIN_PASSWORD",
    ]) {
      delete process.env[k];
    }
  });
  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it("REGRESSION: a wrong password is rejected even with SANDBOX_ADMIN_TOKEN set", async () => {
    // The bypass. Before 2026-09-02 this returned 200 and minted a session
    // holding the service token. It must never do so again.
    process.env.SANDBOX_ADMIN_TOKEN = "shared-service-secret";
    authReturns(() => new HttpResponse(null, { status: 401 }));

    const res = await login({ email: "anyone@example.com", password: "definitely-wrong" });

    expect(res.status).toBe(401);
    expect(jar.size).toBe(0);
  });

  it("does not open the sandbox path merely because the service token exists", async () => {
    // SANDBOX_ADMIN_TOKEN set, but no explicit CMS_SANDBOX_LOGIN opt-in.
    process.env.SANDBOX_ADMIN_TOKEN = "shared-service-secret";
    process.env.CMS_SANDBOX_LOGIN_EMAIL = "sandbox@anuprerna.com";
    process.env.CMS_SANDBOX_LOGIN_PASSWORD = "sandbox-password";
    server.use(http.post("*/authenticate/email", () => new HttpResponse(null, { status: 401 })));

    const res = await login({ email: "sandbox@anuprerna.com", password: "sandbox-password" });

    expect(res.status).toBe(401);
    expect(jar.size).toBe(0);
  });

  it("refuses the sandbox path in production even when every flag says otherwise", async () => {
    configureSandbox();
    vi.stubEnv("NODE_ENV", "production");

    const res = await login({ email: "sandbox@anuprerna.com", password: "sandbox-password" });

    expect(res.status).toBe(401);
    expect(jar.size).toBe(0);
    vi.unstubAllEnvs();
  });

  it("refuses when the sandbox credential is enabled but not configured", async () => {
    // An unset password must never match an empty or any submission.
    process.env.SANDBOX_ADMIN_TOKEN = "shared-service-secret";
    process.env.CMS_SANDBOX_LOGIN = "true";
    server.use(http.post("*/authenticate/email", () => new HttpResponse(null, { status: 401 })));

    expect((await login({ email: "sandbox@anuprerna.com", password: "" })).status).toBe(400);
    expect((await login({ email: "x@y.com", password: "anything" })).status).toBe(401);
    expect(jar.size).toBe(0);
  });

  it("rejects the configured sandbox email with the WRONG password", async () => {
    configureSandbox();

    const res = await login({ email: "sandbox@anuprerna.com", password: "not-it" });

    expect(res.status).toBe(401);
    expect(jar.size).toBe(0);
  });

  it("rejects a DIFFERENT email with the configured sandbox password", async () => {
    configureSandbox();

    const res = await login({ email: "someone@else.com", password: "sandbox-password" });

    expect(res.status).toBe(401);
  });

  it("admits ONLY the configured sandbox credential, matched exactly", async () => {
    configureSandbox();

    const res = await login({ email: "Sandbox@Anuprerna.com", password: "sandbox-password" });

    expect(res.status).toBe(200);
    // Email match is case-insensitive; the password is not.
    expect(jar.get("weave_token")?.value).toBe("shared-service-secret");
  });

  it("a real backend credential still wins without any sandbox configuration", async () => {
    // The fallback is additional, not a replacement: the credential check runs
    // first and its result is preferred.
    process.env.SANDBOX_ADMIN_TOKEN = "shared-service-secret";
    process.env.CMS_SANDBOX_LOGIN = "true";
    process.env.CMS_SANDBOX_LOGIN_EMAIL = "sandbox@anuprerna.com";
    process.env.CMS_SANDBOX_LOGIN_PASSWORD = "sandbox-password";
    authReturns(() => HttpResponse.json({ jwt: "real.loom.jwt" }));

    const res = await login({ email: "amit@anuprerna.com", password: "pw" });

    expect(res.status).toBe(200);
    expect(jar.get("weave_token")?.value).toBe("real.loom.jwt");
  });
});
