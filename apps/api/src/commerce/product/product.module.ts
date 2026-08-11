// @ts-nocheck
/**
 * apps/api/src/commerce/product/product.module.ts
 *
 * Top-level Product module that imports all product domain feature modules.
 */
import { Module } from "@nestjs/common";
import { ProductCoreModule } from "./product/product.module.js";
import { FabricProductModule } from "./fabric-product/fabric-product.module.js";
import { FinishedProductModule } from "./finished-product/finished-product.module.js";
import { CategoryModule } from "./category/category.module.js";
import { SegmentModule } from "./segment/segment.module.js";

@Module({
  imports: [
    ProductCoreModule,
    FabricProductModule,
    FinishedProductModule,
    CategoryModule,
    SegmentModule,
  ],
  exports: [
    ProductCoreModule,
    FabricProductModule,
    FinishedProductModule,
    CategoryModule,
    SegmentModule,
  ],
})
export class ProductModule {}
