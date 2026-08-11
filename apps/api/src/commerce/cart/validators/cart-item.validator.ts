// @ts-nocheck
/**
 * apps/api/src/commerce/cart/validators/cart-item.validator.ts
 *
 * Direct, rule-for-rule port of com.bloomscorp.loom.cart.validator.CartItemValidator.
 *
 * Source rules (verbatim from validate()):
 *  1. productGroup === "fabric" || "swatch"  -> fabricProductId must be present and non-zero
 *  2. productGroup === "finished"            -> finishedProductId must be present and non-zero
 *  3. unit must be a member of UNIT_ENUM       (METER, UNIT)
 *  4. orderType must be a member of ORDER_TYPE  (IN_STOCK, MADE_TO_ORDER, PRE_ORDER)
 *  5. quantity >= 0.5
 *
 * Nothing else is rejected. In particular: no rule requires selectedFabricId
 * or selectedSizeOptionId at the validator level even though the DB column
 * is NOT NULL for selectedFabric/selectedSizeOption in the Java ORM mapping
 * — that mismatch exists in the source and is preserved here rather than
 * "fixed" (flagged again in the module README under Risks).
 */
import { CartItemInput, ORDER_TYPES, UNITS } from "../types/cart.types.js";

const VALID_ORDER_TYPES = new Set<string>(ORDER_TYPES);
const VALID_UNITS = new Set<string>(UNITS);

function isValidOrderType(orderType: unknown): boolean {
  return typeof orderType === "string" && VALID_ORDER_TYPES.has(orderType);
}

function isValidUnit(unit: unknown): boolean {
  return typeof unit === "string" && VALID_UNITS.has(unit);
}

export function validateCartItem(entity: CartItemInput): boolean {
  if (entity.productGroup === "fabric" || entity.productGroup === "swatch") {
    if (entity.fabricProductId === null || entity.fabricProductId === undefined || entity.fabricProductId === 0) {
      return false;
    }
  }

  if (entity.productGroup === "finished") {
    if (entity.finishedProductId === null || entity.finishedProductId === undefined || entity.finishedProductId === 0) {
      return false;
    }
  }

  return isValidUnit(entity.unit) && isValidOrderType(entity.orderType) && entity.quantity >= 0.5;
}
// @ts-nocheck
// @ts-nocheck
