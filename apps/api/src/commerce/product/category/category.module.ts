/**
 * apps/api/src/commerce/product/category/category.module.ts
 *
 * Wires the Category feature together. No controller is registered yet —
 * RequestMapper.java (source of the endpoint path constants) hasn't been
 * uploaded, so CategoryController generation is deferred per the migration
 * checkpoint rules; CategoryService is exported so it's ready to inject
 * once the controller lands.
 *
 * ImageStoragePort is a cross-module dependency (Image/S3) out of scope
 * for this migration — see types/category.types.ts. DatabaseModule is
 * @Global(), so CategoryRepository injects DATABASE_CONNECTION directly.
 *
 * The dummy below returns the "nothing uploaded" value its own interface
 * contract allows (empty string URL, no-op delete) rather than fabricating
 * Image/S3 behavior — same pattern as Cart's port dummies. Replace with a
 * real provider once the Image module is migrated.
 */
import { Module } from "@nestjs/common";
import { CategoryService } from "./service/category.service.js";
import { CategoryRepository } from "./repository/category.repository.js";
import { IMAGE_STORAGE_PORT, ImageStoragePort } from "./types/category.types.js";

const imageStorageDummy: ImageStoragePort = {
  uploadImage: async () => "",
  initiateDeleteImageTask: async () => {},
};

@Module({
  providers: [
    CategoryService,
    CategoryRepository,
    { provide: IMAGE_STORAGE_PORT, useValue: imageStorageDummy },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
