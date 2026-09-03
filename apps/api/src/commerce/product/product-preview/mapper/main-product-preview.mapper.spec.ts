import { describe, it, expect } from "vitest";
import { toView } from "./main-product-preview.mapper.js";

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1n,
    version: 2n,
    name: "Cotton Saree",
    slug: "cotton-saree",
    sku: "SKU1",
    mainProductCheck: true,
    mainProductId: null,
    heroImage: null,
    disabled: false,
    ...overrides,
  } as any;
}

describe("main-product-preview.mapper toView", () => {
  it("coerces id/version to Number and defaults heroImage to empty string when null", () => {
    const out = toView(baseRow());
    expect(out).toEqual({
      id: 1,
      version: 2,
      name: "Cotton Saree",
      slug: "cotton-saree",
      sku: "SKU1",
      mainProductCheck: true,
      mainProductId: null,
      heroImage: "",
      disabled: false,
    });
  });

  it("coerces a non-null mainProductId to Number rather than leaving it a bigint/string", () => {
    const out = toView(baseRow({ mainProductId: 9n }));
    expect(out.mainProductId).toBe(9);
  });

  it("preserves a populated heroImage rather than blanking it", () => {
    const out = toView(baseRow({ heroImage: "hero.jpg" }));
    expect(out.heroImage).toBe("hero.jpg");
  });
});
