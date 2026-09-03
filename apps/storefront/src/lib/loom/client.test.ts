import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers } from "@/test/msw";
import { LOOM_BASE_URL } from "./config";

vi.mock("server-only", () => ({}));

const { loomGet, loomPost, loomPatch, loomPut, loomDelete, LoomError, LoomWriteBlockedError } =
  await import("./client");

describe("loomGet", () => {
  it("sends the Origin header Loom rejects requests without, and the bearer token", async () => {
    let headers: Headers | undefined;
    useHandlers(
      http.get(`${LOOM_BASE_URL}/get/customer/profile`, ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({ entity: { name: "A" } });
      })
    );

    await loomGet("/get/customer/profile", { token: "jwt-123" });

    expect(headers?.get("origin")).toBe("localhost");
    expect(headers?.get("authorization")).toBe("Bearer jwt-123");
  });

  it("throws a LoomError carrying the status and parsed body on a non-2xx", async () => {
    useHandlers(
      http.get(`${LOOM_BASE_URL}/get/address-list`, () =>
        HttpResponse.json({ success: false, message: "Authorization has been denied." }, { status: 403 })
      )
    );

    const err = await loomGet("/get/address-list", { token: "x" }).catch((e) => e);

    expect(err).toBeInstanceOf(LoomError);
    expect((err as InstanceType<typeof LoomError>).status).toBe(403);
    expect((err as InstanceType<typeof LoomError>).body).toMatchObject({ success: false });
  });

  it("tolerates an empty body rather than throwing a parse error", async () => {
    useHandlers(http.get(`${LOOM_BASE_URL}/get/nothing`, () => new HttpResponse(null, { status: 200 })));
    await expect(loomGet("/get/nothing")).resolves.toEqual({});
  });
});

// The write-guard is the reason this public preview cannot mutate live Loom.
// Every one of these must fail BEFORE any network call is made.
describe("demo write-guard", () => {
  const noEgress = () => {
    // No MSW handler is registered; onUnhandledRequest:"error" turns any
    // outbound request into a test failure, which is the assertion.
  };

  it("blocks a POST that is not on the allowlist", async () => {
    noEgress();
    const err = await loomPost("/update/payment/success", { orderId: 1 }).catch((e) => e);
    expect(err).toBeInstanceOf(LoomWriteBlockedError);
    expect((err as InstanceType<typeof LoomWriteBlockedError>).path).toBe("/update/payment/success");
  });

  it("blocks the Loom gateway action routes specifically", async () => {
    for (const path of [
      "/create/payment-session",
      "/create/stripe/payment-session",
      "/update/payment/failure",
      "/update/payment/transaction",
      "/checkout/stripe/webhook",
    ]) {
      await expect(loomPost(path, {})).rejects.toBeInstanceOf(LoomWriteBlockedError);
    }
  });

  it("is not fooled by a query string appended to a blocked path", async () => {
    await expect(loomPost("/delete/everything?ok=/add/cart-item", {})).rejects.toBeInstanceOf(
      LoomWriteBlockedError
    );
  });

  it("is not fooled by a blocked path prefixed onto an allowlisted one", async () => {
    await expect(loomPost("/evil/add/cart-item", {})).rejects.toBeInstanceOf(LoomWriteBlockedError);
  });

  it("allows the allowlisted cart write through", async () => {
    useHandlers(http.post(`${LOOM_BASE_URL}/add/cart-item`, () => HttpResponse.json({ success: true })));
    await expect(loomPost("/add/cart-item", { sku: "A" })).resolves.toEqual({ success: true });
  });

  it("allows any /authenticate* path through (the sign-in prefix)", async () => {
    useHandlers(
      http.post(`${LOOM_BASE_URL}/authenticate/email`, () => HttpResponse.json({ jwt: "t" }))
    );
    await expect(loomPost("/authenticate/email", {})).resolves.toEqual({ jwt: "t" });
  });

  it("allows PATCH /update/cart-item but blocks every other PATCH", async () => {
    useHandlers(
      http.patch(`${LOOM_BASE_URL}/update/cart-item`, () => HttpResponse.json({ success: true }))
    );
    await expect(loomPatch("/update/cart-item", { quantity: 2 })).resolves.toEqual({ success: true });
    await expect(loomPatch("/update/order", {})).rejects.toBeInstanceOf(LoomWriteBlockedError);
  });

  it("allows DELETE of a numeric cart-item id only", async () => {
    useHandlers(
      http.delete(`${LOOM_BASE_URL}/delete/cart-item/42`, () => HttpResponse.json({ success: true }))
    );
    await expect(loomDelete("/delete/cart-item/42")).resolves.toEqual({ success: true });
    // Not a number -> could be any resource path the backend routes elsewhere.
    await expect(loomDelete("/delete/cart-item/all")).rejects.toBeInstanceOf(LoomWriteBlockedError);
    await expect(loomDelete("/delete/order/42")).rejects.toBeInstanceOf(LoomWriteBlockedError);
  });

  it("allows PUT under /manage/wishlist/ only", async () => {
    useHandlers(
      http.put(`${LOOM_BASE_URL}/manage/wishlist/9`, () => HttpResponse.json({ success: true }))
    );
    await expect(loomPut("/manage/wishlist/9", undefined)).resolves.toEqual({ success: true });
    await expect(loomPut("/manage/customer/9", {})).rejects.toBeInstanceOf(LoomWriteBlockedError);
  });
});
