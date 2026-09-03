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
 * All nine ports are bound to real providers. SEGMENT_PORT resolves via
 * SegmentModule's SegmentService; the seven profile lookups are
 * select-by-id over their own tables (commerce/shared/db-lookup.ts) —
 * a `retrieveEntity(id)` port IS a select-by-id, so answering it for real
 * is less code than the `async () => null` dummies these replace, which
 * made every sub-category profile relation silently absent.
 * S3_STORAGE_PORT is a real adapter over ImageModule's ImageService (S3)
 * — see the useFactory below.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { ImageModule } from "../../image/image.module.js";
import { ImageService } from "../../image/service/image.service.js";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { lookupIdById } from "../../shared/db-lookup.js";
import { SegmentModule } from "../segment/segment.module.js";
import { SegmentService } from "../segment/service/segment.service.js";
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

// All seven profile lookups share one shape (see sub-category.types.ts) but
// keep distinct injection tokens, so each gets its own provider over its
// own table.
const profileLookup = (token: symbol, table: unknown) => ({
  provide: token,
  useFactory: (db: Database): ProfileLookupPort => ({ retrieveEntity: lookupIdById(db, table as never) }),
  inject: [DATABASE_CONNECTION],
});

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
  imports: [AuthModule, ImageModule, SegmentModule],
  controllers: [SubCategoryController],
  providers: [
    SubCategoryService,
    SubCategoryRepository,
    {
      provide: SEGMENT_PORT,
      useFactory: (segments: SegmentService): SegmentPort => ({
        retrieveSegment: async (id) => (await segments.retrieveSegmentById(id)) ?? null,
      }),
      inject: [SegmentService],
    },
    profileLookup(BADGE_PROFILE_PORT, schema.badgeProfile),
    profileLookup(MADE_TO_ORDER_PROFILE_PORT, schema.madeToOrderProfile),
    profileLookup(VOLUME_DISCOUNT_PROFILE_PORT, schema.volumeDiscountProfile),
    profileLookup(CUSTOM_SIZE_PROFILE_PORT, schema.customSizeProfile),
    profileLookup(SIZE_PROFILE_PORT, schema.sizeProfile),
    profileLookup(FINISH_PROFILE_PORT, schema.finishProfile),
    profileLookup(FABRIC_PROFILE_PORT, schema.fabricProfile),
    {
      provide: S3_STORAGE_PORT,
      useFactory: s3StorageAdapter,
      inject: [ImageService],
    },
  ],
  exports: [SubCategoryService],
})
export class SubCategoryModule {}
