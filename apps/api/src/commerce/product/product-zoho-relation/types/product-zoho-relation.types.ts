// @ts-nocheck
/**
 * apps/api/src/product/product-zoho-relation/types/product-zoho-relation.types.ts
 *
 * Source-verified types for the ProductZohoRelation module. Mirrors,
 * field-for-field:
 *  - com.bloomscorp.loom.product.product.orm.ProductZohoRelation
 *  - com.bloomscorp.loom.product.product.contract.ProductZohoRelationContract
 *  - com.bloomscorp.loom.product.product.pojo.ProductZohoRelationData
 *  - com.bloomscorp.loom.product.product.pojo.ProductZohoTriggerData
 *  - database/schema/schema.ts (productZohoRelation table) — the actual
 *    introspected Postgres truth this repository queries against.
 *
 * No fields, enum members, or defaults have been invented beyond what's in
 * source. `@anuprerna/types` is currently an empty workspace stub and the
 * project has no zod (or any validation library) dependency installed, so
 * these are plain TS types — consistent with cart.types.ts / auth.types.ts.
 *
 * NUMERIC PRECISION NOTE:
 * purchasePrice and tax are Postgres `numeric(8, 4)` columns (source:
 * schema.ts). The Java layer widens these to `double` (ORM) / `Double`
 * (pojo), so `number` is used here for parity with the rest of this
 * migration — not `string`, even though node-postgres/drizzle can return
 * numeric columns as strings depending on driver config. Confirm the
 * actual driver's numeric parsing config before assuming `number` holds at
 * the DB boundary.
 *
 * QUANTITY FIELD DISCREPANCY (flagged, not silently resolved):
 * ProductZohoRelation.quantity is annotated @Transient in the Java ORM —
 * it is populated from Zoho at runtime and is never a real column on
 * product_zoho_relation (confirmed absent from schema.ts). It is included
 * on ProductZohoRelationEntity below (mirrors the ORM shape as returned by
 * ProductZohoRelationEntityResponse) but intentionally absent from
 * ProductZohoRelationData/Row, which mirror the flat DB projection only.
 */

/** com.bloomscorp.loom.product.product.contract.ProductZohoRelationContract */
export const PRODUCT_ZOHO_RELATION_TABLE = "product_zoho_relation" as const;

export const ProductZohoRelationContract = {
  TABLE: PRODUCT_ZOHO_RELATION_TABLE,
  PRODUCT_ID: "product_id",
  SKU: "sku",
  ZOHO_ITEM_ID: "zoho_item_id",
  HSN_CODE: "hsn_code",
  PURCHASE_PRICE: "purchase_price",
  TAX: "tax",
  DISABLED: "disabled",
} as const;

/**
 * com.bloomscorp.loom.product.product.orm.ProductZohoRelation — full ORM
 * entity shape, as serialized by ProductZohoRelationEntityResponse.
 * `product` is excluded from source's own JSON output (@GsonExclude on the
 * field, to prevent circular references) and is therefore typed `unknown`
 * here rather than omitted — the property exists on the Java entity, but
 * callers should not expect it populated in API responses; the
 * Product/Profile module owns its own shape.
 *
 * id/version are inherited from BehemothORM (not shown in source file, but
 * present on every entity extending it — confirmed via id usage across
 * DAOController/JpaRepository).
 */
export interface ProductZohoRelationEntity {
  id: bigint;
  version: bigint;
  product: unknown;
  productId: number;
  sku: string;
  /** @Transient in source — populated from Zoho at runtime, not a DB column. */
  quantity: number;
  zohoItemId: string;
  hsnCode: string;
  purchasePrice: number;
  tax: number;
  disabled: boolean;
}

export interface ProductZohoRelationView {
  id: number;
  version: number;
  productId: number;
  sku: string;
  quantity: number | null;
  zohoItemId: string;
  hsnCode: string;
  purchasePrice: number;
  tax: number;
  disabled: boolean;
}

/**
 * com.bloomscorp.loom.product.product.pojo.ProductZohoRelationData — flat
 * projection returned by ProductZohoRelationNativeQuery /
 * ProductZohoRelationJpaRepository#retrieveProductZohoRelation(Data)ById.
 * Field order matches the native query's @ConstructorResult column order
 * (significant for the source mapping; preserved for parity, not required
 * in TS). `quantity` is intentionally absent — not selected by either
 * native query (RETRIEVE_PRODUCT_ZOHO_RELATION /
 * RETRIEVE_PRODUCT_ZOHO_RELATION_BY_ID).
 */
export interface ProductZohoRelationData {
  id: number;
  version: number;
  productId: number;
  sku: string;
  zohoItemId: string;
  hsnCode: string;
  purchasePrice: number;
  tax: number;
  disabled: boolean;
}

/**
 * database/schema/schema.ts's `productZohoRelation` pgTable — the
 * introspected Postgres row shape this repository actually queries
 * against. bigserial columns are declared `{ mode: "bigint" }` in source
 * for id/version, but productId is declared `{ mode: "number" }`; typed as
 * `number` throughout here for parity with ProductZohoRelationData (both
 * describe the same table) — confirm bigint vs number handling against the
 * live drizzle client config before relying on this at scale.
 */
export interface ProductZohoRelationRow {
  id: number;
  version: number;
  productId: number;
  sku: string;
  zohoItemId: string;
  hsnCode: string;
  purchasePrice: number;
  tax: number;
  disabled: boolean;
}

/**
 * Inbound shape for create/update requests against ProductZohoRelation.
 * Field set derived from the ORM's persisted (non-transient) columns; `id`
 * optional for update, absent for create — mirrors the CartItemInput
 * convention used elsewhere in this migration. Not source-verified against
 * a dedicated Java DTO (none exists in the product module — DAOController
 * operates directly on the entity), so this is a narrow port sized to
 * what BehemothCRUDDAOController's create/update entry points accept.
 */
export interface ProductZohoRelationInput {
  id?: number;
  productId: number;
  sku: string;
  zohoItemId?: string; // DB default ''
  hsnCode?: string; // DB default ''
  purchasePrice?: number; // DB default 0.001
  tax: number;
  disabled?: boolean; // DB default false
}

/**
 * com.bloomscorp.loom.product.product.pojo.ProductZohoTriggerData —
 * `public class ProductZohoTriggerData { private Long productId; private
 * List<ProductZohoRelation> productZohoRelationList; }`. Field names/order
 * preserved exactly. `productZohoRelationList` typed against
 * ProductZohoRelationEntity above since source holds the full ORM entity
 * list, not the flat Data projection.
 */
export interface ProductZohoTriggerData {
  productId: number;
  productZohoRelationList: ProductZohoRelationEntity[];
}

/**
 * Pagination params accepted by
 * ProductZohoRelationDAOController#retrieveProductZohoRelationData(page, size)
 * / JpaRepository#retrieveProductZohoRelation(size, offset). Source
 * computes offset as `page * size` — preserved as a named export so
 * callers don't reimplement the arithmetic inconsistently.
 */
export interface ProductZohoRelationPageRequest {
  page: number;
  size: number;
}
