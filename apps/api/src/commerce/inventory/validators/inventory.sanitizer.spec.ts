import { describe, it, expect } from "vitest";
import {
  sanitizeWarehouse,
  sanitizeInventoryAdjustmentReason,
  sanitizeInventoryAdjustment,
  sanitizeInventoryRestockRequest,
} from "./inventory.sanitizer.js";

describe("sanitizeWarehouse", () => {
  it("trims and HTML-escapes name and description", () => {
    const result = sanitizeWarehouse({ name: "  <b>Main</b> Warehouse  ", description: "  <script>x</script>  " });
    expect(result.name).toBe("&lt;b&gt;Main&lt;/b&gt; Warehouse");
    expect(result.description).toBe("&lt;script&gt;x&lt;/script&gt;");
  });
});

describe("sanitizeInventoryAdjustmentReason", () => {
  it("trims and HTML-escapes reason and description", () => {
    const result = sanitizeInventoryAdjustmentReason({ reason: " Damaged & Lost ", description: ' "shrinkage" ' });
    expect(result.reason).toBe("Damaged &amp; Lost");
    expect(result.description).toBe("&quot;shrinkage&quot;");
  });
});

describe("sanitizeInventoryAdjustment", () => {
  it("trims and HTML-escapes referenceNo and description, leaving other fields untouched", () => {
    const result = sanitizeInventoryAdjustment({
      userId: 1n,
      adjustmentDate: 1700000000000,
      warehouseId: 2n,
      referenceNo: " REF'123 ",
      reasonId: 3n,
      description: " note ",
      items: [],
    });
    expect(result.referenceNo).toBe("REF&#x27;123");
    expect(result.description).toBe("note");
    expect(result.warehouseId).toBe(2n);
    expect(result.items).toEqual([]);
  });
});

describe("sanitizeInventoryRestockRequest", () => {
  it("trims and HTML-escapes productGroup, leaving numeric fields untouched", () => {
    const result = sanitizeInventoryRestockRequest({
      tenantId: 1n,
      productId: 2n,
      productGroup: " <finished> ",
      requestedQuantity: 5,
    });
    expect(result.productGroup).toBe("&lt;finished&gt;");
    expect(result.requestedQuantity).toBe(5);
  });
});
