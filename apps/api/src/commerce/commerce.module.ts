import { Module } from "@nestjs/common";
import { CartModule } from "./cart/cart.module.js";
import { ProductModule } from "./product/product.module.js";
import { FabricProductModule } from "./product/fabric-product/fabric-product.module.js";
import { FinishedProductModule } from "./product/finished-product/finished-product.module.js";
import { CustomProductModule } from "./product/custom-product/custom-product.module.js";
import { ProductPreviewModule } from "./product/product-preview/Product-preview.module.js";
import { ProductSizeProfileModule } from "./product/product-size-profile/product-size-profile.module.js";
import { ProductZohoRelationModule } from "./product/product-zoho-relation/product-zoho-relation.module.js";
import { CatalogModule } from "./catalog/catalog.module.js";
import { ContentModule } from "./content/content.module.js";
import { FaqModule } from "./faq/faq.module.js";
import { FilterModule } from "./filter/filter.module.js";
import { NavigationModule } from "./navigation/navigation.module.js";
import { SearchModule } from "./search/search.module.js";
import { SeoModule } from "./seo/seo.module.js";

@Module({
  imports: [
    CartModule,
    ProductModule,
    FabricProductModule,
    FinishedProductModule,
    CustomProductModule,
    ProductPreviewModule,
    ProductSizeProfileModule,
    ProductZohoRelationModule,
    CatalogModule,
    ContentModule,
    FaqModule,
    FilterModule,
    NavigationModule,
    SearchModule,
    SeoModule,
  ],
})
export class CommerceModule {}
