/**
 * apps/api/src/commerce/product-size-profile/service/product-size-profile.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.controller.ProductSizeProfileDAOController.
 * Every public method here corresponds 1:1 to a source method with the same
 * name/intent:
 *
 *  - deleteProductSizeProfileItems(Product product)          -> deleteByProductId
 *  - getProductSizeProfileBySizeOption(SizeProfileOption)    -> getBySizeProfileOptionId
 *  - deleteProductSizeProfileBySizeOption(SizeProfileOption) -> deleteBySizeProfileOptionId
 *  - retrieveConsumedFabricForImpact(productId, sizeProfileOptionId)
 *  - retrieveProductSizeProfileData(page, size)
 *  - retrieveProductSizeProfileById(id)
 *  - retrieveProductSizeProfileDataById(id)
 *  - plus base BehemothCRUDDAOController CRUD (create/update/delete), which
 *    ProductSizeProfileDAOController does not override.
 *
 * No controller exists for this domain in this migration pass (no
 * RequestMapper.java was found for ProductSizeProfile in the uploaded
 * source), so this service is the terminal layer for now.
 */
import { Inject, Injectable } from "@nestjs/common";
import { ProductSizeProfileRepository, OptimisticLockError } from "../repository/product-size-profile.repository.js";
import { toInsertValues, toUpdateValues, toEntity, toView } from "../mapper/product-size-profile.mapper.js";
import {
  CreateProductSizeProfileRequest,
  UpdateProductSizeProfileRequest,
} from "../dto/product-size-profile.dto.js";
import { ActionCode } from "../../../../common/errors/action-code.js";
import {
  ProductSizeProfileData,
  ProductSizeProfileView,
  SIZE_PROFILE_OPTION_PORT,
  SizeProfileOptionPort,
} from "../types/product-size-profile.types.js";

@Injectable()
export class ProductSizeProfileService {
  constructor(
    private readonly repo: ProductSizeProfileRepository,
    @Inject(SIZE_PROFILE_OPTION_PORT) private readonly sizeProfileOption: SizeProfileOptionPort,
  ) {}

  /** BehemothCRUDDAOController#addNewEntity(productSizeProfile) — base CRUD create. */
  async createProductSizeProfile(input: CreateProductSizeProfileRequest): Promise<number> {
    try {
      await this.repo.insert(toInsertValues(input));
      return ActionCode.INSERT_SUCCESS;
    } catch {
      return ActionCode.INSERT_FAILURE;
    }
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(productSizeProfile) — base CRUD
   * update. Unlike Cart's quantity-only quirk, no override exists here, so
   * the full entity is written. OptimisticLockError is intentionally not
   * caught; it propagates, mirroring an uncaught OptimisticLockException in
   * the Java source.
   */
  async updateProductSizeProfile(input: UpdateProductSizeProfileRequest): Promise<number> {
    try {
      const updated = await this.repo.update(BigInt(input.id), toUpdateValues(input));
      return updated ? ActionCode.UPDATE_SUCCESS : ActionCode.NO_ACTION;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }
  }

  /** BehemothCRUDDAOController#deleteEntity(id) — base CRUD delete. */
  async deleteProductSizeProfile(id: bigint): Promise<boolean> {
    const count = await this.repo.deleteById(id);
    return count === 1;
  }

  /** retrieveProductSizeProfileById(Long id) — enriched with sizeProfileOption. */
  async retrieveProductSizeProfileById(id: bigint): Promise<ProductSizeProfileView | null> {
    const row = await this.repo.findById(id);
    if (!row) return null;

    const entity = toEntity(row);
    const sizeOption = await this.sizeProfileOption.retrieveSizeProfileOption(entity.sizeProfileOptionId);
    return toView(entity, sizeOption);
  }

  /** retrieveProductSizeProfileData(int page, int size) */
  retrieveProductSizeProfileData(page: number, size: number): Promise<ProductSizeProfileData[]> {
    return this.repo.retrieveProductSizeProfileData(size, page * size);
  }

  /** retrieveProductSizeProfileDataById(Long id) */
  retrieveProductSizeProfileDataById(id: bigint): Promise<ProductSizeProfileData | null> {
    return this.repo.retrieveProductSizeProfileDataById(id);
  }

  /** deleteProductSizeProfileItems(Product product) */
  async deleteProductSizeProfileItems(productId: number): Promise<void> {
    await this.repo.deleteByProductId(productId);
  }

  /** getProductSizeProfileBySizeOption(SizeProfileOption option) */
  getProductSizeProfileBySizeOption(sizeProfileOptionId: number) {
    return this.repo.findBySizeProfileOptionId(sizeProfileOptionId);
  }

  /**
   * deleteProductSizeProfileBySizeOption(SizeProfileOption option) — source
   * detaches each row from the in-memory product collection before calling
   * deleteAll; that step has no independent persisted effect once ported to
   * a stateless repository call, so it collapses to the delete itself,
   * matching the source's net database effect. Source always returns true.
   */
  async deleteProductSizeProfileBySizeOption(sizeProfileOptionId: number): Promise<boolean> {
    await this.repo.deleteBySizeProfileOptionId(sizeProfileOptionId);
    return true;
  }

  /**
   * retrieveConsumedFabricForImpact(Long productId, Long sizeProfileOptionId)
   * — returns the product-specific consumedFabric override when set,
   * otherwise falls back to the size option's own default consumedFabric.
   * Returns null when no matching product-size row exists, or when neither
   * value is set.
   */
  async retrieveConsumedFabricForImpact(productId: number, sizeProfileOptionId: number): Promise<number | null> {
    const row = await this.repo.findByProductIdAndSizeProfileOptionId(productId, sizeProfileOptionId);
    if (!row) return null;

    const entity = toEntity(row);
    if (entity.consumedFabric !== null) return entity.consumedFabric;

    const sizeOption = await this.sizeProfileOption.retrieveSizeProfileOption(entity.sizeProfileOptionId);
    if (!sizeOption) return null;

    return sizeOption.consumedFabric;
  }
}
