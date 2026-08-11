/**
 * apps/api/src/commerce/commerce.module.ts
 *
 * Root commerce module importing all LOOM-compatible domain feature modules.
 */
import { Module } from "@nestjs/common";
import { CartModule } from "./cart/cart.module.js";
import { ProductModule } from "./product/product.module.js";
import { CatalogModule } from "./catalog/catalog.module.js";
import { FilterModule } from "./filter/filter.module.js";
import { NavigationModule } from "./navigation/navigation.module.js";
import { SearchModule } from "./search/search.module.js";
import { ColorModule } from "./color/color.module.js";
import { MaterialModule } from "./material/material.module.js";
import { PatternModule } from "./pattern/pattern.module.js";
import { ContentModule } from "./content/content.module.js";
import { ImageModule } from "./image/image.module.js";
import { TenantModule } from "./tenant/tenant.module.js";

@Module({
  imports: [
    CartModule,
    ProductModule,
    CatalogModule,
    FilterModule,
    NavigationModule,
    SearchModule,
    ColorModule,
    MaterialModule,
    PatternModule,
    ContentModule,
    ImageModule,
    TenantModule,
  ],
  exports: [
    CartModule,
    ProductModule,
    CatalogModule,
    FilterModule,
    NavigationModule,
    SearchModule,
    ColorModule,
    MaterialModule,
    PatternModule,
    ContentModule,
    ImageModule,
    TenantModule,
  ],
})
export class CommerceModule {}
