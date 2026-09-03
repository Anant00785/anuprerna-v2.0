import { BadRequestException, Injectable } from "@nestjs/common";
import { ActionCode } from "../../../common/errors/action-code.js";
import { InventoryRepository } from "../repository/inventory.repository.js";
import { WarehouseInput, InventoryAdjustmentReasonInput, InventoryAdjustmentInput, InventoryRestockRequestInput } from "../dto/inventory.dto.js";

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
    const updated = await this.repository.updateWarehouse(BigInt(input.id), {
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
    const updated = await this.repository.updateReason(BigInt(input.id), {
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
    // The referenced warehouse and reason must exist — this used to fall back
    // to hardcoded production ids (306145 / 306167) and even invent a default
    // adjustment item for product 94504 when none was sent.
    const wh = await this.repository.findWarehouseById(BigInt(input.warehouseId));
    if (!wh) throw new BadRequestException(`Warehouse ${input.warehouseId} does not exist.`);
    const reason = await this.repository.findReasonById(BigInt(input.reasonId));
    if (!reason) throw new BadRequestException(`Adjustment reason ${input.reasonId} does not exist.`);

    const data = {
      userId: input.userId,
      adjustmentDate: input.adjustmentDate || Date.now(),
      warehouseId: input.warehouseId,
      referenceNo: input.referenceNo || `ADJ-${Date.now()}`,
      reasonId: input.reasonId,
      description: input.description || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const items = input.items.map(item => ({
      inventoryAdjustmentId: 0,
      productId: item.productId,
      quantityAvailable: (item.quantityAvailable ?? 0).toString(),
      quantityAdjusted: (item.quantityAdjusted ?? 0).toString(),
      quantityAtHand: (item.quantityAtHand ?? 0).toString(),
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
    // tenantId / productId / productGroup / requestedQuantity are validated
    // upstream — no hardcoded id or quantity fallbacks here.
    const created = await this.repository.insertRestockRequest({
      tenantId: input.tenantId,
      productId: input.productId,
      madeToOrderProductId: input.madeToOrderProductId ?? null,
      sizeOptionId: input.sizeOptionId ?? null,
      productGroup: input.productGroup,
      requestedQuantity: input.requestedQuantity.toString(),
      createdAt: Date.now(),
      status: "PENDING",
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
