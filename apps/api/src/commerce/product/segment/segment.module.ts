/**
 * apps/api/src/commerce/product/segment/segment.module.ts
 *
 * Wires the Segment feature together with SegmentController.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { CategoryModule } from "../category/category.module.js";
import { ImageModule } from "../../image/image.module.js";
import { ImageService } from "../../image/service/image.service.js";
import { SegmentController } from "../controller/segment.controller.js";
import { SegmentService } from "./service/segment.service.js";
import { SegmentRepository } from "./repository/segment.repository.js";
import { IMAGE_STORAGE_PORT, ImageStoragePort } from "./types/segment.types.js";

// Real adapter over ImageService (S3) — see category.module.ts for why this
// is a useFactory shim rather than useExisting/useValue dummy, and why
// uploadImage(null|undefined) => "" is the documented null-safe contract,
// not a silent no-op.
function imageStorageAdapter(imageService: ImageService): ImageStoragePort {
  return {
    uploadImage: async (file) => {
      if (!file) return "";
      return imageService.uploadImage(file.buffer, file.originalname, file.mimetype);
    },
    initiateDeleteImageTask: async (existingUrl) => {
      imageService.initiateDeleteImageTask(existingUrl);
    },
  };
}

@Module({
  imports: [AuthModule, CategoryModule, ImageModule],
  controllers: [SegmentController],
  providers: [
    SegmentService,
    SegmentRepository,
    {
      provide: IMAGE_STORAGE_PORT,
      useFactory: imageStorageAdapter,
      inject: [ImageService],
    },
  ],
  exports: [SegmentService],
})
export class SegmentModule {}
