/**
 * apps/api/src/commerce/product/nav-product-preview/service/nav-product-preview.service.ts
 *
 * Thin service layer over NavProductPreviewRepository — mirrors
 * NavProductPreviewDAOController in source. Enriches materials/colors/
 * patterns on-demand via lookup Ports, matching the @Transient semantics
 * on the entity (category/segment stay null — see types file note).
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import { NavProductPreviewRepository } from "../repository/nav-product-preview.repository.js";
import { toView } from "../mapper/nav-product-preview.mapper.js";
import {
  COLOR_LOOKUP_PORT,
  ColorLookupPort,
  MATERIAL_LOOKUP_PORT,
  MaterialLookupPort,
  NavProductPreviewView,
  parseIdList,
  PATTERN_LOOKUP_PORT,
  PatternLookupPort,
} from "../types/nav-product-preview.types.js";

@Injectable()
export class NavProductPreviewService {
  constructor(
    private readonly repo: NavProductPreviewRepository,
    @Optional() @Inject(MATERIAL_LOOKUP_PORT) private readonly materialLookup?: MaterialLookupPort,
    @Optional() @Inject(COLOR_LOOKUP_PORT) private readonly colorLookup?: ColorLookupPort,
    @Optional() @Inject(PATTERN_LOOKUP_PORT) private readonly patternLookup?: PatternLookupPort,
  ) {}

  /** retrieveEntity(id) */
  async retrieveEntity(id: bigint): Promise<NavProductPreviewView | null> {
    const row = await this.repo.findById(id);
    return row ? this.enrich(toView(row)) : null;
  }

  /** findProductPreviewByProductGroupAndDisabledFalse(String group) */
  async listByProductGroup(group: string): Promise<NavProductPreviewView[]> {
    const rows = await this.repo.findByProductGroupActive(group);
    return Promise.all(rows.map((row) => this.enrich(toView(row))));
  }

  private async enrich(view: NavProductPreviewView): Promise<NavProductPreviewView> {
    const [materials, colors, patterns] = await Promise.all([
      this.materialLookup ? this.materialLookup.retrieveByIds(parseIdList(view.materialId)) : Promise.resolve([]),
      this.colorLookup ? this.colorLookup.retrieveByIds(parseIdList(view.colorId)) : Promise.resolve([]),
      this.patternLookup ? this.patternLookup.retrieveByIds(parseIdList(view.patternId)) : Promise.resolve([]),
    ]);

    return { ...view, materials, colors, patterns };
  }
}
// @ts-nocheck
