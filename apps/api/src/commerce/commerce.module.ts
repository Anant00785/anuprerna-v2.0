/**
 * apps/api/src/commerce/commerce.module.ts
 *
 * Root commerce module importing all LOOM-compatible domain feature modules.
 *
 * Deliberately does NOT import `RestApiControllers` from `./rest-api.module.js`.
 * That file holds ~50 auto-generated placeholder CRUD controllers that write
 * to nonexistent `commerce_*` blob tables and would shadow the real routes
 * registered below (see the header comment in `rest-api.module.ts` and
 * docs/KNOWN-GAPS.md). Verified 2026-08-12: it was never wired in to begin
 * with. Leave it unimported.
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
