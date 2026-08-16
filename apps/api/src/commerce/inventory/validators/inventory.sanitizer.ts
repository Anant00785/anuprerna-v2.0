// @ts-nocheck
import { WarehouseInput, InventoryAdjustmentReasonInput, InventoryAdjustmentInput, InventoryRestockRequestInput } from '../dto/inventory.dto.js';

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeWarehouse(input: WarehouseInput): WarehouseInput {
  return {
    ...input,
    name: input.name ? escapeHtml(input.name.trim()) : '',
    description: input.description ? escapeHtml(input.description.trim()) : undefined,
  };
}

export function sanitizeInventoryAdjustmentReason(input: InventoryAdjustmentReasonInput): InventoryAdjustmentReasonInput {
  return {
    ...input,
    reason: input.reason ? escapeHtml(input.reason.trim()) : '',
    description: input.description ? escapeHtml(input.description.trim()) : undefined,
  };
}

export function sanitizeInventoryAdjustment(input: InventoryAdjustmentInput): InventoryAdjustmentInput {
  return {
    ...input,
    referenceNo: input.referenceNo ? escapeHtml(input.referenceNo.trim()) : undefined,
    description: input.description ? escapeHtml(input.description.trim()) : undefined,
  };
}

export function sanitizeInventoryRestockRequest(input: InventoryRestockRequestInput): InventoryRestockRequestInput {
  return {
    ...input,
    productGroup: input.productGroup ? escapeHtml(input.productGroup.trim()) : '',
  };
}
