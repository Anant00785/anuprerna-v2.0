// @ts-nocheck
/**
 * apps/api/src/commerce/product/category/category.module.ts
 *
 * Wires the Category feature together with CategoryController.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { CategoryController } from "../controller/category.controller.js";
import { CategoryService } from "./service/category.service.js";
import { CategoryRepository } from "./repository/category.repository.js";
import { IMAGE_STORAGE_PORT, ImageStoragePort } from "./types/category.types.js";

const imageStorageDummy: ImageStoragePort = {
  uploadImage: async () => "",
  initiateDeleteImageTask: async () => {},
};

@Module({
  imports: [AuthModule],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryRepository,
    { provide: IMAGE_STORAGE_PORT, useValue: imageStorageDummy },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
