import { describe, it, expect } from "vitest";
import { toInsertValues, toUpdateValues, withFabricProductGroup } from "./fabric-product.mapper.js";
import { FabricProductInput } from "../types/fabric-product.types.js";

function baseInput(overrides: Partial<FabricProductInput> = {}): FabricProductInput {
  return {
    gsm: 120,
    addToSwatch: false,
    width: "44 inch",
    product: {} as any,
    ...overrides,
  } as FabricProductInput;
}

describe("fabric-product.mapper toInsertValues", () => {
  it("attaches the caller-supplied productId and maps gsm/addToSwatch/width", () => {
    const values = toInsertValues(42, baseInput());
    expect(values).toEqual({ productId: 42, gsm: 120, addToSwatch: false, width: "44 inch" });
  });

  it("defaults addToSwatch to true when absent", () => {
    const values = toInsertValues(1, baseInput({ addToSwatch: undefined }));
    expect(values.addToSwatch).toBe(true);
  });
});

describe("fabric-product.mapper toUpdateValues", () => {
  it("always overwrites gsm/addToSwatch/width unconditionally", () => {
    const values = toUpdateValues(baseInput({ gsm: 200, addToSwatch: true, width: "60 inch" }));
    expect(values).toEqual({ gsm: 200, addToSwatch: true, width: "60 inch" });
  });

  it("defaults addToSwatch to true when absent", () => {
    const values = toUpdateValues(baseInput({ addToSwatch: undefined }));
    expect(values.addToSwatch).toBe(true);
  });
});

describe("withFabricProductGroup", () => {
  it("forces productGroup to 'fabric', preserving other fields", () => {
    const out = withFabricProductGroup({ name: "Cotton Fabric", productGroup: "finished" });
    expect(out).toEqual({ name: "Cotton Fabric", productGroup: "fabric" });
  });
});
