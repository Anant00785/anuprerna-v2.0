import { Module } from "@nestjs/common";
import { ProductCoreModule } from "./product/product.module.js";
import { FabricProductModule } from "./fabric-product/fabric-product.module.js";
import { FinishedProductModule } from "./finished-product/finished-product.module.js";
import { CategoryModule } from "./category/category.module.js";
import { SegmentModule } from "./segment/segment.module.js";
import { SubCategoryModule } from "./sub-category/subcategory.module.js";

@Module({
  imports: [
    ProductCoreModule,
    FabricProductModule,
    FinishedProductModule,
    CategoryModule,
    SegmentModule,
    SubCategoryModule,
  ],
  exports: [
    ProductCoreModule,
    FabricProductModule,
    FinishedProductModule,
    CategoryModule,
    SegmentModule,
    SubCategoryModule,
  ],
})
export class ProductModule {}
