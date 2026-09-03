/**
 * apps/api/src/product/sub_category/SubCategory.mapper.ts
 *
 * Translates between the API-facing SubCategory input shapes and the
 * Drizzle insert/update value shapes for the `sub_category` table. Kept
 * separate from the service so the "which fields get written on create vs.
 * update, and under what conditions" rules stay visible in one place,
 * mirroring commerce/cart/mapper/cart.mapper.ts and SkuGroup.mapper.ts.
 *
 * Pure/synchronous by design: existence-checking the referenced
 * segment/profile ids against their respective ports, and performing the S3
 * uploads, both require async I/O and belong in SubCategory.service.ts.
 * This module only shapes already-resolved values into DB rows.
 */
import { InsertSubCategoryValues, UpdateSubCategoryValues } from "../repository/subCategory.repository.js";
import { CreateSubCategoryInput, UpdateSubCategoryInput } from "../types/sub-category.types.js";

/** Resolved image URLs produced by the S3 upload step in the service layer. */
export interface ResolvedCreateImages {
  icon: string;
  socialImage: string;
  featuredImage: string;
}

/** Only the images that were actually re-uploaded this update (file was present on the request). */
export interface ResolvedUpdateImages {
  icon?: string;
  socialImage?: string;
  featuredImage?: string;
}

/**
 * Source only sets a profile FK when the incoming id is present AND
 * non-zero (`entity.getXProfileId() != null && entity.getXProfileId() != 0L`)
 * — see SubCategoryDAOController#createNewSubCategory. Absent/zero means
 * "leave unset" on create.
 */
function includeProfileIdOnCreate(id: number | null | undefined): number | undefined {
  if (id === null || id === undefined || id === 0) return undefined;
  return id;
}

/**
 * SubCategoryDAOController#createNewSubCategory(SubCategory entity):
 *   entity.setTimeOfCreation(Pastebox.getCurrentTimeInMillis());
 *   entity.setImpactConfigVersion(1);                      -- NOT persisted, see schema-gap note in types.ts
 *   entity.setSegment(segmentDAOController.retrieveSegment(entity.getSegmentId()));
 *   [each profile: if id present && != 0, resolve + set]
 *   entity.setIcon(s3Store.uploadImage(entity.getIconFile()));
 *   entity.setSocialImage(s3Store.uploadImage(entity.getSocialImageFile()));
 *   if (entity.getFeaturedImage() != null) entity.setFeaturedImage(s3Store.uploadImage(entity.getFeaturedImageFile()));
 *   return this.addNewEntity(entity);
 *
 * Note on the featuredImage branch: `entity.getFeaturedImage()` defaults to
 * `""` (field initializer), never `null`, at the point this runs on a
 * freshly-bound create request — so `!= null` is always true and the upload
 * always executes in source, regardless of whether a featuredImageFile was
 * actually supplied. This port preserves that "always attempt the upload"
 * behavior; SubCategory.service.ts always calls S3StoragePort#uploadImage
 * for icon/socialImage/featuredImage on create (the port's `uploadImage`
 * accepts `null` by design — see S3StoragePort doc in types.ts — instead of
 * this mapper guessing what an unverified external upload call does with a
 * null MultipartFile).
 */
export function toInsertValues(input: CreateSubCategoryInput, resolvedImages: ResolvedCreateImages): InsertSubCategoryValues {
  return {
    segmentId: input.segmentId,
    name: input.name,
    icon: resolvedImages.icon,
    metaTitle: input.metaTitle ?? "",
    metaDescription: input.metaDescription ?? "",
    socialImage: resolvedImages.socialImage,
    featured: input.featured ?? false,
    featuredImage: resolvedImages.featuredImage,
    timeOfCreation: Date.now(),
    badgeProfileId: includeProfileIdOnCreate(input.badgeProfileId),
    madeToOrderProfileId: includeProfileIdOnCreate(input.madeToOrderProfileId),
    volumeDiscountProfileId: includeProfileIdOnCreate(input.volumeDiscountProfileId),
    customSizeProfileId: includeProfileIdOnCreate(input.customSizeProfileId),
    sizeProfileId: includeProfileIdOnCreate(input.sizeProfileId),
    finishProfileId: includeProfileIdOnCreate(input.finishProfileId),
    fabricProfileId: includeProfileIdOnCreate(input.fabricProfileId),
  };
}

