/**
 * apps/api/src/commerce/product/fabric-preview/service/fabric-preview.service.ts
 *
 * Thin service layer over FabricPreviewRepository — mirrors
 * FabricPreviewDAOController / FabricPreviewController in source.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import { FabricPreviewRepository } from "../repository/fabric-preview.repository.js";
import { toView } from "../mapper/fabric-preview.mapper.js";
import {
  FabricPreviewView,
  PRODUCT_PREVIEW_LOOKUP_PORT,
  ProductPreviewLookupPort,
} from "../types/fabric-preview.types.js";

@Injectable()
export class FabricPreviewService {
  constructor(
    private readonly repo: FabricPreviewRepository,
    @Optional() @Inject(PRODUCT_PREVIEW_LOOKUP_PORT) private readonly productPreviewLookup?: ProductPreviewLookupPort,
  ) {}

  /** retrieveEntity(id) */
  async retrieveEntity(id: bigint): Promise<FabricPreviewView | null> {
    const row = await this.repo.findById(id);
    return row ? this.enrich(toView(row)) : null;
  }

  /** findAllByProductDisabledFalse() */
  async listActive(): Promise<FabricPreviewView[]> {
    const rows = await this.repo.findAllActive();
    return Promise.all(rows.map((row) => this.enrich(toView(row))));
  }

  /** findByIdInAndProductDisabledFalse(List<Long> ids) — @Deprecated in source, ported for parity. */
  async listByIdsActive(ids: bigint[]): Promise<FabricPreviewView[]> {
    const rows = await this.repo.findByIdsActive(ids);
    return Promise.all(rows.map((row) => this.enrich(toView(row))));
  }

  /** findFabricPreviewByProduct(ProductPreview product) */
  async findByProductId(productId: number): Promise<FabricPreviewView | null> {
    return (await this.findByProductIds([productId])).get(productId) ?? null;
  }

  /**
   * Same lookup for many products in one `WHERE product_id = ANY($1)`.
   * Product ids with no product_fabric row are simply absent from the map —
   * callers keep their own `?? null`. Enrichment still runs per found row
   * (concurrently), so a found row costs exactly what it did before.
   */
  async findByProductIds(productIds: number[]): Promise<Map<number, FabricPreviewView>> {
    const rows = await this.repo.findByProductIds(productIds);
    const views = await Promise.all(rows.map((row) => this.enrich(toView(row))));
    return new Map(views.map((view) => [view.productId, view]));
  }

  /** streamAll(Boolean includeDisabled) — see repository note on the streaming -> plain-query adaptation. */
  async listAllForBulkProcessing(includeDisabled: boolean): Promise<FabricPreviewView[]> {
    const rows = await this.repo.findAllForBulkProcessing(includeDisabled);
    return Promise.all(rows.map((row) => this.enrich(toView(row))));
  }

  private async enrich(view: FabricPreviewView): Promise<FabricPreviewView> {
    if (!this.productPreviewLookup) return view;
    const productPreview = await this.productPreviewLookup.retrieveByProductId(view.productId);
    return { ...view, product: productPreview };
  }
}
