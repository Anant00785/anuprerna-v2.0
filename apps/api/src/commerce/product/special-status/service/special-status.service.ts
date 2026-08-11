/**
 * apps/api/src/product/special-status/special-status.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.special_status.dao.controller.SpecialStatusDaoController.
 * Every public method here corresponds 1:1 to a source method with the
 * same name/intent — see the per-method doc comments below for the exact
 * source line(s) each one ports.
 *
 * createSpecialStatus / updateSpecialStatus run validate -> sanitize before
 * persisting and throw BadRequestException on validation failure, mirroring
 * what SpecialStatusController#createNewSpecialStatus /
 * #updateSpecialStatus do via
 * CRUDController#postEntity(..., this.validator, new SpecialStatusSanitizer(), ...)
 * — pulled forward into the service now so this layer is ready to be
 * called by a controller as soon as RequestMapper.java is available. This
 * is the same convention already used in
 * product/tag/service/tag.service.ts,
 * commerce/product/category/service/category.service.ts, and
 * commerce/product/segment/service/segment.service.ts (SkuGroupService is
 * the one sibling that does not wire validate/sanitize into the service —
 * that domain's files leave them unused pending its own controller; the
 * throw-on-failure pattern here follows the 3-of-4 majority instead).
 *
 * deleteSpecialStatus preserves the source's unimplemented stub, following
 * the identical pattern already ported in
 * product/sku_group/SkuGroup.service.ts#deleteSkuGroup — SpecialStatus is
 * the only one of the four reference domains (Category/Segment/Tag/
 * SkuGroup) whose Java DAO controller has a delete method at all, and it
 * is that same no-op `// TODO: implement delete` stub.
 */
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { OptimisticLockError, SpecialStatusRepository } from "../repository/special-status.repository.js";
import { toInsertValues, toUpdateValues } from "../mapper/special-status.mapper.js";
import { validateSpecialStatus } from "../validators/special-status.validator.js";
import { sanitizeSpecialStatus } from "../validators/special-status.sanitizer.js";
import {
  CreateSpecialStatusInput,
  SpecialStatusData,
  SpecialStatusEntity,
  UpdateSpecialStatusInput,
} from "../types/special-status.types.js";

@Injectable()
export class SpecialStatusService {
  constructor(private readonly repo: SpecialStatusRepository) {}

  /** SpecialStatusDaoController#retrieveSpecialStatusList() — this.getRepository().findAll() */
  retrieveSpecialStatusList(): Promise<SpecialStatusEntity[]> {
    return this.repo.findAll();
  }

  /**
   * SpecialStatusDaoController#createSpecialStatus(SpecialStatus entity):
   *   entity.setTimeOfCreation(Pastebox.getCurrentTimeInMillis());
   *   return this.addNewEntity(entity);
   * Preceded by validate() + sanitize(), matching
   * SpecialStatusController#createNewSpecialStatus.
   */
  async createSpecialStatus(rawInput: CreateSpecialStatusInput): Promise<SpecialStatusEntity> {
    if (!validateSpecialStatus(rawInput)) {
      throw new BadRequestException("Special status failed validation.");
    }
    const input = sanitizeSpecialStatus(rawInput);
    return this.repo.insert(toInsertValues(input));
  }

  /**
   * SpecialStatusDaoController#updateSpecialStatus(SpecialStatus updatedEntity):
   *   SpecialStatus entity = this.retrieveEntity(updatedEntity.getId());
   *   entity.setName(updatedEntity.getName());
   *   return this.modifyEntity(entity);
   * Preceded by validate() + sanitize(), matching
   * SpecialStatusController#updateSpecialStatus.
   */
  async updateSpecialStatus(rawInput: UpdateSpecialStatusInput): Promise<SpecialStatusEntity> {
    if (!validateSpecialStatus(rawInput)) {
      throw new BadRequestException("Special status failed validation.");
    }
    const input = sanitizeSpecialStatus(rawInput);
    try {
      const updated = await this.repo.update(BigInt(input.id), toUpdateValues(input.name));
      if (!updated) {
        throw new NotFoundException(`SpecialStatus id=${input.id} not found.`);
      }
      return updated;
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  /**
   * SpecialStatusDaoController#deleteSpecialStatus(Long id):
   *   //TODO: implement delete
   *   return true;
   *
   * Source is an unimplemented stub — it performs no deletion at all and
   * unconditionally returns true. Preserved verbatim, not "fixed": this
   * port issues no delete against the database either.
   */
  async deleteSpecialStatus(_id: number): Promise<boolean> {
    // TODO: implement delete (source: SpecialStatusDaoController#deleteSpecialStatus is an unimplemented stub)
    return true;
  }

  /** SpecialStatusDaoController#retrieveSpecialStatusData(int page, int size) */
  retrieveSpecialStatusData(page: number, size: number): Promise<SpecialStatusData[]> {
    return this.repo.retrieveSpecialStatusData(size, page * size);
  }

  /** SpecialStatusDaoController#retrieveSpecialStatusById(Long id) — this.retrieveEntity(id) */
  retrieveSpecialStatusById(id: bigint): Promise<SpecialStatusEntity | null> {
    return this.repo.retrieveEntity(id);
  }

  /** SpecialStatusDaoController#retrieveSpecialStatusDataById(Long id) — this.getRepository().retrieveSpecialStatusDataById(id) */
  retrieveSpecialStatusDataById(id: bigint): Promise<SpecialStatusData | null> {
    return this.repo.retrieveSpecialStatusDataById(id);
  }
}
// @ts-nocheck
