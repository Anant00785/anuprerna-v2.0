/**
 * apps/api/src/commerce/product/category/types/category.types.ts
 *
 * Source-verified types for the Category module (top level of the
 * Category > Segment > SubCategory taxonomy). Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.category.orm.Category
 *  - com.bloomscorp.loom.product.category.pojo.CategoryData
 *
 * No fields or defaults have been invented beyond what's in source. Same
 * project-state constraint as Cart: no validation library (zod / class-
 * validator) is installed, so these are plain TS types with hand-written
 * runtime guards in `validators/category.validator.ts`.
 */

/**
 * Minimal upload shape category endpoints need (Express/Multer-style),
 * kept narrow rather than depending on @types/multer. Mirrors the two
 * transient MultipartFile fields on the Java entity (iconFile,
 * socialImageFile) — neither is persisted directly, both are consumed by
 * ImageStoragePort#uploadImage and discarded.
 */
export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/**
 * Inbound shape for create/update category requests. Field names match the
 * Category entity's persisted + transient properties exactly as consumed by
 * CategoryController#createNewCategory / #updateCategory (multipart form).
 */
export interface CategoryInput {
  name: string;
  metaTitle?: string; // DB default '' when absent
  metaDescription?: string; // DB default '' when absent
  iconFile?: UploadedFile | null;
  socialImageFile?: UploadedFile | null;
}

/**
 * Category entity as returned by GET endpoints / persisted shape.
 */
export interface CategoryView {
  id: number;
  version: number;
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  socialImage: string;
  timeOfCreation: number;
}

/**
 * com.bloomscorp.loom.product.category.pojo.CategoryData — flat projection
 * returned by the table-explorer endpoint. Field order matches the native
 * query column order (significant for the source @ConstructorResult
 * mapping; preserved for parity, not required in TS).
 */
export interface CategoryData {
  id: number;
  version: number;
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  socialImage: string;
  timeOfCreation: number;
}

/**
 * Cross-module dependency (Image/S3) that CategoryService calls into.
 * Out of scope for this migration per the brief — narrow port typed
 * exactly to the two S3StorageManagerService calls the source DAO
 * controller actually makes (uploadImage, initiateDeleteImageTask). Wire a
 * real provider in category.module.ts once the Image module is migrated.
 */
export interface ImageStoragePort {
  uploadImage(file: UploadedFile | null | undefined): Promise<string>;
  initiateDeleteImageTask(existingUrl: string): Promise<void>;
}

export const IMAGE_STORAGE_PORT = Symbol("IMAGE_STORAGE_PORT");

/**
 * Message strings for Category endpoints, named after the LogMessage
 * constants CategoryController references (UNAUTH_CATEGORY_REQUEST,
 * NEW_CATEGORY_CREATED, CATEGORY_UPDATED, CATEGORY_DELETED, etc.).
 * com.bloomscorp.loom.support.LogMessage is not present in this repository,
 * so the exact copy below is NOT source-verified — flagged for confirmation
 * against a live LogMessage.class dump before shipping, same caveat as
 * Cart's CartMessages.
 */
export const CategoryMessages = {
  UNAUTH_CATEGORY_REQUEST: "Unauthorized access to category.",
  UNAUTH_CATEGORY_LIST_REQUEST: "Unauthorized access to category list.",
  UNAUTH_CATEGORY_CREATE_REQUEST: "Unauthorized attempt to create a category.",
  NEW_CATEGORY_CREATED: "Category created successfully.",
  CATEGORY_CREATE_FAILED: "Failed to create category.",
  UNAUTH_CATEGORY_UPDATE_REQUEST: "Unauthorized attempt to update a category.",
  CATEGORY_UPDATED: "Category updated successfully.",
  CATEGORY_UPDATE_FAILED: "Failed to update category.",
  UNAUTH_CATEGORY_DELETE_REQUEST: "Unauthorized attempt to delete a category.",
  CATEGORY_DELETED: "Category deleted successfully.",
  CATEGORY_DELETE_FAILED: "Failed to delete category.",
  UNAUTH_TABLE_EXPLORER_CATEGORY_REQUEST: "Unauthorized access to table explorer category list.",
} as const;
