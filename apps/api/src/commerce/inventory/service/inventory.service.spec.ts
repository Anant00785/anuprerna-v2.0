/**
 * Pins InventoryService against the magic-id fallbacks it used to carry:
 * `warehouseId || 306145`, `reasonId || 306167`, an invented default item for
 * product 94504, and a restock request defaulting to tenant 1 / product 94504 /
 * quantity 100. A nonexistent warehouse or reason now rejects loudly.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { InventoryService } from "./inventory.service.js";
import type { InventoryRepository } from "../repository/inventory.repository.js";

function makeRepo(overrides: Record<string, unknown> = {}) {
  return {
    findWarehouseById: vi.fn().mockResolvedValue({ id: 12n }),
    findReasonById: vi.fn().mockResolvedValue({ id: 34n }),
    findWarehousesPaginated: vi.fn().mockResolvedValue([]),
    findReasonsPaginated: vi.fn().mockResolvedValue([]),
    insertAdjustment: vi.fn().mockResolvedValue({ id: 1n }),
    insertRestockRequest: vi.fn().mockResolvedValue({ id: 1n }),
    ...overrides,
  } as never as InventoryRepository;
}

const adjustment = {
  userId: 42,
  adjustmentDate: 1700000000000,
  warehouseId: 12,
  reasonId: 34,
  items: [{ productId: 56, quantityAvailable: 5, quantityAdjusted: -1, quantityAtHand: 4 }],
};

describe("InventoryService.addAdjustment", () => {
  it("rejects when the warehouse does not exist — never substitutes another warehouse", async () => {
    const repo = makeRepo({ findWarehouseById: vi.fn().mockResolvedValue(null) });
    await expect(new InventoryService(repo).addAdjustment(adjustment)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.insertAdjustment).not.toHaveBeenCalled();
    // The old code scanned for "any warehouse" as a fallback; that scan is gone.
    expect(repo.findWarehousesPaginated).not.toHaveBeenCalled();
  });

  it("rejects when the reason does not exist", async () => {
    const repo = makeRepo({ findReasonById: vi.fn().mockResolvedValue(null) });
    await expect(new InventoryService(repo).addAdjustment(adjustment)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.insertAdjustment).not.toHaveBeenCalled();
  });

  it("writes exactly the ids and items it was given — no 306145/306167/94504 anywhere", async () => {
    const repo = makeRepo();
    await new InventoryService(repo).addAdjustment(adjustment);
    const [data, items] = (repo.insertAdjustment as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data).toMatchObject({ userId: 42, warehouseId: 12, reasonId: 34 });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productId: 56, quantityAdjusted: "-1" });
  });

  it("propagates a database error instead of hiding it", async () => {
    const repo = makeRepo({ insertAdjustment: vi.fn().mockRejectedValue(new Error("db down")) });
    await expect(new InventoryService(repo).addAdjustment(adjustment)).rejects.toThrow("db down");
  });
});

describe("InventoryService.addRestockRequest", () => {
  it("writes exactly the tenant/product/quantity it was given", async () => {
    const repo = makeRepo();
    await new InventoryService(repo).addRestockRequest({
      tenantId: 42,
      productId: 7,
      productGroup: "FABRIC",
      requestedQuantity: 3,
    });
    expect(repo.insertRestockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 42, productId: 7, requestedQuantity: "3", status: "PENDING" }),
    );
  });

  it("propagates a database error instead of hiding it", async () => {
    const repo = makeRepo({ insertRestockRequest: vi.fn().mockRejectedValue(new Error("db down")) });
    await expect(
      new InventoryService(repo).addRestockRequest({
        tenantId: 42,
        productId: 7,
        productGroup: "FABRIC",
        requestedQuantity: 3,
      }),
    ).rejects.toThrow("db down");
  });
});
