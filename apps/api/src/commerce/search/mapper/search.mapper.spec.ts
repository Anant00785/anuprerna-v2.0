import { describe, it, expect } from "vitest";
import { mapProductToSearchResult } from "./search.mapper.js";

describe("mapProductToSearchResult", () => {
  it("maps a fully-populated raw row", () => {
    const out = mapProductToSearchResult({
      id: 1,
      sku: "SKU1",
      name: "Product",
      heroImage: "hero.jpg",
      hoverImage: "hover.jpg",
      heroImageAlt: "hero alt",
      hoverImageAlt: "hover alt",
      slug: "product",
      productGroup: "fabric",
      price: 199.5,
      specialStatus: "New",
      unit: "METER",
    });
    expect(out).toEqual({
      id: 1,
      sku: "SKU1",
      name: "Product",
      heroImage: "hero.jpg",
      hoverImage: "hover.jpg",
      heroImageAltText: "hero alt",
      hoverImageAltText: "hover alt",
      slug: "product",
      productGroup: "fabric",
      price: 199.5,
      specialStatus: "New",
      unit: "METER",
    });
  });

  it("defaults image alt text to empty string and specialStatus to null when absent", () => {
    const out = mapProductToSearchResult({
      id: 1,
      sku: "SKU1",
      name: "Product",
      slug: "product",
      productGroup: "fabric",
      price: 100,
      unit: "METER",
      specialStatus: null,
    });
    expect(out.heroImage).toBe("");
    expect(out.hoverImage).toBe("");
    expect(out.heroImageAltText).toBe("");
    expect(out.hoverImageAltText).toBe("");
    expect(out.specialStatus).toBeNull();
  });
});
