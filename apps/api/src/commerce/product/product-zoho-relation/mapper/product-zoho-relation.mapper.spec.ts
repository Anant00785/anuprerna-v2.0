import { describe, it, expect } from "vitest";
import { toInsertValues, toUpdateValues, toEntity, toView, toData } from "./product-zoho-relation.mapper.js";
import {
  CreateProductZohoRelationRequest,
  UpdateProductZohoRelationRequest,
} from "../dto/product-zoho-relation.dto.js";

function baseCreateInput(overrides: Partial<CreateProductZohoRelationRequest> = {}): CreateProductZohoRelationRequest {
  return {
    productId: 1,
    sku: "SKU1",
    zohoItemId: "Z1",
    hsnCode: "1234",
    purchasePrice: 100,
    tax: 18,
    disabled: false,
    ...overrides,
  } as CreateProductZohoRelationRequest;
}

describe("product-zoho-relation.mapper toInsertValues", () => {
  it("maps every field, stringifying purchasePrice/tax", () => {
    const values = toInsertValues(baseCreateInput());
    expect(values).toEqual({
      productId: 1,
      sku: "SKU1",
      zohoItemId: "Z1",
      hsnCode: "1234",
      purchasePrice: "100",
      tax: "18",
      disabled: false,
    });
  });

  it("defaults zohoItemId/hsnCode to empty string, purchasePrice to 0.001, and disabled to false when absent", () => {
    const values = toInsertValues(baseCreateInput({ zohoItemId: undefined, hsnCode: undefined, purchasePrice: undefined, disabled: undefined }));
    expect(values.zohoItemId).toBe("");
    expect(values.hsnCode).toBe("");
    expect(values.purchasePrice).toBe("0.001");
    expect(values.disabled).toBe(false);
  });
});

describe("product-zoho-relation.mapper toUpdateValues", () => {
  it("writes the full persisted shape", () => {
    const input: UpdateProductZohoRelationRequest = { ...baseCreateInput(), id: 9 } as UpdateProductZohoRelationRequest;
    const values = toUpdateValues(input);
    expect(values).toEqual({
      productId: 1,
      sku: "SKU1",
      zohoItemId: "Z1",
      hsnCode: "1234",
      purchasePrice: "100",
      tax: "18",
      disabled: false,
    });
  });
});

describe("product-zoho-relation.mapper toEntity", () => {
  it("coerces purchasePrice/tax back to Number, sets product undefined and quantity to 0 (transient placeholder)", () => {
    const entity = toEntity({
      id: 1n,
      version: 1n,
      productId: 1,
      sku: "SKU1",
      zohoItemId: "Z1",
      hsnCode: "1234",
      purchasePrice: "100.00",
      tax: "18.00",
      disabled: false,
    });
    expect(entity.purchasePrice).toBe(100);
    expect(entity.tax).toBe(18);
    expect(entity.quantity).toBe(0);
    expect(entity.product).toBeUndefined();
  });
});

describe("product-zoho-relation.mapper toView", () => {
  it("always nulls quantity, since it's never populated (@Transient in source)", () => {
    const entity = toEntity({
      id: 1n, version: 1n, productId: 1, sku: "SKU1", zohoItemId: "Z1",
      hsnCode: "1234", purchasePrice: "100.00", tax: "18.00", disabled: false,
    });
    const view = toView(entity);
    expect(view.quantity).toBeNull();
    expect(view.id).toBe(1);
    expect(view.version).toBe(1);
  });
});

describe("product-zoho-relation.mapper toData", () => {
  it("maps snake_case native-query columns, coercing numeric strings to Number", () => {
    const data = toData({
      id: "1",
      version: "1",
      product_id: "1",
      sku: "SKU1",
      zoho_item_id: "Z1",
      hsn_code: "1234",
      purchase_price: "100.00",
      tax: "18.00",
      disabled: false,
    });
    expect(data).toEqual({
      id: 1,
      version: 1,
      productId: 1,
      sku: "SKU1",
      zohoItemId: "Z1",
      hsnCode: "1234",
      purchasePrice: 100,
      tax: 18,
      disabled: false,
    });
  });
});
