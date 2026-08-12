// @ts-nocheck
export interface OrderInput {
  customerId: bigint;
  addressId: bigint;
  paymentMode: string;
  notes?: string;
}

export function parseOrderInput(raw: unknown): OrderInput {
  const obj = raw as Record<string, unknown>;
  return {
    customerId: typeof obj.customerId === "string" || typeof obj.customerId === "number" ? BigInt(obj.customerId) : 0n,
    addressId: typeof obj.addressId === "string" || typeof obj.addressId === "number" ? BigInt(obj.addressId) : 0n,
    paymentMode: typeof obj.paymentMode === "string" ? obj.paymentMode : "",
    notes: typeof obj.notes === "string" ? obj.notes : undefined,
  };
}

export interface OrderUpdateInput {
  orderId: bigint;
  status: string;
}

export function parseOrderUpdateInput(raw: unknown): OrderUpdateInput {
  const obj = raw as Record<string, unknown>;
  return {
    orderId: typeof obj.orderId === "string" || typeof obj.orderId === "number" ? BigInt(obj.orderId) : 0n,
    status: typeof obj.status === "string" ? obj.status : "",
  };
}
// @ts-nocheck
// @ts-nocheck
