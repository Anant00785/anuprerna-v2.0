/**
 * apps/api/src/commerce/product/segment/types/segment.types.ts
 *
 * Source-verified types for the Segment module (mid level of the
 * Category > Segment > SubCategory taxonomy). Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.segment.orm.Segment
 *  - com.bloomscorp.loom.product.segment.pojo.SegmentData
 *  - com.bloomscorp.loom.product.segment.pojo.SegmentPreview
 *
 * No fields or defaults invented beyond source. Same project-state
 * constraint as Cart/Category: no validation library installed, so these
 * are plain TS types with hand-written runtime guards in
 * `validators/segment.validator.ts`.
 */

/** Same narrow Multer-style shape used by Category — see category.types.ts. */
export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/**
 * Inbound shape for create/update segment requests. Field names match the
 * Segment entity's persisted + transient properties exactly as consumed by
 * SegmentController#createNewSegment / #updateSegment (multipart form).
 * `categoryId` is @Transient on the Java entity (used for form binding;
 * the persisted FK is resolved server-side via the Category lookup).
 */
export interface SegmentInput {
  categoryId: number;
  name: string;
  metaTitle?: string; // DB default '' when absent
  metaDescription?: string; // DB default '' when absent
  iconFile?: UploadedFile | null;
  socialImageFile?: UploadedFile | null;
}

/** Segment entity as returned by GET endpoints / persisted shape. */
export interface SegmentView {
  id: number;
  version: number;
  categoryId: number;
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  socialImage: string;
  timeOfCreation: number;
}

/**
 * com.bloomscorp.loom.product.segment.pojo.SegmentData — flat projection
 * returned by the table-explorer endpoints. Field order matches the native
 * query column order (RETRIEVE_SEGMENT / RETRIEVE_SEGMENT_BY_ID).
 */
export interface SegmentData {
  id: number;
  version: number;
  categoryId: number;
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  socialImage: string;
  timeOfCreation: number;
}

/**
 * com.bloomscorp.loom.product.segment.pojo.SegmentPreview — result of the
 * `findSegmentPreview` named native query (segment left-joined to category,
 * optionally filtered by category name).
 */
export interface SegmentPreview {
  categoryId: number;
  categoryName: string | null;
  segmentId: number;
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  socialImage: string;
}

/**
 * Cross-module dependency (Image/S3) that SegmentService calls into,
 * identical in shape to Category's — see category.types.ts for the same
 * caveat (S3StorageManagerService not in this repository).
 */
export interface ImageStoragePort {
  uploadImage(file: UploadedFile | null | undefined): Promise<string>;
  initiateDeleteImageTask(existingUrl: string): Promise<void>;
}

export const IMAGE_STORAGE_PORT = Symbol("IMAGE_STORAGE_PORT");

/**
 * Message strings for Segment endpoints, named after the LogMessage
 * constants SegmentController references. com.bloomscorp.loom.support.LogMessage
 * is not present in this repository, so exact wording is NOT source-verified
 * — same caveat as CartMessages / CategoryMessages.
 */
export const SegmentMessages = {
  UNAUTH_SEGMENT_REQUEST: "Unauthorized access to segment.",
  UNAUTH_SEGMENT_LIST_REQUEST: "Unauthorized access to segment list.",
  UNAUTH_SEGMENT_CREATE_REQUEST: "Unauthorized attempt to create a segment.",
  NEW_SEGMENT_CREATED: "Segment created successfully.",
  SEGMENT_CREATE_FAILED: "Failed to create segment.",
  UNAUTH_SEGMENT_UPDATE_REQUEST: "Unauthorized attempt to update a segment.",
  SEGMENT_UPDATED: "Segment updated successfully.",
  SEGMENT_UPDATE_FAILED: "Failed to update segment.",
  UNAUTH_SEGMENT_DELETE_REQUEST: "Unauthorized attempt to delete a segment.",
  SEGMENT_DELETED: "Segment deleted successfully.",
  SEGMENT_DELETE_FAILED: "Failed to delete segment.",
  UNAUTH_TABLE_EXPLORER_SEGMENT_REQUEST: "Unauthorized access to table explorer segment list.",
  UNAUTH_TABLE_EXPLORER_SEGMENT_BY_ID_REQUEST: "Unauthorized access to table explorer segment by id.",
} as const;
