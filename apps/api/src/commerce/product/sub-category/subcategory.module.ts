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
 * Eight of the nine ports below are bound to dummies, matching the
 * established convention in the sibling `product/product.module.ts` and
 * `category/category.module.ts`: each is a dependency on a domain that has
 * not been migrated yet. Every dummy here is tracked in
 * `apps/api/docs/PORTS-STATUS.md` — replace with the real provider as each
 * domain lands, do not silently leave them. S3_STORAGE_PORT is the
 * exception: it is wired to a real adapter over ImageModule's ImageService
 * (S3), since that domain has landed — see the useFactory below.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { ImageModule } from "../../../image/image.module.js";
import { ImageService } from "../../../image/service/image.service.js";
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

// Real adapter over ImageService (S3) — not a dummy. See category.module.ts
// for the same shim rationale (ImageService's buffer/name/mimetype call
// shape differs from S3StoragePort's single-file-argument shape).
// uploadImage(null) => "" is S3StoragePort's documented null-safe contract
// (see subCategory.service.ts's "S3StoragePort#uploadImage is null-safe by
// design" comment), not a silent no-op — a real file always reaches
// ImageService.uploadImage, which throws loudly if S3 config is bad.
function s3StorageAdapter(imageService: ImageService): S3StoragePort {
  return {
    uploadImage: async (file) => {
      if (!file) return "";
      return imageService.uploadImage(file.buffer, file.originalname, file.mimetype);
    },
    initiateDeleteImageTask: async (url) => {
      imageService.initiateDeleteImageTask(url);
    },
  };
}

@Module({
  imports: [AuthModule, ImageModule],
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
    {
      provide: S3_STORAGE_PORT,
      useFactory: s3StorageAdapter,
      inject: [ImageService],
    },
  ],
  exports: [SubCategoryService],
})
export class SubCategoryModule {}
