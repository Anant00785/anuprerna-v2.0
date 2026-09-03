import { describe, it, expect } from "vitest";
import { toView } from "./finished-preview.mapper.js";

describe("finished-preview.mapper toView", () => {
  it("coerces bigint id/version/productId to Number and leaves product null for later enrichment", () => {
    const out = toView({ id: 1n, version: 2n, productId: 3n } as any);
    expect(out).toEqual({ id: 1, version: 2, productId: 3, product: null });
  });
});
