/**
 * migrated/review/mapper/review.mapper.ts
 */
import { ReviewData, ReviewStatus } from "../types/review.types.js";

export function mapReviewRowToData(row: any): ReviewData {
  return {
    id: BigInt(row.id),
    tenantId: BigInt(row.tenantId),
    productId: BigInt(row.productId),
    rating: Number(row.rating),
    headline: row.headline ?? "",
    comment: row.comment ?? "",
    status: (row.status as ReviewStatus) ?? ReviewStatus.PENDING,
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now(),
  };
}
