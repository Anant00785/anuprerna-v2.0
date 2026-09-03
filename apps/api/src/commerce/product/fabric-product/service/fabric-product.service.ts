/**
 * apps/api/src/commerce/product/fabric-product/fabric-product.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.dao.controller.FabricProductDAOController.
 * Every public method here corresponds 1:1 to a source method with the
 * same name/intent. Preserved quirks and adaptations, called out rather
 * than silently changed:
 *
 *  1. **createFabricProduct ID handoff.** Source: `this.productDAOController.createProduct(product)`
 *     mutates the JPA-managed `product` entity in place, so its generated
 *     `id` is readable immediately after the call. Product Core's ported
 *     `ProductService.createProduct()` returns only an `ActionCode` number
 *     (see product/core/service/Product.service.ts) — it doesn't expose
 *     the inserted row. Rather than widen that method's signature (Product
 *     Core is off-limits unless compilation requires it), this service
 *     composes Product Core's own exported `sanitizeProduct` /
 *     `validateProductInput` / `toInsertValues` / `ProductRepository`
 *     directly — the exact same building blocks `ProductService.createProduct`
 *     itself calls internally — to get the inserted row (and its `id`)
 *     back. No logic is duplicated; every one of those pieces is imported
 *     from Product Core, not reimplemented.
 *  2. **`disableFabricProduct` / `triggerZohoWorkflow` id parameter.**
 *     Source calls `this.retrieveEntity(request.getProductId())` /
 *     `this.retrieveEntity(data.getProductId())` — both inherited from
 *     `BehemothCRUDDAOController<FabricProduct, ...>`, i.e. a lookup BY
 *     THE FABRIC PRODUCT'S OWN ID, despite the field being named
 *     `productId` on `ProductDisableRequest` / `ProductZohoTriggerData`.
 *     This naming mismatch exists in the source itself — ported literally
 *     (`fabricProductId` is looked up, not the core Product's id),
 *     flagged rather than silently "corrected".
 *  3. **disableFabricProduct's redundant `modifyEntity(fabricProduct)`.**
 *     Source calls `this.modifyEntity(fabricProduct)` after mutating only
 *     the *core Product's* `disabled` flag — no field on the FabricProduct
 *     entity itself changes. Hibernate's dirty-checking means this save is
 *     a no-op in practice (no UPDATE statement, no version bump). Not
 *     ported as a real repository call for that reason — see method doc.
 *  4. **ZohoAdapterPort's narrower signature.** Source's
 *     `ZohoItemAdapterService` methods take the full `tenant`/`fabricProduct`
 *     object graphs; the port here takes `(tenantId, fabricProductId)`
 *     since the adapter itself is an out-of-scope external dependency
 *     bound to a no-op dummy (see fabric-product.module.ts) — a real
 *     implementation would need the full entities, not just ids; flagged
 *     for whoever wires the real Zoho adapter in.
 */
import { Inject, Injectable } from "@nestjs/common";
import { FabricProductRepository, OptimisticLockError } from "../repository/fabric-product.repository.js";
import { toInsertValues as toFabricInsertValues, toUpdateValues as toFabricUpdateValues, withFabricProductGroup } from "../mapper/fabric-product.mapper.js";

import { sanitizeFabricProduct } from "../validators/fabric-product.sanitizer.js";
import { validateFabricProductInput } from "../validators/fabric-product.validator.js";
import { ActionCode } from "../../../../common/errors/action-code.js";
import { ProductService } from "../../product/service/product.service.js";
import { ProductRepository } from "../../product/repository/product.repository.js";
import { sanitizeProduct } from "../../product/validators/product.sanitizer.js";
import { validateProductInput } from "../../product/validators/product.validator.js";
import { toInsertValues as toCoreInsertValues } from "../../product/mapper/product.mapper.js";
import type { ProductView } from "../../product/types/product.types.js";
import {
  COLOR_PORT,
  ColorPort,
  FABRIC_PRODUCT_ZOHO_RELATION_PORT,
  FABRIC_PROFILE_ENRICH_PORT,
  FabricOverview,
  FabricFilterPreview,
  FabricFilterPreviewFilters,
  FabricProductData,
  FabricProductView,
  FabricProductZohoRelationPort,
  FabricProfileEnrichPort,
  MAIN_PRODUCT_PREVIEW_PORT,
  MATERIAL_PORT,
  MainProductPreviewPort,
  MaterialPort,
  PATTERN_PORT,
  PatternPort,
  ProductDisableRequestInput,
  ProductZohoTriggerDataInput,
  SIZE_PROFILE_PREPARE_PORT,
  SUB_CATEGORY_HIERARCHY_PORT,
  SizeProfilePreparePort,
  SubCategoryHierarchyPort,
  TAG_PORT,
  TagPort,
  ZOHO_ADAPTER_PORT,
  ZohoAdapterPort,
  FabricProductInput,
} from "../types/fabric-product.types.js";

