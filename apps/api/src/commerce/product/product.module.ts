import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CategoryModule } from "./category/category.module.js";
import { FabricProductModule } from "./fabric-product/fabric-product.module.js";
import { FinishedProductModule } from "./finished-product/finished-product.module.js";
import { SegmentModule } from "./segment/segment.module.js";
import { SubCategoryModule } from "./sub-category/subcategory.module.js";
import { TagModule } from "./tag/tag.module.js";
import { SkuGroupModule } from "./sku-group/sku-group.module.js";
import { SpecialStatusModule } from "./special-status/special-status.module.js";
import { ProductZohoRelationModule } from "./product-zoho-relation/product-zoho-relation.module.js";
import { ProductSizeProfileModule } from "./product-size-profile/product-size-profile.module.js";
import { ProductCoreModule } from "./product/product.module.js";
import { SkuGroupController } from "./controller/sku-group.controller.js";
import { SpecialStatusController } from "./controller/special-status.controller.js";

@Module({
  // SkuGroupController / SpecialStatusController serve the add/update/delete and
  // table-explorer routes that loom's RequestMapper declares (ADD_SKU_GROUP,
  // UPDATE_SKU_GROUP, DELETE_SKU_GROUP, GET_TABLE_EXPLORER_DATA_SKU_GROUP, and the
  // special-status equivalents) and that the CMS calls. Only the two list routes
  // live elsewhere, on ProductMigratedDomainController.
  controllers: [SkuGroupController, SpecialStatusController],
  imports: [AuthModule,
    CategoryModule,
    FabricProductModule,
    FinishedProductModule,
    SegmentModule,
    SubCategoryModule,
    TagModule,
    SkuGroupModule,
    SpecialStatusModule,
    ProductZohoRelationModule,
    ProductSizeProfileModule,
    ProductCoreModule,
  ],
  exports: [
    CategoryModule,
    FabricProductModule,
    FinishedProductModule,
    SegmentModule,
    SubCategoryModule,
    TagModule,
    SkuGroupModule,
    SpecialStatusModule,
    ProductZohoRelationModule,
    ProductSizeProfileModule,
    ProductCoreModule,
  ],
})
export class ProductModule {}
