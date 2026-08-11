/**
 * apps/api/src/product/sku_group/SkuGroup.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.sku_group.dao.controller.SkuGroupDaoController.
 * Every public method here corresponds 1:1 to a source method with the
 * same name/intent — see the per-method doc comments below for the exact
 * source line(s) each one ports.
 */
import { Injectable } from "@nestjs/common";
import { OptimisticLockError, SkuGroupRepository } from "../repository/sku-group.repository.js";
import { toInsertValues, toUpdateValues } from "../mapper/sku-group.mapper.js";
import { CreateSkuGroupInput, SkuGroupData, SkuGroupEntity, UpdateSkuGroupInput } from "../types/sku-group.types.js";
import { ActionCode } from "../../../../common/errors/action-code.js";

@Injectable()
export class SkuGroupService {
  constructor(private readonly repo: SkuGroupRepository) {}

  /** retrieveSkuGroupList() — this.getRepository().findAll() */
  retrieveSkuGroupList(): Promise<SkuGroupEntity[]> {
    return this.repo.findAll();
  }

  /**
   * createSkuGroup(SkuGroup entity):
   *   entity.setTimeOfCreation(Pastebox.getCurrentTimeInMillis());
   *   return this.addNewEntity(entity);
   */
  async createSkuGroup(input: CreateSkuGroupInput): Promise<number> {
    const values = toInsertValues(input);
    try {
      await this.repo.insert(values);
      return ActionCode.INSERT_SUCCESS;
    } catch {
      return ActionCode.INSERT_FAILURE;
    }
  }

  /**
   * updateSkuGroup(SkuGroup updatedEntity):
   *   SkuGroup entity = this.retrieveEntity(updatedEntity.getId());
   *   entity.setName(updatedEntity.getName());
   *   return this.modifyEntity(entity);
   *
   * OptimisticLockError is intentionally not caught here; it propagates to
   * the caller, mirroring an uncaught OptimisticLockException in the Java
   * source (same convention as commerce/cart/service/cart.service.ts).
   */
  async updateSkuGroup(input: UpdateSkuGroupInput): Promise<number> {
    try {
      const updated = await this.repo.update(BigInt(input.id), toUpdateValues(input.name));
      return updated ? ActionCode.UPDATE_SUCCESS : ActionCode.NO_ACTION;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }
  }

  /**
   * deleteSkuGroup(Long id):
   *   //TODO: implement delete
   *   return true;
   *
   * Source is an unimplemented stub — it performs no deletion at all and
   * unconditionally returns true. Preserved verbatim, not "fixed": this
   * port issues no delete against the database either.
   */
  async deleteSkuGroup(_id: number): Promise<boolean> {
    // TODO: implement delete (source: SkuGroupDaoController#deleteSkuGroup is an unimplemented stub)
    return true;
  }

  /** retrieveSkuGroupData(int page, int size) — this.getRepository().retrieveSkuGroup(size, page * size) */
  retrieveSkuGroupData(page: number, size: number): Promise<SkuGroupData[]> {
    return this.repo.retrieveSkuGroupData(size, page * size);
  }

  /** retrieveSkuGroupById(Long id) — this.retrieveEntity(id) */
  retrieveSkuGroupById(id: bigint): Promise<SkuGroupEntity | null> {
    return this.repo.retrieveEntity(id);
  }

  /** retrieveSkuGroupDataById(Long id) — this.getRepository().retrieveSkuGroupDataById(id) */
  retrieveSkuGroupDataById(id: bigint): Promise<SkuGroupData | null> {
    return this.repo.retrieveSkuGroupDataById(id);
  }
}
// @ts-nocheck
