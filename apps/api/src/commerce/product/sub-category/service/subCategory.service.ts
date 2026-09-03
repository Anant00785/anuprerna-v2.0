import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { SubCategoryRepository, OptimisticLockError } from "../repository/subCategory.repository.js";
import type { ResolvedCreateImages, ResolvedUpdateImages } from "../mapper/subcategory.mapper.js";
import {
  CreateSubCategoryInput,
  DeleteSubCategoryResult,
  FeaturedSubcategory,
  SubCategoryData,
  SubCategoryEntity,
  SubCategoryPreview,
  UpdateSubCategoryInput,
  S3_STORAGE_PORT,
  SEGMENT_PORT,
  BADGE_PROFILE_PORT,
  CUSTOM_SIZE_PROFILE_PORT,
  VOLUME_DISCOUNT_PROFILE_PORT,
  MADE_TO_ORDER_PROFILE_PORT,
  FINISH_PROFILE_PORT,
  SIZE_PROFILE_PORT,
  FABRIC_PROFILE_PORT,
  type S3StoragePort,
  type SegmentPort,
  type ProfileLookupPort,
} from "../types/sub-category.types.js";
import { ActionCode } from "../../../../common/errors/action-code.js";
import { toInsertValues, toUpdateValues } from "../mapper/subcategory.mapper.js";

@Injectable()
export class SubCategoryService {
  constructor(
    private readonly repo: SubCategoryRepository,
    @Inject(S3_STORAGE_PORT) private readonly s3Store: S3StoragePort,
    @Inject(SEGMENT_PORT) private readonly segmentPort: SegmentPort,
    @Inject(BADGE_PROFILE_PORT) private readonly badgeProfilePort: ProfileLookupPort,
    @Inject(CUSTOM_SIZE_PROFILE_PORT) private readonly customSizeProfilePort: ProfileLookupPort,
    @Inject(VOLUME_DISCOUNT_PROFILE_PORT) private readonly volumeDiscountProfilePort: ProfileLookupPort,
    @Inject(MADE_TO_ORDER_PROFILE_PORT) private readonly madeToOrderProfilePort: ProfileLookupPort,
    @Inject(FINISH_PROFILE_PORT) private readonly finishProfilePort: ProfileLookupPort,
    @Inject(SIZE_PROFILE_PORT) private readonly sizeProfilePort: ProfileLookupPort,
    @Inject(FABRIC_PROFILE_PORT) private readonly fabricProfilePort: ProfileLookupPort,
  ) {}

  async retrieveSubCategory(id: bigint): Promise<SubCategoryEntity | null> {
    return this.repo.retrieveEntity(id);
  }

  async retrieveSubCategoryWithRelatedEntities(id: bigint): Promise<SubCategoryEntity | null> {
    return this.repo.retrieveEntity(id);
  }

  async retrieveSubCategoryList(): Promise<SubCategoryPreview[]> {
    return this.repo.findAllPreviews();
  }

  async retrieveFuzzySubCategoryPreviews(text: string, limit = Number.MAX_SAFE_INTEGER): Promise<SubCategoryPreview[]> {
    return this.repo.fuzzySearchSubCategoryPreviews(text, limit);
  }

  async createSubCategory(input: CreateSubCategoryInput): Promise<number> {
    const resolvedImages: ResolvedCreateImages = {
      icon: await this.s3Store.uploadImage(input.iconFile ?? null),
      socialImage: await this.s3Store.uploadImage(input.socialImageFile ?? null),
      featuredImage: await this.s3Store.uploadImage(input.featuredImageFile ?? null),
    };

    const values = toInsertValues(input, resolvedImages);
    try {
      await this.repo.insert(values);
      return ActionCode.INSERT_SUCCESS;
    } catch (err) {
      console.error("[createSubCategory error]:", err);
      return ActionCode.INSERT_FAILURE;
    }
  }

  async updateSubCategory(input: UpdateSubCategoryInput): Promise<number> {
    const existing = await this.repo.retrieveEntity(BigInt(input.id));
    if (!existing) return ActionCode.NO_ACTION;

    const segmentId = input.segmentId && input.segmentId > 0 ? input.segmentId : Number(existing.segmentId);
    input.segmentId = segmentId;
    if (!input.name) input.name = existing.name;

    const resolvedImages: ResolvedUpdateImages = {};
    if (input.iconFile !== undefined && input.iconFile !== null) {
      resolvedImages.icon = await this.s3Store.uploadImage(input.iconFile);
      await this.s3Store.initiateDeleteImageTask(existing.icon);
    }
    if (input.socialImageFile !== undefined && input.socialImageFile !== null) {
      resolvedImages.socialImage = await this.s3Store.uploadImage(input.socialImageFile);
      await this.s3Store.initiateDeleteImageTask(existing.socialImage);
    }
    if (input.featuredImageFile !== undefined && input.featuredImageFile !== null) {
      resolvedImages.featuredImage = await this.s3Store.uploadImage(input.featuredImageFile);
      await this.s3Store.initiateDeleteImageTask(existing.featuredImage);
    }

    const values = toUpdateValues(input, resolvedImages);

    let operationCode: number;
    try {
      const updatedOnce = await this.repo.update(BigInt(input.id), values);
      operationCode = updatedOnce ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      operationCode = ActionCode.UPDATE_FAILURE;
    }

    if (operationCode === ActionCode.UPDATE_SUCCESS) {
      void this.repo.updateRelatedProducts(BigInt(input.id), {
        badgeProfileId: values.badgeProfileId ?? existing.badgeProfileId,
        volumeDiscountProfileId: values.volumeDiscountProfileId ?? existing.volumeDiscountProfileId,
        madeToOrderProfileId: values.madeToOrderProfileId ?? existing.madeToOrderProfileId,
        fabricProfileId: values.fabricProfileId ?? existing.fabricProfileId,
        customSizeProfileId: values.customSizeProfileId ?? existing.customSizeProfileId,
        finishProfileId: values.finishProfileId ?? existing.finishProfileId,
      });
    }

    return operationCode;
  }

  async deleteSubCategory(id: bigint): Promise<DeleteSubCategoryResult> {
    const count = await this.repo.countProductBySubCategoryId(id);
    if (count !== 0) {
      return { success: false, message: `Subcategory has ${count} products associated. Cannot be deleted.` };
    }

    const entity = await this.repo.retrieveEntity(id);
    if (!entity) {
      return { success: false, message: "SubCategory not found." };
    }

    await this.s3Store.initiateDeleteImageTask(entity.icon);
    await this.s3Store.initiateDeleteImageTask(entity.socialImage);
    await this.s3Store.initiateDeleteImageTask(entity.featuredImage);
    await this.repo.delete(id);
    return { success: true, message: "" };
  }

  async getFeaturedSubCategories(categoryName: string): Promise<FeaturedSubcategory[]> {
    return this.repo.findFeaturedSubCategories(categoryName);
  }

  async retrieveSubCategoryData(page: number, size: number): Promise<SubCategoryData[]> {
    return this.repo.retrieveSubCategoryData(size, page * size);
  }

  async retrieveSubCategoryById(id: bigint): Promise<SubCategoryEntity | null> {
    return this.repo.retrieveEntity(id);
  }

  async retrieveSubCategoryDataById(id: bigint): Promise<SubCategoryData | null> {
    return this.repo.retrieveSubCategoryDataById(id);
  }
}
