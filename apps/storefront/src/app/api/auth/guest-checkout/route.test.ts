import { describe, it, expect, beforeEach, vi } from "vitest";
import { GUEST_CHECKOUT_COOKIE, encodeGuest } from "@/lib/checkout-session";

vi.mock("server-only", () => ({}));

let guestCookie: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "ap_guest_checkout" && guestCookie !== undefined ? { name, value: guestCookie } : undefined,
  }),
}));

const { GET, POST, DELETE } = await import("./route");

const post = (body: unknown) =>
  POST(
    new Request("http://localhost:3000/api/auth/guest-checkout", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );

beforeEach(() => {
  guestCookie = undefined;
});

describe("POST /api/auth/guest-checkout", () => {
  // No MSW handler is registered anywhere in this file: onUnhandledRequest:"error"
  // means any backend call at all fails the test. That IS the anti-enumeration
  // assertion — this route must not probe /check-email/tenant.
  it("accepts a guest and parks the identity in an httpOnly cookie", async () => {
    const res = await post({ email: "buyer@example.com", name: "Asha Rao" });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      guest: { email: "buyer@example.com", name: "Asha Rao" },
      created: false,
    });

    const cookie = res.cookies.get(GUEST_CHECKOUT_COOKIE);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.value).toBe(encodeGuest({ email: "buyer@example.com", name: "Asha Rao" }));
  });

  it("creates no account — nothing about a password or registration is returned", async () => {
    const body = (await (await post({ email: "buyer@example.com", name: "Asha" })).json()) as Record<
      string,
      unknown
    >;
    expect(body.created).toBe(false);
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("jwt");
  });

  it("gives an address that already has an account the identical answer (no enumeration oracle)", async () => {
    const known = await post({ email: "existing-customer@example.com", name: "Asha" });
    const unknown = await post({ email: "never-seen@example.com", name: "Asha" });

    expect(known.status).toBe(unknown.status);
    const a = (await known.json()) as Record<string, unknown>;
    const b = (await unknown.json()) as Record<string, unknown>;
    expect(a.success).toBe(b.success);
    expect(a.created).toBe(b.created);
    expect(a).not.toHaveProperty("exists");
  });

  it("rejects a malformed address — a property of the request, not of our customer table", async () => {
    const res = await post({ email: "nobody", name: "Asha" });
    expect(res.status).toBe(400);
    expect(res.cookies.get(GUEST_CHECKOUT_COOKIE)).toBeUndefined();
  });

  it("rejects a missing name", async () => {
    const res = await post({ email: "buyer@example.com", name: "   " });
    expect(res.status).toBe(400);
    expect(res.cookies.get(GUEST_CHECKOUT_COOKIE)).toBeUndefined();
  });

  it("rejects a body that is not JSON", async () => {
    const res = await POST(
      new Request("http://localhost:3000/api/auth/guest-checkout", { method: "POST", body: "{" })
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/guest-checkout", () => {
  it("reports no guest session when the cookie is absent", async () => {
    await expect((await GET()).json()).resolves.toEqual({ active: false });
  });

  it("resumes an in-flight checkout from the cookie", async () => {
    guestCookie = encodeGuest({ email: "buyer@example.com", name: "Asha" });
    await expect((await GET()).json()).resolves.toEqual({
      active: true,
      guest: { email: "buyer@example.com", name: "Asha" },
    });
  });

  it("reports no guest session when the cookie is corrupt rather than throwing", async () => {
    guestCookie = "tampered";
    await expect((await GET()).json()).resolves.toEqual({ active: false });
  });
});

describe("DELETE /api/auth/guest-checkout", () => {
  it("expires the guest cookie", async () => {
    const res = await DELETE();
    const cookie = res.cookies.get(GUEST_CHECKOUT_COOKIE);
    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(0);
  });
});
