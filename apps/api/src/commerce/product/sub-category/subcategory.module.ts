// @ts-nocheck
/**
 * apps/api/src/commerce/product/sub-category/subcategory.module.ts
 *
 * Wires the SubCategory feature together with LOOM SubCategoryController.
 *
 * This module file was missing from the original migration upload (see the
 * root TODO.md item 3 — "custom product/ and subcategory/ don't even have
 * their own *.module.ts"), while `product.module.ts` already imported it.
 * That dangling import was the single TypeScript error in apps/api.
 *
 * The nine ports below are bound to dummies, matching the established
 * convention in the sibling `product/product.module.ts` and
 * `category/category.module.ts`: each is a dependency on a domain that has
 * not been migrated yet. Every dummy here is tracked in
 * `apps/api/docs/PORTS-STATUS.md` — replace with the real provider as each
 * domain lands, do not silently leave them.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { SubCategoryController } from "../controller/sub-category.controller.js";
import { SubCategoryService } from "./service/subCategory.service.js";
import { SubCategoryRepository } from "./repository/subCategory.repository.js";
import {
  BADGE_PROFILE_PORT,
  CUSTOM_SIZE_PROFILE_PORT,
  FABRIC_PROFILE_PORT,
  FINISH_PROFILE_PORT,
  MADE_TO_ORDER_PROFILE_PORT,
  ProfileLookupPort,
  S3_STORAGE_PORT,
  S3StoragePort,
  SEGMENT_PORT,
  SIZE_PROFILE_PORT,
  SegmentPort,
  VOLUME_DISCOUNT_PROFILE_PORT,
} from "./types/sub-category.types.js";

const segmentDummy: SegmentPort = {
  retrieveSegment: async () => null,
};

// All seven profile lookups share one shape (see sub-category.types.ts) but
// keep distinct injection tokens, so one dummy value is reused across them.
const profileLookupDummy: ProfileLookupPort = {
  retrieveEntity: async () => null,
};

const s3StorageDummy: S3StoragePort = {
  uploadImage: async () => "",
  initiateDeleteImageTask: async () => {},
};

@Module({
  imports: [AuthModule],
  controllers: [SubCategoryController],
  providers: [
    SubCategoryService,
    SubCategoryRepository,
    { provide: SEGMENT_PORT, useValue: segmentDummy },
    { provide: BADGE_PROFILE_PORT, useValue: profileLookupDummy },
    { provide: MADE_TO_ORDER_PROFILE_PORT, useValue: profileLookupDummy },
    { provide: VOLUME_DISCOUNT_PROFILE_PORT, useValue: profileLookupDummy },
    { provide: CUSTOM_SIZE_PROFILE_PORT, useValue: profileLookupDummy },
    { provide: SIZE_PROFILE_PORT, useValue: profileLookupDummy },
    { provide: FINISH_PROFILE_PORT, useValue: profileLookupDummy },
    { provide: FABRIC_PROFILE_PORT, useValue: profileLookupDummy },
    { provide: S3_STORAGE_PORT, useValue: s3StorageDummy },
  ],
  exports: [SubCategoryService],
})
export class SubCategoryModule {}
