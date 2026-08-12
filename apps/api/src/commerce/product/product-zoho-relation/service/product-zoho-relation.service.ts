// @ts-nocheck
/**
 * apps/api/src/commerce/product-zoho-relation/service/product-zoho-relation.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.controller.ProductZohoRelationDAOController.
 * Every public method here corresponds 1:1 to a source method with the same
 * name/intent:
 *
 *  - retrieveProductZohoRelationData(page, size)
 *  - retrieveProductZohoRelationById(id)
 *  - retrieveProductZohoRelationDataById(id)
 *  - deleteProductZohoRelation(id)
 *  - plus base BehemothCRUDDAOController CRUD (create/update), which
 *    ProductZohoRelationDAOController does not override, and the finder
 *    methods from ProductZohoRelationJpaRepository the DAO controller
 *    inherits access to via getRepository().
 *
 * No controller exists for this domain in this migration pass (per the
 * brief), so this service is the terminal layer for now.
 */
import { Injectable } from "@nestjs/common";
import {
  ProductZohoRelationRepository,
  OptimisticLockError,
} from "../repository/product-zoho-relation.repository.js";
import { toInsertValues, toUpdateValues, toEntity, toView } from "../mapper/product-zoho-relation.mapper.js";
import {
  CreateProductZohoRelationRequest,
  UpdateProductZohoRelationRequest,
} from "../dto/product-zoho-relation.dto.js";
import { ActionCode } from "../../../../common/errors/action-code.js";
import { ProductZohoRelationData, ProductZohoRelationView } from "../types/product-zoho-relation.types.js";

@Injectable()
export class ProductZohoRelationService {
  constructor(private readonly repo: ProductZohoRelationRepository) {}

  /** BehemothCRUDDAOController#addNewEntity(productZohoRelation) — base CRUD create. */
  async createProductZohoRelation(input: CreateProductZohoRelationRequest): Promise<number> {
    try {
      await this.repo.insert(toInsertValues(input));
      return ActionCode.INSERT_SUCCESS;
    } catch {
      return ActionCode.INSERT_FAILURE;
    }
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(productZohoRelation) — base CRUD
   * update. No override exists here, so the full entity is written.
   * OptimisticLockError is intentionally not caught; it propagates,
   * mirroring an uncaught OptimisticLockException in the Java source.
   */
  async updateProductZohoRelation(input: UpdateProductZohoRelationRequest): Promise<number> {
    try {
      const updated = await this.repo.update(BigInt(input.id), toUpdateValues(input));
      return updated ? ActionCode.UPDATE_SUCCESS : ActionCode.NO_ACTION;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }
  }

  /**
   * deleteProductZohoRelation(Long id) — source calls deleteEntityByID(id)
   * then always returns an empty string (the return value is not consumed
   * meaningfully by any caller in the uploaded source). Ported as a boolean
   * success flag instead, matching
   * ProductSizeProfileService#deleteProductSizeProfile's convention, rather
   * than reproducing the vestigial `""` return literally.
   */
  async deleteProductZohoRelation(id: bigint): Promise<boolean> {
    const count = await this.repo.deleteById(id);
    return count === 1;
  }

  /** retrieveProductZohoRelationById(Long id) */
  async retrieveProductZohoRelationById(id: bigint): Promise<ProductZohoRelationView | null> {
    const row = await this.repo.findById(id);
    if (!row) return null;
    return toView(toEntity(row));
  }

  /** retrieveProductZohoRelationData(int page, int size) */
  retrieveProductZohoRelationData(page: number, size: number): Promise<ProductZohoRelationData[]> {
    return this.repo.retrieveProductZohoRelationData(size, page * size);
  }

  /** retrieveProductZohoRelationDataById(Long id) */
  retrieveProductZohoRelationDataById(id: bigint): Promise<ProductZohoRelationData | null> {
    return this.repo.retrieveProductZohoRelationDataById(id);
  }

  /** findProductZohoRelationByProductAndSku(Product product, String sku) */
  async findByProductIdAndSku(productId: number, sku: string): Promise<ProductZohoRelationView | null> {
    const row = await this.repo.findByProductIdAndSku(productId, sku);
    return row ? toView(toEntity(row)) : null;
  }

  /** findProductZohoRelationByZohoItemIdAndSku(String zohoItemId, String sku) */
  async findByZohoItemIdAndSku(zohoItemId: string, sku: string): Promise<ProductZohoRelationView | null> {
    const row = await this.repo.findByZohoItemIdAndSku(zohoItemId, sku);
    return row ? toView(toEntity(row)) : null;
  }

  /** findProductZohoRelationByZohoItemId(String zohoItemId) */
  async findByZohoItemId(zohoItemId: string): Promise<ProductZohoRelationView | null> {
    const row = await this.repo.findByZohoItemId(zohoItemId);
    return row ? toView(toEntity(row)) : null;
  }

  /**
   * findAllByDisabledFalse() — active Zoho relations where the parent
   * product is also active. Returns raw joined rows; no controller layer
   * exists yet to shape a response for this in this migration pass.
   */
  findAllActiveWithActiveProduct() {
    return this.repo.findAllActiveWithActiveProduct();
  }

  /**
   * streamAllByFinishedProduct(boolean includeDisabled) — see
   * repository.ts STREAMING NOTE: materializes the full result set rather
   * than a true JPA-style stream.
   */
  streamAllByFinishedProduct(includeDisabled: boolean) {
    return this.repo.streamAllByFinishedProduct(includeDisabled);
  }

  /**
   * streamAllByFabricProduct(boolean includeDisabled) — see repository.ts
   * STREAMING NOTE: materializes the full result set rather than a true
   * JPA-style stream.
   */
  streamAllByFabricProduct(includeDisabled: boolean) {
    return this.repo.streamAllByFabricProduct(includeDisabled);
  }
}
