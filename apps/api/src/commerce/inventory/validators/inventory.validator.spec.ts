import { describe, it, expect } from "vitest";
import {
  validateWarehouse,
  validateInventoryAdjustmentReason,
  validateInventoryAdjustment,
  validateInventoryRestockRequest,
  validateUpdateRestockRequestQuantity,
  validateUpdateRestockRequestStatus,
} from "./inventory.validator.js";

describe("validateWarehouse", () => {
  it("passes with a non-empty name", () => {
    expect(validateWarehouse({ name: "Main", description: "" })).toBeNull();
  });

  it("rejects an empty/whitespace-only name", () => {
    expect(validateWarehouse({ name: "   ", description: "" })).toBe("Name is required.");
  });
});

describe("validateInventoryAdjustmentReason", () => {
  it("passes with a non-empty reason", () => {
    expect(validateInventoryAdjustmentReason({ reason: "Damaged", description: "" })).toBeNull();
  });

  it("rejects an empty reason", () => {
    expect(validateInventoryAdjustmentReason({ reason: "", description: "" })).toBe("Reason is required.");
  });
});

describe("validateInventoryAdjustment", () => {
  const valid = {
    userId: 1,
    adjustmentDate: Date.now(),
    warehouseId: 2,
    referenceNo: "REF1",
    reasonId: 3,
    description: "",
    items: [{ productId: 1, quantityAvailable: 1, quantityAdjusted: 1, quantityAtHand: 1 }],
  };

  it("passes with warehouseId, reasonId, and at least one item", () => {
    expect(validateInventoryAdjustment(valid)).toBeNull();
  });

  it("rejects a missing warehouseId", () => {
    expect(validateInventoryAdjustment({ ...valid, warehouseId: undefined as any })).toBe(
      "Warehouse ID is required."
    );
  });

  it("rejects a missing reasonId", () => {
    expect(validateInventoryAdjustment({ ...valid, reasonId: undefined as any })).toBe("Reason ID is required.");
  });

  it("rejects an empty items array", () => {
    expect(validateInventoryAdjustment({ ...valid, items: [] })).toBe(
      "At least one adjustment item is required."
    );
  });
});

describe("validateInventoryRestockRequest", () => {
  const valid = { tenantId: 1, productId: 2, productGroup: "finished", requestedQuantity: 5 };

  it("passes with tenantId, productId, productGroup, and quantity > 0", () => {
    expect(validateInventoryRestockRequest(valid)).toBeNull();
  });

  it("rejects a missing tenantId", () => {
    expect(validateInventoryRestockRequest({ ...valid, tenantId: undefined as any })).toBe(
      "Tenant ID is required."
    );
  });

  it("rejects a missing productId", () => {
    expect(validateInventoryRestockRequest({ ...valid, productId: undefined as any })).toBe(
      "Product ID is required."
    );
  });

  it("rejects a missing productGroup", () => {
    expect(validateInventoryRestockRequest({ ...valid, productGroup: "" })).toBe(
      "Product group is required."
    );
  });

  it("boundary: requestedQuantity = 0 is rejected", () => {
    expect(validateInventoryRestockRequest({ ...valid, requestedQuantity: 0 })).toBe(
      "Requested quantity must be greater than 0."
    );
  });

  it("boundary: requestedQuantity just above 0 passes", () => {
    expect(validateInventoryRestockRequest({ ...valid, requestedQuantity: 0.01 })).toBeNull();
  });
});

describe("validateUpdateRestockRequestQuantity", () => {
  it("passes with a requestId and positive quantity", () => {
    expect(validateUpdateRestockRequestQuantity({ requestId: 1, quantity: 5 })).toBeNull();
  });

  it("rejects a missing requestId", () => {
    expect(validateUpdateRestockRequestQuantity({ requestId: undefined as any, quantity: 5 })).toBe(
      "Request ID is required."
    );
  });

  it("rejects quantity <= 0", () => {
    expect(validateUpdateRestockRequestQuantity({ requestId: 1, quantity: 0 })).toBe(
      "Quantity must be greater than 0."
    );
  });
});

describe("validateUpdateRestockRequestStatus", () => {
  it("passes with a requestId and status", () => {
    expect(validateUpdateRestockRequestStatus({ requestId: 1, status: "APPROVED" })).toBeNull();
  });

  it("rejects a missing requestId", () => {
    expect(validateUpdateRestockRequestStatus({ requestId: undefined as any, status: "APPROVED" })).toBe(
      "Request ID is required."
    );
  });

  it("rejects a missing status", () => {
    expect(validateUpdateRestockRequestStatus({ requestId: 1, status: "" })).toBe("Status is required.");
  });
});
