// @ts-nocheck
/**
 * apps/api/src/commerce/product/segment/segment.module.ts
 *
 * Wires the Segment feature together with SegmentController.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { CategoryModule } from "../category/category.module.js";
import { SegmentController } from "../controller/segment.controller.js";
import { SegmentService } from "./service/segment.service.js";
import { SegmentRepository } from "./repository/segment.repository.js";
import { IMAGE_STORAGE_PORT, ImageStoragePort } from "./types/segment.types.js";

const imageStorageDummy: ImageStoragePort = {
  uploadImage: async () => "",
  initiateDeleteImageTask: async () => {},
};

@Module({
  imports: [AuthModule, CategoryModule],
  controllers: [SegmentController],
  providers: [
    SegmentService,
    SegmentRepository,
    { provide: IMAGE_STORAGE_PORT, useValue: imageStorageDummy },
  ],
  exports: [SegmentService],
})
export class SegmentModule {}
