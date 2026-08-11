/**
 * apps/api/src/product/core/service/Product.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.dao.controller.ProductDAOController.
 * Every public method here corresponds 1:1 to a source method with the
 * same name/intent. Preserved quirks, called out rather than silently
 * "fixed":
 *
 *  1. createProduct/updateProduct hydrate related profile entities via
 *     DAOController calls purely for JPA's object-graph persistence.
 *     Since Drizzle persists FK id columns directly (see Product.mapper.ts
 *     header note), those hydration calls are preserved here as Port
 *     lookups for existence-check parity, but their result is NOT what
 *     gates the write — the mapper already decides which id columns get
 *     written from the enabled/id-present flags on the input, exactly as
 *     source's conditional branches do.
 *  2. updateProduct's ProductSizeProfile handling
 *     (`entity.getProductSizeProfileList().clear();
 *     this.productSizeProfileDAOController.deleteProductSizeProfileItems(entity);
 *     ... addAll(updatedProduct.getProductSizeProfileList())`) is a
 *     wholesale delete-then-replace, not a diff/merge. Ported as a single
 *     `ProductSizeProfilePort.deleteProductSizeProfileItems` call; the
 *     re-insert of the new list is the ProductSizeProfile module's own
 *     migration step (out of scope here, see MIGRATION_CHECKPOINT.md) —
 *     flagged rather than silently dropped.
 *  3. The post-update ProductZohoRelation.disabled sync
 *     (`entity.getProductSizeProfileList().forEach(sizeProfile -> {
 *     ... relation.setDisabled(...) })`) only runs `if (result > 0)` in
 *     source. Ported as-is via ProductZohoRelationPort, looped over the
 *     input's productSizeProfileList (the list this service was actually
 *     given, since — per quirk 2 — the freshly-persisted list lives in the
 *     not-yet-migrated ProductSizeProfile module and isn't readable back
 *     from here).
 *
 * KNOWN GAP: retrieveProductImageData / retrieveEnabledProductImageData
 * (ProductDAOController#retrieveProductImageData /
 * #retrieveEnabledProductImageData) are NOT ported. Both depend on
 * `com.bloomscorp.loom.support.nativeQuery.ProductNativeQuery` — a
 * different class from `com.bloomscorp.loom.product.nativequery.
 * ProductNativeQuery` (the latter, included in the uploaded repository, is
 * an unrelated empty @Entity stub) — whose FIND_PRODUCT_IMAGE_SITEMAP_ROWS
 * / FIND_ENABLED_PRODUCT_IMAGE_SITEMAP_ROWS SQL text is not present
 * anywhere in the files provided. Porting this without the real SQL would
 * mean inventing a sitemap query — not done. Add these once that class is
 * available.
 */
import { Inject, Injectable } from "@nestjs/common";
import { OptimisticLockError, ProductRepository } from "../repository/product.repository.js";
import { generateSlug, toInsertValues, toUpdateValues } from "../mapper/product.mapper.js";
import { CreateProductRequest, UpdateProductRequest } from "../dto/product.dto.js";
import { sanitizeProduct } from "../validators/product.sanitizer.js";
import { validateProductInput } from "../validators/product.validator.js";
import { ActionCode } from "../../../../common/errors/action-code.js";
import {
  BADGE_PROFILE_PORT,
  BadgeProfilePort,
  CUSTOM_SIZE_PROFILE_PORT,
  CustomSizeProfilePort,
  FABRIC_PROFILE_PORT,
  FabricProfilePort,
  FINISH_PROFILE_PORT,
  FinishProfilePort,
  IMAGE_GALLERY_SEO_PORT,
  ImageGallerySeoPort,
  MADE_TO_ORDER_PRODUCT_PREVIEW_PORT,
  MADE_TO_ORDER_PROFILE_PORT,
  MadeToOrderProductPreviewPort,
  MadeToOrderProfilePort,
  NavMenuColorResult,
  NavMenuCraftResult,
  NavMenuFinishedResult,
  NavMenuMaterialResult,
  NavMenuPatternResult,
  PRODUCT_SIZE_PROFILE_PORT,
  PRODUCT_ZOHO_RELATION_PORT,
  ProductData,
  ProductGist,
  ProductSizeProfilePort,
  ProductView,
  ProductZohoRelationPort,
  RelatedProducts,
  SIZE_PROFILE_PORT,
  SKU_GROUP_PORT,
  SPECIAL_STATUS_PORT,
  SUB_CATEGORY_PORT,
  SizeProfilePort,
  SkuGroupPort,
  SpecialStatusPort,
  SubCategoryPort,
  VOLUME_DISCOUNT_PROFILE_PORT,
  VolumeDiscountProfilePort,
} from "../types/product.types.js";
import { product } from "../../../../database/schema/schema.js";

