/**
 * Regression suite for product-creation fabrication: parseProductInput used to
 * invent a name ("Handwoven Silk Scarf"), an SKU, a ₹1200 price, sub-category
 * 25051, and 100 units of stock for any request missing them. Required fields
 * now reject; a genuine 0 price survives (`||` used to turn 0 into 1200 — the
 * falsy-zero bug that charged ₹110 for free shipping elsewhere in this repo).
 */
import { describe, it, expect } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { parseCreateProductRequest, parseUpdateProductRequest } from "./product.dto.js";

const valid = {
  name: "Chambray Teal Khadi",
  sku: "KAK0660N12",
  price: 450,
  subCategoryId: 3521,
  skuGroupId: 9,
  unit: "METER",
  productGroup: "FABRIC",
};

describe("parseCreateProductRequest — required fields reject, never fabricate", () => {
  it.each(["name", "sku", "price", "subCategoryId", "skuGroupId", "unit"])(
    "rejects a request missing %s",
    (field) => {
      const body: Record<string, unknown> = { ...valid };
      delete body[field];
      expect(() => parseCreateProductRequest(body)).toThrow(BadRequestException);
    },
  );

  it("a genuine 0 price survives — it must NOT become 1200", () => {
    expect(parseCreateProductRequest({ ...valid, price: 0 }).price).toBe(0);
  });

  it("keeps the real subCategoryId instead of 25051", () => {
    expect(parseCreateProductRequest(valid).subCategoryId).toBe(3521);
  });

  it("leaves quantity undefined when absent (DB default 0) — never a placeholder 100", () => {
    expect(parseCreateProductRequest(valid).quantity).toBeUndefined();
  });

  it("a genuine 0 quantity survives", () => {
    expect(parseCreateProductRequest({ ...valid, quantity: 0 }).quantity).toBe(0);
  });
});

describe("parseUpdateProductRequest", () => {
  it("still requires an id", () => {
    expect(() => parseUpdateProductRequest(valid)).toThrow(BadRequestException);
  });

  it("accepts a full update body with a 0 price", () => {
    expect(parseUpdateProductRequest({ ...valid, id: 5, price: 0 }).price).toBe(0);
  });
});
