/**
 * apps/api/src/commerce/product/finished-preview/service/finished-preview.service.ts
 *
 * Thin service layer over FinishedPreviewRepository — mirrors
 * FinishedPreviewDAOController / FinishedPreviewController in source.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import { FinishedPreviewRepository } from "../repository/finished-preview.repository.js";
import { toView } from "../mapper/finished-preview.mapper.js";
import {
  FinishedPreviewView,
  PRODUCT_PREVIEW_LOOKUP_PORT,
  ProductPreviewLookupPort,
} from "../types/finished-preview.types.js";

@Injectable()
export class FinishedPreviewService {
  constructor(
    private readonly repo: FinishedPreviewRepository,
    @Optional() @Inject(PRODUCT_PREVIEW_LOOKUP_PORT) private readonly productPreviewLookup?: ProductPreviewLookupPort,
  ) {}

  /** retrieveEntity(id) */
  async retrieveEntity(id: bigint): Promise<FinishedPreviewView | null> {
    const row = await this.repo.findById(id);
    return row ? this.enrich(toView(row)) : null;
  }

  /** findAllByProductDisabledFalse() */
  async listActive(): Promise<FinishedPreviewView[]> {
    const rows = await this.repo.findAllActive();
    return Promise.all(rows.map((row) => this.enrich(toView(row))));
  }

  /** NOT source-verified — see repository note on findByProductId. */
  async findByProductId(productId: number): Promise<FinishedPreviewView | null> {
    const row = await this.repo.findByProductId(productId);
    return row ? this.enrich(toView(row)) : null;
  }

  private async enrich(view: FinishedPreviewView): Promise<FinishedPreviewView> {
    if (!this.productPreviewLookup) return view;
    const productPreview = await this.productPreviewLookup.retrieveByProductId(view.productId);
    return { ...view, product: productPreview };
  }
}
// @ts-nocheck
