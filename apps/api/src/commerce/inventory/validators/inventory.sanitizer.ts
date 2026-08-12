import { WarehouseInput, InventoryAdjustmentReasonInput, InventoryAdjustmentInput, InventoryRestockRequestInput } from '../dto/inventory.dto.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeWarehouse(input: WarehouseInput): WarehouseInput {
  return {
    ...input,
    name: escapeHtml(input.name.trim()),
    description: escapeHtml(input.description.trim()),
  };
}

export function sanitizeInventoryAdjustmentReason(input: InventoryAdjustmentReasonInput): InventoryAdjustmentReasonInput {
  return {
    ...input,
    reason: escapeHtml(input.reason.trim()),
    description: escapeHtml(input.description.trim()),
  };
}

export function sanitizeInventoryAdjustment(input: InventoryAdjustmentInput): InventoryAdjustmentInput {
  return {
    ...input,
    referenceNo: escapeHtml(input.referenceNo.trim()),
    description: escapeHtml(input.description.trim()),
  };
}

export function sanitizeInventoryRestockRequest(input: InventoryRestockRequestInput): InventoryRestockRequestInput {
  return {
    ...input,
    productGroup: escapeHtml(input.productGroup.trim()),
  };
}
