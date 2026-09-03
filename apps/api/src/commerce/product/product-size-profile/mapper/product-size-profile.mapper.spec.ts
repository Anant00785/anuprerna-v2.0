import { describe, it, expect } from "vitest";
import { toInsertValues, toUpdateValues, toEntity, toView, toData } from "./product-size-profile.mapper.js";
import {
  CreateProductSizeProfileRequest,
  UpdateProductSizeProfileRequest,
} from "../dto/product-size-profile.dto.js";

function baseCreateInput(overrides: Partial<CreateProductSizeProfileRequest> = {}): CreateProductSizeProfileRequest {
  return {
    productId: 1,
    sizeProfileOptionId: 2,
    sizeProfileOptionSku: "SKU-S",
    quantity: 10,
    consumedFabric: 1.5,
    disabled: false,
    ...overrides,
  } as CreateProductSizeProfileRequest;
}

describe("product-size-profile.mapper toInsertValues", () => {
  it("maps every field, stringifying consumedFabric", () => {
    const values = toInsertValues(baseCreateInput());
    expect(values).toEqual({
      productId: 1,
      sizeProfileOptionId: 2,
      sizeProfileOptionSku: "SKU-S",
      quantity: 10,
      consumedFabric: "1.5",
      disabled: false,
    });
  });

  it("keeps consumedFabric null when input is null/absent, and defaults disabled to false", () => {
    const values = toInsertValues(baseCreateInput({ consumedFabric: undefined, disabled: undefined }));
    expect(values.consumedFabric).toBeNull();
    expect(values.disabled).toBe(false);
  });
});

describe("product-size-profile.mapper toUpdateValues", () => {
  it("writes the full persisted shape (no partial-update quirk)", () => {
    const input: UpdateProductSizeProfileRequest = { ...baseCreateInput(), id: 9 } as UpdateProductSizeProfileRequest;
    const values = toUpdateValues(input);
    expect(values).toEqual({
      productId: 1,
      sizeProfileOptionId: 2,
      sizeProfileOptionSku: "SKU-S",
      quantity: 10,
      consumedFabric: "1.5",
      disabled: false,
    });
  });
});

describe("product-size-profile.mapper toEntity", () => {
  it("coerces the numeric-string consumedFabric column back to Number", () => {
    const entity = toEntity({
      id: 1n,
      version: 1n,
      productId: 1,
      sizeProfileOptionId: 2,
      sizeProfileOptionSku: "SKU-S",
      quantity: 10,
      consumedFabric: "1.50",
      disabled: false,
    });
    expect(entity.consumedFabric).toBe(1.5);
  });

  it("preserves null consumedFabric rather than coercing to 0", () => {
    const entity = toEntity({
      id: 1n,
      version: 1n,
      productId: 1,
      sizeProfileOptionId: 2,
      sizeProfileOptionSku: "SKU-S",
      quantity: 10,
      consumedFabric: null,
      disabled: false,
    });
    expect(entity.consumedFabric).toBeNull();
  });
});

describe("product-size-profile.mapper toView", () => {
  it("coerces bigint id/version to Number and embeds the resolved sizeProfileOption", () => {
    const entity = toEntity({
      id: 5n,
      version: 2n,
      productId: 1,
      sizeProfileOptionId: 2,
      sizeProfileOptionSku: "SKU-S",
      quantity: 10,
      consumedFabric: "1.50",
      disabled: false,
    });
    const preview = { id: 2, name: "Small" } as any;
    const view = toView(entity, preview);
    expect(view.id).toBe(5);
    expect(view.version).toBe(2);
    expect(view.sizeProfileOption).toBe(preview);
    expect(view.consumedFabric).toBe(1.5);
  });

  it("allows a null sizeProfileOption", () => {
    const entity = toEntity({
      id: 5n, version: 2n, productId: 1, sizeProfileOptionId: 2,
      sizeProfileOptionSku: "SKU-S", quantity: 10, consumedFabric: null, disabled: false,
    });
    const view = toView(entity, null);
    expect(view.sizeProfileOption).toBeNull();
  });
});

describe("product-size-profile.mapper toData", () => {
  it("maps snake_case native-query columns, coercing numeric strings to Number", () => {
    const data = toData({
      id: "5",
      version: "2",
      product_id: "1",
      size_profile_option_id: "2",
      size_profile_option_sku: "SKU-S",
      quantity: "10",
      consumed_fabric: "1.50",
      disabled: false,
    });
    expect(data).toEqual({
      id: 5,
      version: 2,
      productId: 1,
      sizeProfileOptionId: 2,
      sizeProfileOptionSku: "SKU-S",
      quantity: 10,
      consumedFabric: 1.5,
      disabled: false,
    });
  });

  it("preserves a null consumed_fabric rather than coercing to 0", () => {
    const data = toData({
      id: "5", version: "2", product_id: "1", size_profile_option_id: "2",
      size_profile_option_sku: "SKU-S", quantity: "10", consumed_fabric: null, disabled: false,
    });
    expect(data.consumedFabric).toBeNull();
  });
});