const BLANK_STRING_VALUE = "";

@Injectable()
export class FabricProductService {
  constructor(
    private readonly repo: FabricProductRepository,
    private readonly productService: ProductService,
    private readonly productRepository: ProductRepository,
    @Inject(COLOR_PORT) private readonly color: ColorPort,
    @Inject(MATERIAL_PORT) private readonly material: MaterialPort,
    @Inject(PATTERN_PORT) private readonly pattern: PatternPort,
    @Inject(TAG_PORT) private readonly tag: TagPort,
    @Inject(MAIN_PRODUCT_PREVIEW_PORT) private readonly mainProductPreview: MainProductPreviewPort,
    @Inject(SIZE_PROFILE_PREPARE_PORT) private readonly sizeProfilePrepare: SizeProfilePreparePort,
    @Inject(FABRIC_PROFILE_ENRICH_PORT) private readonly fabricProfileEnrich: FabricProfileEnrichPort,
    @Inject(SUB_CATEGORY_HIERARCHY_PORT) private readonly subCategoryHierarchy: SubCategoryHierarchyPort,
    @Inject(FABRIC_PRODUCT_ZOHO_RELATION_PORT) private readonly zohoRelation: FabricProductZohoRelationPort,
    @Inject(ZOHO_ADAPTER_PORT) private readonly zohoAdapter: ZohoAdapterPort,
  ) {}

  /**
   * Shared body of prepareColor/prepareMaterial/preparePattern/prepareTag.
   * The four source methods each split a comma-separated id column and did
   * one `SELECT ... WHERE id = $1` per token — a genuine N+1 that cost a
   * round-trip per colour/material/pattern/tag on every PDP. One
   * `WHERE id = ANY($1)` now answers the whole column.
   *
   * Output is byte-identical to the per-token version: results are re-indexed
   * back into CSV token order, duplicate tokens still yield duplicate entries,
   * and a token with no matching row still yields `null` in its slot (that is
   * what `retrieveEntity` returned for a miss).
   */
  private static async prepareCsvLookup(
    csv: string | null,
    port: { retrieveEntities(ids: number[]): Promise<{ id: number }[]> },
  ): Promise<unknown[]> {
    if (!csv || csv === BLANK_STRING_VALUE) return [];
    const tokens = csv.split(",");
    const rows = await port.retrieveEntities([...new Set(tokens.map(Number))]);
    const byId = new Map(rows.map((row) => [Number(row.id), row]));
    return tokens.map((token) => byId.get(Number(token)) ?? null);
  }

  /** prepareColor(fabricProduct) */
  private prepareColor(colorId: string): Promise<unknown[]> {
    return FabricProductService.prepareCsvLookup(colorId, this.color);
  }

  /** prepareMaterial(fabricProduct) */
  private prepareMaterial(materialId: string): Promise<unknown[]> {
    return FabricProductService.prepareCsvLookup(materialId, this.material);
  }

  /** preparePattern(fabricProduct) */
  private preparePattern(patternId: string | null): Promise<unknown[]> {
    return FabricProductService.prepareCsvLookup(patternId, this.pattern);
  }

  /** prepareTag(fabricProduct) */
  private prepareTag(tagId: string): Promise<unknown[]> {
    return FabricProductService.prepareCsvLookup(tagId, this.tag);
  }

