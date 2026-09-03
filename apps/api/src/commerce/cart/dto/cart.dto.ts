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
 */
import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { CartItemInput, ORDER_TYPES, OrderType, UNITS, Unit } from "../types/cart.types.js";
import { parseIdParamStrict, toSafeNumberId } from "../../../common/params/id-param.js";

function requireInt(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  return n;
}

/**
 * Path ids go through the shared strict parser (common/params/id-param.ts):
 * digits-only on the RAW string, converted with BigInt(string) so nothing is
 * rounded on the way through Number(). The local `requireInt` above stays for
 * JSON body / query fields, where an integer legitimately arrives as a number.
 */
function strictNumberIdParam(value: unknown, field: string): number {
  const n = toSafeNumberId(parseIdParamStrict(value, field));
  if (n === null) throw new BadRequestException(`${field} must be an integer.`);
  return n;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }
  return value;
}

/** selectedFinishId is allowed to be "" (means none) but must be a string. */
function requireNonEmptyStringOrEmpty(value: unknown): string {
  if (typeof value !== "string") {
    throw new BadRequestException("selectedFinishId must be a string.");
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new BadRequestException(`${field} must be a number.`);
  }
  return value;
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

// ─── Query / Param parsers ────────────────────────────────────────────────────

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
  return strictNumberIdParam(id, "id");
}

export function parseUidParam(uid: unknown): string {
  return requireNonEmptyString(uid, "uid");
}

export function parseCartItemIdParam(cartItemId: unknown): number {
  return strictNumberIdParam(cartItemId, "cartItemId");
}

// ─── Body parsers ─────────────────────────────────────────────────────────────

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

export type AddCartItemRequest = CartItemInput;

export function parseAddCartItemRequest(body: unknown): AddCartItemRequest {
  return parseCartItemInput(body);
}

/**
 * Source note: updateCartItem accepts the full CartItem shape as its request
 * body but the DAO controller only ever reads `id` and `quantity` off it.
 * Parsing still accepts the full shape to stay contract-compatible with
 * existing clients; the service layer intentionally ignores everything except
 * id/quantity, exactly as the source does.
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

// ─── Swagger DTOs ─────────────────────────────────────────────────────────────

export class AddCartItemDto {
  @ApiProperty({ example: 156298614, required: false, description: "Fabric product ID" })
  fabricProductId?: number;

  @ApiProperty({ example: null, required: false, description: "Finished product ID" })
  finishedProductId?: number;

  @ApiProperty({ example: null, required: false, description: "Selected fabric ID" })
  selectedFabricId?: number;

  @ApiProperty({ example: null, required: false, description: "Selected size option ID" })
  selectedSizeOptionId?: number;

  @ApiProperty({ example: "0", description: "Selected finish ID" })
  selectedFinishId!: string;

  @ApiProperty({ example: "fabric", description: "Product group ('fabric' or 'finished')" })
  productGroup!: string;

  @ApiProperty({ example: "MADE_TO_ORDER", description: "Order type ('IN_STOCK', 'MADE_TO_ORDER', 'PRE_ORDER')" })
  orderType!: OrderType;

  @ApiProperty({ example: 5, description: "Item quantity" })
  quantity!: number;

  @ApiProperty({ example: "METER", description: "Item unit ('METER', 'PIECE', 'YARD')" })
  unit!: Unit;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 157423055, description: "Cart Item ID to update" })
  id!: number;

  @ApiProperty({ example: 156298614, required: false, description: "Fabric product ID" })
  fabricProductId?: number;

  @ApiProperty({ example: null, required: false, description: "Finished product ID" })
  finishedProductId?: number;

  @ApiProperty({ example: null, required: false, description: "Selected fabric ID" })
  selectedFabricId?: number;

  @ApiProperty({ example: null, required: false, description: "Selected size option ID" })
  selectedSizeOptionId?: number;

  @ApiProperty({ example: "0", description: "Selected finish ID" })
  selectedFinishId!: string;

  @ApiProperty({ example: "fabric", description: "Product group ('fabric' or 'finished')" })
  productGroup!: string;

  @ApiProperty({ example: "MADE_TO_ORDER", description: "Order type ('IN_STOCK', 'MADE_TO_ORDER', 'PRE_ORDER')" })
  orderType!: OrderType;

  @ApiProperty({ example: 15, description: "Updated item quantity" })
  quantity!: number;

  @ApiProperty({ example: "METER", description: "Item unit ('METER', 'PIECE', 'YARD')" })
  unit!: Unit;
}
