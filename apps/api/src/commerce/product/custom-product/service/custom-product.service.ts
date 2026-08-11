// @ts-nocheck
/**
 * apps/api/src/product/custom-product/service/custom-product.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.dao.controller.CustomProductDAOController.
 * Every public method here corresponds 1:1 to a source method with the same
 * name/intent, including the update path's transactional failure mode
 * (flagged below rather than silently softened).
 */
import { Inject, Injectable } from "@nestjs/common";
import { CustomProductRepository, OptimisticLockError } from "../repository/custom-product.repository.js";
import { toInsertValues, toUpdateValues } from "../mapper/custom-product.mapper.js";
import { AddCustomProductRequest } from "../dto/custom-product.dto.js";
import { ActionCode } from "../../../../common/errors/action-code.js";
import {
  CUSTOM_ORDER_ITEM_PORT,
  CustomOrderItemPort,
  CustomProductData,
  CustomProductOrderItemSyncError,
  SYNC_ERROR_LOGGER_PORT,
  SyncErrorLoggerPort,
  UpdateCustomProductInput,
} from "../types/custom-product.types.js";

@Injectable()
export class CustomProductService {
  constructor(
    private readonly repo: CustomProductRepository,
    @Inject(CUSTOM_ORDER_ITEM_PORT) private readonly customOrderItem: CustomOrderItemPort,
    @Inject(SYNC_ERROR_LOGGER_PORT) private readonly syncErrorLogger: SyncErrorLoggerPort,
  ) {}

  /** getCustomProductById(Long id) */
  retrieveEntity(id: bigint) {
    return this.repo.retrieveEntity(id);
  }

  /** getAllCustomProducts() */
  findAll() {
    return this.repo.findAll();
  }

  /**
   * addNewCustomProduct(CustomProduct customProduct) — source stamps
   * createdAt/updatedAt right before addNewEntity; ported in the mapper.
   */
  async addNewCustomProduct(input: AddCustomProductRequest): Promise<number> {
    try {
      await this.repo.insert(toInsertValues(input));
      return ActionCode.INSERT_SUCCESS;
    } catch {
      return ActionCode.INSERT_FAILURE;
    }
  }

  /**
   * updateCustomProduct(CustomProduct updatedCustomProduct, LoomTenant
   * tenant). Source note (preserved, not silently changed): the sync call
   * to CustomOrderItemDAOController#updateCustomProductReference happens
   * inside the same @Transactional method as the entity save. If the sync
   * fails, source throws — rolling back the CustomProduct update alongside
   * it. Ported the same way here: CustomProductOrderItemSyncError is
   * thrown (after logging via SyncErrorLoggerPort) rather than swallowed,
   * so a caller wrapping this call in its own transaction gets the same
   * "the whole operation failed" signal source gives.
   */
  async updateCustomProduct(input: UpdateCustomProductInput, tenantId: number): Promise<number> {
    const existing = await this.repo.retrieveEntity(BigInt(input.id));
    if (!existing) {
      return ActionCode.NO_ACTION;
    }

    let result: number;
    try {
      const updated = await this.repo.update(BigInt(input.id), toUpdateValues(input));
      result = updated ? ActionCode.UPDATE_SUCCESS : ActionCode.NO_ACTION;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }

    if (result === ActionCode.UPDATE_SUCCESS) {
      const syncResult = await this.customOrderItem.updateCustomProductReference(input.id, input, tenantId);

      if (syncResult !== ActionCode.UPDATE_SUCCESS) {
        await this.syncErrorLogger.logCustomProductOrderItemSyncError(input.id, tenantId);
        throw new CustomProductOrderItemSyncError(input.id);
      }
    }

    return result;
  }

  /** retrieveCustomProductData(int page, int size) */
  retrieveCustomProductData(page: number, size: number): Promise<CustomProductData[]> {
    return this.repo.retrieveCustomProductData(size, page * size);
  }
}
// @ts-nocheck
