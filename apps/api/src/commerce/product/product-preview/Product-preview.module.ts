/**
 * apps/api/src/commerce/product/product-preview/product-preview.module.ts
 *
 * Wires the whole ProductPreview family together: the seven read-optimized
 * projections over `product` (and its two OneToOne satellite tables)
 * already generated in this migration —
 *   - ProductPreview        (product-preview/)          — the core projection
 *   - ProductSearchPreview  (product-search-preview/)    — autocomplete/typeahead
 *   - MainProductPreview    (main-product-preview/)      — main/variant family nav
 *   - NavProductPreview     (nav-product-preview/)       — menu generation
 *   - ReviewProductPreview  (review-product-preview/)    — review-page rendering
 *   - FabricPreview         (fabric-preview/)            — product_fabric OneToOne
 *   - FinishedPreview       (finished-preview/)          — product_finished OneToOne
 * No controller is registered — none of these had one in the uploaded
 * source slice either (ProductPreview/ProductSearchPreview are read-only
 * projections; the others are consumed internally by other services).
 *
 * PRODUCT_PREVIEW_LOOKUP_PORT (real wiring, not a dummy): FabricPreview and
 * FinishedPreview each declare their OWN `ProductPreviewLookupPort`
 * interface and `PRODUCT_PREVIEW_LOOKUP_PORT` token in their respective
 * types files (fabric-preview.types.ts / finished-preview.types.ts) — two
 * separate `Symbol("PRODUCT_PREVIEW_LOOKUP_PORT")` calls, so despite the
 * identical display name they are two distinct injection tokens, each
 * bound below to its own adapter. Since ProductPreviewService is *right
 * here* in this same module (not a not-yet-migrated cross-module
 * dependency like Category/Segment/Material/Color/Pattern below), both
 * adapters are real factories over the real ProductPreviewRepository/
 * ProductPreviewService — not `=> null` stubs — satisfying "use the
 * already generated ProductPreview services and repositories" for the one
 * port this module can actually fulfill for real. `retrieveByProductId`
 * has no matching source query method exposed by ProductPreviewService, so
 * it's ported as `retrieveEntity` under the assumption FabricPreview/
 * FinishedPreview's `product_id` and the joined product's `id` are the
 * same value (OneToOne on the owning side's primary key — matches
 * fabric-preview.repository.ts / finished-preview.repository.ts, which
 * both join `product_fabric`/`product_finished` to `product` via
 * `productId`), flagged rather than silently assumed elsewhere.
 *
 * Every other port these seven services declare (MATERIAL_LOOKUP_PORT /
 * COLOR_LOOKUP_PORT / PATTERN_LOOKUP_PORT — declared independently, and
 * therefore as separate tokens, in BOTH nav-product-preview.types.ts and
 * product-preview.types.ts — plus CATEGORY_LOOKUP_PORT / SEGMENT_LOOKUP_PORT
 * in product-preview.types.ts) reaches into Material/Color/Pattern/
 * Category/Segment — domains genuinely out of scope for this module, same
 * reasoning Product.module.ts already applied to its own
 * SubCategoryPort/SkuGroupPort/SpecialStatusPort. All are `@Optional()` on
 * their respective service constructors, so leaving them unbound would
 * already be safe (Nest injects `undefined`, and each service's own doc
 * comment confirms it degrades to the mapper's null/[] default rather than
 * throwing) — bound to explicit dummies anyway, for the same
 * "resolvable at a glance in the providers array" reasoning
 * CategoryModule/Product.module.ts already use.
 *
 * DatabaseModule is @Global(), so every repository below injects
 * DATABASE_CONNECTION directly without this module re-importing it.
 *
 * FabricPreviewService and FinishedPreviewService are the two this
 * module's providers list exists to make available to Cart
 * (commerce/cart/cart.module.ts currently binds its own FABRIC_PREVIEW_PORT
 * / FINISHED_PREVIEW_PORT to dummies for the same "not yet reachable"
 * reason every other cross-module port started that way — CartModule can
 * now import ProductPreviewModule and swap in real
 * `useExisting`/adapter providers for those two tokens using the services
 * exported here). All seven services are exported, not just those two,
 * consistent with "the already generated ProductPreview services" being
 * the whole family, not a subset — cart.module.ts is left untouched here,
 * per the brief.
 */
