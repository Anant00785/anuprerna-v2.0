import { WishlistDomainController } from "./domain/wishlist.controller.js";
import { FabricProductMigratedDomainController } from "./domain/fabric-product-migrated.controller.js";
import { FinishedProductMigratedDomainController } from "./domain/finished-product-migrated.controller.js";
import { CategoryMigratedDomainController } from "./domain/category-migrated.controller.js";
import { ProductMigratedDomainController } from "./domain/product-migrated.controller.js";
import { OrderMigratedDomainController } from "./domain/order-migrated.controller.js";
import { CustomOrderMigratedDomainController } from "./domain/custom-order-migrated.controller.js";
import { SubCategoryMigratedDomainController } from "./domain/sub-category-migrated.controller.js";
import { CurrencyLocationDomainController } from "./domain/currency-location.controller.js";
import { FilterMigratedDomainController } from "./domain/filter-migrated.controller.js";
import { SegmentMigratedDomainController } from "./domain/segment-migrated.controller.js";
import { AuthMigratedDomainController } from "./domain/auth-migrated.controller.js";
import { PaymentMigratedDomainController } from "./domain/payment-migrated.controller.js";
import { SuperUserDomainController } from "./domain/super-user.controller.js";
import { CustomerDomainController } from "./domain/customer.controller.js";
import { LoyaltyMigratedDomainController } from "./domain/loyalty-migrated.controller.js";
import { NotificationsDomainController } from "./domain/notifications.controller.js";
import { MiscMigratedDomainController } from "./domain/misc-migrated.controller.js";
import { ProfilesDomainController } from "./domain/profiles.controller.js";
import { DiscountMigratedDomainController } from "./domain/discount-migrated.controller.js";
import { ArtisanMigratedDomainController } from "./domain/artisan-migrated.controller.js";
import { CatalogMigratedDomainController } from "./domain/catalog-migrated.controller.js";
import { WorkflowMigratedDomainController } from "./domain/workflow-migrated.controller.js";
import { TableExplorerDomainController } from "./domain/table-explorer.controller.js";
import { ContentAiMigratedDomainController } from "./domain/content-ai-migrated.controller.js";
import { ImageOptimizationDomainController } from "./domain/image-optimization.controller.js";
import { DiagnosticsDomainController } from "./domain/diagnostics.controller.js";
import { ReportsDomainController } from "./domain/reports.controller.js";


import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
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
import { AddressModule } from "./address/address.module.js";
import { OrderModule } from "./order/order.module.js";
import { PaymentModule } from "./payment/payment.module.js";
import { DiscountModule } from "./discount/discount.module.js";
import { InventoryModule } from "./inventory/inventory.module.js";
import { FeedbackModule } from "./feedback/feedback.module.js";
import { ReviewModule } from "./review/review.module.js";
import { LoyaltyprogramModule } from "./loyaltyprogram/loyaltyprogram.module.js";
import { ForexModule } from "./forex/forex.module.js";
import { IPLocationModule } from "./iplocation/iplocation.module.js";
import { ShipmentModule } from "./shipment/shipment.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { WhatsappModule } from "./whatsapp/whatsapp.module.js";
import { SeoModule } from "./seo/seo.module.js";
import { ImpactModule } from "./impact/impact.module.js";
import { AiModule } from "./ai/ai.module.js";

@Module({
  controllers: [
    WishlistDomainController,
    FabricProductMigratedDomainController,
    FinishedProductMigratedDomainController,
    CategoryMigratedDomainController,
    ProductMigratedDomainController,
    OrderMigratedDomainController,
    CustomOrderMigratedDomainController,
    SubCategoryMigratedDomainController,
    CurrencyLocationDomainController,
    FilterMigratedDomainController,
    SegmentMigratedDomainController,
    AuthMigratedDomainController,
    PaymentMigratedDomainController,
    SuperUserDomainController,
    CustomerDomainController,
    LoyaltyMigratedDomainController,
    NotificationsDomainController,
    MiscMigratedDomainController,
    ProfilesDomainController,
    DiscountMigratedDomainController,
    ArtisanMigratedDomainController,
    CatalogMigratedDomainController,
    WorkflowMigratedDomainController,
    TableExplorerDomainController,
    ContentAiMigratedDomainController,
    ImageOptimizationDomainController,
    DiagnosticsDomainController,
    ReportsDomainController,

                                                                                                                ],
  imports: [
    AuthModule, 
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
    AddressModule,
    OrderModule,
    PaymentModule,
    DiscountModule,
    InventoryModule,
    FeedbackModule,
    ReviewModule,
    LoyaltyprogramModule,
    ForexModule,
    IPLocationModule,
    ShipmentModule,
    SettingsModule,
    WhatsappModule,
    SeoModule,
    ImpactModule,
    AiModule,
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
    AddressModule,
    OrderModule,
    PaymentModule,
    DiscountModule,
    InventoryModule,
    FeedbackModule,
    ReviewModule,
    LoyaltyprogramModule,
    ForexModule,
    IPLocationModule,
    ShipmentModule,
    SettingsModule,
    WhatsappModule,
    SeoModule,
    ImpactModule,
    AiModule,
  ],
})
export class CommerceModule {}
