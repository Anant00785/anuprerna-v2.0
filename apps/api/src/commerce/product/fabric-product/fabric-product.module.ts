/**
 * apps/api/src/commerce/product/fabric-product/fabric-product.module.ts
 *
 * Wires the FabricProduct feature together. No controller is registered
 * here yet — per the brief, FabricProductController's HTTP surface waits
 * on RequestMapper.java, which wasn't provided.
 *
 * REUSE: imports `ProductCoreModule` (../../../product/core/Product.module.js)
 * rather than redeclaring `ProductService`/`ProductRepository` as local
 * providers — Product Core already exports both, and Nest module imports
 * are exactly how the rest of this codebase shares a feature across
 * modules (identical to how auth.module.ts exports `RolesGuard` for other
 * feature modules to depend on).
 *
 * Cross-module ports are bound to REAL providers, not `async () => null`
 * dummies: Color/Material/Pattern/Tag resolve against their own tables
 * (see commerce/shared/db-lookup.ts), MainProductPreview /
 * SizeProfile(Profile) / SubCategory+Segment / ProductZohoRelation each
 * bind to the module that owns them, and FabricProfile enrichment is the
 * two-column read source performs inline.
 *
 * ZOHO_ADAPTER_PORT is the one exception: no Loom->Zoho item mapping
 * exists in this repository (ZohoService.syncItem needs a ZohoItemPayload
 * nothing builds, and triggerFabricProductWorkflow only logs), so it is
 * bound to a provider that THROWS NotImplementedException naming the port.
 * A silent no-op there would drop every product from the Zoho catalogue
 * with a 200 response. Tracked in docs/KNOWN-GAPS.md.
 *
 * DatabaseModule is @Global(), so FabricProductRepository injects
 * DATABASE_CONNECTION directly without this module re-importing it.
 */
