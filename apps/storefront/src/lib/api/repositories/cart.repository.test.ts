import { describe, it, expect, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { cartRepository } from "./cart.repository";
import { mapLegacyCartToDomain } from "../adapters/legacy-cart.adapter";
import { useHandlers, PROXY_BASE, envelope } from "@/test/msw";
import { env } from "@/env";

// cartRepository has zero importers anywhere in apps/storefront outside the
// dead `lib/api/index.ts` barrel (see report) — tested anyway since it's the
// designed Path-A cart flow per docs/DATA-FLOW.md §1.

const originalMode = env.NEXT_PUBLIC_API_MODE;
afterEach(() => {
  env.NEXT_PUBLIC_API_MODE = originalMode;
});

const cartRow = {
  id: 166340327,
  quantity: 2,
  unit: "METER",
  orderType: "IN_STOCK",
  productGroup: "fabric",
  makingCharge: 0,
  selectedFinishId: "",
  fabricProductPreview: {
    id: 163523574,
    product: {
      id: 163523575,
      name: "Handwoven Fabric",
      slug: "handwoven",
      sku: "DSG1210474",
      price: 446,
      unit: "METER",
    },
  },
};

describe("cartRepository.getCart (legacy)", () => {
  it("reads Loom's cartItemList envelope, not payload/content/data", async () => {
    let capturedUrl: string | undefined;
    useHandlers(
      http.get(`${PROXY_BASE}/get/cart-item/list`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(envelope("cartItemList", [cartRow]));
      })
    );
    const cart = await cartRepository.getCart();
    expect(capturedUrl).toBe(`${PROXY_BASE}/get/cart-item/list`);
    expect(cart.itemCount).toBe(2);
    expect(cart.subtotal).toBe(892);
  });

  it("returns an empty cart — not a crash — when Loom sends the old payload key", async () => {
    // Regression guard: this repository used to read `payload`/`content`/`data`,
    // none of which Loom sends, so a full cart always mapped to an empty one.
    useHandlers(
      http.get(`${PROXY_BASE}/get/cart-item/list`, () =>
        HttpResponse.json(envelope("payload", { cartId: "c1", items: [cartRow] }))
      )
    );
    const cart = await cartRepository.getCart();
    expect(cart.itemCount).toBe(0);
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
  // The shape below is the one verified against live Loom through the dev proxy:
  // it answers `{"success": true}`, and `{productId, qty}` (what this repository
  // used to send) comes back 200 with
  // `{"success": false, "message": "The request contains incorrect information."}`.
  const input = {
    fabricProductId: 163523574,
    quantity: 2,
    unit: "METER",
    price: 446,
    sku: "DSG1210474",
  } as const;

  it("POSTs the flat Loom CartItem entity to /add/cart-item", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post(`${PROXY_BASE}/add/cart-item`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, message: "" });
      })
    );
    await cartRepository.addToCart({ ...input });
    expect(capturedBody).toEqual({
      fabricProductId: 163523574,
      quantity: 2,
      unit: "METER",
      price: 446,
      sku: "DSG1210474",
      orderType: "IN_STOCK",
      productGroup: "fabric",
      selectedSizeOptionId: 0,
      selectedFinishId: "",
      makingCharge: 0,
      customSize: {},
    });
  });

  it("omits zero/absent foreign keys rather than sending 0, which Loom cannot join", async () => {
    let capturedBody: any;
    useHandlers(
      http.post(`${PROXY_BASE}/add/cart-item`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, message: "" });
      })
    );
    await cartRepository.addToCart({ ...input, selectedFabricId: 0, finishedProductId: 0 });
    expect(capturedBody).not.toHaveProperty("selectedFabricId");
    expect(capturedBody).not.toHaveProperty("finishedProductId");
  });

  it("throws on Loom's 200 + {success:false} rejection instead of reporting a silent success", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/add/cart-item`, () =>
        HttpResponse.json({ success: false, message: "The request contains incorrect information." })
      )
    );
    await expect(cartRepository.addToCart({ ...input })).rejects.toThrow(
      /The request contains incorrect information/
    );
  });

  it("propagates a server error instead of swallowing it, unlike getCart", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/add/cart-item`, () =>
        HttpResponse.json({ success: false, message: "boom" }, { status: 500 })
      )
    );
    await expect(cartRepository.addToCart({ ...input })).rejects.toThrow(/API Error \[500\]/);
  });
});

describe("cartRepository.updateQuantity (legacy)", () => {
  it("PATCHes the whole row back with the new quantity, rebuilt from item.source", async () => {
    // Loom re-binds the entire CartItem entity on update — omitting a field
    // writes null and trips its NOT NULL columns — so the original values have
    // to be echoed. This body is the one verified against live Loom.
    let capturedBody: unknown;
    let capturedMethod: string | undefined;
    useHandlers(
      http.patch(`${PROXY_BASE}/update/cart-item`, async ({ request }) => {
        capturedMethod = request.method;
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, message: "" });
      })
    );

    const cart = mapLegacyCartToDomain([cartRow]);
    await cartRepository.updateQuantity(cart.items[0], 3);

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual({
      id: 166340327,
      fabricProductId: 163523574,
      quantity: 3,
      unit: "METER",
      price: 446,
      sku: "DSG1210474",
      orderType: "IN_STOCK",
      productGroup: "fabric",
      selectedSizeOptionId: 0,
      selectedFinishId: "",
      makingCharge: 0,
      customSize: {},
    });
  });

  it("throws on Loom's 200 + {success:false} rejection", async () => {
    useHandlers(
      http.patch(`${PROXY_BASE}/update/cart-item`, () =>
        HttpResponse.json({ success: false, message: "bad quantity" })
      )
    );
    const cart = mapLegacyCartToDomain([cartRow]);
    await expect(cartRepository.updateQuantity(cart.items[0], 3)).rejects.toThrow(/bad quantity/);
  });
});

describe("cartRepository.removeCartItem (legacy)", () => {
  it("DELETEs /delete/cart-item/{cartItemId} using the cart row id", async () => {
    let capturedUrl: string | undefined;
    let capturedMethod: string | undefined;
    useHandlers(
      http.delete(`${PROXY_BASE}/delete/cart-item/:id`, ({ request }) => {
        capturedUrl = request.url;
        capturedMethod = request.method;
        return HttpResponse.json({ success: true, message: "" });
      })
    );
    await cartRepository.removeCartItem("166340327");
    expect(capturedUrl).toBe(`${PROXY_BASE}/delete/cart-item/166340327`);
    expect(capturedMethod).toBe("DELETE");
  });

  it("throws on Loom's 200 + {success:false} rejection", async () => {
    useHandlers(
      http.delete(`${PROXY_BASE}/delete/cart-item/:id`, () =>
        HttpResponse.json({ success: false, message: "not your cart item" })
      )
    );
    await expect(cartRepository.removeCartItem("1")).rejects.toThrow(/not your cart item/);
  });
});
