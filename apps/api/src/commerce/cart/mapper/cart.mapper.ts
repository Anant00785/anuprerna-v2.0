/**
 * apps/api/src/commerce/cart/mapper/cart.mapper.ts
 *
 * Translates between the API-facing CartItemInput shape and the Drizzle
 * insert/update value shapes for the `cart_item` table. Kept separate from
 * the service so the "which fields get written on create vs. update" rule
 * (source quirk: update only ever writes quantity) stays visible in one
 * place instead of buried in query-builder calls.
 */
import { InsertCartItemValues } from "../repository/cart.repository.js";
import { AddCartItemRequest } from "../dto/cart.dto.js";

/** addCartItem(LoomTenant tenant, CartItem cartItem) — builds the insert payload. */
export function toInsertValues(tenantId: number, input: AddCartItemRequest): InsertCartItemValues {
  return {
    tenantId,
    lastUpdatedAt: Date.now(),
    selectedFinishId: input.selectedFinishId ?? "",
    customSize: input.customSize ?? {},
    productGroup: input.productGroup || "fabric",
    orderType: (input.orderType as any) || "IN_STOCK",
    quantity: String(input.quantity ?? 1),
    unit: (input.unit as any) || "METER",
    makingCharge: String(input.makingCharge ?? 0.0),
    clickId: input.clickId ?? null,
    clickIdType: input.clickIdType ?? null,
    clickCapturedAt: input.clickCapturedAt ?? null,
    utmSource: input.utmSource ?? null,
    utmMedium: input.utmMedium ?? null,
    utmCampaign: input.utmCampaign ?? null,
  };
}

/**
 * updateCartItem(CartItem updatedItem) — source only ever writes quantity
 * and lastUpdatedAt; every other field is intentionally left untouched
 * (see CartService class doc, quirk #1). Preserved verbatim here.
 */
export function toUpdateValues(quantity: number): Partial<InsertCartItemValues> {
  return {
    quantity: String(quantity),
    lastUpdatedAt: Date.now(),
  };
}
