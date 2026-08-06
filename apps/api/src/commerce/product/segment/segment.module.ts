/**
 * apps/api/src/commerce/product/segment/segment.module.ts
 *
 * Wires the Segment feature together. No controller registered yet —
 * RequestMapper.java hasn't been uploaded, so SegmentController generation
 * is deferred per the migration checkpoint rules; SegmentService is
 * exported so it's ready to inject once the controller lands.
 *
 * Imports CategoryModule for a real CategoryService dependency (Category
 * is in-scope for this migration and already generated, unlike Cart's
 * out-of-scope cross-module ports).
 *
 * ImageStoragePort is a cross-module dependency (Image/S3) out of scope
 * for this migration — same dummy-binding pattern as category.module.ts.
 * Replace with a real provider once the Image module is migrated.
 */
import { Module } from "@nestjs/common";
import { CategoryModule } from "../category/category.module.js";
import { SegmentService } from "./service/segment.service.js";
import { SegmentRepository } from "./repository/segment.repository.js";
import { IMAGE_STORAGE_PORT, ImageStoragePort } from "./types/segment.types.js";

const imageStorageDummy: ImageStoragePort = {
  uploadImage: async () => "",
  initiateDeleteImageTask: async () => {},
};

@Module({
  imports: [CategoryModule],
  providers: [
    SegmentService,
    SegmentRepository,
    { provide: IMAGE_STORAGE_PORT, useValue: imageStorageDummy },
  ],
  exports: [SegmentService],
})
export class SegmentModule {}
