import { describe, it, expect } from "vitest";
import { toView } from "./nav-product-preview.mapper.js";

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1n,
    version: 2n,
    subCategoryId: 3n,
    slug: "cotton-saree",
    materialId: "1",
    colorId: "2",
    patternId: null,
    heroImage: null,
    productGroup: "fabric",
    disabled: false,
    ...overrides,
  } as any;
}

describe("nav-product-preview.mapper toView", () => {
  it("coerces bigint id/version/subCategoryId to Number, leaves category/segment null, and defaults transient list fields to []", () => {
    const out = toView(baseRow());
    expect(out).toEqual({
      id: 1,
      version: 2,
      subCategoryId: 3,
      category: null,
      segment: null,
      slug: "cotton-saree",
      materialId: "1",
      materials: [],
      colorId: "2",
      colors: [],
      patternId: "",
      patterns: [],
      heroImage: "",
      productGroup: "fabric",
      disabled: false,
    });
  });

  it("defaults patternId to empty string when null but preserves a populated patternId/heroImage", () => {
    const out = toView(baseRow({ patternId: "solid", heroImage: "hero.jpg" }));
    expect(out.patternId).toBe("solid");
    expect(out.heroImage).toBe("hero.jpg");
  });
});
