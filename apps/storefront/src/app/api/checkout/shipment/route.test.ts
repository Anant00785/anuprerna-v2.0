import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers } from "@/test/msw";
import { LOOM_BASE_URL } from "@/lib/loom/config";

vi.mock("server-only", () => ({}));

let sessionCookie: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "loom_jwt" && sessionCookie !== undefined ? { name, value: sessionCookie } : undefined,
  }),
}));

const { GET } = await import("./route");

// There is ONE upstream now. The route used to probe a hardcoded
// http://127.0.0.1:3000/get/shipment-list before falling through to Loom;
// LOOM_BASE_URL defaults to that same backend, so the probe was a duplicate of
// the Loom call and the two handlers collided on a single URL here.

const LIVE_QUOTE = [
  { id: 21209, name: "Regular - By Road", baseAmount: 150, locationType: "DOMESTIC" },
];

beforeEach(() => {
  sessionCookie = undefined;
});

describe("GET /api/checkout/shipment", () => {
  it("returns the guest quote from Loom's unauthenticated path", async () => {
    useHandlers(
      http.get(`${LOOM_BASE_URL}/checkout/shipment-list`, () =>
        HttpResponse.json({ shipmentList: LIVE_QUOTE, success: true })
      )
    );

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      shipmentList: LIVE_QUOTE,
      authenticated: false,
    });
  });

  it("uses the authenticated path and bearer token when a session exists", async () => {
    sessionCookie = "session-jwt";
    let auth: string | null = null;
    useHandlers(
      http.get(`${LOOM_BASE_URL}/get/shipment-list`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ shipmentList: LIVE_QUOTE });
      })
    );

    const res = await GET();

    expect(auth).toBe("Bearer session-jwt");
    await expect(res.json()).resolves.toMatchObject({ authenticated: true });
  });

  // ---------------------------------------------------------------------------
  // THE POINT OF THIS FILE. This route used to answer 200 { success: true } with
  // a hardcoded DEFAULT_SHIPMENT_LIST (₹200 / ₹150 / ₹3000) when everything
  // failed, and the figure flowed into a real order total. A shipping price must
  // never be invented.
  // ---------------------------------------------------------------------------
  it("fails with 502 — never a price — when every backend is unreachable", async () => {
    useHandlers(
      http.get(`${LOOM_BASE_URL}/checkout/shipment-list`, () => HttpResponse.error())
    );

    const res = await GET();
    const body = (await res.json()) as { shipmentList: unknown[]; success: boolean; message: string };

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.shipmentList).toEqual([]);
    expect(body.message).toBeTruthy();
  });

  it("relays the backend's own message on a rejection", async () => {
    useHandlers(
      http.get(`${LOOM_BASE_URL}/checkout/shipment-list`, () =>
        HttpResponse.json({ message: "Shipping is suspended for this region." }, { status: 503 })
      )
    );

    const res = await GET();

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      message: "Shipping is suspended for this region.",
    });
  });

  it("treats a reachable backend with an EMPTY list as no quote, not as a proceedable checkout", async () => {
    useHandlers(
      http.get(`${LOOM_BASE_URL}/checkout/shipment-list`, () =>
        HttpResponse.json({ shipmentList: [], success: true })
      )
    );

    const res = await GET();

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ success: false, shipmentList: [] });
  });

  it("returns no hardcoded rupee amount on any failure path", async () => {
    useHandlers(
      http.get(`${LOOM_BASE_URL}/checkout/shipment-list`, () => HttpResponse.error())
    );

    const text = JSON.stringify(await (await GET()).json());

    // The three fabricated amounts that used to be served as a live quote.
    for (const fabricated of ["200", "150", "3000", "16104210", "21209", "62591603"]) {
      expect(text).not.toContain(fabricated);
    }
  });
});
