import { describe, it, expect } from "vitest";
import { toInsertValues } from "./finished-product.mapper.js";

describe("finished-product.mapper toInsertValues", () => {
  it("wraps the caller-supplied productId with no other fields", () => {
    const values = toInsertValues(42);
    expect(values).toEqual({ productId: 42 });
  });
});
