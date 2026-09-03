import { describe, it, expect, vi } from "vitest";
import { toInsertValues, toUpdateValues } from "./custom-product.mapper.js";
import { AddCustomProductRequest } from "../dto/custom-product.dto.js";
import { UpdateCustomProductInput } from "../types/custom-product.types.js";

function baseInput(overrides: Partial<AddCustomProductRequest> = {}): AddCustomProductRequest {
  return {
    name: "Custom Saree",
    sku: "CUST-1",
    price: 999,
    productGroup: "fabric",
    unit: "UNIT",
    remarks: "handle with care",
    heroImage: "hero.jpg",
    additionalImages: "img1.jpg,img2.jpg",
    additionalDocs: "doc.pdf",
    ...overrides,
  } as AddCustomProductRequest;
}

describe("custom-product.mapper toInsertValues", () => {
  it("maps a fully-populated input, stringifying price and stamping createdAt/updatedAt", () => {
    vi.useFakeTimers().setSystemTime(5000);
    const values = toInsertValues(baseInput());
    expect(values).toEqual({
      name: "Custom Saree",
      sku: "CUST-1",
      price: "999",
      productGroup: "fabric",
      unit: "UNIT",
      remarks: "handle with care",
      heroImage: "hero.jpg",
      additionalImages: "img1.jpg,img2.jpg",
      additionalDocs: "doc.pdf",
      createdAt: 5000,
      updatedAt: 5000,
    });
    vi.useRealTimers();
  });

  it("defaults unit to METER and string fields to empty string when absent", () => {
    const values = toInsertValues(baseInput({
      unit: undefined,
      remarks: undefined,
      heroImage: undefined,
      additionalImages: undefined,
      additionalDocs: undefined,
    }));
    expect(values.unit).toBe("METER");
    expect(values.remarks).toBe("");
    expect(values.heroImage).toBe("");
    expect(values.additionalImages).toBe("");
    expect(values.additionalDocs).toBe("");
  });
});

describe("custom-product.mapper toUpdateValues", () => {
  it("maps name/productGroup/unit/price/images/remarks and stamps updatedAt, omitting sku/createdAt", () => {
    vi.useFakeTimers().setSystemTime(9000);
    const input: UpdateCustomProductInput = { ...baseInput(), id: 1 } as UpdateCustomProductInput;
    const values = toUpdateValues(input);
    expect(values).toEqual({
      name: "Custom Saree",
      productGroup: "fabric",
      unit: "UNIT",
      price: "999",
      heroImage: "hero.jpg",
      additionalImages: "img1.jpg,img2.jpg",
      additionalDocs: "doc.pdf",
      remarks: "handle with care",
      updatedAt: 9000,
    });
    expect(values).not.toHaveProperty("sku");
    expect(values).not.toHaveProperty("createdAt");
    vi.useRealTimers();
  });
});
