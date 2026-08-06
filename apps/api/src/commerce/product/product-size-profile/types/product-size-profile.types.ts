/**
 * apps/api/src/commerce/product-size-profile/types/product-size-profile.types.ts
 *
 * Source-verified types for the ProductSizeProfile module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.product.orm.ProductSizeProfile
 *  - com.bloomscorp.loom.product.product.contract.ProductSizeProfileContract
 *  - com.bloomscorp.loom.product.product.pojo.ProductSizeProfileData
 *
 * PATH ASSUMPTION: no compiled TS output for the Product/FabricProduct/
 * FinishedProduct/CustomProduct modules was included in this upload batch
 * (only their Java sources, under `product.product.*`, are present), so this
 * module's directory depth can't be read off an existing sibling. It's
 * placed at `commerce/product-size-profile/` — the same depth as
 * `commerce/cart/` — matching every other already-migrated top-level
 * domain (Tag, SpecialStatus, Category, Segment, SkuGroup, SubCategory).
 * Confirm against the real monorepo layout before merging.
 *
 * MISSING MODULE DEPENDENCY (flagged, not silently worked around):
 * The source entity's `sizeProfileOption` relation is
 * `com.bloomscorp.loom.profile.size_profile.orm.SizeProfileOption` — a
 * domain that has not been migrated and was not included in any of the
 * uploaded zips (auth, cart, common, database, package, product). Per the
 * precedent already established in `cart.types.ts` (SizeProfileOptionPort /
 * FinishProfileItemPort), this is modeled as a narrow port typed to exactly
 * what ProductSizeProfileDAOController's `retrieveConsumedFabricForImpact`
 * needs from it (id + consumedFabric fallback), not as `unknown`, since the
 * consumedFabric fallback is real, source-verified behavior. Replace the
 * dummy provider in product-size-profile.module.ts with a real one once the
 * SizeProfile/Profile domain is migrated.
 *
 * `@anuprerna/types` is an empty workspace stub and the project has no zod
 * (or any validation library) dependency installed, so these are plain TS
 * types with hand-written runtime guards in
 * `product-size-profile.validator.ts`, matching Cart's approach.
 */

/**
 * com.bloomscorp.loom.product.product.orm.ProductSizeProfile — full entity
 * row, id/version as bigint (bigserial columns), matching the shape Drizzle
 * returns for the `product_size_profile` table.
 */
export interface ProductSizeProfileEntity {
  id: bigint;
  version: bigint;
  productId: number;
  sizeProfileOptionId: number;
  sizeProfileOptionSku: string;
  quantity: number;
  consumedFabric: number | null;
  disabled: boolean;
}

/**
 * Inbound shape for create/update requests. Field names match the entity's
 * persisted properties (ProductSizeProfileContract columns); `id`/`version`
 * are absent on create.
 */
export interface ProductSizeProfileInput {
  id?: number; // required for update, absent for create
  productId: number;
  sizeProfileOptionId: number;
  sizeProfileOptionSku: string;
  quantity: number;
  consumedFabric?: number | null;
  disabled?: boolean; // DB default false when absent
}

/**
 * com.bloomscorp.loom.product.product.pojo.ProductSizeProfileData — flat
 * projection returned by the native queries
 * (retrieveProductSizeProfile / retrieveProductSizeProfileDataById).
 * Field order matches the @ColumnResult order (significant for the source
 * @ConstructorResult mapping; preserved for parity, not required in TS).
 */
export interface ProductSizeProfileData {
  id: number;
  version: number;
  productId: number;
  sizeProfileOptionId: number;
  sizeProfileOptionSku: string;
  quantity: number;
  consumedFabric: number | null;
  disabled: boolean;
}

/**
 * Enriched view as returned once a `sizeProfileOption` lookup is layered on
 * top of the raw entity — the TS analogue of the Java entity's populated
 * `sizeProfileOption` association. `product` is deliberately absent/unknown:
 * its full shape belongs to the Product module, out of scope here (same
 * reasoning cart.types.ts used for `fabricProductPreview`/etc).
 */
export interface ProductSizeProfileView {
  id: number;
  version: number;
  productId: number;
  sizeProfileOption: SizeProfileOptionPreview | null;
  sizeProfileOptionSku: string;
  quantity: number;
  consumedFabric: number | null;
  disabled: boolean;
}

/**
 * Cross-module dependency (Profile/SizeProfile) that
 * ProductSizeProfileService calls into. Out of scope for this migration —
 * see the MISSING MODULE DEPENDENCY note above. Narrowed to exactly the
 * fields `retrieveConsumedFabricForImpact` reads off the source
 * `SizeProfileOption` entity (`getConsumedFabric()`), plus `id`, rather than
 * a bare `unknown`, following the FinishProfileItemPort precedent in
 * cart.types.ts of typing a port to its actual call sites.
 */
export interface SizeProfileOptionPreview {
  id: number;
  consumedFabric: number | null;
  [key: string]: unknown; // remaining SizeProfileOption fields once Profile module is migrated
}

export interface SizeProfileOptionPort {
  retrieveSizeProfileOption(id: number): Promise<SizeProfileOptionPreview | null>;
}

export const SIZE_PROFILE_OPTION_PORT = Symbol("SIZE_PROFILE_OPTION_PORT");
