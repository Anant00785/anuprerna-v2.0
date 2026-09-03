import { describe, it, expect } from "vitest";
import { toView } from "./review-product-preview.mapper.js";

describe("review-product-preview.mapper toView", () => {
  it("coerces id/version/subCategoryId to Number and defaults heroImage to empty string when null", () => {
    const out = toView({
      id: 1n,
      version: 2n,
      subCategoryId: 3n,
      name: "Cotton Saree",
      slug: "cotton-saree",
      sku: "SKU1",
      heroImage: null,
      productGroup: "fabric",
    } as any);
    expect(out).toEqual({
      id: 1,
      version: 2,
      subCategoryId: 3,
      name: "Cotton Saree",
      slug: "cotton-saree",
      sku: "SKU1",
      heroImage: "",
      productGroup: "fabric",
    });
  });

  it("preserves a populated heroImage", () => {
    const out = toView({
      id: 1n,
      version: 2n,
      subCategoryId: 3n,
      name: "Cotton Saree",
      slug: "cotton-saree",
      sku: "SKU1",
      heroImage: "hero.jpg",
      productGroup: "fabric",
    } as any);
    expect(out.heroImage).toBe("hero.jpg");
  });
});
