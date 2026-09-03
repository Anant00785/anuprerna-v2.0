import { describe, it, expect } from "vitest";
import { validateProductImageGallerySEOPayload } from "./seo.validator.js";

const item = (overrides: Partial<{ image: string; altText: string; deleted: boolean }> = {}) => ({
  id: 1, version: 1, productId: 1, image: "a.jpg", altText: "alt", deleted: false, ...overrides,
});

describe("validateProductImageGallerySEOPayload", () => {
  it("accepts a valid payload", () => {
    expect(validateProductImageGallerySEOPayload({ productId: 1, gallerySEOList: [item()] })).toBeNull();
  });

  it("rejects a missing productId", () => {
    expect(validateProductImageGallerySEOPayload({ productId: 0, gallerySEOList: [] })).toMatch(/Product ID/);
  });

  it("rejects a non-deleted item with a blank image", () => {
    expect(validateProductImageGallerySEOPayload({ productId: 1, gallerySEOList: [item({ image: "  " })] })).toMatch(/Image URL/);
  });

  it("rejects a non-deleted item with a blank altText", () => {
    expect(validateProductImageGallerySEOPayload({ productId: 1, gallerySEOList: [item({ altText: "" })] })).toMatch(/Alt text/);
  });

  it("skips image/altText checks for items marked deleted", () => {
    expect(validateProductImageGallerySEOPayload({ productId: 1, gallerySEOList: [item({ image: "", altText: "", deleted: true })] })).toBeNull();
  });
});
