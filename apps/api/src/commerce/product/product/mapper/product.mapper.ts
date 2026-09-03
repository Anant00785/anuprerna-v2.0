/**
 * apps/api/src/product/core/mapper/Product.mapper.ts
 *
 * Translates between the API-facing ProductInput shape and the Drizzle
 * insert/update value shapes for the `product` table. Ported field-for-
 * field from ProductDAOController#createProduct and #updateProduct — see
 * each function's doc comment for the exact source method it mirrors.
 *
 * SLUG GENERATION (flagged, not silently invented): both source methods
 * call `LoomUtility.generateSlug(name)` — com.bloomscorp.loom.support.
 * LoomUtility is an external utility class, not present in this
 * repository, so its exact slugification algorithm (whitespace handling,
 * unicode handling, collision suffixing, etc.) isn't source-verified.
 * `generateSlug` below is a standard, conservative reconstruction
 * (lowercase, strip non-alphanumerics to hyphens, collapse/trim hyphens) —
 * confirm against the real LoomUtility.generateSlug before treating slug
 * output as byte-identical to the Java service.
 */
import { InsertProductValues } from "../repository/product.repository.js";
import { ProductInput } from "../types/product.types.js";

/** Reconstruction of LoomUtility.generateSlug(name) — see header note. */
export function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * ProductDAOController#createProduct(Product entity) — builds the insert
 * payload. Source explicitly: trims sku, regenerates slug from name, and
 * nulls mainProductId when mainProductCheck is true
 * (`if (entity.isMainProductCheck()) entity.setMainProductId(null);`).
 * Every other scalar field passes through from the request-bound entity
 * unchanged (source never reassigns them in createProduct — they arrive
 * already set on the Product object Spring binds from the request body).
 *
 * subCategory/skuGroup/specialStatus/badgeProfile/etc. hydration
 * (`entity.setSubCategory(this.subCategoryDAOController.retrieve...)` and
 * friends) is a JPA object-graph concern with no Drizzle equivalent — this
 * repository persists the FK id columns directly instead, which is what
 * those hydration calls ultimately resolve to on the wire. The hydration
 * calls themselves are preserved as Port lookups in Product.service.ts for
 * parity (existence-checking), not repeated here.
 */
export function toInsertValues(input: ProductInput): InsertProductValues {
  return {
    subCategoryId: input.subCategoryId,
    name: input.name,
    sku: input.sku.trim(),
    skuGroupId: input.skuGroupId,
    price: String(input.price),
    mainProductCheck: input.mainProductCheck,
    mainProductId: input.mainProductCheck ? null : (input.mainProductId ?? null),
    tagId: input.tagId ?? "",
    badgeProfileId: input.badgeProfileId ?? null,
    badgeProfileEnabled: input.badgeProfileEnabled ?? false,
    volumeDiscountProfileId: input.volumeDiscountProfileId ?? null,
    volumeDiscountProfileEnabled: input.volumeDiscountProfileEnabled ?? false,
    madeToOrderProfileId: input.madeToOrderProfileId ?? null,
    madeToOrderProfileEnabled: input.madeToOrderProfileEnabled ?? false,
    madeToOrderFabricId: input.madeToOrderFabricId ?? null,
    sizeProfileId: input.sizeProfileId ?? null,
    sizeProfileEnabled: input.sizeProfileEnabled ?? false,
    customSizeProfileId: input.customSizeProfileId ?? null,
    customSizeProfileEnabled: input.customSizeProfileEnabled ?? false,
    finishProfileId: input.finishProfileId ?? null,
    finishProfileEnabled: input.finishProfileEnabled ?? false,
    finishProfileItemId: input.finishProfileItemId ?? null,
    fabricProfileId: input.fabricProfileId ?? null,
    fabricProfileEnabled: input.fabricProfileEnabled ?? false,
    specialStatusId: input.specialStatusId ?? null,
    productOverview: input.productOverview,
    productCare: input.productCare,
    materialId: input.materialId,
    colorId: input.colorId,
    patternId: input.patternId ?? "",
    sale: input.sale ?? false,
    discount: String(input.discount ?? 0.0),
    heroImage: input.heroImage ?? "",
    hoverImage: input.hoverImage ?? "",
    galleryImages: input.galleryImages ?? "",
    productGroup: input.productGroup,
    slug: generateSlug(input.name),
    productVideo: input.productVideo,
    disabled: input.disabled ?? false,
    metaTitle: input.metaTitle ?? "",
    metaDescription: input.metaDescription ?? "",
    heroImageAlt: input.heroImageAlt ?? "",
    hoverImageAlt: input.hoverImageAlt ?? "",
    productVideoAlt: input.productVideoAlt ?? "",
    backwardCompatibleLink: input.backwardCompatibleLink ?? "",
    quantity: String(input.quantity ?? 0.0),
    externalQuantity: String(input.externalQuantity ?? 0.0),
    unit: input.unit,
  };
}

