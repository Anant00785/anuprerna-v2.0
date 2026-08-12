import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { InventoryService } from "./inventory-service";

describe("InventoryService", () => {
  it("getInventoryAdjustments sends offset/limit/sku as query params and unwraps 'inventoryAdjustmentList'", async () => {
    let seenUrl = "";
    useHandlers(
      http.get("*/get/inventory-adjustment", ({ request }) => {
        seenUrl = request.url;
        return HttpResponse.json(envelope("inventoryAdjustmentList", [{ id: 1 }]));
      })
    );
    const result = await InventoryService.getInventoryAdjustments(20, 10, "sku 1");
    const url = new URL(seenUrl);
    expect(url.searchParams.get("offset")).toBe("20");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("sku")).toBe("sku 1");
    expect(result).toEqual([{ id: 1 }]);
  });

  it("getWarehouseById unwraps the singular 'warehouse' key", async () => {
    useHandlers(
      http.get("*/get/warehouse/3", () => HttpResponse.json(envelope("warehouse", { id: 3, name: "Main" })))
    );
    const result = await InventoryService.getWarehouseById(3);
    expect(result).toEqual({ id: 3, name: "Main" });
  });

  it("propagates a rejected response from getRestockRequests", async () => {
    useHandlers(
      http.get("*/get/inventory-restock-request", () => HttpResponse.json(errorEnvelope("restock list unavailable")))
    );
    await expect(InventoryService.getRestockRequests()).rejects.toThrow("restock list unavailable");
  });

  it("updateRestockRequestStatus PATCHes the exact payload shape", async () => {
    let sawBody: unknown;
    let method = "";
    useHandlers(
      http.patch("*/update/inventory-restock-request/status", async ({ request }) => {
        method = request.method;
        sawBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );
    await InventoryService.updateRestockRequestStatus({ id: 1, productId: 2, status: "APPROVED" });
    expect(method).toBe("PATCH");
    expect(sawBody).toEqual({ id: 1, productId: 2, status: "APPROVED" });
  });
});
