import { describe, it, expect } from "vitest";
import { mapNestCartItemToDomain, mapNestCartToDomain } from "./nest-cart.adapter";
import type { NestCartDto } from "../dto/nestjs.dto";

const product = {
  id: "p1",
  slug: "linen-runner",
  title: "Linen Runner",
  price: { amount: 300, currency: "INR" },
  thumbnailUrl: "linen.jpg",
  galleryUrls: [],
  stockQuantity: 5,
  isAvailable: true,
};

describe("mapNestCartItemToDomain", () => {
  it("maps a cart item, deriving totalPrice from the DTO's subtotal field", () => {
    const item = mapNestCartItemToDomain({
      id: "ci1",
      productId: "p1",
      product,
      quantity: 3,
      unitPrice: 300,
      subtotal: 900,
      variantId: "v2",
    });
    expect(item).toMatchObject({
      id: "ci1",
      productId: "p1",
      quantity: 3,
      unitPrice: 300,
      totalPrice: 900,
      selectedVariantId: "v2",
    });
    expect(item.product.name).toBe("Linen Runner");
    expect(item.selectedColor).toBeUndefined(); // nest DTO has no color field
  });
});

describe("mapNestCartToDomain", () => {
  it("maps cart totals directly from the DTO with no derivation (unlike the legacy adapter)", () => {
    const dto: NestCartDto = {
      id: "cart-9",
      items: [{ id: "ci1", productId: "p1", product, quantity: 1, unitPrice: 300, subtotal: 300 }],
      itemCount: 1,
      subtotal: 300,
      discountTotal: 30,
      shippingFee: 0,
      grandTotal: 270,
      currency: "INR",
    };
    const cart = mapNestCartToDomain(dto);
    expect(cart).toMatchObject({
      id: "cart-9",
      itemCount: 1,
      subtotal: 300,
      discount: 30,
      estimatedShipping: 0,
      total: 270, // taken verbatim from grandTotal, not recomputed
      currency: "INR",
    });
  });

  it("defaults currency to INR when the DTO omits it", () => {
    const dto = {
      id: "cart-10",
      items: [],
      itemCount: 0,
      subtotal: 0,
      discountTotal: 0,
      shippingFee: 0,
      grandTotal: 0,
    } as unknown as NestCartDto;
    expect(mapNestCartToDomain(dto).currency).toBe("INR");
  });
});
