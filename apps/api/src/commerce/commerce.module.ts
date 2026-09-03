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
import { AuthMigratedDomainController } from "./domain/auth-migrated.controller.js";
import { PaymentMigratedDomainController } from "./domain/payment-migrated.controller.js";
import { SuperUserDomainController } from "./domain/super-user.controller.js";
import { CustomerDomainController } from "./domain/customer.controller.js";
import { LoyaltyMigratedDomainController } from "./domain/loyalty-migrated.controller.js";
import { NotificationsDomainController } from "./domain/notifications.controller.js";
import { MiscMigratedDomainController } from "./domain/misc-migrated.controller.js";
import { ProfilesDomainController } from "./domain/profiles.controller.js";
import { DiscountMigratedDomainController } from "./domain/discount-migrated.controller.js";
import { AddressMigratedDomainController } from "./domain/address-migrated.controller.js";
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
import { CheckoutModule } from "./checkout/checkout.module.js";
import { DiscountModule } from "./discount/discount.module.js";
import { InventoryModule } from "./inventory/inventory.module.js";
import { ReviewModule } from "./review/review.module.js";
import { LoyaltyprogramModule } from "./loyaltyprogram/loyaltyprogram.module.js";
import { ForexModule } from "./forex/forex.module.js";
import { CustomProductModule } from "./custom-product/custom-product.module.js";
import { CustomWorkflowModule } from "./custom-workflow/custom-workflow.module.js";
import { IPLocationModule } from "./iplocation/iplocation.module.js";
import { ShipmentModule } from "./shipment/shipment.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { WhatsappModule } from "./whatsapp/whatsapp.module.js";
import { SeoModule } from "./seo/seo.module.js";
import { ImpactModule } from "./impact/impact.module.js";
import { CompatibilityModule } from "./compatibility/compatibility.module.js";
import { MiscModule } from "./misc/misc.module.js";
import { ProductPreviewModule } from "./product/product-preview/Product-preview.module.js";
// Modules that existed on disk but were never imported here, so none of their
// routes were registered and every one of them 404'd for the CMS. Each was
// checked route-by-route before wiring: every route they add sits behind a
// class-level RolesGuard with an explicit @RequireGate (CODE_SU / CODE_SUCU /
// CODE_AR), so they answer 401 anonymously rather than serving data.
//
// PREVIOUSLY EXCLUDED FOR SECURITY, now imported — the reasons were fixed, not
// waived. Keep reading before you touch either of them:
//
//   NverseModule (./nverse/nverse.module.js) — POST /nverse/{login,otp/send,
//     otp/resend,otp/verify,email/verify} still carry no @RequireGate, and that
//     is correct: they are the token-minting endpoints, the same shape as the
//     already-public POST /auth/authenticate. What made them dangerous was the
//     service behind them, and that is gone: plaintext password compare ->
//     GatekeeperService bcrypt(pepper+password); hardcoded OTP "1234" ->
//     MSG91 server-side verification (Msg91OtpService, port of
//     MSG91OTPService.java) which is itself hard-gated on OUTBOUND_SMS_ENABLED;
//     literal 'dummy-jwt-token' -> GatekeeperService#generateToken; and
//     unconditional email-verify success -> a real single-use token check.
//     Every anonymous failure path now returns one identical message
//     (NVerseService.GENERIC_FAILURE), so the enumeration oracle is closed.
//     OPEN RISK: no rate limiting — @nestjs/throttler is not a dependency. See
//     the TODO on NVerseController before enabling OUTBOUND_SMS_ENABLED.
//
//   ZohoModule (./zoho/zoho.module.js) — the four POST /zoho/webhook/* handlers
//     are now behind ZohoWebhookGuard, the NestJS equivalent of Loom's
//     @NVerseDomainValidated User-Agent + Zoho-Request-Ip allowlist
//     (ZohoStockSyncWebhookController.java:31-41). It fails closed and answers
//     403 to anything that doesn't match. The handlers themselves are still
//     log-only — no stock is synced yet — which is deliberate: this change made
//     them authenticated, it did not port ZohoItemStockSyncService.
import { NverseModule } from "./nverse/nverse.module.js";
import { ZohoModule } from "./zoho/zoho.module.js";
import { FaqModule } from "./faq/faq.module.js";
import { SkillModule } from "./skill/skill.module.js";
import { WorkflowModule } from "./workflow/workflow.module.js";
import { Table_explorerModule } from "./table_explorer/table_explorer.module.js";
import { ArtisanpaymentModule } from "./artisanpayment/artisanpayment.module.js";
import { NotificationModule } from "./notification/notification.module.js";
// Service layer extracted out of commerce/domain's inline-Drizzle controllers.
import { OrderDomainService } from "./domain/order-domain.service.js";
import { ProductDomainService } from "./domain/product-domain.service.js";
import { CustomerDomainService } from "./domain/customer-domain.service.js";

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
    AuthMigratedDomainController,
    PaymentMigratedDomainController,
    SuperUserDomainController,
    CustomerDomainController,
    LoyaltyMigratedDomainController,
    NotificationsDomainController,
    MiscMigratedDomainController,
    ProfilesDomainController,
    DiscountMigratedDomainController,
    AddressMigratedDomainController,
    ArtisanMigratedDomainController,
    CatalogMigratedDomainController,
    WorkflowMigratedDomainController,
    TableExplorerDomainController,
    ContentAiMigratedDomainController,
    ImageOptimizationDomainController,
    DiagnosticsDomainController,
    ReportsDomainController,

                                                                                                                ],
  providers: [OrderDomainService, ProductDomainService, CustomerDomainService],
  imports: [
    ProductPreviewModule,
    AuthModule, 
    SeoModule,
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
    CheckoutModule,
    DiscountModule,
    InventoryModule,
    ReviewModule,
    LoyaltyprogramModule,
    ForexModule,
    CustomProductModule,
    CustomWorkflowModule,
    IPLocationModule,
    ShipmentModule,
    SettingsModule,
    WhatsappModule,
    ImpactModule,
    CompatibilityModule,
    MiscModule,
    FaqModule,
    SkillModule,
    WorkflowModule,
    ArtisanpaymentModule,
    NotificationModule,
    NverseModule,
    ZohoModule,
    // Last on purpose: TableExplorerController's `get/table-explorer/data/:tableName`
    // is a wildcard that would otherwise shadow the per-entity table-explorer routes
    // on the domain/faq/tag/workflow/notification controllers. It is gated CODE_SU and
    // its service rejects anything outside table_explorer.allowlist.ts.
    Table_explorerModule,
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
    CheckoutModule,
    DiscountModule,
    InventoryModule,
    ReviewModule,
    LoyaltyprogramModule,
    ForexModule,
    CustomProductModule,
    CustomWorkflowModule,
    IPLocationModule,
    ShipmentModule,
    SettingsModule,
    WhatsappModule,
    SeoModule,
    ImpactModule,
    CompatibilityModule,
    MiscModule,
    FaqModule,
    SkillModule,
    WorkflowModule,
    ArtisanpaymentModule,
    NotificationModule,
    Table_explorerModule,
  ],
})
export class CommerceModule {}