type ProductRow = typeof product.$inferSelect;

function toView(row: ProductRow): ProductView {
  return {
    id: Number(row.id),
    version: Number(row.version),
    subCategoryId: Number(row.subCategoryId),
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    skuGroupId: Number(row.skuGroupId),
    price: Number(row.price),
    quantity: Number(row.quantity),
    externalQuantity: Number(row.externalQuantity),
    totalQuantity: Number(row.quantity) + Number(row.externalQuantity),
    unit: row.unit,
    mainProductCheck: row.mainProductCheck,
    mainProductId: row.mainProductId === null ? null : Number(row.mainProductId),
    tagId: row.tagId,
    badgeProfileId: row.badgeProfileId === null ? null : Number(row.badgeProfileId),
    badgeProfileEnabled: row.badgeProfileEnabled,
    volumeDiscountProfileId: row.volumeDiscountProfileId === null ? null : Number(row.volumeDiscountProfileId),
    volumeDiscountProfileEnabled: row.volumeDiscountProfileEnabled,
    madeToOrderProfileId: row.madeToOrderProfileId === null ? null : Number(row.madeToOrderProfileId),
    madeToOrderProfileEnabled: row.madeToOrderProfileEnabled,
    madeToOrderFabricId: row.madeToOrderFabricId === null ? null : Number(row.madeToOrderFabricId),
    sizeProfileId: row.sizeProfileId === null ? null : Number(row.sizeProfileId),
    sizeProfileEnabled: row.sizeProfileEnabled,
    customSizeProfileId: row.customSizeProfileId === null ? null : Number(row.customSizeProfileId),
    customSizeProfileEnabled: row.customSizeProfileEnabled,
    finishProfileId: row.finishProfileId === null ? null : Number(row.finishProfileId),
    finishProfileEnabled: row.finishProfileEnabled,
    finishProfileItemId: row.finishProfileItemId,
    fabricProfileId: row.fabricProfileId === null ? null : Number(row.fabricProfileId),
    fabricProfileEnabled: row.fabricProfileEnabled,
    specialStatusId: row.specialStatusId === null ? null : Number(row.specialStatusId),
    productOverview: row.productOverview,
    productCare: row.productCare,
    materialId: row.materialId,
    colorId: row.colorId,
    patternId: row.patternId,
    sale: row.sale ?? false,
    discount: Number(row.discount ?? 0),
    heroImage: row.heroImage ?? "",
    hoverImage: row.hoverImage ?? "",
    galleryImages: row.galleryImages ?? "",
    productGroup: row.productGroup,
    productVideo: row.productVideo,
    disabled: row.disabled,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    heroImageAlt: row.heroImageAlt,
    hoverImageAlt: row.hoverImageAlt,
    productVideoAlt: row.productVideoAlt,
    backwardCompatibleLink: row.backwardCompatibleLink,
  };
}

@Injectable()
export class ProductService {
  private readonly invalidCsvEntries = new Set<string>(["", "null"]);

