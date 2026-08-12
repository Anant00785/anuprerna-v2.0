// @ts-nocheck
/**
 * apps/api/src/product/finished-product/service/finished-product.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.controller.FinishedProductDAOController.
 * Every public method here corresponds 1:1 to a source method with the same
 * name/intent. Two deliberate departures from a literal line-by-line port,
 * both flagged rather than silently absorbed:
 *
 *  1. createFinishedProduct/updateFinishedProduct: source relies on JPA's
 *     `cascade = CascadeType.ALL` on FinishedProduct.product to persist the
 *     nested Product row as part of saving FinishedProduct. Drizzle has no
 *     such cascade, and the real (already-migrated) Product module's
 *     persistence logic wasn't shared into this conversation (see
 *     types/finished-product.types.ts header). Ported as an explicit
 *     two-step sequence through ProductPort instead: persist the product
 *     first, then insert/touch the product_finished row referencing its id.
 *     This preserves the *outcome* (a Product row + a linked
 *     product_finished row) without inventing Product's internal
 *     ~30-field creation logic.
 *  2. prepareColor/prepareMaterial/preparePattern/prepareTag,
 *     mainProductPreviewDAOController.prepareRelatedProductList, and
 *     sizeProfileDAOController.prepareSizeProfile all reach into modules
 *     that are not yet migrated (Color, Material, Pattern, Tag,
 *     MainProductPreview, SizeProfile aren't in the completed-domains
 *     list). Ported as Ports with safe "not found" dummies wired in
 *     finished-product.module.ts, exactly like Cart's
 *     FabricPreviewPort/FinishedPreviewPort/etc.
 */
import { Inject, Injectable } from "@nestjs/common";
import { FinishedProductRepository, OptimisticLockError } from "../repository/finished-product.repository.js";
import { toInsertValues } from "../mapper/finished-product.mapper.js";
import {
  CreateFinishedProductRequest,
} from "../dto/finished-product.dto.js";
import { ActionCode } from "../../../../common/errors/action-code.js";
import {
  COLOR_PORT,
  ColorPort,
  FinishedProductData,
  MAIN_PRODUCT_PREVIEW_PORT,
  MainProductPreviewPort,
  MATERIAL_PORT,
  MaterialPort,
  PATTERN_PORT,
  PatternPort,
  PRODUCT_PORT,
  PRODUCT_SIZE_PROFILE_PORT,
  PRODUCT_ZOHO_RELATION_PORT,
  ProductDisableRequest,
  ProductPort,
  ProductSizeProfilePort,
  ProductZohoRelationPort,
  ProductZohoTriggerData,
  SIZE_PROFILE_PORT,
  SizeProfilePort,
  TAG_PORT,
  TagPort,
  UpdateFinishedProductInput,
  ZOHO_ADAPTER_PORT,
  ZohoAdapterPort,
} from "../types/finished-product.types.js";

@Injectable()
export class FinishedProductService {
  constructor(
    private readonly repo: FinishedProductRepository,
    @Inject(PRODUCT_PORT) private readonly product: ProductPort,
    @Inject(COLOR_PORT) private readonly color: ColorPort,
    @Inject(MATERIAL_PORT) private readonly material: MaterialPort,
    @Inject(PATTERN_PORT) private readonly pattern: PatternPort,
    @Inject(TAG_PORT) private readonly tag: TagPort,
    @Inject(MAIN_PRODUCT_PREVIEW_PORT) private readonly mainProductPreview: MainProductPreviewPort,
    @Inject(SIZE_PROFILE_PORT) private readonly sizeProfile: SizeProfilePort,
    @Inject(ZOHO_ADAPTER_PORT) private readonly zohoAdapter: ZohoAdapterPort,
    @Inject(PRODUCT_ZOHO_RELATION_PORT) private readonly productZohoRelation: ProductZohoRelationPort,
    @Inject(PRODUCT_SIZE_PROFILE_PORT) private readonly productSizeProfile: ProductSizeProfilePort,
  ) {}

  /**
   * Shared enrichment for retrieveFinishedProduct / retrieveFinishedProductBySlug.
   * Source: prepareColor/prepareMaterial/preparePattern/prepareTag +
   * mainProductPreviewDAOController.prepareRelatedProductList +
   * sizeProfileDAOController.prepareSizeProfile, all called against the
   * loaded entity's nested `product`. Ported against the productId only,
   * since the nested product's own fields (colorId/materialId/etc.) aren't
   * available in this module — the port implementations resolve those.
   */
  private async enrich(productId: number) {
    const [productPreview, colors, materials, patterns, tags, relatedProducts, sizeProfile] = await Promise.all([
      this.product.retrieveProduct(productId),
      this.color.retrieveEntity(productId),
      this.material.retrieveEntity(productId),
      this.pattern.retrieveEntity(productId),
      this.tag.retrieveEntity(productId),
      this.mainProductPreview.prepareRelatedProductList(productId),
      // Source only calls this when entity.getProduct().getSizeProfile() != null;
      // that conditional isn't checkable here since ProductPort.retrieveProduct
      // returns `unknown` (Product's real shape isn't available — see file
      // header). Called unconditionally; SizeProfilePort's dummy returns null
      // for products with no size profile, which is an equivalent no-op.
      this.sizeProfile.prepareSizeProfile(productId),
    ]);
    return { productPreview, colors, materials, patterns, tags, relatedProducts, sizeProfile };
  }

