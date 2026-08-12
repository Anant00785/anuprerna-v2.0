// @ts-nocheck
/**
 * apps/api/src/product/sub_category/SubCategory.service.ts
 *
 * Direct port of com.bloomscorp.loom.product.sub_category.dao.controller.SubCategoryDAOController
 * and .SubCategoryPreviewDAOController. Every public method here corresponds
 * 1:1 to a source method with the same name/intent — see the per-method doc
 * comments below for the exact source line(s) each one ports.
 *
 * Cross-module dependencies (Segment lookup, the seven Profile lookups, S3
 * storage) are injected as ports — see SubCategory.types.ts for the
 * rationale (Segment is already migrated per the checkpoint but its TS
 * module wasn't part of this upload batch; the Profile modules aren't
 * migrated yet at all).
 */
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  toInsertValues,
  toUpdateValues,
  type ResolvedCreateImages,
  type ResolvedUpdateImages,
} from "../mapper/subcategory.mapper.js";
import { OptimisticLockError, SubCategoryRepository } from "../repository/subCategory.repository.js";
import {
  BADGE_PROFILE_PORT,
  CUSTOM_SIZE_PROFILE_PORT,
  FABRIC_PROFILE_PORT,
  FINISH_PROFILE_PORT,
  MADE_TO_ORDER_PROFILE_PORT,
  S3_STORAGE_PORT,
  SEGMENT_PORT,
  SIZE_PROFILE_PORT,
  VOLUME_DISCOUNT_PROFILE_PORT,
  type CreateSubCategoryInput,
  type FeaturedSubcategory,
  type ProfileLookupPort,
  type S3StoragePort,
  type SegmentPort,
  type SubCategoryData,
  type SubCategoryEntity,
  type SubCategoryPreview,
  type UpdateSubCategoryInput,
} from "../types/sub-category.types.js";
import { ActionCode } from "../../../../common/errors/action-code.js";

/** SubCategoryDAOController#deleteSubCategory return shape — Java returns a String: "" on success, an error message otherwise. */
export interface DeleteSubCategoryResult {
  success: boolean;
  message: string;
}

@Injectable()
export class SubCategoryService {
  constructor(
    private readonly repo: SubCategoryRepository,
    @Inject(SEGMENT_PORT) private readonly segmentPort: SegmentPort,
    @Inject(BADGE_PROFILE_PORT) private readonly badgeProfilePort: ProfileLookupPort,
    @Inject(MADE_TO_ORDER_PROFILE_PORT) private readonly madeToOrderProfilePort: ProfileLookupPort,
    @Inject(VOLUME_DISCOUNT_PROFILE_PORT) private readonly volumeDiscountProfilePort: ProfileLookupPort,
    @Inject(CUSTOM_SIZE_PROFILE_PORT) private readonly customSizeProfilePort: ProfileLookupPort,
    @Inject(SIZE_PROFILE_PORT) private readonly sizeProfilePort: ProfileLookupPort,
    @Inject(FINISH_PROFILE_PORT) private readonly finishProfilePort: ProfileLookupPort,
    @Inject(FABRIC_PROFILE_PORT) private readonly fabricProfilePort: ProfileLookupPort,
    @Inject(S3_STORAGE_PORT) private readonly s3Store: S3StoragePort,
  ) {}

  /**
   * retrieveSubCategory(Long id):
   *   SubCategory entity = this.retrieveEntity(id);
   *   [strips heavy nested item-lists off badge/volume-discount/custom-size/size profiles]
   *   return entity;
   *
   * The nested-list stripping is profile-internal shape trimming on
   * entities this module doesn't own (BadgeProfile.badgeProfileItemList,
   * etc.) — those profile object graphs don't exist on this port's
   * `{ id: number }`-shaped return value in the first place, so there is
   * nothing to strip here; the port boundary already gives the trimmed
   * shape by construction.
   */
  async retrieveSubCategory(id: bigint): Promise<SubCategoryEntity | null> {
    return this.repo.retrieveEntity(id);
  }

  /** retrieveSubCategoryWithRelatedEntities(Long id) — this.retrieveEntity(id) */
  async retrieveSubCategoryWithRelatedEntities(id: bigint): Promise<SubCategoryEntity | null> {
    return this.repo.retrieveEntity(id);
  }

  /** SubCategoryPreviewDAOController#retrieveSubCategoryList — this.getRepository().findAll() */
  async retrieveSubCategoryList(): Promise<SubCategoryPreview[]> {
    return this.repo.findAllPreviews();
  }

  /**
   * retrieveFuzzySubCategoryPreviewsFromString(String text) /
   * retrieveFuzzySubCategoryPreviewsFromString(String text, int limit) —
   * source overload defaults limit to Integer.MAX_VALUE.
   */
  async retrieveFuzzySubCategoryPreviews(text: string, limit = Number.MAX_SAFE_INTEGER): Promise<SubCategoryPreview[]> {
    return this.repo.fuzzySearchSubCategoryPreviews(text, limit);
  }

