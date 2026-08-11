// @ts-nocheck
/**
 * apps/api/src/commerce/cart/dto/cart.dto.ts
 *
 * Request DTOs, one per Cart endpoint. Field sets mirror the corresponding
 * CartController handler parameters exactly:
 *  - getCartItemData(page, size)
 *  - getCartItemById(id)
 *  - getCartItemListUsingUid(uid)
 *  - addCartItem(cartItem: CartItem)
 *  - updateCartItem(updateCartItem: CartItem)
 *  - deleteCartItem(cartItemId)
 *
 * No validation library (zod/class-validator) is installed in this project
 * yet (`@anuprerna/types` is an empty workspace stub, package.json lists
 * neither), so parsing here is done by hand rather than depending on a
 * missing package.
 */
import { BadRequestException } from "@nestjs/common";
import { CartItemInput, ORDER_TYPES, OrderType, UNITS, Unit } from "../types/cart.types.js";

function requireInt(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  return n;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }
  return value;
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = q.page !== undefined && q.page !== "" ? requireInt(q.page, "page") : 1;
  const size = q.size !== undefined && q.size !== "" ? requireInt(q.size, "size") : 10;
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

export function parseUidParam(uid: unknown): string {
  return requireNonEmptyString(uid, "uid");
}

export function parseCartItemIdParam(cartItemId: unknown): number {
  return requireInt(cartItemId, "cartItemId");
}

function parseOrderType(value: unknown): OrderType {
  if (typeof value !== "string" || !(ORDER_TYPES as readonly string[]).includes(value)) {
    throw new BadRequestException(`orderType must be one of ${ORDER_TYPES.join(", ")}.`);
  }
  return value as OrderType;
}

function parseUnit(value: unknown): Unit {
  if (typeof value !== "string" || !(UNITS as readonly string[]).includes(value)) {
    throw new BadRequestException(`unit must be one of ${UNITS.join(", ")}.`);
  }
  return value as Unit;
}

function parseOptionalInt(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return requireInt(value, field);
}

function parseOptionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined || value === null) return value as null | undefined;
  if (typeof value !== "string") throw new BadRequestException(`${field} must be a string.`);
  return value;
}

/** Shared body parsing for both add and update — the request shape is identical (CartItem). */
function parseCartItemInput(body: unknown): CartItemInput {
  const b = (body ?? {}) as Record<string, unknown>;

  return {
    id: b.id === undefined ? undefined : requireInt(b.id, "id"),
    fabricProductId: parseOptionalInt(b.fabricProductId, "fabricProductId"),
    finishedProductId: parseOptionalInt(b.finishedProductId, "finishedProductId"),
    selectedFabricId: parseOptionalInt(b.selectedFabricId, "selectedFabricId"),
    selectedSizeOptionId: parseOptionalInt(b.selectedSizeOptionId, "selectedSizeOptionId"),
    selectedFinishId: requireNonEmptyStringOrEmpty(b.selectedFinishId),
    customSize: b.customSize,
    productGroup: requireNonEmptyString(b.productGroup, "productGroup"),
    orderType: parseOrderType(b.orderType),
    quantity: requireNumber(b.quantity, "quantity"),
    unit: parseUnit(b.unit),
    makingCharge: b.makingCharge === undefined ? undefined : requireNumber(b.makingCharge, "makingCharge"),
    clickId: parseOptionalString(b.clickId, "clickId"),
    clickIdType: parseOptionalString(b.clickIdType, "clickIdType"),
    clickCapturedAt: parseOptionalInt(b.clickCapturedAt, "clickCapturedAt"),
    utmSource: parseOptionalString(b.utmSource, "utmSource"),
    utmMedium: parseOptionalString(b.utmMedium, "utmMedium"),
    utmCampaign: parseOptionalString(b.utmCampaign, "utmCampaign"),
  };
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new BadRequestException(`${field} must be a number.`);
  }
  return value;
}

/** selectedFinishId is allowed to be "" (means none) but must be a string, unlike other required fields. */
function requireNonEmptyStringOrEmpty(value: unknown): string {
  if (typeof value !== "string") {
    throw new BadRequestException("selectedFinishId must be a string.");
  }
  return value;
}

export type AddCartItemRequest = CartItemInput;

export function parseAddCartItemRequest(body: unknown): AddCartItemRequest {
  return parseCartItemInput(body);
}

/**
 * Source note: updateCartItem accepts the full CartItem shape as its request
 * body but the DAO controller only ever reads `id` and `quantity` off it
 * (every other field-level update is commented out in
 * CartItemDAOController#updateCartItem). Parsing still accepts the full
 * shape to stay contract-compatible with existing clients; the service
 * layer intentionally ignores everything except id/quantity, exactly as the
 * source does.
 */
export interface UpdateCartItemRequest extends CartItemInput {
  id: number; // required for update, unlike create
}

export function parseUpdateCartItemRequest(body: unknown): UpdateCartItemRequest {
  const parsed = parseCartItemInput(body);
  if (parsed.id === undefined) {
    throw new BadRequestException("id is required to update a cart item.");
  }
  return parsed as UpdateCartItemRequest;
}
// @ts-nocheck
// @ts-nocheck
