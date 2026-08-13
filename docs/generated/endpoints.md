# Endpoint inventory

> **Generated file — do not edit.** Produced by `scripts/gen-docs/index.mjs` from the code
> itself. Run `pnpm docs:gen` to refresh; CI runs `pnpm docs:check` and fails if this file is
> stale. What `apps/api` exposes, and what the frontends actually call.

**apps/api exposes 554 routes** across 117 controllers (DELETE 35, GET 324, PATCH 59, POST 136).

**The frontends call 131 distinct legacy paths**, against the live Java backend — not against `apps/api`. Those two populations are still almost entirely disjoint; closing that
gap is the migration. See `docs/KNOWN-GAPS.md`.

## apps/api routes

| Method | Path | Controller |
|---|---|---|
| GET | `/` | `apps/api/src/commerce/filter/controller/filter.controller.ts` |
| GET | `/` | `apps/api/src/commerce/filter/controller/filter.controller.ts` |
| GET | `/` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| GET | `/` | `apps/api/src/commerce/product/controller/finished-product.controller.ts` |
| POST | `/add/artisan/catalog` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| POST | `/add/artisan/catalog-item` | `apps/api/src/commerce/catalog/controller/catalog-item.controller.ts` |
| POST | `/add/artisan/catalog-pdf-generation` | `apps/api/src/commerce/catalog/controller/catalog-pdf.controller.ts` |
| POST | `/add/artisan/element/feedback` | `apps/api/src/commerce/workflow/controller/element-feedback.controller.ts` |
| POST | `/add/badge-profile` | `apps/api/src/commerce/profile/controller/badge-profile.controller.ts` |
| POST | `/add/blog-content` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| POST | `/add/blog-content-category/:blogContentTypeId` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| POST | `/add/blog-content-section` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| POST | `/add/blog-content-type` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| POST | `/add/cart-item` | `apps/api/src/commerce/cart/controller/cart.controller.ts` |
| POST | `/add/catalog` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| POST | `/add/catalog-item` | `apps/api/src/commerce/catalog/controller/catalog-item.controller.ts` |
| POST | `/add/catalog-item-media` | `apps/api/src/commerce/catalog/controller/catalog-item-media.controller.ts` |
| POST | `/add/catalog-pdf-generation/artisan/:artisanId` | `apps/api/src/commerce/catalog/controller/catalog-pdf.controller.ts` |
| POST | `/add/category` | `apps/api/src/commerce/product/controller/category.controller.ts` |
| POST | `/add/custom-order` | `apps/api/src/commerce/order/controller/custom-order.controller.ts` |
| POST | `/add/element/feedback` | `apps/api/src/commerce/workflow/controller/element-feedback.controller.ts` |
| POST | `/add/fabric-product` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| POST | `/add/faq` | `apps/api/src/commerce/faq/controller/faq.controller.ts` |
| POST | `/add/finished-product` | `apps/api/src/commerce/product/controller/finished-product.controller.ts` |
| POST | `/add/impact-factor` | `apps/api/src/commerce/impact/controller/impact.controller.ts` |
| POST | `/add/inventory-adjustment` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| POST | `/add/inventory-adjustment-reason` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| POST | `/add/inventory-restock-request` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| POST | `/add/made-to-order-profile` | `apps/api/src/commerce/profile/controller/made-to-order-profile.controller.ts` |
| POST | `/add/material` | `apps/api/src/commerce/material/controller/material.controller.ts` |
| POST | `/add/order` | `apps/api/src/commerce/order/controller/order.controller.ts` |
| POST | `/add/order/feedback` | `apps/api/src/commerce/order/controller/order-feedback.controller.ts` |
| POST | `/add/order/fulfillment` | `apps/api/src/commerce/order/controller/order-fulfillment.controller.ts` |
| POST | `/add/order/ready` | `apps/api/src/commerce/order/controller/order-fulfillment.controller.ts` |
| POST | `/add/pattern` | `apps/api/src/commerce/pattern/controller/pattern.controller.ts` |
| POST | `/add/product` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| POST | `/add/product-size-profile` | `apps/api/src/commerce/product/controller/product-size-profile.controller.ts` |
| POST | `/add/product-zoho-relation` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| POST | `/add/review` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| POST | `/add/segment` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| POST | `/add/shipment` | `apps/api/src/commerce/shipment/controller/shipment.controller.ts` |
| POST | `/add/size-profile` | `apps/api/src/commerce/profile/controller/size-profile.controller.ts` |
| POST | `/add/skill` | `apps/api/src/commerce/skill/controller/skill.controller.ts` |
| POST | `/add/sku-group` | `apps/api/src/commerce/product/controller/sku-group.controller.ts` |
| POST | `/add/special-status` | `apps/api/src/commerce/product/controller/special-status.controller.ts` |
| POST | `/add/story-content` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| POST | `/add/story-content-category` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| POST | `/add/story-content-section` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| POST | `/add/story-product/relation` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| POST | `/add/sub-category` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| POST | `/add/tag` | `apps/api/src/commerce/product/controller/tag.controller.ts` |
| POST | `/add/warehouse` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| POST | `/add/workflow` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| POST | `/add/workflow-template` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| POST | `/auth/authenticate` | `apps/api/src/auth/controller/auth.controller.ts` |
| POST | `/auth/authenticate/social` | `apps/api/src/auth/controller/auth.controller.ts` |
| GET | `/auth/authority` | `apps/api/src/auth/controller/auth.controller.ts` |
| POST | `/auth/register` | `apps/api/src/auth/controller/auth.controller.ts` |
| POST | `/auth/register/email` | `apps/api/src/auth/controller/auth.controller.ts` |
| POST | `/auth/register/social` | `apps/api/src/auth/controller/auth.controller.ts` |
| POST | `/auth/validate/provider` | `apps/api/src/auth/controller/auth.controller.ts` |
| PATCH | `/cancel/custom-order` | `apps/api/src/commerce/order/controller/custom-order.controller.ts` |
| GET | `/cart` | `apps/api/src/commerce/cart/cart-api.controller.ts` |
| GET | `/cart/:id` | `apps/api/src/commerce/cart/cart-api.controller.ts` |
| GET | `/catalog` | `apps/api/src/commerce/catalog/catalog.controller.ts` |
| GET | `/catalog-item` | `apps/api/src/commerce/catalog/controller/catalog-item-api.controller.ts` |
| GET | `/catalog-item/:id` | `apps/api/src/commerce/catalog/controller/catalog-item-api.controller.ts` |
| GET | `/catalog/:id` | `apps/api/src/commerce/catalog/catalog.controller.ts` |
| POST | `/checkout/stripe/webhook` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| POST | `/create/address` | `apps/api/src/commerce/address/address.controller.ts` |
| POST | `/create/ads_conversion` | `apps/api/src/commerce/ads_conversion/ads_conversion.controller.ts` |
| POST | `/create/ai` | `apps/api/src/commerce/ai/ai.controller.ts` |
| POST | `/create/alfred` | `apps/api/src/commerce/alfred/alfred.controller.ts` |
| POST | `/create/artisan` | `apps/api/src/commerce/artisan/artisan.controller.ts` |
| POST | `/create/artisanpayment` | `apps/api/src/commerce/artisanpayment/artisanpayment.controller.ts` |
| POST | `/create/behemoth` | `apps/api/src/commerce/behemoth/behemoth.controller.ts` |
| POST | `/create/bloomsight` | `apps/api/src/commerce/bloomsight/bloomsight.controller.ts` |
| POST | `/create/cart` | `apps/api/src/commerce/cart/cart.controller.ts` |
| POST | `/create/color` | `apps/api/src/commerce/color/color.controller.ts` |
| POST | `/create/compatibility` | `apps/api/src/commerce/compatibility/compatibility.controller.ts` |
| POST | `/create/configuration` | `apps/api/src/commerce/configuration/configuration.controller.ts` |
| POST | `/create/content` | `apps/api/src/commerce/content/content.controller.ts` |
| POST | `/create/diagnostics` | `apps/api/src/commerce/diagnostics/diagnostics.controller.ts` |
| POST | `/create/discount` | `apps/api/src/commerce/discount/discount.controller.ts` |
| POST | `/create/faq` | `apps/api/src/commerce/faq/faq.controller.ts` |
| POST | `/create/feedback` | `apps/api/src/commerce/feedback/feedback.controller.ts` |
| POST | `/create/filter` | `apps/api/src/commerce/filter/filter.controller.ts` |
| POST | `/create/forex` | `apps/api/src/commerce/forex/forex.controller.ts` |
| POST | `/create/image` | `apps/api/src/commerce/image/image.controller.ts` |
| POST | `/create/impact` | `apps/api/src/commerce/impact/impact.controller.ts` |
| POST | `/create/inventory` | `apps/api/src/commerce/inventory/inventory.controller.ts` |
| POST | `/create/iplocation` | `apps/api/src/commerce/iplocation/iplocation.controller.ts` |
| POST | `/create/loyaltyprogram` | `apps/api/src/commerce/loyaltyprogram/loyaltyprogram.controller.ts` |
| POST | `/create/material` | `apps/api/src/commerce/material/material.controller.ts` |
| POST | `/create/misc` | `apps/api/src/commerce/misc/misc.controller.ts` |
| POST | `/create/msg91` | `apps/api/src/commerce/msg91/msg91.controller.ts` |
| POST | `/create/navigation` | `apps/api/src/commerce/navigation/navigation.controller.ts` |
| POST | `/create/notification` | `apps/api/src/commerce/notification/notification.controller.ts` |
| POST | `/create/nverse` | `apps/api/src/commerce/nverse/nverse.controller.ts` |
| POST | `/create/order` | `apps/api/src/commerce/order/order.controller.ts` |
| POST | `/create/pattern` | `apps/api/src/commerce/pattern/pattern.controller.ts` |
| POST | `/create/payment` | `apps/api/src/commerce/payment/payment.controller.ts` |
| POST | `/create/payment-session` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| POST | `/create/product` | `apps/api/src/commerce/product/product.controller.ts` |
| POST | `/create/profile` | `apps/api/src/commerce/profile/profile.controller.ts` |
| POST | `/create/report` | `apps/api/src/commerce/report/report.controller.ts` |
| POST | `/create/restful` | `apps/api/src/commerce/restful/restful.controller.ts` |
| POST | `/create/review` | `apps/api/src/commerce/review/review.controller.ts` |
| POST | `/create/search` | `apps/api/src/commerce/search/search.controller.ts` |
| POST | `/create/seo` | `apps/api/src/commerce/seo/seo.controller.ts` |
| POST | `/create/settings` | `apps/api/src/commerce/settings/settings.controller.ts` |
| POST | `/create/shipment` | `apps/api/src/commerce/shipment/shipment.controller.ts` |
| POST | `/create/sitemap` | `apps/api/src/commerce/sitemap/sitemap.controller.ts` |
| POST | `/create/skill` | `apps/api/src/commerce/skill/skill.controller.ts` |
| POST | `/create/stripe/payment-session` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| POST | `/create/support` | `apps/api/src/commerce/support/support.controller.ts` |
| POST | `/create/table_explorer` | `apps/api/src/commerce/table_explorer/table_explorer.controller.ts` |
| POST | `/create/tenant` | `apps/api/src/commerce/tenant/tenant.controller.ts` |
| POST | `/create/transmission` | `apps/api/src/commerce/transmission/transmission.controller.ts` |
| POST | `/create/utility` | `apps/api/src/commerce/utility/utility.controller.ts` |
| POST | `/create/whatsapp` | `apps/api/src/commerce/whatsapp/whatsapp.controller.ts` |
| POST | `/create/workflow` | `apps/api/src/commerce/workflow/workflow.controller.ts` |
| POST | `/create/zoho` | `apps/api/src/commerce/zoho/zoho.controller.ts` |
| POST | `/create/zoho_adapter` | `apps/api/src/commerce/zoho_adapter/zoho_adapter.controller.ts` |
| POST | `/customer/whatsapp/dismiss` | `apps/api/src/commerce/whatsapp/controller/whatsapp.controller.ts` |
| POST | `/customer/whatsapp/opt-in` | `apps/api/src/commerce/whatsapp/controller/whatsapp.controller.ts` |
| POST | `/customer/whatsapp/opt-out` | `apps/api/src/commerce/whatsapp/controller/whatsapp.controller.ts` |
| DELETE | `/delete/all-cart-item` | `apps/api/src/commerce/cart/controller/cart.controller.ts` |
| DELETE | `/delete/artisan/catalog-item-media/:catalogItemMediaId` | `apps/api/src/commerce/catalog/controller/catalog-item.controller.ts` |
| DELETE | `/delete/artisan/catalog/:catalogId` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| DELETE | `/delete/badge-profile/:profileId` | `apps/api/src/commerce/profile/controller/badge-profile.controller.ts` |
| DELETE | `/delete/blog-content-section/:blogContentSectionId` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| DELETE | `/delete/blog-content/:blogContentId` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| DELETE | `/delete/cart-item/:cartItemId` | `apps/api/src/commerce/cart/controller/cart.controller.ts` |
| DELETE | `/delete/catalog-item-media/:catalogItemMediaId` | `apps/api/src/commerce/catalog/controller/catalog-item-media.controller.ts` |
| DELETE | `/delete/catalog-item/:catalogItemId` | `apps/api/src/commerce/catalog/controller/catalog-item.controller.ts` |
| DELETE | `/delete/catalog/:catalogId` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| DELETE | `/delete/category/:categoryId` | `apps/api/src/commerce/product/controller/category.controller.ts` |
| DELETE | `/delete/custom-order/:orderId` | `apps/api/src/commerce/order/controller/custom-order.controller.ts` |
| DELETE | `/delete/image` | `apps/api/src/commerce/image/controller/image.controller.ts` |
| DELETE | `/delete/impact-factor/:id` | `apps/api/src/commerce/impact/controller/impact.controller.ts` |
| DELETE | `/delete/inventory-restock-request/:requestId` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| DELETE | `/delete/made-to-order-profile/:profileId` | `apps/api/src/commerce/profile/controller/made-to-order-profile.controller.ts` |
| DELETE | `/delete/material/:id` | `apps/api/src/commerce/material/controller/material.controller.ts` |
| DELETE | `/delete/order/:orderId` | `apps/api/src/commerce/order/controller/order.controller.ts` |
| DELETE | `/delete/pattern/:id` | `apps/api/src/commerce/pattern/controller/pattern.controller.ts` |
| DELETE | `/delete/product-size-profile/:id` | `apps/api/src/commerce/product/controller/product-size-profile.controller.ts` |
| DELETE | `/delete/product-size-profile/by-size-option/:sizeProfileOptionId` | `apps/api/src/commerce/product/controller/product-size-profile.controller.ts` |
| DELETE | `/delete/product-zoho-relation/:id` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| DELETE | `/delete/product-zoho-relation/:id` | `apps/api/src/commerce/zoho/controller/zoho.controller.ts` |
| DELETE | `/delete/product/:id` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| DELETE | `/delete/segment/:segmentId` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| DELETE | `/delete/shipment/:shipmentId` | `apps/api/src/commerce/shipment/controller/shipment.controller.ts` |
| DELETE | `/delete/size-profile/:profileId` | `apps/api/src/commerce/profile/controller/size-profile.controller.ts` |
| DELETE | `/delete/skill/:skillId` | `apps/api/src/commerce/skill/controller/skill.controller.ts` |
| DELETE | `/delete/sku-group/:groupId` | `apps/api/src/commerce/product/controller/sku-group.controller.ts` |
| DELETE | `/delete/special-status/:statusId` | `apps/api/src/commerce/product/controller/special-status.controller.ts` |
| DELETE | `/delete/story-content-section/:storyContentSectionId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| DELETE | `/delete/story-content/:storyContentId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| DELETE | `/delete/sub-category/:subCategoryId` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| DELETE | `/delete/workflow-template/:templateId` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| DELETE | `/delete/workflow/:workflowId` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| PATCH | `/disable/fabric-product` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| PATCH | `/disable/finished-product` | `apps/api/src/commerce/product/controller/finished-product.controller.ts` |
| POST | `/download/report/:type` | `apps/api/src/commerce/report/controller/report.controller.ts` |
| GET | `/get/address` | `apps/api/src/commerce/address/address.controller.ts` |
| GET | `/get/ads_conversion` | `apps/api/src/commerce/ads_conversion/ads_conversion.controller.ts` |
| GET | `/get/ai` | `apps/api/src/commerce/ai/ai.controller.ts` |
| GET | `/get/alfred` | `apps/api/src/commerce/alfred/alfred.controller.ts` |
| GET | `/get/article-seo-list` | `apps/api/src/commerce/seo/controller/seo.controller.ts` |
| GET | `/get/artisan` | `apps/api/src/commerce/artisan/artisan.controller.ts` |
| GET | `/get/artisan/catalog-item/:catalogItemId` | `apps/api/src/commerce/catalog/controller/catalog-item.controller.ts` |
| GET | `/get/artisan/catalog-list` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| GET | `/get/artisan/catalog-pdf-generation-list` | `apps/api/src/commerce/catalog/controller/catalog-pdf.controller.ts` |
| GET | `/get/artisan/catalog-pdf-generation/:generationId` | `apps/api/src/commerce/catalog/controller/catalog-pdf.controller.ts` |
| GET | `/get/artisan/catalog/:catalogId` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| GET | `/get/artisan/step-element-list/:status` | `apps/api/src/commerce/workflow/controller/step-element.controller.ts` |
| GET | `/get/artisan/subprocess-element-list/:status` | `apps/api/src/commerce/workflow/controller/subprocess-element.controller.ts` |
| GET | `/get/artisan/workflow-list/:status` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| GET | `/get/artisanpayment` | `apps/api/src/commerce/artisanpayment/artisanpayment.controller.ts` |
| GET | `/get/badge-profile-list` | `apps/api/src/commerce/profile/controller/badge-profile.controller.ts` |
| GET | `/get/badge-profile/:profileId` | `apps/api/src/commerce/profile/controller/badge-profile.controller.ts` |
| GET | `/get/behemoth` | `apps/api/src/commerce/behemoth/behemoth.controller.ts` |
| GET | `/get/blog-content-category-list` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/blog-content-list` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/blog-content-list/csv/:commaSeparatedIDList` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/blog-content-list/customer` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/blog-content-types` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/blog-content/:blogContentId` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/blog-content/slug/:slug` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/blogs/:blogId/recommended` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/blogs/category/:blogCategoryId` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/bloomsight` | `apps/api/src/commerce/bloomsight/bloomsight.controller.ts` |
| GET | `/get/cart` | `apps/api/src/commerce/cart/cart.controller.ts` |
| GET | `/get/cart-item/list` | `apps/api/src/commerce/cart/controller/cart.controller.ts` |
| GET | `/get/catalog-item-list` | `apps/api/src/commerce/catalog/controller/catalog-item.controller.ts` |
| GET | `/get/catalog-item/:catalogItemId` | `apps/api/src/commerce/catalog/controller/catalog-item.controller.ts` |
| GET | `/get/catalog-list` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| GET | `/get/catalog-list/artisan/:artisanId` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| GET | `/get/catalog-pdf-generation-list/artisan/:artisanId` | `apps/api/src/commerce/catalog/controller/catalog-pdf.controller.ts` |
| GET | `/get/catalog-pdf-generation/:generationId` | `apps/api/src/commerce/catalog/controller/catalog-pdf.controller.ts` |
| GET | `/get/catalog/:catalogId` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| GET | `/get/category/:categoryId` | `apps/api/src/commerce/product/controller/category.controller.ts` |
| GET | `/get/category/list` | `apps/api/src/commerce/product/controller/category.controller.ts` |
| GET | `/get/color` | `apps/api/src/commerce/color/color.controller.ts` |
| GET | `/get/color-list` | `apps/api/src/commerce/color/controller/color.controller.ts` |
| GET | `/get/compatibility` | `apps/api/src/commerce/compatibility/compatibility.controller.ts` |
| GET | `/get/configuration` | `apps/api/src/commerce/configuration/configuration.controller.ts` |
| GET | `/get/content` | `apps/api/src/commerce/content/content.controller.ts` |
| GET | `/get/customer/custom-order-list` | `apps/api/src/commerce/order/controller/custom-order.controller.ts` |
| GET | `/get/customer/custom-order/:orderId` | `apps/api/src/commerce/order/controller/custom-order.controller.ts` |
| GET | `/get/customer/loyalty-info` | `apps/api/src/commerce/loyaltyprogram/controller/loyaltyprogram.controller.ts` |
| GET | `/get/customer/order-list` | `apps/api/src/commerce/order/controller/order.controller.ts` |
| GET | `/get/customer/order/:orderId` | `apps/api/src/commerce/order/controller/order.controller.ts` |
| GET | `/get/customer/order/:orderId/fulfillment-list` | `apps/api/src/commerce/order/controller/order-fulfillment.controller.ts` |
| GET | `/get/customer/profile` | `apps/api/src/commerce/profile/controller/tenant-profile.controller.ts` |
| GET | `/get/customer/profile` | `apps/api/src/commerce/tenant/controller/tenant.controller.ts` |
| GET | `/get/customer/review` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| GET | `/get/customers/whatsapp-status` | `apps/api/src/commerce/whatsapp/controller/whatsapp.controller.ts` |
| GET | `/get/diagnostics` | `apps/api/src/commerce/diagnostics/diagnostics.controller.ts` |
| GET | `/get/discount` | `apps/api/src/commerce/discount/discount.controller.ts` |
| GET | `/get/element/feedback/:feedbackId` | `apps/api/src/commerce/workflow/controller/element-feedback.controller.ts` |
| GET | `/get/fabric-product/:productId` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| GET | `/get/fabric-product/filter-preview` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| GET | `/get/fabric-product/filter-preview/by-ids` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| GET | `/get/fabric-product/filter-preview/filtered` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| GET | `/get/fabric-product/filter-preview/page` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| GET | `/get/fabric-product/overview/list` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| GET | `/get/fabric-product/slug/:productSlug` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| GET | `/get/faq` | `apps/api/src/commerce/faq/faq.controller.ts` |
| GET | `/get/faq/:faqId` | `apps/api/src/commerce/faq/controller/faq.controller.ts` |
| GET | `/get/faqs` | `apps/api/src/commerce/faq/controller/faq.controller.ts` |
| GET | `/get/feedback` | `apps/api/src/commerce/feedback/feedback.controller.ts` |
| GET | `/get/filter` | `apps/api/src/commerce/filter/filter.controller.ts` |
| GET | `/get/filter-seo/:code/:name` | `apps/api/src/commerce/seo/controller/seo.controller.ts` |
| GET | `/get/filter/fabric/filtered` | `apps/api/src/commerce/filter/controller/filter.controller.ts` |
| GET | `/get/filter/finished` | `apps/api/src/commerce/filter/controller/filter.controller.ts` |
| GET | `/get/finished-product/:productId` | `apps/api/src/commerce/product/controller/finished-product.controller.ts` |
| GET | `/get/finished-product/slug/:productSlug` | `apps/api/src/commerce/product/controller/finished-product.controller.ts` |
| GET | `/get/forex` | `apps/api/src/commerce/forex/forex.controller.ts` |
| GET | `/get/image` | `apps/api/src/commerce/image/image.controller.ts` |
| GET | `/get/impact` | `apps/api/src/commerce/impact/impact.controller.ts` |
| GET | `/get/impact-factor/:id` | `apps/api/src/commerce/impact/controller/impact.controller.ts` |
| GET | `/get/impact-factors` | `apps/api/src/commerce/impact/controller/impact.controller.ts` |
| GET | `/get/inventory` | `apps/api/src/commerce/inventory/inventory.controller.ts` |
| GET | `/get/inventory-adjustment` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/inventory-adjustment-reason` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/inventory-adjustment-reason/:reasonId` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/inventory-adjustment/:adjustmentId` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/inventory-restock-request` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/iplocation` | `apps/api/src/commerce/iplocation/iplocation.controller.ts` |
| GET | `/get/iplocation/:ip` | `apps/api/src/commerce/iplocation/controller/iplocation.controller.ts` |
| GET | `/get/iplocation/current` | `apps/api/src/commerce/iplocation/controller/iplocation.controller.ts` |
| GET | `/get/loyalty-program/config` | `apps/api/src/commerce/loyaltyprogram/controller/loyaltyprogram.controller.ts` |
| GET | `/get/loyaltyprogram` | `apps/api/src/commerce/loyaltyprogram/loyaltyprogram.controller.ts` |
| GET | `/get/made-to-order-profile-list` | `apps/api/src/commerce/profile/controller/made-to-order-profile.controller.ts` |
| GET | `/get/made-to-order-profile/:profileId` | `apps/api/src/commerce/profile/controller/made-to-order-profile.controller.ts` |
| GET | `/get/material` | `apps/api/src/commerce/material/material.controller.ts` |
| GET | `/get/material-list` | `apps/api/src/commerce/material/controller/material.controller.ts` |
| GET | `/get/misc` | `apps/api/src/commerce/misc/misc.controller.ts` |
| GET | `/get/msg91` | `apps/api/src/commerce/msg91/msg91.controller.ts` |
| GET | `/get/navigation` | `apps/api/src/commerce/navigation/controller/navigation.controller.ts` |
| GET | `/get/navigation` | `apps/api/src/commerce/navigation/navigation.controller.ts` |
| GET | `/get/navigation/fabric/color` | `apps/api/src/commerce/navigation/controller/navigation.controller.ts` |
| GET | `/get/navigation/fabric/craft` | `apps/api/src/commerce/navigation/controller/navigation.controller.ts` |
| GET | `/get/navigation/fabric/material` | `apps/api/src/commerce/navigation/controller/navigation.controller.ts` |
| GET | `/get/navigation/fabric/pattern` | `apps/api/src/commerce/navigation/controller/navigation.controller.ts` |
| GET | `/get/navigation/finished/:category` | `apps/api/src/commerce/navigation/controller/navigation.controller.ts` |
| GET | `/get/navigation/story/:category` | `apps/api/src/commerce/navigation/controller/navigation.controller.ts` |
| GET | `/get/notification` | `apps/api/src/commerce/notification/notification.controller.ts` |
| GET | `/get/nverse` | `apps/api/src/commerce/nverse/nverse.controller.ts` |
| GET | `/get/order` | `apps/api/src/commerce/order/order.controller.ts` |
| GET | `/get/order/feedback-list` | `apps/api/src/commerce/order/controller/order-feedback.controller.ts` |
| GET | `/get/order/feedback/:orderId` | `apps/api/src/commerce/order/controller/order-feedback.controller.ts` |
| GET | `/get/pattern` | `apps/api/src/commerce/pattern/pattern.controller.ts` |
| GET | `/get/pattern-list` | `apps/api/src/commerce/pattern/controller/pattern.controller.ts` |
| GET | `/get/payment` | `apps/api/src/commerce/payment/payment.controller.ts` |
| GET | `/get/product` | `apps/api/src/commerce/product/product.controller.ts` |
| GET | `/get/product-seo-list` | `apps/api/src/commerce/seo/controller/seo.controller.ts` |
| GET | `/get/product-size-profile/:id` | `apps/api/src/commerce/product/controller/product-size-profile.controller.ts` |
| GET | `/get/product-size-profile/by-size-option/:sizeProfileOptionId` | `apps/api/src/commerce/product/controller/product-size-profile.controller.ts` |
| GET | `/get/product-size-profile/consumed-fabric-for-impact` | `apps/api/src/commerce/product/controller/product-size-profile.controller.ts` |
| GET | `/get/product-zoho-relation/:id` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| GET | `/get/product-zoho-relation/active-with-active-product` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| GET | `/get/product-zoho-relation/by-product-and-sku` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| GET | `/get/product-zoho-relation/by-zoho-item-and-sku` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| GET | `/get/product-zoho-relation/by-zoho-item/:zohoItemId` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| GET | `/get/product-zoho-relation/stream/fabric-product` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| GET | `/get/product-zoho-relation/stream/finished-product` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| GET | `/get/product/:id` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/backward-compatible-link` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/by-id/:id` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/enabled-image-sitemap` | `apps/api/src/commerce/seo/controller/seo.controller.ts` |
| GET | `/get/product/enabled-image-sitemap` | `apps/api/src/commerce/sitemap/controller/sitemap.controller.ts` |
| GET | `/get/product/gist/list` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/image-sitemap` | `apps/api/src/commerce/seo/controller/seo.controller.ts` |
| GET | `/get/product/image-sitemap` | `apps/api/src/commerce/sitemap/controller/sitemap.controller.ts` |
| GET | `/get/product/impact/:productId` | `apps/api/src/commerce/impact/controller/impact.controller.ts` |
| GET | `/get/product/nav-menu/color` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/nav-menu/craft` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/nav-menu/finished/:categoryName` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/nav-menu/material` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/nav-menu/pattern` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/related` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/related/story/:storyContentId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/product/review/:productId` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| GET | `/get/product/slug/:slug` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/product/sub-category/:subCategoryId` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/profile` | `apps/api/src/commerce/profile/profile.controller.ts` |
| GET | `/get/recent-catalog-list/:limit` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| GET | `/get/report` | `apps/api/src/commerce/report/report.controller.ts` |
| GET | `/get/restful` | `apps/api/src/commerce/restful/restful.controller.ts` |
| GET | `/get/review` | `apps/api/src/commerce/review/review.controller.ts` |
| GET | `/get/review/:reviewId` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| GET | `/get/review/stats` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| GET | `/get/search` | `apps/api/src/commerce/search/search.controller.ts` |
| GET | `/get/search/result/:keyword` | `apps/api/src/commerce/search/controller/search.controller.ts` |
| GET | `/get/segment/:segmentId` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| GET | `/get/segment/by-id/:id` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| GET | `/get/segment/fuzzy-search` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| GET | `/get/segment/list` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| GET | `/get/segment/preview/list` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| GET | `/get/seo` | `apps/api/src/commerce/seo/seo.controller.ts` |
| GET | `/get/settings` | `apps/api/src/commerce/settings/settings.controller.ts` |
| GET | `/get/settings-list` | `apps/api/src/commerce/settings/controller/settings.controller.ts` |
| GET | `/get/settings/:settingId` | `apps/api/src/commerce/settings/controller/settings.controller.ts` |
| GET | `/get/shipment` | `apps/api/src/commerce/shipment/shipment.controller.ts` |
| GET | `/get/shipment-list` | `apps/api/src/commerce/shipment/controller/shipment.controller.ts` |
| GET | `/get/shipment/:shipmentId` | `apps/api/src/commerce/shipment/controller/shipment.controller.ts` |
| GET | `/get/sitemap` | `apps/api/src/commerce/sitemap/sitemap.controller.ts` |
| GET | `/get/size-profile-list` | `apps/api/src/commerce/profile/controller/size-profile.controller.ts` |
| GET | `/get/size-profile/:profileId` | `apps/api/src/commerce/profile/controller/size-profile.controller.ts` |
| GET | `/get/skill` | `apps/api/src/commerce/skill/skill.controller.ts` |
| GET | `/get/skill-list` | `apps/api/src/commerce/skill/controller/skill.controller.ts` |
| GET | `/get/skill/:skillId` | `apps/api/src/commerce/skill/controller/skill.controller.ts` |
| GET | `/get/sku-group/list` | `apps/api/src/commerce/product/controller/sku-group.controller.ts` |
| GET | `/get/special-status/list` | `apps/api/src/commerce/product/controller/special-status.controller.ts` |
| GET | `/get/stories/:storyId/recommended` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/stories/category/:storyCategoryId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/story-content-category-list` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/story-content-list` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/story-content-list/csv/:commaSeparatedIDList` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/story-content/:storyContentId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/story-content/slug/:slug` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/story/product-previews/:storyContentId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/story/products/:storyContentId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/story/related/product/:productId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/sub-category/:subCategoryId` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| GET | `/get/sub-category/featured/:categoryName` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| GET | `/get/sub-category/fuzzy-search` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| GET | `/get/sub-category/list` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| GET | `/get/sub-category/related/:subCategoryId` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| GET | `/get/super-user/custom-order-list` | `apps/api/src/commerce/order/controller/custom-order.controller.ts` |
| GET | `/get/super-user/custom-order/:orderId` | `apps/api/src/commerce/order/controller/custom-order.controller.ts` |
| GET | `/get/super-user/order-list` | `apps/api/src/commerce/order/controller/order.controller.ts` |
| GET | `/get/super-user/order/:orderId` | `apps/api/src/commerce/order/controller/order.controller.ts` |
| GET | `/get/super-user/order/:orderId/fulfillment-list` | `apps/api/src/commerce/order/controller/order-fulfillment.controller.ts` |
| GET | `/get/super-user/order/:orderId/ready-list` | `apps/api/src/commerce/order/controller/order-fulfillment.controller.ts` |
| GET | `/get/super-user/order/feedback/:feedbackId` | `apps/api/src/commerce/order/controller/order-feedback.controller.ts` |
| GET | `/get/super-user/profile` | `apps/api/src/commerce/profile/controller/tenant-profile.controller.ts` |
| GET | `/get/super-user/profile` | `apps/api/src/commerce/tenant/controller/tenant.controller.ts` |
| GET | `/get/super-user/review` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| GET | `/get/support` | `apps/api/src/commerce/support/support.controller.ts` |
| GET | `/get/table_explorer` | `apps/api/src/commerce/table_explorer/table_explorer.controller.ts` |
| GET | `/get/table-explorer/data/:tableName` | `apps/api/src/commerce/table_explorer/controller/table_explorer.controller.ts` |
| GET | `/get/table-explorer/data/:tableName/:id` | `apps/api/src/commerce/table_explorer/controller/table_explorer.controller.ts` |
| GET | `/get/table-explorer/data/artisan-skill-mapping` | `apps/api/src/commerce/skill/controller/skill.controller.ts` |
| GET | `/get/table-explorer/data/badge-profile` | `apps/api/src/commerce/profile/controller/badge-profile.controller.ts` |
| GET | `/get/table-explorer/data/badge-profile-item` | `apps/api/src/commerce/profile/controller/badge-profile.controller.ts` |
| GET | `/get/table-explorer/data/badge-profile/:id` | `apps/api/src/commerce/profile/controller/badge-profile.controller.ts` |
| GET | `/get/table-explorer/data/blog-content` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/table-explorer/data/blog-content-category` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/table-explorer/data/blog-content-section` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/table-explorer/data/blog-content-type` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| GET | `/get/table-explorer/data/cart-item` | `apps/api/src/commerce/cart/controller/cart.controller.ts` |
| GET | `/get/table-explorer/data/cart-item/:id` | `apps/api/src/commerce/cart/controller/cart.controller.ts` |
| GET | `/get/table-explorer/data/category` | `apps/api/src/commerce/product/controller/category.controller.ts` |
| GET | `/get/table-explorer/data/email-notification-history` | `apps/api/src/commerce/notification/controller/notification.controller.ts` |
| GET | `/get/table-explorer/data/email-notification-history/:id` | `apps/api/src/commerce/notification/controller/notification.controller.ts` |
| GET | `/get/table-explorer/data/fabric-product` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| GET | `/get/table-explorer/data/faq` | `apps/api/src/commerce/faq/controller/faq.controller.ts` |
| GET | `/get/table-explorer/data/faq-question` | `apps/api/src/commerce/faq/controller/faq.controller.ts` |
| GET | `/get/table-explorer/data/faq-question/:id` | `apps/api/src/commerce/faq/controller/faq.controller.ts` |
| GET | `/get/table-explorer/data/faq/:id` | `apps/api/src/commerce/faq/controller/faq.controller.ts` |
| GET | `/get/table-explorer/data/inventory-adjustment` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/table-explorer/data/inventory-adjustment-reason` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/table-explorer/data/inventory-restock-request` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/table-explorer/data/loyalty-program-config` | `apps/api/src/commerce/loyaltyprogram/controller/loyaltyprogram.controller.ts` |
| GET | `/get/table-explorer/data/loyalty-program-config-audit-log` | `apps/api/src/commerce/loyaltyprogram/controller/loyaltyprogram.controller.ts` |
| GET | `/get/table-explorer/data/loyalty-program-config-audit-log/:id` | `apps/api/src/commerce/loyaltyprogram/controller/loyaltyprogram.controller.ts` |
| GET | `/get/table-explorer/data/loyalty-program-config/:id` | `apps/api/src/commerce/loyaltyprogram/controller/loyaltyprogram.controller.ts` |
| GET | `/get/table-explorer/data/made-to-order-profile` | `apps/api/src/commerce/profile/controller/made-to-order-profile.controller.ts` |
| GET | `/get/table-explorer/data/made-to-order-profile/:id` | `apps/api/src/commerce/profile/controller/made-to-order-profile.controller.ts` |
| GET | `/get/table-explorer/data/material` | `apps/api/src/commerce/material/controller/material.controller.ts` |
| GET | `/get/table-explorer/data/material/:id` | `apps/api/src/commerce/material/controller/material.controller.ts` |
| GET | `/get/table-explorer/data/pattern` | `apps/api/src/commerce/pattern/controller/pattern.controller.ts` |
| GET | `/get/table-explorer/data/pattern/:id` | `apps/api/src/commerce/pattern/controller/pattern.controller.ts` |
| GET | `/get/table-explorer/data/product` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/table-explorer/data/product-image-gallery-seo` | `apps/api/src/commerce/seo/controller/seo.controller.ts` |
| GET | `/get/table-explorer/data/product-size-profile` | `apps/api/src/commerce/product/controller/product-size-profile.controller.ts` |
| GET | `/get/table-explorer/data/product-size-profile/:id` | `apps/api/src/commerce/product/controller/product-size-profile.controller.ts` |
| GET | `/get/table-explorer/data/product-zoho-relation` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| GET | `/get/table-explorer/data/product-zoho-relation/:id` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| GET | `/get/table-explorer/data/product/:id` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| GET | `/get/table-explorer/data/razorpay-transaction` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| GET | `/get/table-explorer/data/razorpay-transaction/:id` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| GET | `/get/table-explorer/data/review` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| GET | `/get/table-explorer/data/review/:id` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| GET | `/get/table-explorer/data/segment` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| GET | `/get/table-explorer/data/segment/:id` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| GET | `/get/table-explorer/data/settings` | `apps/api/src/commerce/settings/controller/settings.controller.ts` |
| GET | `/get/table-explorer/data/settings/:id` | `apps/api/src/commerce/settings/controller/settings.controller.ts` |
| GET | `/get/table-explorer/data/shipment` | `apps/api/src/commerce/shipment/controller/shipment.controller.ts` |
| GET | `/get/table-explorer/data/shipment/:id` | `apps/api/src/commerce/shipment/controller/shipment.controller.ts` |
| GET | `/get/table-explorer/data/size-profile` | `apps/api/src/commerce/profile/controller/size-profile.controller.ts` |
| GET | `/get/table-explorer/data/size-profile-guide` | `apps/api/src/commerce/profile/controller/size-profile.controller.ts` |
| GET | `/get/table-explorer/data/size-profile-option` | `apps/api/src/commerce/profile/controller/size-profile.controller.ts` |
| GET | `/get/table-explorer/data/size-profile/:id` | `apps/api/src/commerce/profile/controller/size-profile.controller.ts` |
| GET | `/get/table-explorer/data/sku-group` | `apps/api/src/commerce/product/controller/sku-group.controller.ts` |
| GET | `/get/table-explorer/data/sku-group/:id` | `apps/api/src/commerce/product/controller/sku-group.controller.ts` |
| GET | `/get/table-explorer/data/special-status` | `apps/api/src/commerce/product/controller/special-status.controller.ts` |
| GET | `/get/table-explorer/data/special-status/:id` | `apps/api/src/commerce/product/controller/special-status.controller.ts` |
| GET | `/get/table-explorer/data/story-content` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/table-explorer/data/story-content-category` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/table-explorer/data/story-content-section` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/table-explorer/data/story-product-mapping` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| GET | `/get/table-explorer/data/stripe-transaction` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| GET | `/get/table-explorer/data/stripe-transaction/:id` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| GET | `/get/table-explorer/data/sub-category` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| GET | `/get/table-explorer/data/sub-category/:id` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| GET | `/get/table-explorer/data/tag` | `apps/api/src/commerce/product/controller/tag.controller.ts` |
| GET | `/get/table-explorer/data/tag/:id` | `apps/api/src/commerce/product/controller/tag.controller.ts` |
| GET | `/get/table-explorer/data/user-role` | `apps/api/src/commerce/tenant/controller/tenant.controller.ts` |
| GET | `/get/table-explorer/data/user-role/:id` | `apps/api/src/commerce/tenant/controller/tenant.controller.ts` |
| GET | `/get/table-explorer/data/warehouse` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/table-explorer/data/whatsapp-notification-history` | `apps/api/src/commerce/whatsapp/controller/whatsapp.controller.ts` |
| GET | `/get/table-explorer/data/whatsapp-notification-history/:id` | `apps/api/src/commerce/whatsapp/controller/whatsapp.controller.ts` |
| GET | `/get/table-explorer/data/workflow-template` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| GET | `/get/tag/:id` | `apps/api/src/commerce/product/controller/tag.controller.ts` |
| GET | `/get/tag/by-ids` | `apps/api/src/commerce/product/controller/tag.controller.ts` |
| GET | `/get/tag/list` | `apps/api/src/commerce/product/controller/tag.controller.ts` |
| GET | `/get/tenant` | `apps/api/src/commerce/tenant/tenant.controller.ts` |
| GET | `/get/tenant/cart-item/list` | `apps/api/src/commerce/cart/controller/cart.controller.ts` |
| GET | `/get/tenant/cart-item/list/:uid` | `apps/api/src/commerce/cart/controller/cart.controller.ts` |
| GET | `/get/tenant/profile/:uId` | `apps/api/src/commerce/profile/controller/tenant-profile.controller.ts` |
| GET | `/get/tenant/profile/:uId` | `apps/api/src/commerce/tenant/controller/tenant.controller.ts` |
| GET | `/get/transmission` | `apps/api/src/commerce/transmission/transmission.controller.ts` |
| GET | `/get/utility` | `apps/api/src/commerce/utility/utility.controller.ts` |
| GET | `/get/v2/filter/fabric` | `apps/api/src/commerce/filter/controller/filter.controller.ts` |
| GET | `/get/v2/search/result/:keyword` | `apps/api/src/commerce/search/controller/search.controller.ts` |
| GET | `/get/warehouse` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/warehouse/:warehouseId` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| GET | `/get/whatsapp` | `apps/api/src/commerce/whatsapp/whatsapp.controller.ts` |
| GET | `/get/workflow` | `apps/api/src/commerce/workflow/workflow.controller.ts` |
| GET | `/get/workflow-list/:status` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| GET | `/get/workflow-template-list` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| GET | `/get/workflow-template/:templateId` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| GET | `/get/workflow/:workflowId` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| GET | `/get/zoho` | `apps/api/src/commerce/zoho/zoho.controller.ts` |
| GET | `/get/zoho_adapter` | `apps/api/src/commerce/zoho_adapter/zoho_adapter.controller.ts` |
| GET | `/health` | `apps/api/src/health/health.controller.ts` |
| POST | `/modify/gallery-images` | `apps/api/src/commerce/seo/controller/seo.controller.ts` |
| GET | `/nverse//get/table-explorer/data/verification-token` | `apps/api/src/commerce/nverse/controller/nverse.controller.ts` |
| GET | `/nverse//get/table-explorer/data/verification-token/:id` | `apps/api/src/commerce/nverse/controller/nverse.controller.ts` |
| POST | `/nverse/email/verify` | `apps/api/src/commerce/nverse/controller/nverse.controller.ts` |
| POST | `/nverse/login` | `apps/api/src/commerce/nverse/controller/nverse.controller.ts` |
| POST | `/nverse/otp/send` | `apps/api/src/commerce/nverse/controller/nverse.controller.ts` |
| POST | `/nverse/otp/verify` | `apps/api/src/commerce/nverse/controller/nverse.controller.ts` |
| GET | `/product` | `apps/api/src/commerce/product/product-api.controller.ts` |
| GET | `/product/:id` | `apps/api/src/commerce/product/product-api.controller.ts` |
| GET | `/reindex` | `apps/api/src/commerce/search/controller/search.controller.ts` |
| GET | `/reindex/vector` | `apps/api/src/commerce/search/controller/search.controller.ts` |
| GET | `/reindex/vector/blog` | `apps/api/src/commerce/search/controller/search.controller.ts` |
| GET | `/reindex/vector/story` | `apps/api/src/commerce/search/controller/search.controller.ts` |
| POST | `/retrigger/email/order/:orderId` | `apps/api/src/commerce/notification/controller/notification.controller.ts` |
| GET | `/search/ai/:keyword` | `apps/api/src/commerce/search/controller/search.controller.ts` |
| GET | `/search/ai/blog/:keyword` | `apps/api/src/commerce/search/controller/search.controller.ts` |
| GET | `/search/ai/story/:keyword` | `apps/api/src/commerce/search/controller/search.controller.ts` |
| POST | `/submit/contact-us` | `apps/api/src/commerce/misc/controller/misc.controller.ts` |
| GET | `/track/all` | `apps/api/src/commerce/transmission/tracking.controller.ts` |
| GET | `/track/awb/:trackingNumber` | `apps/api/src/commerce/transmission/tracking.controller.ts` |
| GET | `/track/batch/:batchNo` | `apps/api/src/commerce/transmission/tracking.controller.ts` |
| GET | `/track/order/:orderId` | `apps/api/src/commerce/transmission/tracking.controller.ts` |
| POST | `/trigger/fabric-product/zoho-workflow` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| POST | `/trigger/fabric-product/zoho-workflow` | `apps/api/src/commerce/zoho/controller/zoho.controller.ts` |
| POST | `/trigger/finished-product/zoho-workflow` | `apps/api/src/commerce/product/controller/finished-product.controller.ts` |
| POST | `/trigger/finished-product/zoho-workflow` | `apps/api/src/commerce/zoho/controller/zoho.controller.ts` |
| PATCH | `/update/artisan/catalog` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| PATCH | `/update/artisan/catalog-item` | `apps/api/src/commerce/catalog/controller/catalog-item.controller.ts` |
| PATCH | `/update/artisan/element/feedback` | `apps/api/src/commerce/workflow/controller/element-feedback.controller.ts` |
| PATCH | `/update/badge-profile/:profileId` | `apps/api/src/commerce/profile/controller/badge-profile.controller.ts` |
| PATCH | `/update/blog-content-category` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| PATCH | `/update/blog-content-section/:blogContentSectionId` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| PATCH | `/update/blog-content-type` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| PATCH | `/update/blog-content/:blogContentId` | `apps/api/src/commerce/content/blog/controller/blog.controller.ts` |
| PATCH | `/update/cart-item` | `apps/api/src/commerce/cart/controller/cart.controller.ts` |
| PATCH | `/update/catalog` | `apps/api/src/commerce/catalog/controller/catalog.controller.ts` |
| PATCH | `/update/catalog-item` | `apps/api/src/commerce/catalog/controller/catalog-item.controller.ts` |
| PATCH | `/update/category/:categoryId` | `apps/api/src/commerce/product/controller/category.controller.ts` |
| PATCH | `/update/custom-order` | `apps/api/src/commerce/order/controller/custom-order.controller.ts` |
| PATCH | `/update/customer/profile` | `apps/api/src/commerce/profile/controller/tenant-profile.controller.ts` |
| PATCH | `/update/customer/profile` | `apps/api/src/commerce/tenant/controller/tenant.controller.ts` |
| PATCH | `/update/customer/review` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| PATCH | `/update/element/feedback` | `apps/api/src/commerce/workflow/controller/element-feedback.controller.ts` |
| PATCH | `/update/fabric-product` | `apps/api/src/commerce/product/controller/fabric-product.controller.ts` |
| PATCH | `/update/faq` | `apps/api/src/commerce/faq/controller/faq.controller.ts` |
| PATCH | `/update/finished-product` | `apps/api/src/commerce/product/controller/finished-product.controller.ts` |
| PATCH | `/update/impact-factor` | `apps/api/src/commerce/impact/controller/impact.controller.ts` |
| PATCH | `/update/inventory-adjustment-reason` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| PATCH | `/update/inventory-restock-request/quantity` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| PATCH | `/update/inventory-restock-request/status` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| PATCH | `/update/loyalty-program/config` | `apps/api/src/commerce/loyaltyprogram/controller/loyaltyprogram.controller.ts` |
| PATCH | `/update/made-to-order-profile` | `apps/api/src/commerce/profile/controller/made-to-order-profile.controller.ts` |
| PATCH | `/update/material` | `apps/api/src/commerce/material/controller/material.controller.ts` |
| PATCH | `/update/order` | `apps/api/src/commerce/order/controller/order.controller.ts` |
| PATCH | `/update/order/feedback/q1` | `apps/api/src/commerce/order/controller/order-feedback.controller.ts` |
| PATCH | `/update/order/feedback/q2` | `apps/api/src/commerce/order/controller/order-feedback.controller.ts` |
| PATCH | `/update/order/feedback/q3` | `apps/api/src/commerce/order/controller/order-feedback.controller.ts` |
| PATCH | `/update/order/fulfillment` | `apps/api/src/commerce/order/controller/order-fulfillment.controller.ts` |
| PATCH | `/update/order/ready` | `apps/api/src/commerce/order/controller/order-fulfillment.controller.ts` |
| PATCH | `/update/pattern` | `apps/api/src/commerce/pattern/controller/pattern.controller.ts` |
| POST | `/update/payment/failure` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| POST | `/update/payment/success` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| POST | `/update/payment/transaction` | `apps/api/src/commerce/payment/controller/payment.controller.ts` |
| PATCH | `/update/product` | `apps/api/src/commerce/product/controller/product.controller.ts` |
| PATCH | `/update/product-size-profile` | `apps/api/src/commerce/product/controller/product-size-profile.controller.ts` |
| PATCH | `/update/product-zoho-relation` | `apps/api/src/commerce/product/controller/product-zoho-relation.controller.ts` |
| PATCH | `/update/segment/:segmentId` | `apps/api/src/commerce/product/controller/segment.controller.ts` |
| PATCH | `/update/settings` | `apps/api/src/commerce/settings/controller/settings.controller.ts` |
| PATCH | `/update/shipment` | `apps/api/src/commerce/shipment/controller/shipment.controller.ts` |
| PATCH | `/update/size-profile/:profileId` | `apps/api/src/commerce/profile/controller/size-profile.controller.ts` |
| PATCH | `/update/skill` | `apps/api/src/commerce/skill/controller/skill.controller.ts` |
| PATCH | `/update/sku-group` | `apps/api/src/commerce/product/controller/sku-group.controller.ts` |
| PATCH | `/update/special-status` | `apps/api/src/commerce/product/controller/special-status.controller.ts` |
| PATCH | `/update/step-element` | `apps/api/src/commerce/workflow/controller/step-element.controller.ts` |
| PATCH | `/update/story-content-category` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| PATCH | `/update/story-content-section/:storyContentSectionId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| PATCH | `/update/story-content/:storyContentId` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| PATCH | `/update/story-product/relation` | `apps/api/src/commerce/content/story/controller/story.controller.ts` |
| PATCH | `/update/sub-category/:subCategoryId` | `apps/api/src/commerce/product/controller/sub-category.controller.ts` |
| PATCH | `/update/subprocess-element` | `apps/api/src/commerce/workflow/controller/subprocess-element.controller.ts` |
| PATCH | `/update/super-user/review` | `apps/api/src/commerce/review/controller/review.controller.ts` |
| PATCH | `/update/tag` | `apps/api/src/commerce/product/controller/tag.controller.ts` |
| PATCH | `/update/warehouse` | `apps/api/src/commerce/inventory/controller/inventory.controller.ts` |
| PATCH | `/update/workflow` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| PATCH | `/update/workflow-template` | `apps/api/src/commerce/workflow/controller/workflow.controller.ts` |
| POST | `/upload/image` | `apps/api/src/commerce/image/controller/image.controller.ts` |
| GET | `/wait/artisan/catalog-pdf-generation/:generationId` | `apps/api/src/commerce/catalog/controller/catalog-pdf.controller.ts` |
| GET | `/wait/catalog-pdf-generation/:generationId` | `apps/api/src/commerce/catalog/controller/catalog-pdf.controller.ts` |
| POST | `/zoho/sync/all-product` | `apps/api/src/commerce/zoho/controller/zoho.controller.ts` |
| POST | `/zoho/webhook/bill` | `apps/api/src/commerce/zoho/controller/zoho.controller.ts` |
| POST | `/zoho/webhook/inventory-adjustment` | `apps/api/src/commerce/zoho/controller/zoho.controller.ts` |
| POST | `/zoho/webhook/package` | `apps/api/src/commerce/zoho/controller/zoho.controller.ts` |
| POST | `/zoho/webhook/sales-order` | `apps/api/src/commerce/zoho/controller/zoho.controller.ts` |

## Legacy paths the frontends call

- `/add/artisan`
- `/add/badge-profile`
- `/add/blog-content`
- `/add/blog-content-category/`
- `/add/blog-content-type`
- `/add/cart-item`
- `/add/category`
- `/add/color`
- `/add/custom-order`
- `/add/custom-size-profile`
- `/add/discount`
- `/add/fabric-profile`
- `/add/finish-profile`
- `/add/forex`
- `/add/inventory-adjustment`
- `/add/inventory-adjustment-reason`
- `/add/made-to-order-profile`
- `/add/material`
- `/add/pattern`
- `/add/review`
- `/add/segment`
- `/add/shipment`
- `/add/size-profile`
- `/add/skill`
- `/add/sku-group`
- `/add/special-status`
- `/add/story-content`
- `/add/story-content-category`
- `/add/sub-category`
- `/add/tag`
- `/add/volume-discount-profile`
- `/add/warehouse`
- `/get/artisan-payments`
- `/get/badge-profile-list`
- `/get/blog-content-category-list`
- `/get/blog-content-list`
- `/get/blog-content-list/customer`
- `/get/blog-content-types`
- `/get/cart-item/list`
- `/get/catalog-list`
- `/get/category-list`
- `/get/color-list`
- `/get/cron-logs`
- `/get/custom-size-profile-list`
- `/get/customer/custom-order/{orderId}`
- `/get/customer/order/{orderId}`
- `/get/customer/profile`
- `/get/customers`
- `/get/customers/whatsapp-status`
- `/get/diagnostics/app`
- `/get/diagnostics/host`
- `/get/diagnostics/summary`
- `/get/diagnostics/thread-dump`
- `/get/discount-list`
- `/get/element/feedback`
- `/get/fabric-overview-list`
- `/get/fabric-preview-list`
- `/get/fabric-preview-list?returnDisabledProducts=true`
- `/get/fabric-profile-list`
- `/get/faqs`
- `/get/filter-seo-list`
- `/get/finish-profile-list`
- `/get/finished-preview-list?returnDisabledProducts=true`
- `/get/forex-exchange-rate/latest`
- `/get/forex-list`
- `/get/image-optimization/overview`
- `/get/inventory-adjustment-reason`
- `/get/inventory-restock-request`
- `/get/made-to-order-profile-list`
- `/get/material-list`
- `/get/navigation`
- `/get/navigation/fabric/craft`
- `/get/order/feedback-list`
- `/get/pattern-list`
- `/get/product-preview-list`
- `/get/review`
- `/get/segment-list`
- `/get/settings`
- `/get/shipment-list`
- `/get/size-profile-list`
- `/get/skills`
- `/get/sku-group-list`
- `/get/special-status-list`
- `/get/story-content-category-list`
- `/get/story-content-list`
- `/get/sub-category-list`
- `/get/super-user/email-audit-logs`
- `/get/table-explorer/tables`
- `/get/tag-list`
- `/get/tenant/cart-item/list`
- `/get/volume-discount-profile-list`
- `/get/warehouse`
- `/get/workflow-template-list`
- `/search/ai/`
- `/update/artisan`
- `/update/blog-content-category`
- `/update/blog-content-type`
- `/update/blog-content/`
- `/update/cart-item`
- `/update/category/`
- `/update/color`
- `/update/custom-size-profile`
- `/update/discount`
- `/update/filter-seo`
- `/update/forex`
- `/update/image-optimization/discovery/run`
- `/update/image-optimization/main/pause`
- `/update/image-optimization/main/resume`
- `/update/inventory-adjustment-reason`
- `/update/inventory-restock-request/status`
- `/update/made-to-order-profile`
- `/update/material`
- `/update/pattern`
- `/update/segment/`
- `/update/settings`
- `/update/shipment`
- `/update/skill`
- `/update/sku-group`
- `/update/special-status`
- `/update/story-content-category`
- `/update/story-content/`
- `/update/sub-category/`
- `/update/super-user/review`
- `/update/tag`
- `/update/volume-discount-profile`
- `/update/warehouse`
- `/v1/cart`
- `/v1/cart/items`
- `/v1/navigation`
- `/v1/products`
- `/v1/search`