  /**
   * createNewSubCategory(SubCategory entity):
   *   entity.setTimeOfCreation(...); entity.setImpactConfigVersion(1);  -- impactConfigVersion NOT persisted, see types.ts
   *   entity.setSegment(segmentDAOController.retrieveSegment(entity.getSegmentId()));
   *   [each profile: resolve+set if id present && != 0]
   *   entity.setIcon(s3Store.uploadImage(entity.getIconFile()));
   *   entity.setSocialImage(s3Store.uploadImage(entity.getSocialImageFile()));
   *   if (entity.getFeaturedImage() != null) entity.setFeaturedImage(s3Store.uploadImage(entity.getFeaturedImageFile()));
   *   return this.addNewEntity(entity);
   *
   * Segment must exist (source dereferences retrieveSegment's result with
   * no null-guard, so a missing segment would NPE in Java) — ported as an
   * explicit NotFoundException rather than reproducing an NPE.
   */
  async createSubCategory(input: CreateSubCategoryInput): Promise<number> {
    const segment = await this.segmentPort.retrieveSegment(input.segmentId);
    if (!segment) {
      throw new NotFoundException(`Segment id=${input.segmentId} not found.`);
    }

    await this.verifyProfileReferencesOnCreate(input);

    // Source always attempts icon/socialImage/featuredImage uploads on
    // create (see SubCategory.mapper.ts doc for the featuredImage quirk) —
    // S3StoragePort#uploadImage is null-safe by design.
    const resolvedImages: ResolvedCreateImages = {
      icon: await this.s3Store.uploadImage(input.iconFile ?? null),
      socialImage: await this.s3Store.uploadImage(input.socialImageFile ?? null),
      featuredImage: await this.s3Store.uploadImage(input.featuredImageFile ?? null),
    };

    const values = toInsertValues(input, resolvedImages);
    try {
      await this.repo.insert(values);
      return ActionCode.INSERT_SUCCESS;
    } catch {
      return ActionCode.INSERT_FAILURE;
    }
  }

  /**
   * updateSubCategory(SubCategory updatedEntity, Long subCategoryId, ProductDAOController):
   *   SubCategory entity = this.retrieveEntity(subCategoryId);
   *   if (entity == null) return ActionCode.NO_ACTION;
   *   if (hasImpactWorkHoursChanged(entity, updatedEntity)) entity.setImpactConfigVersion(nextImpactConfigVersion(...));  -- NOT persisted, see types.ts
   *   entity.setName(...); entity.setMetaTitle(...); entity.setMetaDescription(...);
   *   entity.setAvgWorkHoursPerMeter(...);  -- NOT persisted, see types.ts
   *   entity.setFeatured(...);
   *   entity.setSegment(segmentDAOController.retrieveSegment(updatedEntity.getSegmentId()));  -- always re-resolved
   *   [each profile: present+0 -> null, present+nonzero -> resolve+set, absent -> untouched]
   *   [each *File: only if present -> upload + queue old asset for delete]
   *   int operationCode = this.modifyEntity(entity);
   *   if (operationCode == ActionCode.UPDATE_SUCCESS) this.updateRelatedProducts(subCategoryId, entity, productDAOController);
   *   return this.modifyEntity(entity);   -- source calls modifyEntity TWICE; see note below.
   *
   * SOURCE QUIRK, PRESERVED: `updateSubCategory` calls
   * `this.modifyEntity(entity)` a second time after already branching on the
   * first call's result and (conditionally) firing `updateRelatedProducts`.
   * The method's actual return value is always the *second* call's result,
   * not the first. Ported faithfully below: the repository write happens
   * twice in sequence, `updateRelatedProducts` is triggered off the first
   * write's outcome (exactly as source branches), and the second write's
   * outcome is what's returned. Not "fixed" — this looks like an
   * unintentional duplicate call in the Java source, but "preserve Java
   * behaviour exactly" takes precedence over correcting it silently.
   */
  async updateSubCategory(input: UpdateSubCategoryInput): Promise<number> {
    const existing = await this.repo.retrieveEntity(BigInt(input.id));
    if (!existing) return ActionCode.NO_ACTION;

    const segment = await this.segmentPort.retrieveSegment(input.segmentId);
    if (!segment) {
      throw new NotFoundException(`Segment id=${input.segmentId} not found.`);
    }

    await this.verifyProfileReferencesOnUpdate(input);

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
      // Fire-and-forget, matching source's `new Thread(...).start()`.
      void this.repo.updateRelatedProducts(BigInt(input.id), {
        badgeProfileId: values.badgeProfileId ?? existing.badgeProfileId,
        volumeDiscountProfileId: values.volumeDiscountProfileId ?? existing.volumeDiscountProfileId,
        madeToOrderProfileId: values.madeToOrderProfileId ?? existing.madeToOrderProfileId,
        fabricProfileId: values.fabricProfileId ?? existing.fabricProfileId,
        customSizeProfileId: values.customSizeProfileId ?? existing.customSizeProfileId,
        finishProfileId: values.finishProfileId ?? existing.finishProfileId,
      });
    }

