/**
 * apps/api/src/commerce/product/category/service/category.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.category.dao.controller.CategoryDAOController's
 * business logic (the source DAO controller does more than plain CRUD
 * delegation, so it's ported here rather than folded into the repository —
 * matching how Cart's service owns the create/update quirks). Controller
 * generation is deferred (RequestMapper.java not yet available); this
 * service is the seam the future CategoryController will call into.
 */
import { Injectable, Inject, BadRequestException, NotFoundException } from "@nestjs/common";
import { CategoryRepository } from "../repository/category.repository.js";
import { toInsertValues, toUpdateValues } from "../mapper/category.mapper.js";
import { validateCategory } from "../validators/category.validator.js";
import { sanitizeCategory } from "../validators/category.sanitizer.js";
import { CategoryInput, CategoryData, IMAGE_STORAGE_PORT, ImageStoragePort } from "../types/category.types.js";

@Injectable()
export class CategoryService {
  constructor(
    private readonly repository: CategoryRepository,
    @Inject(IMAGE_STORAGE_PORT) private readonly imageStore: ImageStoragePort,
  ) {}

  /** CategoryDAOController#retrieveCategory(Long id) — retrieveEntity throws if not found. */
  async retrieveCategory(id: number) {
    const found = await this.repository.findById(id);
    if (!found) throw new NotFoundException(`Category id=${id} not found.`);
    return found;
  }

  /** CategoryDAOController#retrieveCategoryList() */
  retrieveCategoryList() {
    return this.repository.findAll();
  }

  /**
   * CategoryDAOController#createNewCategory(Category category) — validates,
   * sanitizes, sets timeOfCreation, uploads icon/socialImage, then inserts.
   */
  async createNewCategory(rawInput: CategoryInput) {
    if (!validateCategory(rawInput)) {
      throw new BadRequestException("Category failed validation.");
    }
    const input = sanitizeCategory(rawInput);

    const iconUrl = await this.imageStore.uploadImage(input.iconFile);
    const socialImageUrl = await this.imageStore.uploadImage(input.socialImageFile);

    return this.repository.insert(toInsertValues(input, iconUrl, socialImageUrl));
  }

  /**
   * CategoryDAOController#updateCategory(Category updatedCategory, Long categoryId)
   * — name/metaTitle/metaDescription always overwritten; icon/socialImage
   * only replaced (and the old S3 object queued for deletion) when a new
   * file was actually uploaded, exactly matching source.
   */
  async updateCategory(categoryId: number, rawInput: CategoryInput) {
    const existing = await this.repository.findById(categoryId);
    if (!existing) throw new NotFoundException(`Category id=${categoryId} not found.`);

    if (!validateCategory(rawInput)) {
      throw new BadRequestException("Category failed validation.");
    }
    const input = sanitizeCategory(rawInput);

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

    return this.repository.update(categoryId, toUpdateValues(input, iconUrl, socialImageUrl));
  }

  /**
   * CategoryDAOController#deleteCategory(Long id) — refuses deletion when
   * segments are attached, returning the source's descriptive string
   * instead of the entity. Preserved as-is (source TODO: "implement
   * delete" left untouched, not a signal to redesign this here).
   */
  async deleteCategory(id: number): Promise<string> {
    const segmentCount = await this.repository.countSegmentsByCategoryId(id);
    if (segmentCount !== 0) {
      return `Category has ${segmentCount} segments associated. Cannot be deleted.`;
    }

    const existing = await this.repository.findById(id);
    if (!existing) return "Category not found.";

    await this.imageStore.initiateDeleteImageTask(existing.icon as string);
    await this.imageStore.initiateDeleteImageTask(existing.socialImage as string);
    await this.repository.deleteById(id);
    return "";
  }

  /** CategoryDAOController#retrieveFuzzyCategoriesFromString(String, int) — default limit is Integer.MAX_VALUE. */
  retrieveFuzzyCategoriesFromString(text: string, limit = Number.MAX_SAFE_INTEGER) {
    return this.repository.fuzzySearchCategoriesInText(text, limit);
  }

  /** CategoryDAOController#retrieveCategoryData(int page, int size) */
  retrieveCategoryData(page: number, size: number): Promise<CategoryData[]> {
    return this.repository.retrieveCategory(size, page * size);
  }
}