import { Module, NotImplementedException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { AuthModule } from "../../../auth/auth.module.js";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { lookupById } from "../../shared/db-lookup.js";
import { ProfileModule } from "../../profile/profile.module.js";
import { ProfileService } from "../../profile/service/profile.service.js";
import { FabricProductController } from "../controller/fabric-product.controller.js";
import { ProductCoreModule } from "../product/product.module.js";
import { ProductPreviewModule } from "../product-preview/Product-preview.module.js";
import { MainProductPreviewService } from "../product-preview/service/main-product-preview.service.js";
import { ProductZohoRelationModule } from "../product-zoho-relation/product-zoho-relation.module.js";
import { ProductZohoRelationService } from "../product-zoho-relation/service/product-zoho-relation.service.js";
import { SegmentModule } from "../segment/segment.module.js";
import { SegmentService } from "../segment/service/segment.service.js";
import { SubCategoryModule } from "../sub-category/subcategory.module.js";
import { SubCategoryService } from "../sub-category/service/subCategory.service.js";
import { FabricProductService } from "./service/fabric-product.service.js";
import { FabricProductRepository } from "./repository/fabric-product.repository.js";
import {
  COLOR_PORT,
  FABRIC_PRODUCT_ZOHO_RELATION_PORT,
  FABRIC_PROFILE_ENRICH_PORT,
  FabricProductZohoRelationPort,
  FabricProfileEnrichPort,
  MAIN_PRODUCT_PREVIEW_PORT,
  MATERIAL_PORT,
  MainProductPreviewPort,
  PATTERN_PORT,
  SIZE_PROFILE_PREPARE_PORT,
  SUB_CATEGORY_HIERARCHY_PORT,
  SizeProfilePreparePort,
  SubCategoryHierarchyPort,
  TAG_PORT,
  ZOHO_ADAPTER_PORT,
  ZohoAdapterPort,
} from "./types/fabric-product.types.js";

/** `retrieveEntity(id)` port over one table — a real select-by-id, not a stub. */
const tableLookup = (token: symbol, table: unknown) => ({
  provide: token,
  useFactory: (db: Database) => ({ retrieveEntity: lookupById(db, table as never) }),
  inject: [DATABASE_CONNECTION],
});

/**
 * Every Zoho push is unimplemented — see the class doc and
 * docs/KNOWN-GAPS.md. Throwing beats a no-op: source treats a failed push
 * as an error, and a silent success would leave Zoho permanently stale.
 */
const zohoNotImplemented = (operation: string) => async (): Promise<never> => {
  throw new NotImplementedException(
    `ZOHO_ADAPTER_PORT.${operation} is not implemented — no Loom-product-to-Zoho-item mapping exists ` +
      `in apps/api (see docs/KNOWN-GAPS.md, "Zoho product sync").`,
  );
};

@Module({
  imports: [
    AuthModule,
    ProductCoreModule,
    ProductPreviewModule,
    ProductZohoRelationModule,
    ProfileModule,
    SegmentModule,
    SubCategoryModule,
  ],
  controllers: [FabricProductController],
  providers: [
    FabricProductService,
    FabricProductRepository,

    tableLookup(COLOR_PORT, schema.color),
    tableLookup(MATERIAL_PORT, schema.material),
    tableLookup(PATTERN_PORT, schema.pattern),
    tableLookup(TAG_PORT, schema.tag),

    {
      provide: MAIN_PRODUCT_PREVIEW_PORT,
      useFactory: (previews: MainProductPreviewService): MainProductPreviewPort => ({
        prepareRelatedProductList: (productId) => previews.prepareRelatedProductList(productId),
      }),
      inject: [MainProductPreviewService],
    },
    {
      provide: SIZE_PROFILE_PREPARE_PORT,
      useFactory: (profile: ProfileService): SizeProfilePreparePort => ({
        prepareSizeProfile: (sizeProfileId) => profile.getSizeProfile(sizeProfileId),
      }),
      inject: [ProfileService],
    },
    {
      /**
       * Source loads `fabricProfile.fabricProfileItemList` and sets each
       * item's `fabricPreview.totalQuantity = quantity + externalQuantity`
       * in place. Same two columns, joined here.
       */
      provide: FABRIC_PROFILE_ENRICH_PORT,
      useFactory: (db: Database): FabricProfileEnrichPort => ({
        retrieveEnrichedItems: async (fabricProfileId) => {
          const rows = await db
            .select({ item: schema.fabricProfileItem, product: schema.product })
            .from(schema.fabricProfileItem)
            .innerJoin(schema.product, eq(schema.fabricProfileItem.productId, schema.product.id))
            .where(eq(schema.fabricProfileItem.profileId, fabricProfileId));

          return rows.map(({ item, product }) => ({
            ...item,
            fabricPreview: {
              ...product,
              totalQuantity: Number(product.quantity ?? 0) + Number(product.externalQuantity ?? 0),
            },
          }));
        },
      }),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: SUB_CATEGORY_HIERARCHY_PORT,
      useFactory: (
        subCategories: SubCategoryService,
        segments: SegmentService,
        db: Database,
      ): SubCategoryHierarchyPort => ({
        retrieveHierarchy: async (subCategoryId) => {
          const subCategory = await subCategories.retrieveSubCategory(BigInt(subCategoryId));
          if (!subCategory) return null;
          const segment = await segments.retrieveSegmentById(subCategory.segmentId);
          if (!segment) return { subCategory, segment: null, category: null };
          const category = await lookupById(db, schema.category)(segment.categoryId);
          return { subCategory, segment, category };
        },
      }),
      inject: [SubCategoryService, SegmentService, DATABASE_CONNECTION],
    },
    {
      provide: FABRIC_PRODUCT_ZOHO_RELATION_PORT,
      useFactory: (relations: ProductZohoRelationService): FabricProductZohoRelationPort => ({
        findAllByProductId: (productId) => relations.findAllByProductId(productId),
        setDisabled: (relationId, disabled) => relations.setDisabled(relationId, disabled),
      }),
      inject: [ProductZohoRelationService],
    },
    {
      provide: ZOHO_ADAPTER_PORT,
      useValue: {
        addFabricProductToZoho: zohoNotImplemented("addFabricProductToZoho"),
        updateFabricProductToZoho: zohoNotImplemented("updateFabricProductToZoho"),
        reTriggerFabricProductToZohoWorkflow: zohoNotImplemented("reTriggerFabricProductToZohoWorkflow"),
      } satisfies ZohoAdapterPort,
    },
  ],
  exports: [FabricProductService, FabricProductRepository],
})
export class FabricProductModule {}