  constructor(
    private readonly repo: ProductRepository,
    @Inject(SUB_CATEGORY_PORT) private readonly subCategory: SubCategoryPort,
    @Inject(SKU_GROUP_PORT) private readonly skuGroup: SkuGroupPort,
    @Inject(SPECIAL_STATUS_PORT) private readonly specialStatus: SpecialStatusPort,
    @Inject(BADGE_PROFILE_PORT) private readonly badgeProfile: BadgeProfilePort,
    @Inject(VOLUME_DISCOUNT_PROFILE_PORT) private readonly volumeDiscountProfile: VolumeDiscountProfilePort,
    @Inject(MADE_TO_ORDER_PROFILE_PORT) private readonly madeToOrderProfile: MadeToOrderProfilePort,
    @Inject(MADE_TO_ORDER_PRODUCT_PREVIEW_PORT) private readonly madeToOrderFabric: MadeToOrderProductPreviewPort,
    @Inject(CUSTOM_SIZE_PROFILE_PORT) private readonly customSizeProfile: CustomSizeProfilePort,
    @Inject(SIZE_PROFILE_PORT) private readonly sizeProfile: SizeProfilePort,
    @Inject(FINISH_PROFILE_PORT) private readonly finishProfile: FinishProfilePort,
    @Inject(FABRIC_PROFILE_PORT) private readonly fabricProfile: FabricProfilePort,
    @Inject(PRODUCT_SIZE_PROFILE_PORT) private readonly productSizeProfile: ProductSizeProfilePort,
    @Inject(PRODUCT_ZOHO_RELATION_PORT) private readonly productZohoRelation: ProductZohoRelationPort,
    @Inject(IMAGE_GALLERY_SEO_PORT) private readonly imageGallerySeo: ImageGallerySeoPort,
  ) {}

  /** retrieveProduct(Long id) — retrieveEntity + transient totalQuantity. */
  async retrieveProduct(id: bigint): Promise<ProductView | null> {
    const row = await this.repo.retrieveEntity(id);
    return row ? toView(row) : null;
  }

  /** retrieveProductById(Long id) — @Transactional(readOnly = true) alias of retrieveEntity. */
  async retrieveProductById(id: bigint): Promise<ProductView | null> {
    const row = await this.repo.retrieveEntity(id);
    return row ? toView(row) : null;
  }

  /** findProductBySlug(String slug) */
  async findBySlug(slug: string): Promise<ProductView | null> {
    const row = await this.repo.findBySlug(slug);
    return row ? toView(row) : null;
  }

  /** findByBackwardCompatibleLink(String link) */
  async findByBackwardCompatibleLink(link: string): Promise<ProductView | null> {
    const row = await this.repo.findByBackwardCompatibleLink(link);
    return row ? toView(row) : null;
  }

  /** findAllBySubCategoryId(Long subCategoryId) */
  async findAllBySubCategoryId(subCategoryId: number): Promise<ProductView[]> {
    const rows = await this.repo.findAllBySubCategoryId(subCategoryId);
    return rows.map(toView);
  }

  /** retrieveProductGists() */
  retrieveProductGists(): Promise<ProductGist[]> {
    return this.repo.findProductGists();
  }

  /** findNavMenuCraftMapping() */
  findNavMenuCraftMapping(): Promise<NavMenuCraftResult[]> {
    return this.repo.findNavMenuCraftMapping();
  }

  /** findNavMenuMaterialMapping() */
  findNavMenuMaterialMapping(): Promise<NavMenuMaterialResult[]> {
    return this.repo.findNavMenuMaterialMapping();
  }

  /** findNavMenuPatternMapping() */
  findNavMenuPatternMapping(): Promise<NavMenuPatternResult[]> {
    return this.repo.findNavMenuPatternMapping();
  }

  /** findNavMenuColorMapping() */
  findNavMenuColorMapping(): Promise<NavMenuColorResult[]> {
    return this.repo.findNavMenuColorMapping();
  }

  /** findNavMenuFinishedMapping(String category) */
  findNavMenuFinishedMapping(category: string): Promise<NavMenuFinishedResult[]> {
    return this.repo.findNavMenuFinishedMapping(category);
  }

  /**
   * resolveRelatedProductsByIdCSV(String csv) — tolerant per-token parse:
   * split on comma, dedupe, trim, drop ""/null tokens, silently skip
   * non-numeric tokens (`chars().allMatch(Character::isDigit)` guard in
   * source — no error thrown for a malformed token, it's just skipped).
   * Source iterates in parallel; ported sequentially for determinism (no
   * shared-state hazard here, unlike Cart's finish-resolution quirk, so
   * this doesn't change the result — only ordering, which was never
   * meaningful since results are additionally `removeIf(Objects::isNull)`).
   */
  async resolveRelatedProductsByIdCSV(csv: string): Promise<RelatedProducts[]> {
    const tokens = Array.from(new Set(csv.trim().split(",").map((t) => t.trim())));
    const results: RelatedProducts[] = [];

    for (const token of tokens) {
      if (this.invalidCsvEntries.has(token)) continue;
      if (!/^\d+$/.test(token)) continue;

      const id = Number(token);
      const products = await this.repo.findRelatedProductsByMainProductId(id);
      results.push({ id, products });
    }

    return results;
  }

