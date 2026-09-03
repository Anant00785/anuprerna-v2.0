/**
 * apps/api/src/commerce/product/main-product-preview/service/main-product-preview.service.ts
 *
 * Thin service layer over MainProductPreviewRepository — mirrors
 * MainProductPreviewDAOController in source, plus the variant-family
 * navigation helpers documented on the entity itself (find variants /
 * find main product / find all in family).
 */
import { Injectable } from "@nestjs/common";
import { MainProductPreviewRepository } from "../repository/main-product-preview.repository.js";
import { toView } from "../mapper/main-product-preview.mapper.js";
import { MainProductPreviewView } from "../types/main-product-preview.types.js";

@Injectable()
export class MainProductPreviewService {
  constructor(private readonly repo: MainProductPreviewRepository) {}

  /** retrieveEntity(id) */
  async retrieveEntity(id: bigint): Promise<MainProductPreviewView | null> {
    const row = await this.repo.findById(id);
    return row ? toView(row) : null;
  }

  /** findAllByMainProductId(Long id) — all variants, including disabled. */
  async listVariants(mainProductId: number): Promise<MainProductPreviewView[]> {
    const rows = await this.repo.findAllByMainProductId(mainProductId);
    return rows.map(toView);
  }

  /** findAllByMainProductIdAndDisabledFalse(Long mainProductId) — active variants only. */
  async listActiveVariants(mainProductId: number): Promise<MainProductPreviewView[]> {
    const rows = await this.repo.findAllActiveByMainProductId(mainProductId);
    return rows.map(toView);
  }

  /**
   * MainProductPreviewDAOController#prepareRelatedProductList(product) —
   * source mutates `product.relatedProductList` in place; ported as a
   * lookup returning that list, head-first:
   *  - a main product => itself, then its active variants
   *  - a variant      => its main product, then that main's active variants
   *  - a variant with no main product => empty, as in source
   */
  async prepareRelatedProductList(productId: number): Promise<MainProductPreviewView[]> {
    const self = await this.retrieveEntity(BigInt(productId));
    if (!self) return [];

    if (self.mainProductCheck) return [self, ...(await this.listActiveVariants(self.id))];

    if (!self.mainProductId) return [];
    const main = await this.retrieveEntity(BigInt(self.mainProductId));
    if (!main) return [];
    return [main, ...(await this.listActiveVariants(main.id))];
  }
}
