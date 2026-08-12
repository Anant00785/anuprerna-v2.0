// @ts-nocheck
/**
 * apps/api/src/commerce/product/review-product-preview/service/review-product-preview.service.ts
 *
 * Thin service layer over ReviewProductPreviewRepository — mirrors
 * ReviewProductPreviewDAOController's inherited CRUD-read behavior
 * (source repository declares no custom query methods).
 */
import { Injectable } from "@nestjs/common";
import { ReviewProductPreviewRepository } from "../repository/review-product-preview.repository.js";
import { toView } from "../mapper/review-product-preview.mapper.js";
import { ReviewProductPreviewView } from "../types/review-product-preview.types.js";

@Injectable()
export class ReviewProductPreviewService {
  constructor(private readonly repo: ReviewProductPreviewRepository) {}

  /** retrieveEntity(id) */
  async retrieveEntity(id: bigint): Promise<ReviewProductPreviewView | null> {
    const row = await this.repo.findById(id);
    return row ? toView(row) : null;
  }

  /** retrieveEntities(ids) — bulk lookup for review-display widgets rendering multiple products at once. */
  async retrieveEntities(ids: bigint[]): Promise<ReviewProductPreviewView[]> {
    const rows = await this.repo.findByIds(ids);
    return rows.map(toView);
  }
}
