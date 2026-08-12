import { describe, it, expect } from "vitest";
import { mapNestProductToDomain, mapNestProductDetailToDomain, mapNestNavigationToDomain } from "./nest-catalog.adapter";
import type { NestProductDto } from "../dto/nestjs.dto";

const baseDto: NestProductDto = {
  id: "1",
  slug: "silk-saree",
  title: "Silk Saree",
  price: { amount: 2000, currency: "INR" },
  thumbnailUrl: "https://cdn.test/silk.jpg",
  galleryUrls: [],
  stockQuantity: 0,
  isAvailable: false,
};

describe("mapNestProductToDomain", () => {
  it("maps a full DTO field by field", () => {
    const dto: NestProductDto = {
      ...baseDto,
      price: { amount: 1800, originalAmount: 2200, currency: "INR" },
      galleryUrls: ["a.jpg", "b.jpg"],
      stockQuantity: 4,
      isAvailable: true,
      material: "Silk",
      craft: "Weaving",
      weave: "Jacquard",
      weightGsm: 120,
      isSustainable: true,
      minOrderQty: 2,
    };
    const product = mapNestProductToDomain(dto);
    expect(product).toMatchObject({
      id: "1",
      slug: "silk-saree",
      name: "Silk Saree",
      price: 1800,
      originalPrice: 2200,
      currency: "INR",
      thumbnail: "https://cdn.test/silk.jpg",
      gallery: ["a.jpg", "b.jpg"],
      inStock: true,
      availableQuantity: 4,
      material: "Silk",
      craft: "Weaving",
      weave: "Jacquard",
      gsm: 120,
      ecoFriendly: true,
      minimumOrderQty: 2,
      badge: "Sustainable Artisan",
    });
  });

  it("falls back to the thumbnail as gallery when galleryUrls is empty, and is out of stock when stockQuantity is 0", () => {
    const product = mapNestProductToDomain(baseDto);
    expect(product.gallery).toEqual(["https://cdn.test/silk.jpg"]);
    expect(product.inStock).toBe(false);
    expect(product.ecoFriendly).toBe(true); // ?? true default, unlike legacy's ?? false
    expect(product.minimumOrderQty).toBe(1);
    expect(product.badge).toBeUndefined();
  });

  it("is out of stock when isAvailable is true but stockQuantity is 0 (both must hold)", () => {
    const product = mapNestProductToDomain({ ...baseDto, isAvailable: true, stockQuantity: 0 });
    expect(product.inStock).toBe(false);
  });
});

describe("mapNestProductDetailToDomain / mapNestNavigationToDomain", () => {
  it("builds specifications only from present fields and falls back to summary for description", () => {
    const detail = mapNestProductDetailToDomain({ ...baseDto, summary: "Short summary", material: "Silk" });
    expect(detail.description).toBe("Short summary");
    expect(detail.specifications).toEqual([{ label: "Material", value: "Silk" }]);
    expect(detail.certification).toBe("Ethical Artisan Certified");
  });

  it("maps nav items and marks featured collections by presence of a badge", () => {
    const nav = mapNestNavigationToDomain([
      { id: "1", label: "Silk", path: "/silk", badge: "New" },
      { id: "2", label: "Cotton", path: "/cotton" },
    ]);
    expect(nav.mainCategories).toHaveLength(2);
    expect(nav.featuredCollections).toEqual([expect.objectContaining({ id: "1" })]);
  });
});
