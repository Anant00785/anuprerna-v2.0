// @ts-nocheck
import { WarehouseInput, InventoryAdjustmentReasonInput, InventoryAdjustmentInput, InventoryRestockRequestInput, UpdateRestockRequestQuantityInput, UpdateRestockRequestStatusInput } from '../dto/inventory.dto.js';

export function validateWarehouse(input: WarehouseInput): string | null {
  if (!input.name || input.name.trim().length === 0) return 'Name is required.';
  return null;
}

export function validateInventoryAdjustmentReason(input: InventoryAdjustmentReasonInput): string | null {
  if (!input.reason || input.reason.trim().length === 0) return 'Reason is required.';
  return null;
}

export function validateInventoryAdjustment(input: InventoryAdjustmentInput): string | null {
  if (!input.warehouseId) return 'Warehouse ID is required.';
  if (!input.reasonId) return 'Reason ID is required.';
  if (!input.items || input.items.length === 0) return 'At least one adjustment item is required.';
  return null;
}

export function validateInventoryRestockRequest(input: InventoryRestockRequestInput): string | null {
  if (!input.tenantId) return 'Tenant ID is required.';
  if (!input.productId) return 'Product ID is required.';
  if (!input.productGroup) return 'Product group is required.';
  if (input.requestedQuantity <= 0) return 'Requested quantity must be greater than 0.';
  return null;
}

export function validateUpdateRestockRequestQuantity(input: UpdateRestockRequestQuantityInput): string | null {
  if (!input.requestId) return 'Request ID is required.';
  if (input.quantity <= 0) return 'Quantity must be greater than 0.';
  return null;
}

export function validateUpdateRestockRequestStatus(input: UpdateRestockRequestStatusInput): string | null {
  if (!input.requestId) return 'Request ID is required.';
  if (!input.status) return 'Status is required.';
  return null;
}
// @ts-nocheck
// @ts-nocheck