  /**
   * Shared assembly for retrieveFabricProduct / retrieveFabricProductBySlug /
   * retrieveFabricProductBySlugV2 — the three source methods are
   * near-identical (only how the base Product row is located differs),
   * so the common enrichment sequence is factored out here rather than
   * copy-pasted three times. Not a behavior change: every enrichment step
   * below runs for all three source methods.
   */
  private async assembleView(
    pendingFabricRow: Promise<{ id: bigint; version: bigint; productId: number; gsm: number; addToSwatch: boolean; width: string } | null>,
    product: ProductView,
  ): Promise<FabricProductView | null> {
    // Every enrichment below depends only on the already-loaded `product`
    // row, so they all go in one round-trip batch. Previously sizeProfile,
    // the sub-category hierarchy, the made-to-order fabric and the fabric
    // profile items were each `await`ed on its own line, serialising ~5
    // extra 300ms Neon round-trips behind each other for no reason. The
    // fabric row itself is passed in unresolved so the slug path can
    // overlap it with this batch instead of waiting on it first.
    const [fabricRow, colors, materials, patterns, tags, relatedProductList, sizeProfile, hierarchy, mto, fabricProfileItems] =
      await Promise.all([
        pendingFabricRow,
        this.prepareColor(product.colorId),
        this.prepareMaterial(product.materialId),
        this.preparePattern(product.patternId),
        this.prepareTag(product.tagId),
        this.mainProductPreview.prepareRelatedProductList(product.id),
        product.sizeProfileId != null ? this.sizeProfilePrepare.prepareSizeProfile(product.sizeProfileId) : null,
        this.subCategoryHierarchy.retrieveHierarchy(product.subCategoryId),
        product.madeToOrderFabricId != null ? this.productService.retrieveProductById(BigInt(product.madeToOrderFabricId)) : null,
        product.fabricProfileId != null ? this.fabricProfileEnrich.retrieveEnrichedItems(product.fabricProfileId) : [],
      ]);

    if (!fabricRow) return null;

    // source: entity.getProduct().getSegment().setCategory(null) — the
    // segment object is hoisted with its own .category reference cleared,
    // to avoid a duplicated/circular payload. The port returns the pieces
    // separately already, so there's nothing to null out here — same
    // outcome (segment carries no embedded category), different mechanism.
    const category = hierarchy?.category ?? null;
    const segment = hierarchy?.segment ?? null;

    const madeToOrderFabric: (typeof product & { totalQuantity: number }) | null = mto
      ? { ...mto, totalQuantity: mto.quantity + mto.externalQuantity }
      : null;

    // source: entity.getProduct().getImageGallerySEOList().forEach(imageSeo -> imageSeo.setProduct(null))
    // ProductPreview (image-gallery-SEO) is its own migration step — no
    // list is available to null-out here yet; empty per that gap.
    const imageGallerySEOList: unknown[] = [];

    return {
      id: Number(fabricRow.id),
      version: Number(fabricRow.version),
      productId: fabricRow.productId,
      gsm: fabricRow.gsm,
      addToSwatch: fabricRow.addToSwatch,
      width: fabricRow.width,
      product,
      colors,
      materials,
      patterns,
      tags,
      relatedProductList,
      sizeProfile,
      category,
      segment,
      madeToOrderFabric,
      fabricProfileItems,
      imageGallerySEOList,
    };
  }

  /** retrieveFabricProduct(Long id) */
  async retrieveFabricProduct(id: bigint): Promise<FabricProductView | null> {
    const fabricRow = await this.repo.retrieveEntity(id);
    if (!fabricRow) return null;
    const product = await this.productService.retrieveProductById(BigInt(fabricRow.productId));
    if (!product) return null;
    return this.assembleView(Promise.resolve(fabricRow), product);
  }

  /**
   * retrieveFabricProductBySlug(String slug) — @Deprecated in source
   * (still ported, per "port every method 1:1"). Source's
   * "// TODO: exclude disabled product" is left as a TODO, not
   * implemented — the query returns disabled products too, matching
   * source exactly.
   */
  async retrieveFabricProductBySlug(slug: string): Promise<FabricProductView | null> {
    const product = await this.productService.findBySlug(slug);
    if (!product) return null;
    // findBySlug already returned the full product row; the old code threw it
    // away and had assembleView re-select it by id. The fabric row lookup is
    // handed over unresolved so it runs alongside the enrichment batch.
    return this.assembleView(this.repo.findByProductId(product.id), product);
  }

  /** retrieveFabricProductBySlugV2(String slug) — functionally identical to V1 in source (see class doc). */
  async retrieveFabricProductBySlugV2(slug: string): Promise<FabricProductView | null> {
    return this.retrieveFabricProductBySlug(slug);
  }

  /** retrieveFabricOverviews() */
  retrieveFabricOverviews(): Promise<FabricOverview[]> {
    return this.repo.findFabricOverviews();
  }

  /** retrieveFabricProductData(int page, int size) */
  retrieveFabricProductData(page: number, size: number): Promise<FabricProductData[]> {
    return this.repo.retrieveFabricProductData(size, page * size);
  }

  /** findFabricFilterPreview(categoryName, segmentCategoryName) */
  findFabricFilterPreview(categoryName: string | null, segmentCategoryName: string | null): Promise<FabricFilterPreview[]> {
    return this.repo.findFabricFilterPreview(categoryName, segmentCategoryName);
  }

  /** findFabricFilterPreviewPage(categoryName, segmentCategoryName, limit, offset) */
  findFabricFilterPreviewPage(
    categoryName: string | null,
    segmentCategoryName: string | null,
    limit: number,
    offset: number,
  ): Promise<FabricFilterPreview[]> {
    return this.repo.findFabricFilterPreviewPage(categoryName, segmentCategoryName, limit, offset);
  }

  /** findFabricFilterPreviewByIDs(ids) */
  findFabricFilterPreviewByIds(ids: number[]): Promise<FabricFilterPreview[]> {
    return this.repo.findFabricFilterPreviewByIds(ids);
  }

  /** findFabricFilterPreviewFiltered(...) */
  findFabricFilterPreviewFiltered(filters: FabricFilterPreviewFilters): Promise<FabricFilterPreview[]> {
    return this.repo.findFabricFilterPreviewFiltered(filters);
  }