  /** retrieveProductData(int page, int size) */
  retrieveProductData(page: number, size: number): Promise<ProductData[]> {
    return this.repo.retrieveProductData(size, page * size);
  }

  /** retrieveProductDataById(Long id) */
  retrieveProductDataById(id: bigint): Promise<ProductData | null> {
    return this.repo.retrieveProductDataById(id);
  }

  /**
   * createProduct(Product entity) — see class doc quirk #1 for the
   * hydration-call adaptation. Existence lookups are awaited for parity
   * but (as in source, which never checks their result before use) don't
   * gate the insert; the mapper decides the persisted id columns.
   */
  async createProduct(input: CreateProductRequest): Promise<number> {
    const sanitized = sanitizeProduct(input);
    const { valid } = validateProductInput(sanitized);
    if (!valid) return ActionCode.INCORRECT_INFORMATION;

    await this.subCategory.retrieveSubCategoryWithRelatedEntities(sanitized.subCategoryId);
    await this.skuGroup.retrieveEntity(sanitized.skuGroupId);
    if (sanitized.specialStatusId != null && sanitized.specialStatusId !== 0) {
      await this.specialStatus.retrieveEntity(sanitized.specialStatusId);
    }
    if (sanitized.badgeProfileId != null && sanitized.badgeProfileId !== 0) {
      await this.badgeProfile.retrieveBadgeProfile(sanitized.badgeProfileId);
    }
    if (sanitized.volumeDiscountProfileId != null && sanitized.volumeDiscountProfileId !== 0) {
      await this.volumeDiscountProfile.retrieveVolumeDiscountProfile(sanitized.volumeDiscountProfileId);
    }
    if (sanitized.madeToOrderProfileId != null && sanitized.madeToOrderProfileId !== 0) {
      await this.madeToOrderProfile.retrieveMadeToOrderProfile(sanitized.madeToOrderProfileId);
      if (sanitized.madeToOrderFabricId != null) {
        await this.madeToOrderFabric.retrieveMadeToOrderProfilePreview(sanitized.madeToOrderFabricId);
      }
    }
    if (sanitized.customSizeProfileId != null && sanitized.customSizeProfileId !== 0) {
      await this.customSizeProfile.retrieveCustomSizeProfile(sanitized.customSizeProfileId);
    }
    if (sanitized.sizeProfileId != null && sanitized.sizeProfileId !== 0) {
      await this.sizeProfile.retrieveSizeProfile(sanitized.sizeProfileId);
    }
    if (sanitized.finishProfileId != null && sanitized.finishProfileId !== 0) {
      await this.finishProfile.retrieveFinishProfile(sanitized.finishProfileId);
    }
    if (sanitized.fabricProfileId != null && sanitized.fabricProfileId !== 0) {
      await this.fabricProfile.retrieveFabricProfile(sanitized.fabricProfileId);
    }

    const values = toInsertValues(sanitized);

    try {
      const inserted = await this.repo.insert(values);
      if (!inserted) return ActionCode.INSERT_FAILURE;

      // ProductImageGallerySEO: filter deleted rows, persist the rest —
      // ProductPreview's own migration step, delegated via port.
      if (sanitized.imageGallerySEOList && sanitized.imageGallerySEOList.length > 0) {
        const kept = sanitized.imageGallerySEOList.filter((row: any) => !row.deleted);
        await this.imageGallerySeo.replaceForProduct(Number(inserted.id), kept);
      }

      return ActionCode.INSERT_SUCCESS;
    } catch {
      return ActionCode.INSERT_FAILURE;
    }
  }

