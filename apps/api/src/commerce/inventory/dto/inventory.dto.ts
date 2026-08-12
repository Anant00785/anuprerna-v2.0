// @ts-nocheck
export interface WarehouseInput {
  id?: bigint;
  name: string;
  description: string;
}

export function parseWarehouseInput(raw: unknown): WarehouseInput {
  const obj = raw as Record<string, unknown>;
  return {
    id: typeof obj.id === 'number' || typeof obj.id === 'bigint' ? BigInt(obj.id) : undefined,
    name: typeof obj.name === 'string' ? obj.name : '',
    description: typeof obj.description === 'string' ? obj.description : '',
  };
}

export interface InventoryAdjustmentReasonInput {
  id?: bigint;
  reason: string;
  description: string;
}

export function parseInventoryAdjustmentReasonInput(raw: unknown): InventoryAdjustmentReasonInput {
  const obj = raw as Record<string, unknown>;
  return {
    id: typeof obj.id === 'number' || typeof obj.id === 'bigint' ? BigInt(obj.id) : undefined,
    reason: typeof obj.reason === 'string' ? obj.reason : '',
    description: typeof obj.description === 'string' ? obj.description : '',
  };
}

export interface InventoryAdjustmentItemInput {
  productId: bigint;
  quantityAvailable: number;
  quantityAdjusted: number;
  quantityAtHand: number;
}

export interface InventoryAdjustmentInput {
  userId: bigint;
  adjustmentDate: number;
  warehouseId: bigint;
  referenceNo: string;
  reasonId: bigint;
  description: string;
  items: InventoryAdjustmentItemInput[];
}

export function parseInventoryAdjustmentInput(raw: unknown): InventoryAdjustmentInput {
  const obj = raw as Record<string, unknown>;
  const itemsRaw = Array.isArray(obj.items) ? obj.items : [];
  return {
    userId: typeof obj.userId === 'number' || typeof obj.userId === 'bigint' ? BigInt(obj.userId) : BigInt(0),
    adjustmentDate: typeof obj.adjustmentDate === 'number' ? obj.adjustmentDate : Date.now(),
    warehouseId: typeof obj.warehouseId === 'number' || typeof obj.warehouseId === 'bigint' ? BigInt(obj.warehouseId) : BigInt(0),
    referenceNo: typeof obj.referenceNo === 'string' ? obj.referenceNo : '',
    reasonId: typeof obj.reasonId === 'number' || typeof obj.reasonId === 'bigint' ? BigInt(obj.reasonId) : BigInt(0),
    description: typeof obj.description === 'string' ? obj.description : '',
    items: itemsRaw.map((i: any) => ({
      productId: typeof i.productId === 'number' || typeof i.productId === 'bigint' ? BigInt(i.productId) : BigInt(0),
      quantityAvailable: typeof i.quantityAvailable === 'number' ? i.quantityAvailable : 0,
      quantityAdjusted: typeof i.quantityAdjusted === 'number' ? i.quantityAdjusted : 0,
      quantityAtHand: typeof i.quantityAtHand === 'number' ? i.quantityAtHand : 0,
    })),
  };
}

export interface InventoryRestockRequestInput {
  tenantId: bigint;
  productId: bigint;
  madeToOrderProductId?: bigint;
  sizeOptionId?: bigint;
  productGroup: string;
  requestedQuantity: number;
}

export function parseInventoryRestockRequestInput(raw: unknown): InventoryRestockRequestInput {
  const obj = raw as Record<string, unknown>;
  return {
    tenantId: typeof obj.tenantId === 'number' || typeof obj.tenantId === 'bigint' ? BigInt(obj.tenantId) : BigInt(0),
    productId: typeof obj.productId === 'number' || typeof obj.productId === 'bigint' ? BigInt(obj.productId) : BigInt(0),
    madeToOrderProductId: typeof obj.madeToOrderProductId === 'number' || typeof obj.madeToOrderProductId === 'bigint' ? BigInt(obj.madeToOrderProductId) : undefined,
    sizeOptionId: typeof obj.sizeOptionId === 'number' || typeof obj.sizeOptionId === 'bigint' ? BigInt(obj.sizeOptionId) : undefined,
    productGroup: typeof obj.productGroup === 'string' ? obj.productGroup : '',
    requestedQuantity: typeof obj.requestedQuantity === 'number' ? obj.requestedQuantity : 0,
  };
}

export interface UpdateRestockRequestQuantityInput {
  requestId: bigint;
  quantity: number;
}
export function parseUpdateRestockRequestQuantityInput(raw: unknown): UpdateRestockRequestQuantityInput {
  const obj = raw as Record<string, unknown>;
  return {
    requestId: typeof obj.requestId === 'number' || typeof obj.requestId === 'bigint' ? BigInt(obj.requestId) : BigInt(0),
    quantity: typeof obj.quantity === 'number' ? obj.quantity : 0,
  };
}

export interface UpdateRestockRequestStatusInput {
  requestId: bigint;
  status: string;
}
export function parseUpdateRestockRequestStatusInput(raw: unknown): UpdateRestockRequestStatusInput {
  const obj = raw as Record<string, unknown>;
  return {
    requestId: typeof obj.requestId === 'number' || typeof obj.requestId === 'bigint' ? BigInt(obj.requestId) : BigInt(0),
    status: typeof obj.status === 'string' ? obj.status : '',
  };
}
// @ts-nocheck
// @ts-nocheck
