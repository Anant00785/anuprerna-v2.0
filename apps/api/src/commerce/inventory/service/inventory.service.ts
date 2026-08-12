// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { ActionCode } from "../../../common/errors/action-code.js";
import { InventoryRepository } from "../repository/inventory.repository.js";
import { WarehouseInput, InventoryAdjustmentReasonInput, InventoryAdjustmentInput, InventoryRestockRequestInput } from "../dto/inventory.dto.js";
import { RestockRequestStatus } from "../types/inventory.types.js";

@Injectable()
export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  // Warehouse
  async getWarehouseById(id: bigint) {
    return this.repository.findWarehouseById(id);
  }

  async getWarehouses(page: number, size: number) {
    return this.repository.findWarehousesPaginated(page, size);
  }

  async addWarehouse(input: WarehouseInput) {
    const created = await this.repository.insertWarehouse({
      name: input.name,
      description: input.description,
      createdAt: Date.now(),
    });
    return !!created;
  }

  async updateWarehouse(input: WarehouseInput) {
    if (!input.id) return false;
    const updated = await this.repository.updateWarehouse(input.id, {
      name: input.name,
      description: input.description,
    });
    return !!updated;
  }

  // Inventory Adjustment Reason
  async getReasonById(id: bigint) {
    return this.repository.findReasonById(id);
  }

  async getReasons(page: number, size: number) {
    return this.repository.findReasonsPaginated(page, size);
  }

  async addReason(input: InventoryAdjustmentReasonInput) {
    const created = await this.repository.insertReason({
      reason: input.reason,
      description: input.description,
      createdAt: Date.now(),
    });
    return !!created;
  }

  async updateReason(input: InventoryAdjustmentReasonInput) {
    if (!input.id) return false;
    const updated = await this.repository.updateReason(input.id, {
      reason: input.reason,
      description: input.description,
    });
    return !!updated;
  }

  // Inventory Adjustment
  async getAdjustmentById(id: bigint) {
    return this.repository.findAdjustmentById(id);
  }

  async getAdjustments(page: number, size: number) {
    return this.repository.findAdjustmentsPaginated(page, size);
  }

  async addAdjustment(input: InventoryAdjustmentInput) {
    const data = {
      userId: input.userId,
      adjustmentDate: input.adjustmentDate,
      warehouseId: input.warehouseId,
      referenceNo: input.referenceNo,
      reasonId: input.reasonId,
      description: input.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const items = input.items.map(item => ({
      inventoryAdjustmentId: BigInt(0), // populated in repo
      productId: item.productId,
      quantityAvailable: item.quantityAvailable.toString(),
      quantityAdjusted: item.quantityAdjusted.toString(),
      quantityAtHand: item.quantityAtHand.toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const created = await this.repository.insertAdjustment(data, items);
    return !!created;
  }

  // Inventory Restock Request
  async getRestockRequests(page: number, size: number) {
    return this.repository.findRestockRequestsPaginated(page, size);
  }

  async addRestockRequest(input: InventoryRestockRequestInput) {
    const created = await this.repository.insertRestockRequest({
      tenantId: input.tenantId,
      productId: input.productId,
      madeToOrderProductId: input.madeToOrderProductId ?? null,
      sizeOptionId: input.sizeOptionId ?? null,
      productGroup: input.productGroup,
      requestedQuantity: input.requestedQuantity.toString(),
      createdAt: Date.now(),
      status: RestockRequestStatus.PENDING as any,
    });
    return !!created;
  }

  async updateRestockRequestQuantity(id: bigint, quantity: number) {
    const updated = await this.repository.updateRestockRequestQuantity(id, quantity);
    return !!updated;
  }

  async updateRestockRequestStatus(id: bigint, status: string) {
    const updated = await this.repository.updateRestockRequestStatus(id, status);
    return !!updated;
  }

  async deleteRestockRequest(id: bigint) {
    const deleted = await this.repository.deleteRestockRequest(id);
    return !!deleted;
  }
}
// @ts-nocheck
