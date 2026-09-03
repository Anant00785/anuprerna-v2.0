import { describe, it, expect } from "vitest";
import { toView } from "./fabric-preview.mapper.js";

describe("fabric-preview.mapper toView", () => {
  it("coerces bigint id/version/productId to Number and leaves product null for later enrichment", () => {
    const out = toView({
      id: 1n,
      version: 2n,
      productId: 3n,
      addToSwatch: true,
      gsm: 120,
      width: "44 inch",
    } as any);
    expect(out).toEqual({
      id: 1,
      version: 2,
      productId: 3,
      product: null,
      gsm: 120,
    });
  });
});
