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

const { GET, POST } = await import("./route");

const post = (body: string) =>
  POST(new Request("http://localhost:3000/api/profile/addresses", { method: "POST", body }));

beforeEach(() => {
  sessionCookie = undefined;
});

describe("GET /api/profile/addresses", () => {
  it("401s an anonymous caller without touching the backend", async () => {
    // No MSW handler: any egress fails the test.
    const res = await GET();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("forwards the session token and returns the backend's list", async () => {
    sessionCookie = "session-jwt";
    useHandlers(
      http.get(`${LOOM_BASE_URL}/get/address-list`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer session-jwt");
        return HttpResponse.json({ addressList: [{ id: 1, city: "Kolkata" }] });
      })
    );

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ addressList: [{ id: 1, city: "Kolkata" }] });
  });

  it("reports 502 with an empty list — never a silent success — when the backend fails", async () => {
    sessionCookie = "session-jwt";
    useHandlers(
      http.get(`${LOOM_BASE_URL}/get/address-list`, () =>
        HttpResponse.json({ message: "denied" }, { status: 403 })
      )
    );

    const res = await GET();
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ addressList: [], success: false });
  });
});

describe("POST /api/profile/addresses", () => {
  it("401s an anonymous caller and writes nothing", async () => {
    const res = await post(JSON.stringify({ city: "Kolkata" }));
    expect(res.status).toBe(401);
  });

  it("saves through the backend and echoes the minted record", async () => {
    sessionCookie = "session-jwt";
    let sent: unknown;
    useHandlers(
      http.post(`${LOOM_BASE_URL}/add/address`, async ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer session-jwt");
        sent = await request.json();
        return HttpResponse.json({ success: true, message: "9001" });
      })
    );

    const res = await post(JSON.stringify({ city: "Kolkata", pinCode: "700001" }));

    expect(sent).toEqual({ city: "Kolkata", pinCode: "700001" });
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      entity: { success: true, message: "9001" },
    });
  });

  it("reports the failure rather than pretending the address was saved locally", async () => {
    sessionCookie = "session-jwt";
    useHandlers(http.post(`${LOOM_BASE_URL}/add/address`, () => HttpResponse.error()));

    const res = await post(JSON.stringify({ city: "Kolkata" }));

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      success: false,
      message: "Could not save the address.",
    });
  });

  it("forwards an empty object for an unparseable body instead of throwing", async () => {
    sessionCookie = "session-jwt";
    let sent: unknown = "unset";
    useHandlers(
      http.post(`${LOOM_BASE_URL}/add/address`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ success: true, message: "9002" });
      })
    );

    await post("{");
    expect(sent).toEqual({});
  });

  it("relays a backend refusal instead of confirming an address that was never stored", async () => {
    // The backend answers HTTP 200 with { success: false }; a naive route would
    // report "Address saved successfully." and leave the buyer with nothing.
    sessionCookie = "session-jwt";
    useHandlers(
      http.post(`${LOOM_BASE_URL}/add/address`, () =>
        HttpResponse.json({ success: false, message: "Pin code is required." })
      )
    );

    const res = await post(JSON.stringify({ city: "Kolkata" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      message: "Pin code is required.",
    });
  });
});
