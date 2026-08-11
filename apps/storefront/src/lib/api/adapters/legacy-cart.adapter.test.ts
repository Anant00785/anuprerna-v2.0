import { describe, it, expect } from "vitest";
import { mapLegacyCartItemToDomain, mapLegacyCartToDomain } from "./legacy-cart.adapter";
import { mapNestCartToDomain } from "./nest-cart.adapter";
import type { LegacyCartResponseDto } from "../dto/legacy-springboot.dto";
import type { NestCartDto } from "../dto/nestjs.dto";

describe("mapLegacyCartItemToDomain", () => {
  it("maps a full cart item, deriving the product from productDetails", () => {
    const item = mapLegacyCartItemToDomain({
      cartItemId: 1,
      productId: 99,
      productDetails: { id: 99, productName: "Cotton Fabric", priceDetails: { basePrice: 300 } },
      qty: 2,
      unitPrice: 300,
      totalPrice: 600,
      selectedColorHex: "#ffffff",
      variantId: "v1",
    });

    expect(item).toMatchObject({
      id: "1",
      productId: "99",
      quantity: 2,
      unitPrice: 300,
      totalPrice: 600,
      selectedColor: "#ffffff",
      selectedVariantId: "v1",
    });
    expect(item.product.name).toBe("Cotton Fabric");
  });

  it("builds a placeholder product when productDetails is missing", () => {
    const item = mapLegacyCartItemToDomain({ productId: 5, unitPrice: 250, qty: 1 });
    expect(item.product).toMatchObject({
      id: "5",
      name: "Artisan Fabric Item",
      price: 250,
      thumbnail: "/images/placeholder.jpg",
      gallery: ["/images/placeholder.jpg"],
      inStock: true,
    });
  });

  it("defaults qty to 1 and derives totalPrice from unitPrice * quantity when totalPrice is absent", () => {
    const item = mapLegacyCartItemToDomain({ productId: 1, unitPrice: 100 });
    expect(item.quantity).toBe(1);
    expect(item.totalPrice).toBe(100);
  });

  it("falls back to a random string id when both cartItemId and productId are missing", () => {
    const item = mapLegacyCartItemToDomain({});
    expect(item.id).toBeTruthy();
    expect(item.productId).toBe("unknown");
  });
});

describe("mapLegacyCartToDomain", () => {
  const dto: LegacyCartResponseDto = {
    cartId: "cart-1",
    items: [
      { productId: 1, unitPrice: 100, qty: 2, totalPrice: 200 },
      { productId: 2, unitPrice: 50, qty: 1, totalPrice: 50 },
    ],
    totalCartValue: 250,
    discountAmount: 20,
    deliveryCharge: 0,
  };

  it("aggregates item count and totals from the item list", () => {
    const cart = mapLegacyCartToDomain(dto);
    expect(cart.id).toBe("cart-1");
    expect(cart.items).toHaveLength(2);
    expect(cart.itemCount).toBe(3);
    expect(cart.subtotal).toBe(250);
    expect(cart.discount).toBe(20);
    expect(cart.estimatedShipping).toBe(0);
    expect(cart.total).toBe(230);
  });

  it("returns an empty cart shape for an empty/missing items list", () => {
    const cart = mapLegacyCartToDomain({});
    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
    expect(cart.subtotal).toBe(0);
    expect(cart.total).toBe(0);
  });

  it("applies free shipping over 2000 subtotal, else a flat 150 charge, when deliveryCharge is absent", () => {
    const cheap = mapLegacyCartToDomain({ items: [{ productId: 1, unitPrice: 100, qty: 1, totalPrice: 100 }] });
    expect(cheap.estimatedShipping).toBe(150);
    const expensive = mapLegacyCartToDomain({ items: [{ productId: 1, unitPrice: 3000, qty: 1, totalPrice: 3000 }] });
    expect(expensive.estimatedShipping).toBe(0);
  });
});

describe("legacy vs nest cart adapter equivalence", () => {
  it("map a representative legacy and nest cart to the same domain shape", () => {
    const legacyDto: LegacyCartResponseDto = {
      cartId: "c1",
      items: [
        {
          cartItemId: "ci1",
          productId: "p1",
          productDetails: { id: "p1", productName: "Wool Shawl", priceDetails: { basePrice: 400 } },
          qty: 2,
          unitPrice: 400,
          totalPrice: 800,
        },
      ],
      totalCartValue: 800,
      discountAmount: 0,
      deliveryCharge: 100,
    };

    const nestDto: NestCartDto = {
      id: "c1",
      items: [
        {
          id: "ci1",
          productId: "p1",
          product: {
            id: "p1",
            slug: "wool-shawl",
            title: "Wool Shawl",
            price: { amount: 400, currency: "INR" },
            thumbnailUrl: "/images/placeholder.jpg",
            galleryUrls: [],
            stockQuantity: 1,
            isAvailable: true,
          },
          quantity: 2,
          unitPrice: 400,
          subtotal: 800,
        },
      ],
      itemCount: 2,
      subtotal: 800,
      discountTotal: 0,
      shippingFee: 100,
      grandTotal: 900,
      currency: "INR",
    };

    const fromLegacy = mapLegacyCartToDomain(legacyDto);
    const fromNest = mapNestCartToDomain(nestDto);

    expect(fromLegacy).toMatchObject({
      id: "c1",
      itemCount: 2,
      subtotal: 800,
      discount: 0,
      estimatedShipping: 100,
      total: 900,
      currency: "INR",
    });
    // Same top-level cart shape from both backends once adapted.
    expect(fromNest).toMatchObject({
      id: fromLegacy.id,
      itemCount: fromLegacy.itemCount,
      subtotal: fromLegacy.subtotal,
      discount: fromLegacy.discount,
      estimatedShipping: fromLegacy.estimatedShipping,
      total: fromLegacy.total,
      currency: fromLegacy.currency,
    });
    expect(fromNest.items[0]).toMatchObject({
      productId: fromLegacy.items[0].productId,
      quantity: fromLegacy.items[0].quantity,
      unitPrice: fromLegacy.items[0].unitPrice,
      totalPrice: fromLegacy.items[0].totalPrice,
    });
  });
});
