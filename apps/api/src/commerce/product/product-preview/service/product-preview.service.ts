// @ts-nocheck
/**
 * apps/api/src/commerce/product/product-preview/service/product-preview.service.ts
 *
 * Thin service layer over ProductPreviewRepository — mirrors what
 * ProductPreviewDAOController / ProductPreviewController expose in source:
 * retrieval by id/sku/name, active-listing, and the filter/search
 * pass-throughs. Enrichment (category/segment/materials/colors/patterns)
 * is delegated to the lookup Ports declared in product-preview.types.ts;
 * when a port isn't wired (still un-migrated), the corresponding view
 * field is left at its mapper default (null / []) rather than throwing —
 * matching source's "populated on-demand" @Transient semantics, where
 * absence just means "not resolved this call".
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ProductPreviewRepository } from "../repository/product-preview.repository.js";
import { toView } from "../mapper/product-preview.mapper.js";
import {
  CATEGORY_LOOKUP_PORT,
  CategoryLookupPort,
  COLOR_LOOKUP_PORT,
  ColorLookupPort,
  MATERIAL_LOOKUP_PORT,
  MaterialLookupPort,
  parseIdList,
  PATTERN_LOOKUP_PORT,
  PatternLookupPort,
  ProductPreviewFilterArgs,
  ProductPreviewView,
  SEGMENT_LOOKUP_PORT,
  SegmentLookupPort,
} from "../types/product-preview.types.js";

@Injectable()
export class ProductPreviewService {
  constructor(
    private readonly repo: ProductPreviewRepository,
    @Optional() @Inject(MATERIAL_LOOKUP_PORT) private readonly materialLookup?: MaterialLookupPort,
    @Optional() @Inject(COLOR_LOOKUP_PORT) private readonly colorLookup?: ColorLookupPort,
    @Optional() @Inject(PATTERN_LOOKUP_PORT) private readonly patternLookup?: PatternLookupPort,
    @Optional() @Inject(CATEGORY_LOOKUP_PORT) private readonly categoryLookup?: CategoryLookupPort,
    @Optional() @Inject(SEGMENT_LOOKUP_PORT) private readonly segmentLookup?: SegmentLookupPort,
  ) {}

  /** retrieveEntity(id) */
  async retrieveEntity(id: bigint): Promise<ProductPreviewView | null> {
    const row = await this.repo.findById(id);
    return row ? this.enrich(toView(row)) : null;
  }

  /** findAllByDisabledFalse(Pageable pageable) */
  async listActive(limit: number, offset: number): Promise<ProductPreviewView[]> {
    const rows = await this.repo.findAllActive(limit, offset);
    return Promise.all(rows.map((row) => this.enrich(toView(row))));
  }

  /** findProductPreviewByNameIgnoreCase(String name) */
  async findByName(name: string): Promise<ProductPreviewView | null> {
    const row = await this.repo.findByNameIgnoreCase(name);
    return row ? this.enrich(toView(row)) : null;
  }

  /** findProductPreviewBySkuIgnoreCase(String sku) */
  async findBySku(sku: string): Promise<ProductPreviewView | null> {
    const row = await this.repo.findBySkuIgnoreCase(sku);
    return row ? this.enrich(toView(row)) : null;
  }

  /** findProductSearchResultBySkuIgnoreCase(String sku) */
  findSearchResultBySku(sku: string) {
    return this.repo.findSearchResultBySkuIgnoreCase(sku);
  }

  /** findProductPreviewsByColorId(long colorId) */
  findByColorId(colorId: number) {
    return this.repo.findByColorId(colorId);
  }

  /** findProductSearchResultsByColorId(long colorId) */
  findSearchResultsByColorId(colorId: number) {
    return this.repo.findSearchResultsByColorId(colorId);
  }

  /** findProductPreviewsByMaterialId(long materialId) */
  findByMaterialId(materialId: number) {
    return this.repo.findByMaterialId(materialId);
  }

  /** findProductSearchResultsByMaterialId(long materialId) */
  findSearchResultsByMaterialId(materialId: number) {
    return this.repo.findSearchResultsByMaterialId(materialId);
  }

  /** findProductSearchResultsByPatternId(long patternId) */
  findSearchResultsByPatternId(patternId: number) {
    return this.repo.findSearchResultsByPatternId(patternId);
  }

  /** findProductPreviewsBySubCategoryName(String name) */
  findBySubCategoryName(name: string) {
    return this.repo.findBySubCategoryName(name);
  }

  /** findProductSearchResultsBySubCategoryName(String name) */
  findSearchResultsBySubCategoryName(name: string) {
    return this.repo.findSearchResultsBySubCategoryName(name);
  }

  /** findProductPreviewBySegmentName(String name) */
  findBySegmentName(name: string) {
    return this.repo.findBySegmentName(name);
  }

  /** findProductSearchResultsBySegmentName(String name) */
  findSearchResultsBySegmentName(name: string) {
    return this.repo.findSearchResultsBySegmentName(name);
  }

  /** findProductPreviewsByCategoryName(String name) */
  findByCategoryName(name: string) {
    return this.repo.findByCategoryName(name);
  }

  /** findProductSearchResultsByCategoryName(String name) */
  findSearchResultsByCategoryName(name: string) {
    return this.repo.findSearchResultsByCategoryName(name);
  }

  /** findProductPreviewsByAllFilterIds(...) */
  findByAllFilterIds(args: ProductPreviewFilterArgs) {
    return this.repo.findByAllFilterIds(args);
  }

  /**
   * Enrichment pass — resolves the @Transient fields ProductPreview leaves
   * for on-demand population: category/segment (via product id) and the
   * materials/colors/patterns lists (via the comma-separated id columns,
   * parsed with parseIdList). No-ops per field when the corresponding port
   * isn't wired.
   */
  private async enrich(view: ProductPreviewView): Promise<ProductPreviewView> {
    const [category, segment, materials, colors, patterns] = await Promise.all([
      this.categoryLookup ? this.categoryLookup.retrieveForProduct(view.id) : Promise.resolve(null),
      this.segmentLookup ? this.segmentLookup.retrieveForProduct(view.id) : Promise.resolve(null),
      this.materialLookup ? this.materialLookup.retrieveByIds(parseIdList(view.materialId)) : Promise.resolve([]),
      this.colorLookup ? this.colorLookup.retrieveByIds(parseIdList(view.colorId)) : Promise.resolve([]),
      this.patternLookup ? this.patternLookup.retrieveByIds(parseIdList(view.patternId)) : Promise.resolve([]),
    ]);

    return { ...view, category, segment, materials, colors, patterns };
  }
}
