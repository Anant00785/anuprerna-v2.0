/**
 * apps/api/src/catalog/product/tag/service/tag.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.tag.dao.controller.TagDAOController.
 * Every public method here corresponds 1:1 to a source method with the same
 * name/intent.
 *
 * `createTag` / `updateTag` also run validate -> sanitize before persisting,
 * mirroring what TagController#createNewTag / #updateTag do via
 * CRUDController#postEntity(..., this.validator, new TagSanitizer(), ...)
 * — pulled forward into the service now so this layer is ready to be
 * called by the controller as soon as RequestMapper.java is available,
 * rather than leaving validation for a later pass.
 *
 * BadRequestException here mirrors the "validation failed" branch of
 * CRUDController#postEntity (source returns an unauthorized/failure
 * RainTreeResponse rather than persisting); the exact response envelope
 * text is owned by the controller layer and intentionally not decided here.
 */
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { TagRepository, OptimisticLockError } from "../repository/tag.repository.js";
import { toInsertValues, toUpdateValues } from "../mapper/tag.mapper.js";
import { validateTag } from "../validators/tag.validator.js";
import { sanitizeTag } from "../validators/tag.sanitizer.js";
import { CreateTagInput, UpdateTagInput, TagData, TagRow } from "../types/tag.types.js";

@Injectable()
export class TagService {
  constructor(private readonly repository: TagRepository) {}

  /** TagDAOController#retrieveTagList() */
  retrieveTagList(): Promise<TagRow[]> {
    return this.repository.findAll() as Promise<TagRow[]>;
  }

  /** TagDAOController#retrieveTagsByIds(List<Long> ids) */
  retrieveTagsByIds(ids: bigint[]): Promise<TagRow[]> {
    return this.repository.findByIds(ids) as Promise<TagRow[]>;
  }

  /** TagDAOController#retrieveTagById(Long id) */
  async retrieveTagById(id: bigint): Promise<TagRow | null> {
    return this.repository.findById(id) as Promise<TagRow | null>;
  }

  /** TagDAOController#retrieveTagData(int page, int size) */
  retrieveTagData(page: number, size: number): Promise<TagData[]> {
    return this.repository.retrieveTagData(page, size);
  }

  /** TagDAOController#retrieveTagDataById(Long id) */
  retrieveTagDataById(id: bigint): Promise<TagData | null> {
    return this.repository.retrieveTagDataById(id);
  }

  /**
   * TagDAOController#createTag(Tag entity):
   *   entity.setTimeOfCreation(Pastebox.getCurrentTimeInMillis());
   *   return this.addNewEntity(entity);
   * Preceded by validate() + sanitize(), matching TagController#createNewTag.
   */
  async createTag(input: CreateTagInput): Promise<TagRow> {
    const sanitized = sanitizeTag(input);
    if (!validateTag(sanitized)) {
      throw new BadRequestException("Invalid tag payload.");
    }
    const inserted = await this.repository.insert(toInsertValues(sanitized));
    return inserted as TagRow;
  }

  /**
   * TagDAOController#updateTag(Tag updatedEntity):
   *   Tag entity = this.retrieveEntity(updatedEntity.getId());
   *   entity.setName(updatedEntity.getName());
   *   return this.modifyEntity(entity);
   * Preceded by validate() + sanitize(), matching TagController#updateTag.
   */
  async updateTag(input: UpdateTagInput): Promise<TagRow> {
    const sanitized = sanitizeTag(input);
    if (!validateTag(sanitized)) {
      throw new BadRequestException("Invalid tag payload.");
    }
    try {
      const updated = await this.repository.update(input.id, toUpdateValues(sanitized.name));
      if (!updated) {
        throw new NotFoundException(`Tag id=${input.id} not found.`);
      }
      return updated as TagRow;
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }
}
