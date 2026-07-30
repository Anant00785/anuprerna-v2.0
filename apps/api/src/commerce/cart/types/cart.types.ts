/**
 * apps/api/src/commerce/cart/types/cart.types.ts
 *
 * Source-verified types for the Cart module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.cart.orm.CartItem
 *  - com.bloomscorp.loom.cart.orm.ORDER_TYPE
 *  - com.bloomscorp.loom.product.product.orm.UNIT_ENUM
 *  - com.bloomscorp.loom.cart.pojo.CartItemData
 *  - com.bloomscorp.loom.cart.pojo.TenantCartOverview
 *
 * No fields, enum members, or defaults have been invented beyond what's in
 * source. `@anuprerna/types` is currently an empty workspace stub and the
 * project has no zod (or any validation library) dependency installed, so
 * these are plain TS types with hand-written runtime guards in
 * `validators/cart-item.validator.ts`, rather than a zod schema — using zod
 * here would violate "never generate code that depends on missing packages".
 */

/** com.bloomscorp.loom.cart.orm.ORDER_TYPE — mirrors orderTypeEnum in schema.ts exactly. */
export const ORDER_TYPES = ["IN_STOCK", "MADE_TO_ORDER", "PRE_ORDER"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

/** com.bloomscorp.loom.product.product.orm.UNIT_ENUM — mirrors unitEnum in schema.ts exactly. */
export const UNITS = ["METER", "UNIT"] as const;
export type Unit = (typeof UNITS)[number];

/**
 * Product group values recognized by CartItemValidator. The source
 * validator only special-cases "fabric", "swatch" and "finished"; it does
 * not enumerate a closed set anywhere else, so this stays a loose string
 * type — any other string passes validate() as long as the remaining rules
 * pass (source-verified: no else/default rejection branch exists).
 */
export const KNOWN_PRODUCT_GROUPS = ["fabric", "swatch", "finished"] as const;
export type ProductGroup = (typeof KNOWN_PRODUCT_GROUPS)[number] | (string & {});

/**
 * Inbound shape for add/update cart item requests. Field names match the
 * CartItem entity's transient + persisted properties exactly as consumed by
 * CartController#addCartItem / #updateCartItem.
 */
export interface CartItemInput {
  id?: number; // required for update, absent for create
  fabricProductId?: number | null;
  finishedProductId?: number | null;
  selectedFabricId?: number | null;
  selectedSizeOptionId?: number | null;
  selectedFinishId: string; // comma-separated ids, e.g. "1,5,12"; "" means none
  customSize: unknown; // JSONB, shape not defined in source (cart module) -> passthrough
  productGroup: string;
  orderType: OrderType;
  quantity: number;
  unit: Unit;
  makingCharge?: number; // DB default 0.00 when absent
  // Ad-attribution fields (real columns on cart_item, populated by the
  // ads_conversion module — out of scope for this migration).
  clickId?: string | null;
  clickIdType?: string | null;
  clickCapturedAt?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

/**
 * Enriched cart item as returned by GET endpoints, after
 * CartService#prepareCartItems. `tenant` is deliberately absent (source
 * sets cartItem.setTenant(null) before returning). Nested product/size/
 * finish objects are typed unknown — their full shape belongs to the
 * Product/Profile modules, out of scope for this migration.
 */
export interface CartItemView {
  id: number;
  version: number;
  fabricProductPreview: unknown | null;
  finishedProductPreview: unknown | null;
  selectedFabric: unknown | null;
  selectedSizeOption: unknown | null;
  sizeDisplayName: string | null;
  selectedFinishId: string;
  selectedFinishList: unknown[];
  finishDisplayName: string | null;
  customSize: unknown;
  productGroup: string;
  orderType: OrderType;
  quantity: number;
  unit: Unit;
  makingCharge: number;
  lastUpdatedAt: number;
  clickId: string | null;
  clickIdType: string | null;
  clickCapturedAt: number | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

/**
 * com.bloomscorp.loom.cart.pojo.CartItemData — flat projection returned by
 * the table-explorer endpoints. Field order matches the native query column
 * order (significant for the source @ConstructorResult mapping; preserved
 * for parity, not required in TS).
 */
export interface CartItemData {
  id: number;
  version: number;
  tenantId: number;
  fabricProductId: number | null;
  finishedProductId: number | null;
  selectedFabricId: number | null;
  selectedSizeOptionId: number | null;
  selectedFinishId: string;
  customSize: unknown;
  productGroup: string;
  orderType: string;
  quantity: number;
  unit: string;
  makingCharge: number;
  lastUpdatedAt: number;
}

/**
 * com.bloomscorp.loom.cart.pojo.TenantCartOverview. `tenant` is typed
 * unknown — the Tenant/Identity module owns its own shape.
 */
export interface TenantCartOverview {
  tenant: unknown;
  cartItemCount: number;
  hasAbandonedItem: boolean;
  lastUpdatedAt: number;
  estimatedTotalPrice: number;
}

export interface CartItemSummaryRow {
  tenantId: bigint;
  itemCount: bigint;
  hasAbandonedItem: boolean;
  lastUpdatedAt: bigint;
}

/**
 * Cross-module dependencies (Product, Profile, Tenant) that CartService
 * calls into. Out of scope for this migration per the brief — narrow ports
 * typed exactly to the calls Cart actually makes. Wire real providers in
 * cart.module.ts as each module gets migrated.
 */
export interface FabricPreviewPort {
  retrieveEntity(id: number): Promise<unknown | null>;
  retrieveFabricProductByProductId(productId: number): Promise<unknown | null>;
}

export interface FinishedPreviewPort {
  retrieveEntity(id: number): Promise<unknown | null>;
}

export interface SizeProfileOptionPort {
  retrieveSizeProfileOption(id: number): Promise<unknown | null>;
}

export interface FinishProfileItemPort {
  retrieveEntity(id: number): Promise<{ finishProfile: { displayName: string } } | null>;
}

export interface TenantLookupPort {
  retrieveUserByUid(uid: string): Promise<{ id: number; email: string } | null>;
}

export interface EmailEncoderPort {
  decode(cipherText: string): Promise<string>;
}

/**
 * Ports the LogMessage constants CartController actually uses (source:
 * com.bloomscorp.loom.support.LogMessage, lines ~434-442, 670, 773) so
 * response `message` strings stay byte-identical to what existing clients
 * already parse/display.
 *
 * The exact prose generated by buildUnAuthListAccessLog / etc. is produced
 * by an external helper not present in this repository. The literal
 * *topic* strings passed to those builders ARE source-verified; the exact
 * builder output format is flagged as "not found in current repository" —
 * confirm final copy against a live LogMessage.class dump before shipping.
 */
export const CartMessages = {
  UNAUTH_TABLE_EXPLORER_CART_ITEM_REQUEST: "Unauthorized access to table explorer cart item list.",
  UNAUTH_TABLE_EXPLORER_CART_ITEM_BY_ID_REQUEST: "Unauthorized access to table explorer cart item by id.",
  UNAUTH_CART_ITEM_LIST_REQUEST: "Unauthorized access to cart item list.",
  UNAUTH_CART_ITEM_CREATE_REQUEST: "Unauthorized attempt to create a cart item.",
  NEW_CART_ITEM_CREATED: "Cart item created successfully.",
  CART_ITEM_CREATE_FAILED: "Failed to create cart item.",
  UNAUTH_CART_ITEM_UPDATE_REQUEST: "Unauthorized attempt to update a cart item.",
  CART_ITEM_UPDATED: "Cart item updated successfully.",
  CART_ITEM_UPDATE_FAILED: "Failed to update cart item.",
  UNAUTH_CART_ITEM_DELETE_REQUEST: "Unauthorized attempt to delete a cart item.",
  CART_ITEM_DELETED: "Cart item deleted successfully.",
  CART_ITEM_DELETE_FAILED: "Failed to delete cart item.",
  UNAUTH_ALL_CART_ITEM_DELETE_REQUEST: "Unauthorized attempt to delete all cart items.",
  ALL_CART_ITEM_DELETED: "All cart items deleted successfully.",
} as const;

export const FABRIC_PREVIEW_PORT = Symbol("FABRIC_PREVIEW_PORT");
export const FINISHED_PREVIEW_PORT = Symbol("FINISHED_PREVIEW_PORT");
export const SIZE_PROFILE_OPTION_PORT = Symbol("SIZE_PROFILE_OPTION_PORT");
export const FINISH_PROFILE_ITEM_PORT = Symbol("FINISH_PROFILE_ITEM_PORT");
export const TENANT_LOOKUP_PORT = Symbol("TENANT_LOOKUP_PORT");
export const EMAIL_ENCODER_PORT = Symbol("EMAIL_ENCODER_PORT");