/**
 * ProductDAOController#updateProduct(Product updatedProduct) — builds the
 * update payload. Ported field-for-field, including the profile-enabled
 * "if enabled and id set, keep the id; otherwise null it out" branches
 * (source: `if (updatedProduct.getBadgeProfileEnabled() && ...) {
 * entity.setBadgeProfile(...) } else { entity.setBadgeProfile(null); }`,
 * repeated per profile). The finish-profile branch additionally resets
 * `finishProfileItemId` to `""` when disabled, per source. `category`/
 * `segment` assignment is commented out in source itself
 * (`// if (updatedProduct.getCategoryId() != null ...`) — left out here
 * too, not a migration omission.
 */
export function toUpdateValues(input: ProductInput): Partial<InsertProductValues> {
  const values: Partial<InsertProductValues> = {
    name: input.name,
    slug: generateSlug(input.name),
    sku: input.sku != null ? input.sku.trim() : input.sku,
    price: String(input.price),
    quantity: String(input.quantity ?? 0.0),
    externalQuantity: String(input.externalQuantity ?? 0.0),
    unit: input.unit,
    mainProductCheck: input.mainProductCheck,
    tagId: input.tagId ?? "",
    productCare: input.productCare,
    productOverview: input.productOverview,
    materialId: input.materialId,
    colorId: input.colorId,
    patternId: input.patternId ?? "",
    sale: input.sale ?? false,
    discount: String(input.discount ?? 0.0),
    heroImage: input.heroImage ?? "",
    hoverImage: input.hoverImage ?? "",
    galleryImages: input.galleryImages ?? "",
    productVideo: input.productVideo,
    metaTitle: input.metaTitle ?? "",
    metaDescription: input.metaDescription ?? "",
    heroImageAlt: input.heroImageAlt ?? "",
    hoverImageAlt: input.hoverImageAlt ?? "",
    productVideoAlt: input.productVideoAlt ?? "",
    backwardCompatibleLink: input.backwardCompatibleLink ?? "",
    badgeProfileEnabled: input.badgeProfileEnabled ?? false,
    volumeDiscountProfileEnabled: input.volumeDiscountProfileEnabled ?? false,
    madeToOrderProfileEnabled: input.madeToOrderProfileEnabled ?? false,
    sizeProfileEnabled: input.sizeProfileEnabled ?? false,
    customSizeProfileEnabled: input.customSizeProfileEnabled ?? false,
    finishProfileEnabled: input.finishProfileEnabled ?? false,
    fabricProfileEnabled: input.fabricProfileEnabled ?? false,
    // `entity.setMainProductId(updatedProduct.getMainProductId())`, then
    // immediately overridden to null when mainProductCheck is true —
    // preserved as the same two-step outcome, collapsed into one value.
    mainProductId: input.mainProductCheck ? null : (input.mainProductId ?? null),
  };

  if (input.subCategoryId != null && input.subCategoryId !== 0) {
    values.subCategoryId = input.subCategoryId;
  }
  if (input.skuGroupId != null && input.skuGroupId !== 0) {
    values.skuGroupId = input.skuGroupId;
  }
  if (input.specialStatusId != null && input.specialStatusId !== 0) {
    values.specialStatusId = input.specialStatusId;
  }

  if (input.badgeProfileEnabled && input.badgeProfileId != null && input.badgeProfileId !== 0) {
    values.badgeProfileId = input.badgeProfileId;
  } else {
    values.badgeProfileId = null;
  }

  if (
    input.volumeDiscountProfileEnabled &&
    input.volumeDiscountProfileId != null &&
    input.volumeDiscountProfileId !== 0
  ) {
    values.volumeDiscountProfileId = input.volumeDiscountProfileId;
  } else {
    values.volumeDiscountProfileId = null;
  }

  if (
    input.madeToOrderProfileEnabled &&
    input.madeToOrderProfileId != null &&
    input.madeToOrderProfileId !== 0
  ) {
    values.madeToOrderProfileId = input.madeToOrderProfileId;
    values.madeToOrderFabricId = input.madeToOrderFabricId ?? null;
  } else {
    values.madeToOrderProfileId = null;
    values.madeToOrderFabricId = null;
  }

  if (input.customSizeProfileEnabled && input.customSizeProfileId != null && input.customSizeProfileId !== 0) {
    values.customSizeProfileId = input.customSizeProfileId;
  } else {
    values.customSizeProfileId = null;
  }

  if (input.sizeProfileEnabled && input.sizeProfileId != null && input.sizeProfileId !== 0) {
    values.sizeProfileId = input.sizeProfileId;
  } else {
    values.sizeProfileId = null;
  }

  if (input.finishProfileEnabled && input.finishProfileId != null && input.finishProfileId !== 0) {
    values.finishProfileId = input.finishProfileId;
    values.finishProfileItemId = input.finishProfileItemId ?? null;
  } else {
    values.finishProfileId = null;
    values.finishProfileItemId = "";
  }

  if (input.fabricProfileEnabled && input.fabricProfileId != null && input.fabricProfileId !== 0) {
    values.fabricProfileId = input.fabricProfileId;
  } else {
    values.fabricProfileId = null;
  }

  // See Product.types.ts column-discrepancy note: productSpecificSizeProfile
  // has no backing column in this schema, so it is intentionally never
  // written here despite being set unconditionally in the Java source
  // (`entity.setProductSpecificSizeProfile(updatedProduct.getProductSpecificSizeProfile())`).

  return values;
}