  /** retrieveFinishedProduct(Long id) */
  async retrieveFinishedProduct(id: bigint) {
    const entity = await this.repo.retrieveEntity(id);
    if (!entity) return null;
    const enrichment = await this.enrich(entity.productId);
    return { ...entity, ...enrichment };
  }

  /** retrieveFinishedProductBySlug(String slug) */
  async retrieveFinishedProductBySlug(slug: string) {
    const product = await this.product.findProductBySlug(slug);
    if (!product) return null;
    const entity = await this.repo.findByProductId(product.id);
    if (!entity) return null;
    const enrichment = await this.enrich(entity.productId);
    return { ...entity, ...enrichment };
  }

  /**
   * createFinishedProduct(LoomTenant tenant, FinishedProduct finishedProduct)
   * See class doc, departure #1, for why this is a two-step
   * persist-product-then-insert-row sequence rather than a cascade save.
   */
  async createFinishedProduct(tenantId: number, input: CreateFinishedProductRequest): Promise<number> {
    const createdProduct = await this.product.createProduct(input.product);
    if (!createdProduct) return ActionCode.INSERT_FAILURE;

    try {
      const inserted = await this.repo.insert(toInsertValues(createdProduct.id));
      await this.zohoAdapter.addFinishedProductToZoho(tenantId, Number(inserted.id));
      return ActionCode.INSERT_SUCCESS;
    } catch {
      return ActionCode.INSERT_FAILURE;
    }
  }

  /** updateFinishedProduct(LoomTenant tenant, FinishedProduct updatedEntity) */
  async updateFinishedProduct(tenantId: number, input: UpdateFinishedProductInput): Promise<number> {
    const entity = await this.repo.retrieveEntity(BigInt(input.id));
    if (!entity) return ActionCode.UPDATE_FAILURE;

    const productUpdateResult = await this.product.updateProduct(input.product);
    if (productUpdateResult !== ActionCode.UPDATE_SUCCESS) return ActionCode.UPDATE_FAILURE;

    try {
      await this.repo.touchVersion(BigInt(input.id));
      await this.zohoAdapter.updateFinishedProductToZoho(tenantId, input.id);
      return ActionCode.UPDATE_SUCCESS;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }
  }

  /**
   * disableFinishedProduct(ProductDisableRequest request). Source restores
   * each ProductZohoRelation's disabled state from its matching
   * ProductSizeProfile when re-enabling, and force-disables all of them
   * when disabling — ported verbatim via the two out-of-scope ports.
   */
  async disableFinishedProduct(request: ProductDisableRequest): Promise<number> {
    const entity = await this.repo.findByProductId(request.productId);
    if (!entity) return ActionCode.UPDATE_FAILURE;

    const productUpdateResult = await this.product.updateProductInternal(request.productId, request.disable);
    if (productUpdateResult !== ActionCode.UPDATE_SUCCESS) return ActionCode.UPDATE_FAILURE;

    let result: number;
    try {
      await this.repo.touchVersion(entity.id);
      result = ActionCode.UPDATE_SUCCESS;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }

    const relations = await this.product.getZohoRelations(request.productId);
    for (const relation of relations) {
      let shouldDisable: boolean;
      if (request.disable) {
        shouldDisable = true;
      } else {
        const sizeProfile = await this.productSizeProfile.findBySizeProfileOptionSku(relation.sku);
        shouldDisable = sizeProfile?.disabled ?? false;
      }
      await this.productZohoRelation.setDisabled(relation.id, shouldDisable);
    }

    return result;
  }

  /** triggerZohoWorkflow(LoomTenant tenant, ProductZohoTriggerData data) */
  async triggerZohoWorkflow(tenantId: number, data: ProductZohoTriggerData): Promise<number> {
    const entity = await this.repo.findByProductId(data.productId);
    if (!entity) return 0;

    await this.zohoAdapter.reTriggerFinishedProductToZohoWorkflow(tenantId, Number(entity.id));
    return 1;
  }

  /** retrieveFinishedProductData(int page, int size) */
  retrieveFinishedProductData(page: number, size: number): Promise<FinishedProductData[]> {
    return this.repo.retrieveFinishedProductData(size, page * size);
  }
}
// @ts-nocheck
