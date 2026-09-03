/**
 * PATCH /update/inventory-adjustment-reason — ported from Loom
 * InventoryAdjustmentReasonController.updateInventoryAdjustmentReason
 * (CODE_SU, validate + sanitize, then a DAO update that returns
 * ActionCode.NO_ACTION when the id matches no row).
 */
import { describe, it, expect, vi } from "vitest";
import { InventoryController } from "./inventory.controller.js";
import type { InventoryService } from "../service/inventory.service.js";
import type { UpdateInventoryAdjustmentReasonDto } from "../dto/inventory.dto.js";

function make(updateReason = vi.fn().mockResolvedValue(true)) {
  const service = { updateReason } as unknown as InventoryService;
  return { updateReason, controller: new InventoryController(service) };
}

const body = (over: Partial<UpdateInventoryAdjustmentReasonDto> = {}) =>
  ({ id: 3, reason: "Damaged Goods", description: "Damaged in transit", ...over }) as UpdateInventoryAdjustmentReasonDto;

describe("InventoryController.updateReason", () => {
  it("updates and returns the Loom simple envelope", async () => {
    const { controller, updateReason } = make();

    await expect(controller.updateReason(body())).resolves.toEqual({
      success: true,
      message: "Reason updated.",
    });
    expect(updateReason).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, reason: "Damaged Goods", description: "Damaged in transit" }),
    );
  });

  it("reports failure (never a silent success) when the id matches no row", async () => {
    const { controller } = make(vi.fn().mockResolvedValue(false));
    await expect(controller.updateReason(body({ id: 9999 }))).resolves.toEqual({
      success: false,
      message: "Failed to update reason.",
    });
  });

  it("rejects an empty reason before touching the service", async () => {
    const { controller, updateReason } = make();
    await expect(controller.updateReason(body({ reason: "" }))).resolves.toEqual({
      success: false,
      message: "Reason is required.",
    });
    expect(updateReason).not.toHaveBeenCalled();
  });

  it("rejects a missing id before touching the service", async () => {
    const { controller, updateReason } = make();
    await expect(
      controller.updateReason({ reason: "Damaged" } as UpdateInventoryAdjustmentReasonDto),
    ).resolves.toEqual({ success: false, message: "Reason id is required." });
    expect(updateReason).not.toHaveBeenCalled();
  });
});
