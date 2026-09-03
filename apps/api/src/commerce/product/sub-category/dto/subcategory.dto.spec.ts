/**
 * Regression: parseCreateSubCategoryRequest used to default a missing
 * segmentId to 66059 and a missing name to "SUB CATEGORY" — a sub-category
 * silently filed under someone's real segment. Both are required now.
 */
import { describe, it, expect } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { parseCreateSubCategoryRequest } from "./subcategory.dto.js";

describe("parseCreateSubCategoryRequest", () => {
  it("rejects a missing segmentId instead of defaulting to 66059", () => {
    expect(() => parseCreateSubCategoryRequest({ name: "Cushions" })).toThrow(BadRequestException);
  });

  it("rejects a missing name instead of inventing \"SUB CATEGORY\"", () => {
    expect(() => parseCreateSubCategoryRequest({ segmentId: 31862 })).toThrow(BadRequestException);
  });

  it("keeps the real segmentId it was given", () => {
    expect(parseCreateSubCategoryRequest({ segmentId: 31862, name: "Cushions" }).segmentId).toBe(31862);
  });
});
