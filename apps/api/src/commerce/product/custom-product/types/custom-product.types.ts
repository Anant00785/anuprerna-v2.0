/**
 * apps/api/src/product/custom-product/types/custom-product.types.ts
 *
 * Source-verified types for the CustomProduct module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.orm.CustomProduct
 *  - com.bloomscorp.loom.product.contract.CustomProductContract
 *  - com.bloomscorp.loom.product.pojo.CustomProductData
 *
 * Unlike FinishedProduct, CustomProduct has no nested Product relation — it
 * is a fully self-contained entity (source-verified: `CustomProduct extends
 * BehemothORM` directly, with its own name/sku/price/etc. columns, no
 * `@OneToOne`/`@ManyToOne` to Product anywhere in the class).
 *
 * `@anuprerna/types` is an empty workspace stub and this project has no zod
 * (or any validation library) dependency installed (verified against
 * package.json — same finding as Cart/FinishedProduct), so these are plain
 * TS types with hand-written runtime guards in
 * validator/custom-product.validator.ts.
 */

/** com.bloomscorp.loom.product.product.orm.UNIT_ENUM — mirrors unitEnum in schema.ts exactly. */
export const UNITS = ["METER", "UNIT"] as const;
export type Unit = (typeof UNITS)[number];

/**
 * com.bloomscorp.loom.product.pojo.CustomProductData — flat projection
 * returned by the table-explorer endpoint. Field order matches
 * CustomProductDataNativeQuery.RETRIEVE_CUSTOM_PRODUCT column order
 * (significant for the source @ConstructorResult mapping; preserved for
 * parity, not required in TS).
 */
export interface CustomProductData {
  id: number;
  version: number;
  name: string;
  sku: string;
  price: number;
  productGroup: string;
  unit: string;
  remarks: string;
  heroImage: string;
  additionalImages: string;
  additionalDocs: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Inbound shape for add/update requests. Field names match the CustomProduct
 * entity's persisted properties, as consumed by
 * CustomProductController#addCustomProduct / #updateCustomProduct.
 * `remarks`/`heroImage`/`additionalImages`/`additionalDocs` default to `""`
 * in source (field initializers + `@ColumnDefault("")`) when absent; `unit`
 * defaults to `"METER"` (`@ColumnDefault("'METER'")`) when absent.
 */
export interface CustomProductInput {
  id?: number; // required for update, absent for create
  name: string;
  sku: string;
  price: number;
  productGroup: string;
  unit?: Unit;
  remarks?: string;
  heroImage?: string;
  additionalImages?: string;
  additionalDocs?: string;
}

export interface UpdateCustomProductInput extends CustomProductInput {
  id: number;
}

/**
 * Cross-module dependency (Order) that CustomProductDAOController calls
 * into on update — out of scope for this migration per the brief, same
 * pattern as Cart's/FinishedProduct's ports. Wire a real provider in
 * custom-product.module.ts once the Order module gets migrated.
 *
 * updateCustomProductReference(Long id, CustomProduct updated, LoomTenant
 * tenant) — source return is an ActionCode int; UPDATE_SUCCESS means the
 * sync succeeded.
 */
export interface CustomOrderItemPort {
  updateCustomProductReference(customProductId: number, updated: CustomProductInput, tenantId: number): Promise<number>;
}

/**
 * LoomCronManager#scheduleLogTask + LoomLogBook#prepareLogReporter — source
 * schedules an async error-log task when the order-item sync fails, before
 * throwing. Both classes are external infra (not present in this
 * repository); ported as a minimal logging port rather than invented in
 * full. See service file for the throw this precedes.
 */
export interface SyncErrorLoggerPort {
  logCustomProductOrderItemSyncError(customProductId: number, tenantId: number): Promise<void>;
}

/**
 * Thrown when the post-update order-item sync fails — mirrors source
 * throwing `CarrierException(new Exception(CUSTOM_PRODUCT_ORDER_ITEM_SYNC_ERROR), ErrorCode.GENERIC)`
 * after modifyEntity already succeeded. The CustomProduct row update itself
 * is NOT rolled back here, matching source (the exception is thrown after
 * `this.modifyEntity(existingProduct)` already returned UPDATE_SUCCESS,
 * inside the same @Transactional method — so in source this failure DOES
 * roll back the whole transaction, including the just-applied update. This
 * class exists so the service layer can propagate that same "update
 * succeeded but the whole operation still fails" semantics to its own
 * caller to decide on transactional rollback).
 */
export class CustomProductOrderItemSyncError extends Error {
  constructor(customProductId: number) {
    super(`CUSTOM_PRODUCT_ORDER_ITEM_SYNC_ERROR: CustomProduct ID: ${customProductId}`);
    this.name = "CustomProductOrderItemSyncError";
  }
}

export const CUSTOM_ORDER_ITEM_PORT = Symbol("CUSTOM_ORDER_ITEM_PORT");
export const SYNC_ERROR_LOGGER_PORT = Symbol("SYNC_ERROR_LOGGER_PORT");

/**
 * Ports the LogMessage constants CustomProductController actually uses
 * (source: com.bloomscorp.loom.support.LogMessage —
 * UNAUTH_CUSTOM_PRODUCT_REQUEST, UNAUTH_CUSTOM_PRODUCT_LIST_REQUEST,
 * UNAUTH_CUSTOM_PRODUCT_CREATE_REQUEST, NEW_CUSTOM_PRODUCT_CREATED,
 * UNAUTH_CUSTOM_PRODUCT_UPDATE_REQUEST, CUSTOM_PRODUCT_UPDATED,
 * UNAUTH_TABLE_EXPLORER_CUSTOM_PRODUCT_REQUEST) so response `message`
 * strings stay byte-identical to what existing clients already parse/
 * display. No controller is generated in this pass (none requested), but
 * these are kept here — same as Cart's CartMessages / FinishedProduct's
 * FinishedProductMessages — for the controller that will wire up later.
 */
export const CustomProductMessages = {
  UNAUTH_CUSTOM_PRODUCT_REQUEST: "Unauthorized access to custom product.",
  UNAUTH_CUSTOM_PRODUCT_LIST_REQUEST: "Unauthorized access to custom product list.",
  UNAUTH_CUSTOM_PRODUCT_CREATE_REQUEST: "Unauthorized attempt to create a custom product.",
  NEW_CUSTOM_PRODUCT_CREATED: "Custom product created successfully.",
  CUSTOM_PRODUCT_CREATE_FAILED: "Failed to create custom product.",
  UNAUTH_CUSTOM_PRODUCT_UPDATE_REQUEST: "Unauthorized attempt to update a custom product.",
  CUSTOM_PRODUCT_UPDATED: "Custom product updated successfully.",
  CUSTOM_PRODUCT_UPDATE_FAILED: "Failed to update custom product.",
  UNAUTH_TABLE_EXPLORER_CUSTOM_PRODUCT_REQUEST: "Unauthorized access to table explorer custom product list.",
} as const;