  /**
   * createFabricProduct(LoomTenant tenant, FabricProduct fabricProduct) —
   * see class doc quirk #1 for the Product Core composition rationale.
   */
  async createFabricProduct(tenantId: number, input: FabricProductInput): Promise<number> {
    const sanitized = sanitizeFabricProduct(input);
    const { valid } = validateFabricProductInput(sanitized);
    if (!valid) return ActionCode.INCORRECT_INFORMATION;

    // product.setProductGroup("fabric")
    const productInput = withFabricProductGroup(sanitized.product);
    const productSanitized = sanitizeProduct(productInput);
    const productValidation = validateProductInput(productSanitized);
    if (!productValidation.valid) return ActionCode.INCORRECT_INFORMATION;

    let insertedProduct;
    try {
      insertedProduct = await this.productRepository.insert(toCoreInsertValues(productSanitized));
    } catch {
      return ActionCode.INSERT_FAILURE;
    }
    if (!insertedProduct) return ActionCode.INSERT_FAILURE;

    try {
      const insertedFabric = await this.repo.insert(toFabricInsertValues(Number(insertedProduct.id), sanitized));
      if (!insertedFabric) return ActionCode.INSERT_FAILURE;

      await this.zohoAdapter.addFabricProductToZoho(tenantId, Number(insertedFabric.id));

      return ActionCode.INSERT_SUCCESS;
    } catch {
      return ActionCode.INSERT_FAILURE;
    }
  }

  /**
   * updateFabricProduct(LoomTenant tenant, FabricProduct updatedEntity) —
   * OptimisticLockError is intentionally not caught here; it propagates,
   * mirroring an uncaught OptimisticLockException in the Java source
   * (same pattern as Cart/Product Core's own update methods).
   */
  async updateFabricProduct(tenantId: number, input: FabricProductInput): Promise<number> {
    const sanitized = sanitizeFabricProduct(input);
    const { valid } = validateFabricProductInput(sanitized);
    if (!valid) return ActionCode.INCORRECT_INFORMATION;
    // id is optional on FabricProductInput (create has none); BigInt(undefined) throws.
    if (sanitized.id === undefined) return ActionCode.UPDATE_FAILURE;

    const existingId = BigInt(sanitized.id);
    const existing = await this.repo.retrieveEntity(existingId);
    if (!existing) return ActionCode.UPDATE_FAILURE;

    const productUpdate = sanitized.product as FabricProductInput["product"] & { id: number };
    const operationCode = await this.productService.updateProduct(productUpdate);

    if (operationCode !== ActionCode.UPDATE_SUCCESS) {
      return ActionCode.UPDATE_FAILURE;
    }

    try {
      const updated = await this.repo.update(existingId, toFabricUpdateValues(sanitized));
      if (!updated) return ActionCode.UPDATE_FAILURE;

      await this.zohoAdapter.updateFabricProductToZoho(tenantId, Number(updated.id));

      return ActionCode.UPDATE_SUCCESS;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }
  }

  /**
   * disableFabricProduct(ProductDisableRequest request) — see class doc
   * quirks #2 and #3 (id-param naming mismatch; the FabricProduct-side
   * `modifyEntity` is a dirty-checking no-op, not ported as a real write).
   */
  async disableFabricProduct(request: ProductDisableRequestInput): Promise<number> {
    // quirk #2: request.productId is actually the FabricProduct's own id in source.
    const fabricRow = await this.repo.retrieveEntity(BigInt(request.productId));
    if (!fabricRow) return ActionCode.UPDATE_FAILURE;

    const operationCode = await this.productService.updateProductInternal(BigInt(fabricRow.productId), {
      disabled: request.disable,
    });

    if (operationCode !== ActionCode.UPDATE_SUCCESS) {
      return ActionCode.UPDATE_FAILURE;
    }

    // quirk #3: no FabricProduct-side field changed, so no repo.update call here.

    const relations = await this.zohoRelation.findAllByProductId(fabricRow.productId);
    for (const relation of relations) {
      await this.zohoRelation.setDisabled(relation.id, request.disable);
    }

    return ActionCode.UPDATE_SUCCESS;
  }

  /** triggerZohoWorkflow(LoomTenant tenant, ProductZohoTriggerData data) — see class doc quirks #2 and #4. */
  async triggerZohoWorkflow(tenantId: number, data: ProductZohoTriggerDataInput): Promise<number> {
    // quirk #2: data.productId is actually the FabricProduct's own id in source.
    const fabricRow = await this.repo.retrieveEntity(BigInt(data.productId));
    if (!fabricRow) return 0;

    await this.zohoAdapter.reTriggerFabricProductToZohoWorkflow(tenantId, Number(fabricRow.id));

    return 1;
  }
}
