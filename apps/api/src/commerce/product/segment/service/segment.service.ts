/**
 * apps/api/src/commerce/product/segment/service/segment.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.segment.dao.controller.SegmentDAOController's
 * business logic. Controller generation is deferred (RequestMapper.java
 * not yet available); this service is the seam the future
 * SegmentController will call into.
 *
 * Unlike Cart's cross-module dependencies (out of scope for that
 * migration), Category IS part of this migration and already generated —
 * so the source's `CategoryDAOController.retrieveCategory(...)` call is
 * wired here as a real in-process dependency on `CategoryService`, not a
 * dummy port.
 */
import { Injectable, Inject, BadRequestException, NotFoundException } from "@nestjs/common";
import { SegmentRepository } from "../repository/segment.repository.js";
import { CategoryService } from "../../category/service/category.service.js";
import { toInsertValues, toUpdateValues } from "../mapper/segment.mapper.js";
import { validateSegment } from "../validators/segment.validator.js";
import { sanitizeSegment } from "../validators/segment.sanitizer.js";
import { SegmentInput, SegmentData, SegmentPreview, IMAGE_STORAGE_PORT, ImageStoragePort } from "../types/segment.types.js";

@Injectable()
export class SegmentService {
  constructor(
    private readonly repository: SegmentRepository,
    private readonly categoryService: CategoryService,
    @Inject(IMAGE_STORAGE_PORT) private readonly imageStore: ImageStoragePort,
  ) {}

  /** SegmentDAOController#retrieveSegment(Long id) — retrieveEntity throws if not found. */
  async retrieveSegment(id: number) {
    const found = await this.repository.findById(id);
    if (!found) throw new NotFoundException(`Segment id=${id} not found.`);
    return found;
  }

  /** SegmentDAOController#retrieveSegmentList() */
  retrieveSegmentList() {
    return this.repository.findAll();
  }

  /** SegmentDAOController#retrieveSegmentById(Long id) — plain findById().orElse(null), no throw. */
  retrieveSegmentById(id: number) {
    return this.repository.findById(id);
  }

  /**
   * SegmentDAOController#createNewSegment(Segment segment) — validates,
   * sanitizes, sets timeOfCreation, resolves + verifies the parent category
   * exists (mirrors `categoryDAOController.retrieveCategory(...)`, which
   * throws when the category is missing), uploads icon/socialImage, then
   * inserts.
   */
  async createNewSegment(rawInput: SegmentInput) {
    if (!validateSegment(rawInput)) {
      throw new BadRequestException("Segment failed validation.");
    }
    const input = sanitizeSegment(rawInput);

    await this.categoryService.retrieveCategory(input.categoryId);

    const iconUrl = await this.imageStore.uploadImage(input.iconFile);
    const socialImageUrl = await this.imageStore.uploadImage(input.socialImageFile);

    return this.repository.insert(toInsertValues(input, iconUrl, socialImageUrl));
  }

  /**
   * SegmentDAOController#updateSegment(Segment updatedSegment, Long segmentId)
   * — name/metaTitle/metaDescription/categoryId always overwritten (source
   * unconditionally re-resolves the category); icon/socialImage only
   * replaced (and the old S3 object queued for deletion) when a new file
   * was actually uploaded, exactly matching source.
   */
  async updateSegment(segmentId: number, rawInput: SegmentInput) {
    const existing = await this.repository.findById(segmentId);
    if (!existing) throw new NotFoundException(`Segment id=${segmentId} not found.`);

    if (!validateSegment(rawInput)) {
      throw new BadRequestException("Segment failed validation.");
    }
    const input = sanitizeSegment(rawInput);

    await this.categoryService.retrieveCategory(input.categoryId);

    let iconUrl: string | undefined;
    if (input.iconFile) {
      const existingIconUrl = existing.icon as string;
      iconUrl = await this.imageStore.uploadImage(input.iconFile);
      await this.imageStore.initiateDeleteImageTask(existingIconUrl);
    }

    let socialImageUrl: string | undefined;
    if (input.socialImageFile) {
      const existingSocialImageUrl = existing.socialImage as string;
      socialImageUrl = await this.imageStore.uploadImage(input.socialImageFile);
      await this.imageStore.initiateDeleteImageTask(existingSocialImageUrl);
    }

    return this.repository.update(segmentId, toUpdateValues(input, iconUrl, socialImageUrl));
  }

  /**
   * SegmentDAOController#deleteSegment(Long id) — refuses deletion when
   * sub-categories are attached, returning the source's descriptive
   * string instead of the entity.
   */
  async deleteSegment(id: number): Promise<string> {
    const subCategoryCount = await this.repository.countSubCategoryBySegmentId(id);
    if (subCategoryCount !== 0) {
      return `Segment has ${subCategoryCount} sub-categories associated. Cannot be deleted.`;
    }

    const existing = await this.repository.findById(id);
    if (!existing) return "Segment not found.";

    await this.imageStore.initiateDeleteImageTask(existing.icon as string);
    await this.imageStore.initiateDeleteImageTask(existing.socialImage as string);
    await this.repository.deleteById(id);
    return "";
  }

  /** SegmentDAOController#retrieveFuzzySegmentsFromString(String, int) — default limit is Integer.MAX_VALUE. */
  retrieveFuzzySegmentsFromString(text: string, limit = Number.MAX_SAFE_INTEGER) {
    return this.repository.fuzzySearchSegmentsInText(text, limit);
  }

  /** SegmentDAOController#retrieveSegmentPreviewsByCategory(String categoryName) */
  retrieveSegmentPreviewsByCategory(categoryName?: string): Promise<SegmentPreview[]> {
    return this.repository.findSegmentPreviewByCategory(categoryName ?? null);
  }

  /** SegmentDAOController#retrieveSegmentData(int page, int size) */
  retrieveSegmentData(page: number, size: number): Promise<SegmentData[]> {
    return this.repository.retrieveSegment(size, page * size);
  }

  /** SegmentDAOController#retrieveSegmentDataById(Long id) */
  retrieveSegmentDataById(id: number): Promise<SegmentData | null> {
    return this.repository.retrieveSegmentDataById(id);
  }
}
// @ts-nocheck
