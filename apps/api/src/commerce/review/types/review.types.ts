// @ts-nocheck
/**
 * migrated/review/types/review.types.ts
 */
export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface ReviewInput {
  productId: bigint;
  rating: number; // 1-5
  headline: string;
  comment: string;
}

export interface ReviewData {
  id: bigint;
  tenantId: bigint;
  productId: bigint;
  rating: number;
  headline: string;
  comment: string;
  status: ReviewStatus;
  createdAt: number;
}

export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
}
// @ts-nocheck
// @ts-nocheck
