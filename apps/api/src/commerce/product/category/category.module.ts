// @ts-nocheck
/**
 * apps/api/src/commerce/product/category/category.module.ts
 *
 * Wires the Category feature together with CategoryController.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { ImageModule } from "../../image/image.module.js";
import { ImageService } from "../../image/service/image.service.js";
import { CategoryController } from "../controller/category.controller.js";
import { CategoryService } from "./service/category.service.js";
import { CategoryRepository } from "./repository/category.repository.js";
import { IMAGE_STORAGE_PORT, ImageStoragePort } from "./types/category.types.js";

// Real adapter over ImageService (S3), not a dummy: ImageService's method
// names/signatures differ from ImageStoragePort's (buffer/name/mimetype
// triple vs. a single UploadedFile, sync void vs. Promise<void>), so this
// is a small useFactory shim rather than useExisting — same pattern as
// FABRIC_PRODUCT_PREVIEW_LOOKUP_PORT in Product-preview.module.ts.
// uploadImage(null|undefined) short-circuits to "" — that's the documented
// null-safe contract (create/update call it unconditionally even when no
// file was submitted), not a silent-failure dummy. A real file always goes
// to ImageService.uploadImage, which throws loudly (AWS SDK error) if S3
// credentials/bucket are missing or invalid.
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
  imports: [AuthModule, ImageModule],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryRepository,
    {
      provide: IMAGE_STORAGE_PORT,
      useFactory: imageStorageAdapter,
      inject: [ImageService],
    },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
