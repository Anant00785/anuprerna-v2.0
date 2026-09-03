import { Inject, Injectable } from "@nestjs/common";
import { FinishedProductRepository, OptimisticLockError } from "../repository/finished-product.repository.js";
import { toInsertValues } from "../mapper/finished-product.mapper.js";
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
  FinishedProductInput,
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

  private async enrich(productId: number) {
    const [productPreview, colors, materials, patterns, tags, relatedProducts, sizeProfile] = await Promise.all([
      this.product.retrieveProduct(productId),
      this.color.retrieveEntity(productId),
      this.material.retrieveEntity(productId),
      this.pattern.retrieveEntity(productId),
      this.tag.retrieveEntity(productId),
      this.mainProductPreview.prepareRelatedProductList(productId),
      this.sizeProfile.prepareSizeProfile(productId),
    ]);
    return { productPreview, colors, materials, patterns, tags, relatedProducts, sizeProfile };
  }

  /** retrieveFinishedProduct(Long id) */
  async retrieveFinishedProduct(id: bigint) {
    const numId = Number(id);
    let entity = await this.repo.retrieveEntity(id);
    if (!entity) {
      entity = await this.repo.findByProductId(numId);
    }
    if (!entity) {
      const prod = await this.product.retrieveProduct(numId);
      if (prod) {
        const enrichment = await this.enrich(numId);
        return { ...enrichment, id: numId, productId: numId, product: prod, productPreview: prod };
      }
      return null;
    }
    const enrichment = await this.enrich(entity.productId);
    return { ...entity, ...enrichment };
  }

  /** retrieveFinishedProductBySlug(String slug) */
  async retrieveFinishedProductBySlug(slug: string) {
    const product = await this.product.findProductBySlug(slug);
    if (!product) return null;
    const entity = await this.repo.findByProductId(product.id);
    if (!entity) {
      const enrichment = await this.enrich(product.id);
      return { ...enrichment, id: product.id, productId: product.id, product, productPreview: product };
    }
    const enrichment = await this.enrich(entity.productId);
    return { ...entity, ...enrichment };
  }

  /** createFinishedProduct(LoomTenant tenant, FinishedProduct finishedProduct) */
  async createFinishedProduct(tenantId: number, input: FinishedProductInput): Promise<number> {
    const createdProduct = await this.product.createProduct(input.product);
    if (!createdProduct) return ActionCode.INSERT_FAILURE;

    try {
      const inserted = await this.repo.insert(toInsertValues(createdProduct.id));
      await this.zohoAdapter.addFinishedProductToZoho(tenantId, Number(inserted.id));
      return ActionCode.INSERT_SUCCESS;
    } catch {
      return ActionCode.INSERT_SUCCESS; // Product was created successfully
    }
  }

  /** updateFinishedProduct(LoomTenant tenant, FinishedProduct updatedEntity) */
  async updateFinishedProduct(tenantId: number, input: UpdateFinishedProductInput): Promise<number> {
    const targetId = Number(input.id || input.product?.id);
    let entity = await this.repo.retrieveEntity(BigInt(targetId));
    if (!entity) {
      entity = await this.repo.findByProductId(targetId);
    }

    const productToUpdate = { ...input.product, id: entity ? entity.productId : targetId };
    const productUpdateResult = await this.product.updateProduct(productToUpdate);
    if (productUpdateResult !== ActionCode.UPDATE_SUCCESS) return ActionCode.UPDATE_FAILURE;

    if (entity) {
      try {
        await this.repo.touchVersion(entity.id);
        await this.zohoAdapter.updateFinishedProductToZoho(tenantId, targetId);
      } catch (err) {
        if (err instanceof OptimisticLockError) throw err;
      }
    }

    return ActionCode.UPDATE_SUCCESS;
  }

  /** disableFinishedProduct(ProductDisableRequest request) */
  async disableFinishedProduct(request: ProductDisableRequest): Promise<number> {
    const productUpdateResult = await this.product.updateProductInternal(request.productId, request.disable);
    if (productUpdateResult !== ActionCode.UPDATE_SUCCESS) return ActionCode.UPDATE_FAILURE;

    const entity = await this.repo.findByProductId(request.productId);
    if (entity) {
      try {
        await this.repo.touchVersion(entity.id);
      } catch (err) {
        // safe fallback
      }
    }

    return ActionCode.UPDATE_SUCCESS;
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
