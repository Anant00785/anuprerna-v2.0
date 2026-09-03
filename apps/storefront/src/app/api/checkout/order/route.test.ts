import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers } from "@/test/msw";
import { LOOM_BASE_URL } from "@/lib/loom/config";
import { GUEST_ORDER_COOKIE, encodeGuest } from "@/lib/checkout-session";

vi.mock("server-only", () => ({}));

const jar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name in jar ? { name, value: jar[name] } : undefined),
  }),
}));

const { POST } = await import("./route");

const post = (body: unknown) =>
  POST(
    new Request("http://localhost:3000/api/checkout/order", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );

beforeEach(() => {
  for (const k of Object.keys(jar)) delete jar[k];
});

describe("POST /api/checkout/order", () => {
  it("refuses an order from a caller with neither a session nor a guest cookie", async () => {
    // No MSW handler: any backend call fails the test.
    const res = await post({ items: [] });
    expect(res.status).toBe(401);
  });

  it("takes the guest identity from the httpOnly cookie and DISCARDS the one in the body", async () => {
    jar["ap_guest_checkout"] = encodeGuest({ email: "real@example.com", name: "Asha" });

    let sent: Record<string, unknown> | undefined;
    useHandlers(
      http.post(`${LOOM_BASE_URL}/checkout/order`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, orderId: 1000000000001, amount: 4200 });
      })
    );

    // The browser tries to name a different buyer. It must not be believed.
    await post({ items: [{ sku: "A" }], guest: { email: "victim@example.com", name: "Victim" } });

    expect(sent?.guest).toEqual({ email: "real@example.com", name: "Asha" });
  });

  it("uses the bearer token and sends no guest block for a logged-in buyer", async () => {
    jar["loom_jwt"] = "session-jwt";
    jar["ap_guest_checkout"] = encodeGuest({ email: "stale@example.com", name: "Stale" });

    let sent: Record<string, unknown> | undefined;
    let auth: string | null = null;
    useHandlers(
      http.post(`${LOOM_BASE_URL}/checkout/order`, async ({ request }) => {
        auth = request.headers.get("authorization");
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, orderId: 1000000000002 });
      })
    );

    await post({ items: [{ sku: "A" }], guest: { email: "victim@example.com" } });

    expect(auth).toBe("Bearer session-jwt");
    // A logged-in order must be keyed off the token, never off a guest block.
    expect(sent).not.toHaveProperty("guest");
  });

  it("parks the guest order-status token in an httpOnly cookie", async () => {
    jar["ap_guest_checkout"] = encodeGuest({ email: "a@b.co", name: "A" });
    useHandlers(
      http.post(`${LOOM_BASE_URL}/checkout/order`, () =>
        HttpResponse.json({ success: true, orderId: 1, guestOrder: true, guestToken: "tok-abc" })
      )
    );

    const res = await post({ items: [] });
    const cookie = res.cookies.get(GUEST_ORDER_COOKIE);

    expect(cookie?.value).toBe("tok-abc");
    expect(cookie?.httpOnly).toBe(true);
    // The same token is returned once so the buyer gets a durable link.
    await expect(res.json()).resolves.toMatchObject({ guestToken: "tok-abc" });
  });

  it("sets no order cookie when the backend declines the order", async () => {
    jar["ap_guest_checkout"] = encodeGuest({ email: "a@b.co", name: "A" });
    useHandlers(
      http.post(`${LOOM_BASE_URL}/checkout/order`, () =>
        HttpResponse.json({ success: false, message: "Cart is empty." })
      )
    );

    const res = await post({ items: [] });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ success: false, message: "Cart is empty." });
    expect(res.cookies.get(GUEST_ORDER_COOKIE)).toBeUndefined();
  });

  it("relays the backend's status and the exists flag on a 409", async () => {
    jar["ap_guest_checkout"] = encodeGuest({ email: "a@b.co", name: "A" });
    useHandlers(
      http.post(`${LOOM_BASE_URL}/checkout/order`, () =>
        HttpResponse.json({ exists: true, message: "Sign in to continue." }, { status: 409 })
      )
    );

    const res = await post({ items: [] });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      success: false,
      exists: true,
      message: "Sign in to continue.",
    });
  });

  it("answers 502 without claiming an order was created when the backend is unreachable", async () => {
    jar["ap_guest_checkout"] = encodeGuest({ email: "a@b.co", name: "A" });
    useHandlers(http.post(`${LOOM_BASE_URL}/checkout/order`, () => HttpResponse.error()));

    const res = await post({ items: [] });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ success: false });
    expect(res.cookies.get(GUEST_ORDER_COOKIE)).toBeUndefined();
  });

  it("rejects a body that is not JSON before touching the backend", async () => {
    jar["ap_guest_checkout"] = encodeGuest({ email: "a@b.co", name: "A" });
    const res = await POST(
      new Request("http://localhost:3000/api/checkout/order", { method: "POST", body: "{" })
    );
    expect(res.status).toBe(400);
  });
});
