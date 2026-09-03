import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers } from "@/test/msw";
import { LOOM_BASE_URL, LOOM_JWT_COOKIE } from "@/lib/loom/config";

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
  POST(new Request("http://localhost:3000/api/auth/register", { method: "POST", body: JSON.stringify(body) }));

const validPayload = { name: "Jeel Thummar", email: "buyer@example.com", password: "hunter2" };

beforeEach(() => cookieJar.clear());

describe("POST /api/auth/register", () => {
  it("REFUSES to report success when Loom answers 200 with success:false", async () => {
    // This is Loom's actual refusal shape — HTTP 200, `success:false` in the
    // body. The route used to only catch a THROWN error, so a refusal fell
    // through to `success: true`: the shopper was told "Account created
    // successfully", no account existed, and the next sign-in failed with
    // "username or password is incorrect" — blaming the password for a
    // registration that never happened.
    useHandlers(
      http.post(`${LOOM_BASE_URL}/customer/registration/email`, () =>
        HttpResponse.json({ success: false, message: "The request contains incorrect information." })
      )
    );

    const res = await post(validPayload);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      message: "The request contains incorrect information.",
    });
    // Emphatically no session for an account that does not exist.
    expect(cookieJar.get(LOOM_JWT_COOKIE)).toBeUndefined();
  });

  it("creates the account and parks the authenticated JWT in an httpOnly cookie", async () => {
    let capturedBody: any;
    useHandlers(
      http.post(`${LOOM_BASE_URL}/customer/registration/email`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, message: "" });
      }),
      http.post(`${LOOM_BASE_URL}/authenticate/email`, () =>
        HttpResponse.json({ success: true, message: "", jwt: "signed.jwt.token" })
      )
    );

    const res = await post(validPayload);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ success: true });
    // Loom binds the account fields under `tenant`.
    expect(capturedBody.tenant).toMatchObject({ name: "Jeel Thummar", email: "buyer@example.com" });

    const cookie = cookieJar.get(LOOM_JWT_COOKIE);
    expect(cookie?.value).toBe("signed.jwt.token");
    expect(cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("reports the failure when Loom rejects with an error status", async () => {
    useHandlers(
      http.post(`${LOOM_BASE_URL}/customer/registration/email`, () =>
        HttpResponse.json({ success: false, message: "Email already registered." }, { status: 409 })
      )
    );

    const res = await post(validPayload);

    expect(res.status).toBeGreaterThanOrEqual(400);
    await expect(res.json()).resolves.toMatchObject({ success: false });
    expect(cookieJar.get(LOOM_JWT_COOKIE)).toBeUndefined();
  });

  it("rejects an incomplete payload without calling the backend at all", async () => {
    // No MSW handler registered: the suite runs onUnhandledRequest:"error",
    // so any outbound call here would fail this test on its own.
    const res = await post({ name: "", email: "", password: "" });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });

  it("rejects a password under six characters without calling the backend", async () => {
    const res = await post({ ...validPayload, password: "abc" });
    expect(res.status).toBe(400);
  });
});
