import { describe, it, expect } from "vitest";
import { mapLegacyCartItemToDomain, mapLegacyCartToDomain } from "./legacy-cart.adapter";
import type { LegacyCartItemDto } from "../dto/legacy-springboot.dto";

// The DTOs below are trimmed copies of a real `GET /get/cart-item/list` response
// captured from live Loom through the dev proxy. Loom returns the `CartItem` JPA
// rows under `cartItemList` and nothing else — no cart id, no totals, and no
// per-row price, which is why every total here is derived client-side.

const fabricRow: LegacyCartItemDto = {
  id: 166340327,
  quantity: 2,
  unit: "METER",
  orderType: "IN_STOCK",
  productGroup: "fabric",
  makingCharge: 0,
  selectedFinishId: "",
  fabricProductPreview: {
    id: 163523574,
    gsm: 60,
    product: {
      id: 163523575,
      name: "Stripe Yellow & Black Pure Cotton 60 GSM Handwoven Fabfic",
      slug: "stripe-yellow-black-pure-cotton-60-gsm-handwoven-fabfic",
      sku: "DSG1210474",
      price: 446,
      unit: "METER",
      quantity: 48,
      totalQuantity: 48,
      heroImage: "https://example.s3.amazonaws.com/hero.jpg",
    },
  },
  finishedProductPreview: null,
};

describe("mapLegacyCartItemToDomain", () => {
  it("maps a fabric row, deriving the product from fabricProductPreview.product", () => {
    const item = mapLegacyCartItemToDomain(fabricRow);
    expect(item).toMatchObject({
      id: "166340327",
      quantity: 2,
      unit: "METER",
      unitPrice: 446,
      totalPrice: 892,
    });
    expect(item.product.name).toBe("Stripe Yellow & Black Pure Cotton 60 GSM Handwoven Fabfic");
    expect(item.product.thumbnail).toBe("https://example.s3.amazonaws.com/hero.jpg");
    expect(item.product.inStock).toBe(true);
  });

  it("exposes the PREVIEW id as productId, since that is what /add/cart-item binds to", () => {
    // 163523574 (preview) vs 163523575 (inner product) — sending the latter
    // joins to the wrong row, so this distinction is load-bearing.
    expect(mapLegacyCartItemToDomain(fabricRow).productId).toBe("163523574");
  });

  it("recomputes the unit price from the preview product plus makingCharge, as Loom stores no price", () => {
    const item = mapLegacyCartItemToDomain({ ...fabricRow, makingCharge: 54, quantity: 3 });
    expect(item.unitPrice).toBe(500);
    expect(item.totalPrice).toBe(1500);
  });

  it("falls back to finishedProductPreview when the row is a finished product", () => {
    const item = mapLegacyCartItemToDomain({
      id: 5,
      quantity: 1,
      productGroup: "finished",
      fabricProductPreview: null,
      finishedProductPreview: { id: 900, product: { id: 901, name: "Cotton Stole", price: 1200 } },
    });
    expect(item.productId).toBe("900");
    expect(item.product.name).toBe("Cotton Stole");
    expect(item.unitPrice).toBe(1200);
  });

  it("degrades to a placeholder product when neither preview is present", () => {
    const item = mapLegacyCartItemToDomain({ id: 7 });
    expect(item.product.name).toBe("Artisan Fabric Item");
    expect(item.product.thumbnail).toBe("/images/placeholder.jpg");
    expect(item.product.inStock).toBe(false);
    expect(item.quantity).toBe(1);
    expect(item.unitPrice).toBe(0);
  });

  it("keeps IN_STOCK orderType and minOrderQuantity = 1 when volume discount profile has pre-order tiers", () => {
    const item = mapLegacyCartItemToDomain({
      ...fabricRow,
      orderType: "IN_STOCK",
      quantity: 5,
      volumeDiscountProfile: {
        volumeDiscountProfileItemList: [
          { minimumOrderQuantity: 25, discount: 10, preOrder: true },
          { minimumOrderQuantity: 50, discount: 20, preOrder: true },
        ],
      },
    });
    expect(item.orderType).toBe("IN_STOCK");
    expect(item.minOrderQuantity).toBe(1);
  });
});

describe("mapLegacyCartToDomain", () => {
  it("aggregates count and subtotal across the cartItemList", () => {
    const cart = mapLegacyCartToDomain([fabricRow, { ...fabricRow, id: 2, quantity: 1 }]);
    expect(cart.itemCount).toBe(3);
    expect(cart.subtotal).toBe(892 + 446);
    expect(cart.currency).toBe("INR");
  });

  it("charges nothing on an empty cart rather than the flat shipping rate", () => {
    const cart = mapLegacyCartToDomain([]);
    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
    expect(cart.estimatedShipping).toBe(0);
    expect(cart.total).toBe(0);
  });

  it("defaults to an empty cart when called with no argument", () => {
    expect(mapLegacyCartToDomain().itemCount).toBe(0);
  });

  it("applies flat 150 estimated shipping for non-empty carts", () => {
    const cheap = mapLegacyCartToDomain([{ ...fabricRow, quantity: 1 }]);
    expect(cheap.subtotal).toBe(446);
    expect(cheap.estimatedShipping).toBe(150);
    expect(cheap.total).toBe(596);

    const expensive = mapLegacyCartToDomain([{ ...fabricRow, quantity: 10 }]);
    expect(expensive.subtotal).toBe(4460);
    expect(expensive.estimatedShipping).toBe(150);
    expect(expensive.total).toBe(4610);
  });
});