/**
 * Source only re-sets a profile FK when the incoming id is present on the
 * request at all: present-and-0 clears it to null, present-and-nonzero
 * re-resolves+sets it, and *absent* (undefined) leaves the existing value
 * untouched — see SubCategoryDAOController#updateSubCategory's
 * `if (updatedEntity.getXProfileId() != null) { ... } else { entity.setXProfile(null); }`
 * pattern, repeated per profile. Returns `undefined` to mean "omit from the
 * update set" (leave column as-is).
 */
function resolveProfileIdOnUpdate(id: number | null | undefined): number | null | undefined {
  if (id === undefined) return undefined;
  if (id === null || id === 0) return null;
  return id;
}

/**
 * SubCategoryDAOController#updateSubCategory(SubCategory updatedEntity, ...):
 *   entity.setName(updatedEntity.getName());
 *   entity.setMetaTitle(updatedEntity.getMetaTitle());
 *   entity.setMetaDescription(updatedEntity.getMetaDescription());
 *   entity.setAvgWorkHoursPerMeter(updatedEntity.getAvgWorkHoursPerMeter());  -- NOT persisted, see schema-gap note
 *   entity.setFeatured(updatedEntity.getFeatured());
 *   entity.setSegment(segmentDAOController.retrieveSegment(updatedEntity.getSegmentId()));  -- always re-resolved
 *   [each profile: present+0 -> null, present+nonzero -> resolve+set, absent -> untouched]
 *   [each *File: only if present -> upload + queue old asset for delete]
 *
 * impactConfigVersion's conditional bump
 * (hasImpactWorkHoursChanged/nextImpactConfigVersion) is computed in
 * SubCategory.service.ts for behavioral parity but, like
 * avgWorkHoursPerMeter, has no backing column to persist to yet.
 */
export function toUpdateValues(input: UpdateSubCategoryInput, resolvedImages: ResolvedUpdateImages): UpdateSubCategoryValues {
  const values: UpdateSubCategoryValues = {
    name: input.name,
    metaTitle: input.metaTitle ?? "",
    metaDescription: input.metaDescription ?? "",
    featured: input.featured ?? false,
    segmentId: input.segmentId,
  };

  const badgeProfileId = resolveProfileIdOnUpdate(input.badgeProfileId);
  if (badgeProfileId !== undefined) values.badgeProfileId = badgeProfileId;

  const madeToOrderProfileId = resolveProfileIdOnUpdate(input.madeToOrderProfileId);
  if (madeToOrderProfileId !== undefined) values.madeToOrderProfileId = madeToOrderProfileId;

  const volumeDiscountProfileId = resolveProfileIdOnUpdate(input.volumeDiscountProfileId);
  if (volumeDiscountProfileId !== undefined) values.volumeDiscountProfileId = volumeDiscountProfileId;

  const customSizeProfileId = resolveProfileIdOnUpdate(input.customSizeProfileId);
  if (customSizeProfileId !== undefined) values.customSizeProfileId = customSizeProfileId;

  const sizeProfileId = resolveProfileIdOnUpdate(input.sizeProfileId);
  if (sizeProfileId !== undefined) values.sizeProfileId = sizeProfileId;

  const finishProfileId = resolveProfileIdOnUpdate(input.finishProfileId);
  if (finishProfileId !== undefined) values.finishProfileId = finishProfileId;

  const fabricProfileId = resolveProfileIdOnUpdate(input.fabricProfileId);
  if (fabricProfileId !== undefined) values.fabricProfileId = fabricProfileId;

  if (resolvedImages.icon !== undefined) values.icon = resolvedImages.icon;
  if (resolvedImages.socialImage !== undefined) values.socialImage = resolvedImages.socialImage;
  if (resolvedImages.featuredImage !== undefined) values.featuredImage = resolvedImages.featuredImage;

  return values;
}
