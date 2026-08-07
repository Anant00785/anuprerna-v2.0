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
 * Ten ports are bound to safe dummy implementations rather than left
 * unbound or throwing, same pattern as cart.module.ts / auth.module.ts /
 * product/core/Product.module.ts:
 *  - ColorPort / MaterialPort / PatternPort / TagPort — Color, Material,
 *    Pattern aren't migrated yet; Tag IS marked complete in
 *    MIGRATION_CHECKPOINT.md but its TS output wasn't included in this
 *    task's uploads (see fabric-product.types.ts header) — swap in real
 *    providers as each becomes available.
 *  - MainProductPreviewPort / SizeProfilePreparePort / FabricProfileEnrichPort /
 *    SubCategoryHierarchyPort / FabricProductZohoRelationPort — out of
 *    scope per MIGRATION_CHECKPOINT.md's remaining-domains list
 *    (ProductPreview, Profile domains, SubCategory's hierarchy isn't
 *    exposed anywhere importable yet either, ProductZohoRelation).
 *  - ZohoAdapterPort — external Zoho CRM integration, not present in this
 *    repository at all (same treatment as Auth0ValidationPort).
 *
 * Every dummy returns the "nothing found" / no-op value its own interface
 * contract allows, instead of fabricating another module's behavior.
 *
 * DatabaseModule is @Global(), so FabricProductRepository injects
 * DATABASE_CONNECTION directly without this module re-importing it.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { FabricProductController } from "../controller/fabric-product.controller.js";
import { ProductCoreModule } from "../product/product.module.js";
import { FabricProductService } from "./service/fabric-product.service.js";
import { FabricProductRepository } from "./repository/fabric-product.repository.js";
import {
  COLOR_PORT,
  ColorPort,
  FABRIC_PRODUCT_ZOHO_RELATION_PORT,
  FABRIC_PROFILE_ENRICH_PORT,
  FabricProductZohoRelationPort,
  FabricProfileEnrichPort,
  MAIN_PRODUCT_PREVIEW_PORT,
  MATERIAL_PORT,
  MainProductPreviewPort,
  MaterialPort,
  PATTERN_PORT,
  PatternPort,
  SIZE_PROFILE_PREPARE_PORT,
  SUB_CATEGORY_HIERARCHY_PORT,
  SizeProfilePreparePort,
  SubCategoryHierarchyPort,
  TAG_PORT,
  TagPort,
  ZOHO_ADAPTER_PORT,
  ZohoAdapterPort,
} from "./types/fabric-product.types.js";

const colorDummy: ColorPort = {
  retrieveEntity: async () => null,
};

const materialDummy: MaterialPort = {
  retrieveEntity: async () => null,
};

const patternDummy: PatternPort = {
  retrieveEntity: async () => null,
};

const tagDummy: TagPort = {
  retrieveEntity: async () => null,
};

const mainProductPreviewDummy: MainProductPreviewPort = {
  prepareRelatedProductList: async () => [],
};

const sizeProfilePrepareDummy: SizeProfilePreparePort = {
  prepareSizeProfile: async () => null,
};

const fabricProfileEnrichDummy: FabricProfileEnrichPort = {
  retrieveEnrichedItems: async () => [],
};

const subCategoryHierarchyDummy: SubCategoryHierarchyPort = {
  retrieveHierarchy: async () => null,
};

const fabricProductZohoRelationDummy: FabricProductZohoRelationPort = {
  findAllByProductId: async () => [],
  setDisabled: async () => undefined,
};

const zohoAdapterDummy: ZohoAdapterPort = {
  addFabricProductToZoho: async () => undefined,
  updateFabricProductToZoho: async () => undefined,
  reTriggerFabricProductToZohoWorkflow: async () => undefined,
};

@Module({
  imports: [AuthModule, ProductCoreModule],
  controllers: [FabricProductController],
  providers: [
    FabricProductService,
    FabricProductRepository,
    { provide: COLOR_PORT, useValue: colorDummy },
    { provide: MATERIAL_PORT, useValue: materialDummy },
    { provide: PATTERN_PORT, useValue: patternDummy },
    { provide: TAG_PORT, useValue: tagDummy },
    { provide: MAIN_PRODUCT_PREVIEW_PORT, useValue: mainProductPreviewDummy },
    { provide: SIZE_PROFILE_PREPARE_PORT, useValue: sizeProfilePrepareDummy },
    { provide: FABRIC_PROFILE_ENRICH_PORT, useValue: fabricProfileEnrichDummy },
    { provide: SUB_CATEGORY_HIERARCHY_PORT, useValue: subCategoryHierarchyDummy },
    { provide: FABRIC_PRODUCT_ZOHO_RELATION_PORT, useValue: fabricProductZohoRelationDummy },
    { provide: ZOHO_ADAPTER_PORT, useValue: zohoAdapterDummy },
  ],
  exports: [FabricProductService, FabricProductRepository],
})
export class FabricProductModule {}