  /**
   * updateProduct(Product updatedProduct) — see class doc quirks #1-3.
   * OptimisticLockError is intentionally not caught here; it propagates to
   * the controller, mirroring an uncaught OptimisticLockException in the
   * Java source (same pattern as CartService#updateCartItem).
   */
  async updateProduct(input: UpdateProductRequest): Promise<number> {
    const sanitized = sanitizeProduct(input);
    const { valid } = validateProductInput(sanitized);
    if (!valid) return ActionCode.INCORRECT_INFORMATION;

    if (sanitized.subCategoryId != null && sanitized.subCategoryId !== 0) {
      await this.subCategory.retrieveSubCategoryWithRelatedEntities(sanitized.subCategoryId);
    }
    if (sanitized.skuGroupId != null && sanitized.skuGroupId !== 0) {
      await this.skuGroup.retrieveEntity(sanitized.skuGroupId);
    }
    if (sanitized.specialStatusId != null && sanitized.specialStatusId !== 0) {
      await this.specialStatus.retrieveEntity(sanitized.specialStatusId);
    }
    if (sanitized.badgeProfileEnabled && sanitized.badgeProfileId != null && sanitized.badgeProfileId !== 0) {
      await this.badgeProfile.retrieveBadgeProfile(sanitized.badgeProfileId);
    }
    if (
      sanitized.volumeDiscountProfileEnabled &&
      sanitized.volumeDiscountProfileId != null &&
      sanitized.volumeDiscountProfileId !== 0
    ) {
      await this.volumeDiscountProfile.retrieveVolumeDiscountProfile(sanitized.volumeDiscountProfileId);
    }
    if (
      sanitized.madeToOrderProfileEnabled &&
      sanitized.madeToOrderProfileId != null &&
      sanitized.madeToOrderProfileId !== 0
    ) {
      await this.madeToOrderProfile.retrieveMadeToOrderProfile(sanitized.madeToOrderProfileId);
      if (sanitized.madeToOrderFabricId != null) {
        await this.madeToOrderFabric.retrieveMadeToOrderProfilePreview(sanitized.madeToOrderFabricId);
      }
    }
    if (
      sanitized.customSizeProfileEnabled &&
      sanitized.customSizeProfileId != null &&
      sanitized.customSizeProfileId !== 0
    ) {
      await this.customSizeProfile.retrieveCustomSizeProfile(sanitized.customSizeProfileId);
    }
    if (sanitized.sizeProfileEnabled && sanitized.sizeProfileId != null && sanitized.sizeProfileId !== 0) {
      await this.sizeProfile.retrieveSizeProfile(sanitized.sizeProfileId);
    }
    if (sanitized.finishProfileEnabled && sanitized.finishProfileId != null && sanitized.finishProfileId !== 0) {
      await this.finishProfile.retrieveFinishProfile(sanitized.finishProfileId);
    }
    if (sanitized.fabricProfileEnabled && sanitized.fabricProfileId != null && sanitized.fabricProfileId !== 0) {
      await this.fabricProfile.retrieveFabricProfile(sanitized.fabricProfileId);
    }

    const values = toUpdateValues(sanitized);

    try {
      // quirk #2: wholesale delete of the existing size-profile rows before
      // the (out-of-scope) re-insert of the new list.
      await this.productSizeProfile.deleteProductSizeProfileItems(sanitized.id);

      const updated = await this.repo.update(BigInt(sanitized.id), values);
      if (!updated) return ActionCode.NO_ACTION;

      // quirk #3: sync ProductZohoRelation.disabled per size, only on success.
      if (sanitized.productSizeProfileList) {
        for (const size of sanitized.productSizeProfileList) {
          const sku = `${sanitized.sku.trim()}-${size.sizeProfileOptionId}`;
          const relation = await this.productZohoRelation.findByProductAndSku(sanitized.id, sku);
          if (relation) {
            await this.productZohoRelation.setDisabled(relation.id, size.disabled ?? false);
          }
        }
      }

      return ActionCode.UPDATE_SUCCESS;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }
  }

  /** updateProductInternal(Product product) — bare modifyEntity call, no field remapping. */
  async updateProductInternal(id: bigint, values: Partial<ReturnType<typeof toUpdateValues>>): Promise<number> {
    const updated = await this.repo.update(id, values);
    return updated ? ActionCode.UPDATE_SUCCESS : ActionCode.NO_ACTION;
  }

  /** Generic delete — see Product.repository.ts#deleteById header note on BehemothCRUDDAOController's inherited delete. */
  async deleteProduct(id: bigint): Promise<boolean> {
    const count = await this.repo.deleteById(id);
    return count === 1;
  }
}

// Re-exported so callers building a slug preview (e.g. an admin UI) don't
// need to import the mapper module directly.
export { generateSlug };
// @ts-nocheck
