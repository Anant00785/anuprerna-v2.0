/**
 * Regression suite for the magic-number defaults: a request missing a
 * warehouse id used to silently adjust stock in warehouse 306145 (with reason
 * 306167, product 94504, quantity 100 — real ids from someone's database).
 * A missing required id must fail validation, never be guessed.
 */
import { describe, it, expect } from "vitest";
import {
  parseInventoryAdjustmentInput,
  parseInventoryRestockRequestInput,
} from "./inventory.dto.js";
import {
  validateInventoryAdjustment,
  validateInventoryRestockRequest,
} from "../validators/inventory.validator.js";

describe("inventory adjustment — no magic-id fallbacks", () => {
  const validRaw = {
    warehouseId: 12,
    reasonId: 34,
    items: [{ productId: 56, quantityAvailable: 5, quantityAdjusted: -1, quantityAtHand: 4 }],
  };

  it("a missing warehouseId fails validation instead of becoming 306145", () => {
    const input = parseInventoryAdjustmentInput({ ...validRaw, warehouseId: undefined });
    expect(input.warehouseId).not.toBe(306145);
    expect(validateInventoryAdjustment(input)).toBe("Warehouse ID is required.");
  });

  it("a missing reasonId fails validation instead of becoming 306167", () => {
    const input = parseInventoryAdjustmentInput({ ...validRaw, reasonId: undefined });
    expect(input.reasonId).not.toBe(306167);
    expect(validateInventoryAdjustment(input)).toBe("Reason ID is required.");
  });

  it("an item missing productId fails validation instead of becoming 94504", () => {
    const input = parseInventoryAdjustmentInput({
      ...validRaw,
      items: [{ quantityAvailable: 5, quantityAdjusted: -1, quantityAtHand: 4 }],
    });
    expect(input.items[0].productId).not.toBe(94504);
    expect(validateInventoryAdjustment(input)).toBe("Each adjustment item requires a product ID.");
  });

  it("no items means rejection — an adjustment for product 94504 is never invented", () => {
    const input = parseInventoryAdjustmentInput({ ...validRaw, items: undefined });
    expect(input.items).toEqual([]);
    expect(validateInventoryAdjustment(input)).toBe("At least one adjustment item is required.");
  });

  it("real ids pass through unchanged and validate", () => {
    const input = parseInventoryAdjustmentInput(validRaw);
    expect(input.warehouseId).toBe(12);
    expect(input.reasonId).toBe(34);
    expect(input.items[0].productId).toBe(56);
    expect(validateInventoryAdjustment(input)).toBeNull();
  });
});

describe("inventory restock request — no magic defaults", () => {
  const validRaw = { tenantId: 42, productId: 7, productGroup: "FABRIC", requestedQuantity: 3 };

  it("a missing productId fails validation instead of becoming 94504", () => {
    const input = parseInventoryRestockRequestInput({ ...validRaw, productId: undefined });
    expect(input.productId).not.toBe(94504);
    expect(validateInventoryRestockRequest(input)).toBe("Product ID is required.");
  });

  it("a missing tenantId fails validation instead of becoming 1", () => {
    const input = parseInventoryRestockRequestInput({ ...validRaw, tenantId: undefined });
    expect(input.tenantId).toBe(0);
    expect(validateInventoryRestockRequest(input)).toBe("Tenant ID is required.");
  });

  it("a missing requestedQuantity fails validation instead of becoming 100", () => {
    const input = parseInventoryRestockRequestInput({ ...validRaw, requestedQuantity: undefined });
    expect(input.requestedQuantity).not.toBe(100);
    expect(validateInventoryRestockRequest(input)).toBe("Requested quantity must be greater than 0.");
  });

  it("a missing productGroup fails validation instead of becoming FABRIC", () => {
    const input = parseInventoryRestockRequestInput({ ...validRaw, productGroup: undefined });
    expect(input.productGroup).toBe("");
    expect(validateInventoryRestockRequest(input)).toBe("Product group is required.");
  });

  it("real values pass through unchanged", () => {
    const input = parseInventoryRestockRequestInput(validRaw);
    expect(input).toMatchObject(validRaw);
    expect(validateInventoryRestockRequest(input)).toBeNull();
  });
});
