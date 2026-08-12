import { describe, it, expect, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { cartRepository } from "./cart.repository";
import { useHandlers, PROXY_BASE, envelope } from "@/test/msw";
import { env } from "@/env";

// cartRepository has zero importers anywhere in apps/storefront outside the
// dead `lib/api/index.ts` barrel (see report) — tested anyway since it's the
// designed Path-A cart flow per docs/DATA-FLOW.md §1.

const originalMode = env.NEXT_PUBLIC_API_MODE;
afterEach(() => {
  env.NEXT_PUBLIC_API_MODE = originalMode;
});

describe("cartRepository.getCart (legacy)", () => {
  it("fetches /get/cart-item/list and maps the payload envelope to a domain Cart", async () => {
    let capturedUrl: string | undefined;
    useHandlers(
      http.get(`${PROXY_BASE}/get/cart-item/list`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(
          envelope("payload", { cartId: "c1", items: [], totalCartValue: 0 })
        );
      })
    );
    const cart = await cartRepository.getCart();
    expect(capturedUrl).toBe(`${PROXY_BASE}/get/cart-item/list`);
    expect(cart.id).toBe("c1");
    expect(cart.items).toEqual([]);
  });

  it("swallows a fetch failure and returns an empty cart rather than throwing", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/cart-item/list`, () =>
        HttpResponse.json({ success: false, message: "boom" }, { status: 500 })
      )
    );
    await expect(cartRepository.getCart()).resolves.toEqual({
      items: [],
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      estimatedShipping: 0,
      total: 0,
      currency: "INR",
    });
  });

  it("also swallows a 401 the same way — getCart never surfaces auth failure to the caller", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/cart-item/list`, () =>
        HttpResponse.json({ success: false, message: "unauthorized" }, { status: 401 })
      )
    );
    const cart = await cartRepository.getCart();
    expect(cart.itemCount).toBe(0);
  });
});

describe("cartRepository.getCart (nest)", () => {
  it("fetches /v1/cart and maps the NestApiResponse envelope to a domain Cart", async () => {
    env.NEXT_PUBLIC_API_MODE = "nest";
    useHandlers(
      http.get(`${PROXY_BASE}/v1/cart`, () =>
        HttpResponse.json({
          statusCode: 200,
          message: "",
          data: { id: "c2", items: [], itemCount: 0, subtotal: 0, discountTotal: 0, shippingFee: 0, grandTotal: 0, currency: "INR" },
        })
      )
    );
    const cart = await cartRepository.getCart();
    expect(cart.id).toBe("c2");
  });
});

describe("cartRepository.addToCart (legacy)", () => {
  it("POSTs productId/quantity to /add/cart-item and returns the updated cart", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post(`${PROXY_BASE}/add/cart-item`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(envelope("payload", { cartId: "c1", items: [] }));
      })
    );
    const cart = await cartRepository.addToCart("p1", 3);
    expect(capturedBody).toEqual({ productId: "p1", qty: 3 });
    expect(cart.id).toBe("c1");
  });

  it("propagates a server error instead of swallowing it, unlike getCart", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/add/cart-item`, () =>
        HttpResponse.json({ success: false, message: "boom" }, { status: 500 })
      )
    );
    await expect(cartRepository.addToCart("p1", 1)).rejects.toThrow(/API Error \[500\]/);
  });
});