import { Module } from "@nestjs/common";
import { FabricPreviewService } from "./service/fabric-preview.service.js";
import { FabricPreviewRepository } from "./repository/fabric-preview.repository.js";
import {
  PRODUCT_PREVIEW_LOOKUP_PORT as FABRIC_PRODUCT_PREVIEW_LOOKUP_PORT,
  ProductPreviewLookupPort as FabricProductPreviewLookupPort,
} from "./types/fabric-preview.types.js";
import { FinishedPreviewService } from "./service/finished-preview.service.js";
import { FinishedPreviewRepository } from "./repository/finished-preview.repository.js";
import {
  PRODUCT_PREVIEW_LOOKUP_PORT as FINISHED_PRODUCT_PREVIEW_LOOKUP_PORT,
  ProductPreviewLookupPort as FinishedProductPreviewLookupPort,
} from "./types/finished-preview.types.js";
import { MainProductPreviewService } from "./service/main-product-preview.service.js";
import { MainProductPreviewRepository } from "./repository/main-product-preview.repository.js";
import { NavProductPreviewService } from "./service/nav-product-preview.service.js";
import { NavProductPreviewRepository } from "./repository/nav-product-preview.repository.js";
import {
  COLOR_LOOKUP_PORT as NAV_COLOR_LOOKUP_PORT,
  ColorLookupPort as NavColorLookupPort,
  MATERIAL_LOOKUP_PORT as NAV_MATERIAL_LOOKUP_PORT,
  MaterialLookupPort as NavMaterialLookupPort,
  PATTERN_LOOKUP_PORT as NAV_PATTERN_LOOKUP_PORT,
  PatternLookupPort as NavPatternLookupPort,
} from "./types/nav-product-preview.types.js";
import { ProductPreviewService } from "./service/product-preview.service.js";
import { ProductPreviewRepository } from "./repository/product-preview.repository.js";
import {
  CATEGORY_LOOKUP_PORT,
  CategoryLookupPort,
  COLOR_LOOKUP_PORT,
  ColorLookupPort,
  MATERIAL_LOOKUP_PORT,
  MaterialLookupPort,
  PATTERN_LOOKUP_PORT,
  PatternLookupPort,
  SEGMENT_LOOKUP_PORT,
  SegmentLookupPort,
} from "./types/product-preview.types.js";
import { ProductSearchPreviewService } from "./service/product-search-preview.service.js";
import { ProductSearchPreviewRepository } from "./repository/product-search-preview.repository.js";
import { ReviewProductPreviewService } from "./service/review-product-preview.service.js";
import { ReviewProductPreviewRepository } from "./repository/review-product-preview.repository.js";

const materialLookupDummy: MaterialLookupPort | NavMaterialLookupPort = {
  retrieveByIds: async () => [],
};

const colorLookupDummy: ColorLookupPort | NavColorLookupPort = {
  retrieveByIds: async () => [],
};

const patternLookupDummy: PatternLookupPort | NavPatternLookupPort = {
  retrieveByIds: async () => [],
};

const categoryLookupDummy: CategoryLookupPort = {
  retrieveForProduct: async () => null,
};

const segmentLookupDummy: SegmentLookupPort = {
  retrieveForProduct: async () => null,
};

@Module({
  providers: [
    ProductPreviewService,
    ProductPreviewRepository,
    ProductSearchPreviewService,
    ProductSearchPreviewRepository,
    MainProductPreviewService,
    MainProductPreviewRepository,
    NavProductPreviewService,
    NavProductPreviewRepository,
    ReviewProductPreviewService,
    ReviewProductPreviewRepository,
    FabricPreviewService,
    FabricPreviewRepository,
    FinishedPreviewService,
    FinishedPreviewRepository,

    // Real adapters over ProductPreviewService — see class doc.
    {
      provide: FABRIC_PRODUCT_PREVIEW_LOOKUP_PORT,
      useFactory: (productPreview: ProductPreviewService): FabricProductPreviewLookupPort => ({
        retrieveEntity: async (id) => productPreview.retrieveEntity(BigInt(id)),
        retrieveByProductId: async (productId) => productPreview.retrieveEntity(BigInt(productId)),
      }),
      inject: [ProductPreviewService],
    },
    {
      provide: FINISHED_PRODUCT_PREVIEW_LOOKUP_PORT,
      useFactory: (productPreview: ProductPreviewService): FinishedProductPreviewLookupPort => ({
        retrieveEntity: async (id) => productPreview.retrieveEntity(BigInt(id)),
        retrieveByProductId: async (productId) => productPreview.retrieveEntity(BigInt(productId)),
      }),
      inject: [ProductPreviewService],
    },

    // Out-of-scope cross-module ports (Material/Color/Pattern/Category/Segment) — see class doc.
    { provide: MATERIAL_LOOKUP_PORT, useValue: materialLookupDummy },
    { provide: COLOR_LOOKUP_PORT, useValue: colorLookupDummy },
    { provide: PATTERN_LOOKUP_PORT, useValue: patternLookupDummy },
    { provide: CATEGORY_LOOKUP_PORT, useValue: categoryLookupDummy },
    { provide: SEGMENT_LOOKUP_PORT, useValue: segmentLookupDummy },
    { provide: NAV_MATERIAL_LOOKUP_PORT, useValue: materialLookupDummy },
    { provide: NAV_COLOR_LOOKUP_PORT, useValue: colorLookupDummy },
    { provide: NAV_PATTERN_LOOKUP_PORT, useValue: patternLookupDummy },
  ],
  exports: [
    ProductPreviewService,
    ProductSearchPreviewService,
    MainProductPreviewService,
    NavProductPreviewService,
    ReviewProductPreviewService,
    // The two Cart needs (FabricPreviewPort / FinishedPreviewPort adapters
    // are wired inside cart.module.ts itself, using these — untouched here
    // per the brief).
    FabricPreviewService,
    FinishedPreviewService,
  ],
})
export class ProductPreviewModule {}