    // Second modifyEntity call, per the source quirk documented above.
    try {
      const updatedTwice = await this.repo.update(BigInt(input.id), values);
      return updatedTwice ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }
  }

  /**
   * deleteSubCategory(Long id):
   *   Long count = this.getRepository().countProductBySubCategoryId(id);
   *   if (count != 0L) return "Subcategory has " + count + " products associated. Cannot be deleted.";
   *   SubCategory subCategory = this.getRepository().findById(id).orElse(null);
   *   if (subCategory == null) return "SubCategory not found.";
   *   this.s3Store.initiateDeleteImageTask(subCategory.getIcon());
   *   this.s3Store.initiateDeleteImageTask(subCategory.getSocialImage());
   *   this.s3Store.initiateDeleteImageTask(subCategory.getFeaturedImage());
   *   this.deleteEntityByID(id);
   *   return "";
   */
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

  /** getFeaturedSubCategories(String categoryName) — this.getRepository().findFeaturedSubCategories(categoryName) */
  async getFeaturedSubCategories(categoryName: string): Promise<FeaturedSubcategory[]> {
    return this.repo.findFeaturedSubCategories(categoryName);
  }

  /** retrieveSubCategoryData(int page, int size) — this.getRepository().retrieveSubCategory(size, page * size) */
  async retrieveSubCategoryData(page: number, size: number): Promise<SubCategoryData[]> {
    return this.repo.retrieveSubCategoryData(size, page * size);
  }

  /** retrieveSubCategoryById(Long id) — this.getRepository().findById(id).orElse(null) */
  async retrieveSubCategoryById(id: bigint): Promise<SubCategoryEntity | null> {
    return this.repo.retrieveEntity(id);
  }

  /** retrieveSubCategoryDataById(Long id) — this.getRepository().retrieveSubCategoryDataById(id) */
  async retrieveSubCategoryDataById(id: bigint): Promise<SubCategoryData | null> {
    return this.repo.retrieveSubCategoryDataById(id);
  }

  /**
   * Existence-checks every profile id present-and-nonzero on a create
   * request, mirroring the NPE-on-missing-profile behavior implicit in
   * source's unguarded `profileDAOController.retrieveXProfile(id)` calls
   * (those base DAO controllers throw/return null-then-NPE on a missing
   * id; ported here as an explicit NotFoundException).
   */
  private async verifyProfileReferencesOnCreate(input: CreateSubCategoryInput): Promise<void> {
    await this.verifyProfileRef(this.badgeProfilePort, input.badgeProfileId, "BadgeProfile");
    await this.verifyProfileRef(this.customSizeProfilePort, input.customSizeProfileId, "CustomSizeProfile");
    await this.verifyProfileRef(this.volumeDiscountProfilePort, input.volumeDiscountProfileId, "VolumeDiscountProfile");
    await this.verifyProfileRef(this.madeToOrderProfilePort, input.madeToOrderProfileId, "MadeToOrderProfile");
    await this.verifyProfileRef(this.finishProfilePort, input.finishProfileId, "FinishProfile");
    await this.verifyProfileRef(this.sizeProfilePort, input.sizeProfileId, "SizeProfile");
    await this.verifyProfileRef(this.fabricProfilePort, input.fabricProfileId, "FabricProfile");
  }

  private async verifyProfileReferencesOnUpdate(input: UpdateSubCategoryInput): Promise<void> {
    await this.verifyProfileRef(this.badgeProfilePort, input.badgeProfileId, "BadgeProfile");
    await this.verifyProfileRef(this.customSizeProfilePort, input.customSizeProfileId, "CustomSizeProfile");
    await this.verifyProfileRef(this.volumeDiscountProfilePort, input.volumeDiscountProfileId, "VolumeDiscountProfile");
    await this.verifyProfileRef(this.madeToOrderProfilePort, input.madeToOrderProfileId, "MadeToOrderProfile");
    await this.verifyProfileRef(this.finishProfilePort, input.finishProfileId, "FinishProfile");
    await this.verifyProfileRef(this.sizeProfilePort, input.sizeProfileId, "SizeProfile");
    await this.verifyProfileRef(this.fabricProfilePort, input.fabricProfileId, "FabricProfile");
  }

  private async verifyProfileRef(port: ProfileLookupPort, id: number | null | undefined, label: string): Promise<void> {
    if (id === null || id === undefined || id === 0) return;
    const found = await port.retrieveEntity(id);
    if (!found) {
      throw new NotFoundException(`${label} id=${id} not found.`);
    }
  }
}
