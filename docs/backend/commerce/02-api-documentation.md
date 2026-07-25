# Core Commerce Module — Verified API Documentation
All routes, methods, and behaviors below are read directly from source (`*Controller.java`, `*DAOController.java`, `RequestMapper.java`, `LoomGatekeeper.java`). Auth codes: `CODE_SU=1` (superuser), `CODE_CU=2` (customer), `CODE_AR=3` (artisan), `CODE_SUCU=4` (superuser OR customer).

Legend for "Response": all read (`GET`) endpoints return a **serialized JSON string** (`Content-Type: application/json`) built by a dedicated `*Response` builder class; all mutating endpoints (`POST`/`PATCH`/`DELETE`) return a `RainTreeResponse` envelope (`{success, message, data}` shape per the in-house RainTree framework) unless noted otherwise.

---

## A. Cart (`cart/controller/CartController.java`)

| # | Route | Method | Auth | Handler | Service (DAO) | DTO / Body | Validation | Business Logic | DB Tables |
|---|---|---|---|---|---|---|---|---|---|
| A1 | `/get/table-explorer/data/cart-item` | GET | `CODE_SU` | `getCartItemData` | `CartItemDAOController.retrieveCartItemData(page,size)` | query: `page`,`size` | none (auth only) | Paginated admin projection | `cart_item` |
| A2 | `/get/table-explorer/data/cart-item/{id}` | GET | `CODE_SU` | `getCartItemById` | `retrieveCartItemDataById(id)` | path `id` | none | Single admin projection | `cart_item` |
| A3 | `/get/cart-item/list` | GET | `CODE_CU` | `getCartItemList` | `retrieveCartItems(tenant)` | — (tenant from bearer token) | none | Returns authenticated customer's own cart items, enriched with fabric/finished product previews, selected fabric, size option, finish list | `cart_item` (+ read joins into product/profile preview tables) |
| A4 | `/get/tenant/cart-item/list/{uid}` | GET | `CODE_SU` | `getCartItemListUsingUid` | `retrieveCartItemsByUid(uid)` | path `uid` | none | Admin lookup of any tenant's cart by tenant UID | `cart_item` |
| A5 | `/get/tenant/cart-item/list` | GET | `CODE_SU` | `getCartItemListForTenants` | `retrieveTenantWiseCartOverview()` | — | none | Aggregated per-tenant cart overview: item counts, abandoned-cart flag, last-updated, estimated totals (admin/analytics) | `cart_item` (aggregated) |
| A6 | `/add/cart-item` | POST | `CODE_CU` | `addCartItem` | `addCartItem(tenant, cartItem)` | body: `CartItem` | `CartItemValidator`: if `productGroup ∈ {fabric,swatch}` → `fabricProductId` required & non-zero; if `productGroup == finished` → `finishedProductId` required & non-zero; `unit` must be valid `UNIT_ENUM`; `orderType` must be valid `ORDER_TYPE`; `quantity >= 0.5` | Sanitized via `CartItemSanitizer`, owning tenant force-set from bearer token before persistence | `cart_item` |
| A7 | `/update/cart-item` | PATCH | `CODE_CU` | `updateCartItem` | `updateCartItem(updateCartItem)` | body: `CartItem` (partial) | same `CartItemValidator` | Updates ordered quantity and `lastUpdatedAt` on the persisted item | `cart_item` |
| A8 | `/delete/cart-item/{cartItemId}` | DELETE | `CODE_CU` | `deleteCartItem` | `deleteCartItem(cartItemId)` | path `cartItemId` | none | Deletes one cart item | `cart_item` |
| A9 | `/delete/all-cart-item` | DELETE | `CODE_CU` | `deleteAllCartItem` | `deleteAllCartItem(tenant)` | — (tenant from bearer token) | none | Clears authenticated customer's entire cart | `cart_item` |

**Entity `CartItem` fields (verified):** `tenant` (FK), `fabricProductId`, `fabricProductPreview` (readonly join), `finishedProductId`, `finishedProductPreview` (readonly join), `selectedFabricId`, `selectedFabric` (readonly join), `selectedSizeOptionId`, `selectedSizeOption` (readonly join), `selectedFinishId`, `selectedFinishList` (readonly join), `customSize` (JSON), `productGroup` (string: `fabric`/`swatch`/`finished`), `orderType` (`ORDER_TYPE` enum), `quantity` (double), `unit` (`UNIT_ENUM`), `makingCharge` (default 0.00), `lastUpdatedAt`, `clickId`/`clickIdType`/`clickCapturedAt`/`utmSource`/`utmMedium`/`utmCampaign` (ad-attribution).

---

## B. Catalog (`catalog/controller/CatalogController.java`, `CatalogItemController.java`, `CatalogItemMediaController.java`, `CatalogPdfDownloadHistoryController.java`)

### B.1 Catalog

| # | Route | Method | Auth | Handler | Service | Business Logic | DB Tables |
|---|---|---|---|---|---|---|---|
| B1 | `/get/table-explorer/data/catalog` | GET | `CODE_SU` | `getCatalogData` | `CatalogDAOController` | paginated admin projection | `catalog` |
| B2 | `/get/catalog/{catalogId}` | GET | `CODE_SU` | `getCatalogById` | same | single lookup, empty entity if not found | `catalog` |
| B3 | `/get/recent-catalog-list/{limit}` | GET | `CODE_SU`/`CODE_CU`* | `getRecentCatalogList` | same | **`@implNote` in source: `limit` path variable is currently NOT applied — full catalog list is returned; a TODO for artisan-scoping remains in the method body.** Preserve this exact (unfiltered) behavior unless product explicitly signs off on a fix. | `catalog` |
| B4 | `/get/catalog-list` | GET | `CODE_SU`/`CODE_CU` | `getCatalogList` | same | Full catalog list | `catalog` |
| B5 | `/get/catalog-list/artisan/{artisanId}` | GET | — | `getCatalogListByArtisanId` | same | Catalogs owned by a given artisan id | `catalog` |
| B6 | `/get/artisan/catalog-list` | GET | `CODE_AR` | `getCatalogListByAuthenticatedArtisan` | same + `ArtisanDAOController` | Resolves artisan from token; **returns empty list (not an error) if token resolves to no artisan** | `catalog` |
| B7 | `/get/artisan/catalog/{catalogId}` | GET | `CODE_AR` | `getCatalogByIdForAuthenticatedArtisan` | same | Returns empty entity if no artisan resolved, catalog missing, or catalog not owned by that artisan | `catalog` |
| B8 | `/add/catalog` | POST | `CODE_SU` | `createNewCatalog` | same | Validated (`CatalogValidator`) + persisted | `catalog` |
| B9 | `/add/artisan/catalog` | POST | `CODE_AR` | `createCatalogByAuthenticatedArtisan` | same | **Forces `artisanId` to the resolved authenticated artisan** (client cannot assign to another artisan). Skips persistence with `NO_ACTION` if no artisan resolved | `catalog` |
| B10 | `/update/catalog` | PATCH | `CODE_SU` | `updateCatalog` | same | Validated + updated | `catalog` |
| B11 | `/update/artisan/catalog` | PATCH | `CODE_AR` | `updateCatalogByAuthenticatedArtisan` | same | Forces artisan id; re-loads existing catalog and confirms ownership before applying update; `NO_ACTION` on any check failure | `catalog` |
| B12 | `/delete/catalog/{catalogId}` | DELETE | `CODE_SU` | `deleteCatalog` | same | Delete by id | `catalog` |
| B13 | `/delete/artisan/catalog/{catalogId}` | DELETE | `CODE_AR` | `deleteCatalogByAuthenticatedArtisan` | same | Delete scoped to authenticated artisan's ownership | `catalog` |

/ *B3/B4 auth: both `CODE_SU` and `CODE_CU` accepted per source javadoc "(superuser or customer users)" — confirm exact gatekeeper code combination against source constant if a compound code is used; documented here at the behavior level.*

### B.2 Catalog Item

| # | Route | Method | Auth | Handler | Business Logic | DB Tables |
|---|---|---|---|---|---|---|
| B14 | `/get/table-explorer/data/catalog-item` | GET | `CODE_SU` | `getCatalogItemData` | Paginated admin projection | `catalog_item` |
| B15 | `/get/catalog-item/{catalogItemId}` | GET | `CODE_SU` | `getCatalogItemById` | Single lookup | `catalog_item` |
| B16 | `/get/catalog-item-list` | GET | `CODE_SU`/`CODE_CU` | `getCatalogItemList` | Full item list | `catalog_item` |
| B17 | `/get/artisan/catalog-item/{catalogItemId}` | GET | `CODE_AR` | `getCatalogItemByIdForAuthenticatedArtisan` | Ownership-chain checked (`CatalogItem→Catalog→Artisan`) | `catalog_item` |
| B18 | `/add/catalog-item` | POST | `CODE_SU` | `createNewCatalogItem` | Body: `CatalogItemUpsertPayload` (bundles item + media list). Validated via `CatalogItemUpsertPayloadValidator` | `catalog_item`, `catalog_item_media` |
| B19 | `/add/artisan/catalog-item` | POST | `CODE_AR` | `createCatalogItemByAuthenticatedArtisan` | Verifies target catalog exists & belongs to resolved artisan first; `NO_ACTION` otherwise | `catalog_item`, `catalog_item_media` |
| B20 | `/update/catalog-item` | PATCH | `CODE_SU` | `updateExistingCatalogItem` | Updates item + media details | `catalog_item`, `catalog_item_media` |
| B21 | `/update/artisan/catalog-item` | PATCH | `CODE_AR` | `updateCatalogItemByAuthenticatedArtisan` | **Dual ownership check**: currently-persisted owning catalog AND the (possibly reassigned) target catalog must both belong to the resolved artisan | `catalog_item`, `catalog_item_media` |
| B22 | `/delete/catalog-item/{catalogItemId}` | DELETE | `CODE_SU` | `deleteCatalogItem` | Delete by id | `catalog_item` |
| B23 | `/delete/artisan/catalog-item/{catalogItemId}` | DELETE | `CODE_AR` | `deleteCatalogItemByAuthenticatedArtisan` | Ownership-scoped delete | `catalog_item` |

### B.3 Catalog Item Media

| # | Route | Method | Auth | Handler | Business Logic | DB Tables |
|---|---|---|---|---|---|---|
| B24 | `/delete/catalog-item-media/{catalogItemMediaId}` | DELETE | `CODE_SU` | `deleteCatalogItemMedia` | Unconditional delete | `catalog_item_media` |
| B25 | `/delete/artisan/catalog-item-media/{catalogItemMediaId}` | DELETE | `CODE_AR` | `deleteCatalogItemMediaByAuthenticatedArtisan` | Walks `CatalogItemMedia→CatalogItem→Catalog→Artisan`; returns "not found" message (not an error) if any link fails or ownership mismatches | `catalog_item_media` |
| B26 | `/get/table-explorer/data/catalog-item-media` | GET | `CODE_SU` | `getCatalogItemMediaData` | Paginated admin projection | `catalog_item_media` |
| B27 | `/get/table-explorer/data/catalog-item-media/{id}` | GET | `CODE_SU` | `getCatalogItemMediaById` | Single admin projection | `catalog_item_media` |

*Note: media rows have no direct create/update endpoints — they are created/updated implicitly as part of the `CatalogItemUpsertPayload` in B18–B21.*

### B.4 Catalog PDF Download History (async generation)

| # | Route | Method | Auth | Handler | Business Logic | DB Tables |
|---|---|---|---|---|---|---|
| B28 | `/add/artisan/catalog-pdf-generation` | POST | `CODE_AR` | (in `CatalogPdfDownloadHistoryController`) | Enqueues async PDF generation for authenticated artisan | `catalog_pdf_download_history` |
| B29 | `/get/artisan/catalog-pdf-generation-list` | GET | `CODE_AR` | — | List of generations for authenticated artisan | `catalog_pdf_download_history` |
| B30 | `/get/artisan/catalog-pdf-generation/{generationId}` | GET | `CODE_AR` | — | Status of one generation | `catalog_pdf_download_history` |
| B31 | `/wait/artisan/catalog-pdf-generation/{generationId}` | GET | `CODE_AR` | — | Long-poll: `DeferredResult` completes when generation finishes or short wait times out | `catalog_pdf_download_history` |
| B32 | `/add/catalog-pdf-generation/artisan/{artisanId}` | POST | `CODE_SU` | — | Superuser-triggered generation for a given artisan | `catalog_pdf_download_history` |
| B33 | `/get/catalog-pdf-generation-list/artisan/{artisanId}` | GET | `CODE_SU` | — | List for a given artisan | `catalog_pdf_download_history` |
| B34 | `/get/catalog-pdf-generation/{generationId}` | GET | `CODE_SU` | — | Status by id | `catalog_pdf_download_history` |
| B35 | `/wait/catalog-pdf-generation/{generationId}` | GET | `CODE_SU` | — | Long-poll variant | `catalog_pdf_download_history` |
| B36 | `/get/table-explorer/data/catalog-pdf` | GET | `CODE_SU` | `getCatalogPdfData` | Paginated admin projection | `catalog_pdf_download_history` |

Domain exceptions (`IllegalArgumentException`, `NoSuchElementException`, `SecurityException`, `IllegalStateException`) raised by `CatalogPdfDownloadService`/`CatalogPdfDownloadWaitService` are translated to stable failure messages: *"Catalog PDF generation is unauthorized"*, *"...is forbidden"*, *"...artisan was not found"*, *"...was invalid"*, *"...was not found"*, *"...could not be processed"* (internal errors). **Preserve this exact exception→message mapping.**

---

## C. Standard Order (`order/controller/OrderController.java`, `OrderFulfillmentController.java`, `OrderReadyController.java`, `OrderPreviewController.java`)

### C.1 Order core

| # | Route | Method | Auth | Handler | Service | DTO | Validation | Business Logic | DB Tables |
|---|---|---|---|---|---|---|---|---|---|
| C1 | `/get/customer/order/{orderId}` | GET | `CODE_CU` | `getCustomerOrder` | `retrieveOrderByTenant(tenant, id, workflowDAOController)` | path `orderId` | none | Order detail enriched with workflow status, scoped to caller's tenant | `orders`, `order_item` (+ read of workflow tables) |
| C2 | `/get/super-user/order/{orderId}` | GET | `CODE_SU` | `getSuperUserOrder` | `retrieveOrder(orderId)` | path `orderId` | none | Order detail, any tenant | `orders`, `order_item` |
| C3 | `/add/order` | POST | `CODE_CU` | `addOrder` | `addOrder(tenant, order)` | body: `Orders` (nested `orderItems`) | `OrdersValidator`: `shippingCost`,`total`,`advancePay`,`remainingPay`,`autoDiscount`,`couponDiscount`,`subTotal` non-null; `currency` exactly 3 chars; `address` mapped to `OrderAddress` and validated by `AddressValidator`; `orderItems` validated by `OrderItemValidator.validateOrderItems`. `OrdersNormalizer.normalize()` runs first. | **See §"addOrder business logic" below — full verified trace.** | `orders`, `order_item` |
| C4 | `/update/order/shipment` | PATCH | `CODE_SU` | `updateOrderShipment` | `updateOrderShipment(request)` | body: `OrderUpdateRequest` | `OrderShipmentUpdateRequestValidator` | Updates shipment metadata (shipping code, tracking URL, dispatch/delivery estimates) — see `updateOrderShipmentMetadata` | `orders`, `order_item` |
| C5 | `/update/order` | PATCH | `CODE_SU` | `updateOrder` | `updateOrder(updatedOrder)` | body: `Orders` | `OrdersValidator` (same as C3) | Full order update | `orders`, `order_item` |
| C6 | `/update/order/global-note` | PATCH | `CODE_SU` | `updateOrderGlobalNote` | `updateOrderGlobalNote(request)` | body: `OrderGlobalNoteUpdateRequest` | `OrderGlobalNoteUpdateRequestValidator`: positive order id + non-null note string | Overwrites internal-only `globalNote` column; **never touches customer-facing `note`** | `orders` |
| C7 | `/cancel/order` | DELETE | `CODE_SUCU` | `cancelOrder` | `updateOrderStatusToCancelled(tenant, payload)` | body: `OrderCancellationPayload` | none declared at controller level | Sets order (and presumably item) status to `CANCELLED`, records `cancelledAt`/`cancellationReason`; callable by either superuser or the owning customer | `orders`, `order_item` |
| C8 | `/delete/order/{orderId}` | DELETE | `CODE_SU` | `deleteOrder` | `deleteOrder(orderId)` | path `orderId` | none | Hard/soft delete (verify against `deleted` flag semantics) | `orders` |
| C9 | `/send/email/prepared-order` | POST | `CODE_SU` | `sendEmailForPreparedOrder` | `sendEmailForPreparedOrder(tenant, request)` | body: `OrderPreparationRequest` | `OrderPreparationRequestValidator` | Triggers "order prepared" transactional email | (email side-effect only) |
| C10 | `/send/email/confirmed-order/{orderId}` | POST | `CODE_SU` | `sendOrderConfirmationEmail` | `sendOrderConfirmationEmail(tenant, orderId)` | path `orderId` | none | Triggers order confirmation email | (email side-effect only) |
| C11 | `/get/customer/order-list/v2` | GET | `CODE_CU` | `getCustomerOrderList` | `retrieveOrderListByTenant(tenant, pageNumber, pageSize)` | query `pageNumber`,`pageSize` (default 0/50) | none | Paginated preview list for caller | `orders_preview` |
| C12 | `/get/customer/order-list/all` | GET | `CODE_CU` | `getCustomerAllOrderList` | `retrieveAllOrderListByTenant(tenant, pageNumber, pageSize)` | same | none | Paginated *all* orders (incl. those `v2` may filter) for caller | `orders_preview` |
| C13 | `/get/customer/orders/status/processing` | GET | `CODE_CU` | `getProcessingOrderStatus` | `getProcessingOrderStatus(tenant, pageNumber, pageSize)` | same | none | Custom-shaped response (not the standard envelope) of processing-status orders | `orders` |
| C14 | `/get/data-dump/order` | GET | `CODE_SU` | `getOrderDataDump` | `retrieveOrderList()` | — | none | Full order dump | `orders` |
| C15 | `/get/data-dump/order-item` | GET | `CODE_SU` | `getOrderItemDataDump` | `OrderItemDAOController.retrieveOrderItemList()` | — | none | Full order-item dump | `order_item` |
| C16 | `/get/table-explorer/data/order-item` | GET | `CODE_SU` | `getOrderItemData` | paginated | query `page`,`size` | none | Admin projection | `order_item` |
| C17 | `/get/table-explorer/data/order-item/{id}` | GET | `CODE_SU` | `getOrderItemById` | single | path `id` | none | Admin projection | `order_item` |
| C18 | `/get/table-explorer/data/orders` | GET | `CODE_SU` | `getOrdersData` | paginated | query `page`,`size` | none | Admin projection | `orders` |
| C19 | `/get/table-explorer/data/orders/{id}` | GET | `CODE_SU` | `getOrdersById` | single | path `id` | none | Admin projection | `orders` |
| C20 | `/get/table-explorer/data/order-review-scheduled-email` | GET | `CODE_SU` | `getOrderReviewScheduledEmailData` | paginated | query `page`,`size` | none | Admin projection | `order_review_scheduled_email` |
| C21 | `/get/table-explorer/data/order-review-scheduled-email/{id}` | GET | `CODE_SU` | `getOrderReviewScheduledEmailById` | single | path `id` | none | Admin projection | `order_review_scheduled_email` |

#### `addOrder` — full verified business logic (C3, `OrderDAOController.addOrder`)
1. Set `order.tenant` from the resolved bearer-token tenant; set `order.createdAt = now()`.
2. For each `orderItem`: link back to `order`; set `orderStatus = INITIATED`; set `paymentStatus = PENDING`; set `createdAt`/`updatedAt = now()`; call `prepareCustomization(orderItem)` (private, resolves finish-profile-item selections onto the customization payload) and `setEstimatedDeliveryDates(order, orderItem)`; serialize `volumeDiscount` and `madeToOrderProfile` to JSON strings via Jackson (`objectMapper.writeValueAsString`).
3. Serialize `order.shippingMode` and `order.address` to JSON strings.
4. Fetch latest forex rate (`ForexExchangeRateDAOController.retrieveLatestForexExchangeRate()`); set `order.exchangeRate` to the USD/EUR/GBP rate matching `order.currency`, else `1.0`.
5. **Promote Google Ads attribution** (`promoteAdAttribution`): read the tenant's raw cart items; among items carrying a click id (`gclid`/`gbraid`/`wbraid`), pick the most-recently-captured ("last-click wins"); if none carry a click id, fall back to the most-recent item carrying any `utm_*` field; copy the winner's `clickId`/`clickIdType`/`clickCapturedAt`/`utmSource`/`utmMedium`/`utmCampaign` onto the order. If no cart item carries any attribution, **whatever attribution the client already put on the order payload (buy-now/skip-cart flow) is left untouched** — do not overwrite. The 30-day attribution window is enforced client-side (localStorage expiry); the backend does not re-check it.
6. Persist the order (`addNewEntity(order, true)`).
7. If persisted successfully, fire an async impact-refresh request (`impactRefreshPublisherService.requestOrderRefresh`) — fire-and-forget, does not affect the response.
8. Return the new order id.

**No server-side discount recomputation or inventory/stock decrement was found in this method** — see Module Analysis §4 Risk 3.

### C.2 Order Fulfillment

| # | Route | Method | Auth | Handler | Business Logic | DB Tables |
|---|---|---|---|---|---|---|
| C22 | `/add/order/fulfillment` | POST | (superuser, per javadoc) | `addOrderFulfillment` | Creates one partial-shipment fulfillment record; body `OrderFulfillmentRequest`; validated by `OrderFulfillmentRequestValidator`, sanitized by its sanitizer | `order_fulfillment`, `order_item_fulfillment` |
| C23 | `/update/order/fulfillment` | PATCH | (superuser) | `updateOrderFulfillment` | Updates an existing fulfillment record (must include id) | `order_fulfillment` |
| C24 | `/get/super-user/order/{orderId}/fulfillment-list` | GET | `CODE_SU` | `getSuperUserOrderFulfillmentList` | All fulfillments for an order | `order_fulfillment` |
| C25 | `/get/customer/order/{orderId}/fulfillment-list` | GET | `CODE_CU` | `getCustomerOrderFulfillmentList` | Fulfillments scoped to the authenticated customer's order | `order_fulfillment` |
| — | `/get/table-explorer/data/order-fulfillment[/{id}]` | GET | `CODE_SU` | (table-explorer pair) | Admin projections | `order_fulfillment` |

*Note: this fulfillment sub-resource is additive — the legacy whole-order shipment endpoint (`UPDATE_ORDER_SHIPMENT`, C4) is preserved unchanged alongside it, per source javadoc ("without changing the legacy whole-item shipment endpoint").*

### C.3 Order Ready

| # | Route | Method | Auth | Business Logic | DB Tables |
|---|---|---|---|---|---|
| C26 | `/add/order/ready` | POST | (superuser) | Creates one internal "received/ready" record; body `OrderReadyRequest`, validated by `OrderReadyRequestValidator` | `order_ready`, `order_item_ready` |
| C27 | `/update/order/ready` | PATCH | (superuser) | Updates a ready record (must include id) | `order_ready` |
| C28 | `/get/super-user/order/{orderId}/ready-list` | GET | `CODE_SU` | List ready records for an order | `order_ready` |

### C.4 Order Preview (admin search)

| # | Route | Method | Auth | Business Logic | DB Tables |
|---|---|---|---|---|---|
| C29 | `/get/super-user/order-list` | GET | `CODE_SU` | Standard superuser order list (paginated) | `orders_preview` |
| C30 | `/get/super-user/order-list/search` | GET | `CODE_SU` | Keyword search: keyword interpreted as order id, encoded email, customer name fragment, or SKU fragment; query params `keyword`(required), `pageNumber`(default 0), `pageSize`(default 50) | `orders_preview` |

---

## D. Custom Order (`order/controller/CustomOrderController.java`, `CustomOrderFulfillmentController.java`, `CustomOrderReadyController.java`, `CustomOrderPreviewController.java`, `CustomOrderAdjustmentController.java`)

### D.1 Custom Order core

| # | Route | Method | Auth | Handler | Validation | Business Logic | DB Tables |
|---|---|---|---|---|---|---|---|
| D1 | `/get/super-user/custom-order/{orderId}` | GET | `CODE_SU` | `getSuperUserOrder` | — | Custom order detail | `custom_order`, `custom_order_item` |
| D2 | `/get/customer/custom-order/{orderId}` | GET | `CODE_CU` | `getCustomerCustomOrder` | — | Detail scoped to caller | `custom_order`, `custom_order_item` |
| D3 | `/add/custom-order` | POST | `CODE_SU` | `addOrder` | `CustomOrderValidator` → delegates to `itemValidator.validateOrderItems(entity.getOrderItems())` **only** — no order-level field checks (source has a `// TODO: add proper validation logic` comment; **preserve as-is**) | Staff-created bespoke order, no cart involved | `custom_order`, `custom_order_item` |
| D4 | `/update/custom-order` | PATCH | `CODE_SU` | `updateOrder` | same `CustomOrderValidator` | Full update | `custom_order`, `custom_order_item` |
| D5 | `/update/custom-order/global-note` | PATCH | `CODE_SU` | `updateCustomOrderGlobalNote` | validated payload carries custom order id + note text | Updates internal `global_note` only; leaves customer-facing note untouched | `custom_order` |
| D6 | `/update/custom-order/shipment` | PATCH | `CODE_SU` | `updateOrderShipment` | — | Legacy whole-order shipment update (mirrors C4) | `custom_order` |
| D7 | `/update/custom-order-info` | PATCH | `CODE_SU` | `updateCustomOrderInfo` | — | Updates misc custom order info fields | `custom_order` |
| D8 | `/cancel/custom-order` | DELETE | `CODE_SUCU` | `cancelOrder` | — | Mirrors C7 for custom orders | `custom_order` |
| D9 | `/delete/custom-order/{orderId}` | DELETE | `CODE_SU` | `deleteOrder` | — | Delete by id | `custom_order` |
| D10 | `/send/email/confirmed-custom-order/{orderId}` | POST | `CODE_SU` | `sendCustomOrderConfirmationEmail` | — | Confirmation email | (side-effect only) |
| D11 | `/update/custom-order-item` | PATCH | `CODE_SU` | `updateCustomOrderItem` | `CustomOrderItemUpdateValidator` | Updates one line item | `custom_order_item` |
| D12 | `/delete/custom-order-item/{orderItemId}` | DELETE | `CODE_SU` | `deleteCustomOrderItem` | — | Deletes one line item | `custom_order_item` |
| D13 | `/add/custom-order-items` | PATCH *(note: verb is PATCH, not POST, per source)* | `CODE_SU` | `addNewOrderItems` | `NewCustomOrderItemAddValidator` | Appends new line items to an existing custom order | `custom_order_item` |
| D14 | `/get/data-dump/custom-order` | GET | `CODE_SU` | `getCustomOrderDataDump` | — | Full dump | `custom_order` |
| D15 | `/get/data-dump/custom-order-item` | GET | `CODE_SU` | `getCustomOrderItemDataDump` | — | Full dump | `custom_order_item` |
| D16–D19 | `/get/table-explorer/data/custom-order[/{id}]`, `/get/table-explorer/data/custom-order-item[/{id}]` | GET | `CODE_SU` | — | — | Admin projections | `custom_order`, `custom_order_item` |
| D20 | `/get/customer/custom-order-list` | GET | `CODE_CU` | — | — | Preview list for caller | `custom_order_preview` |

### D.2 Custom Order Fulfillment / Ready / Preview / Adjustment
Structurally identical to §C.2–C.4, scoped to `CustomOrder`:

| # | Route | Method | Auth | Business Logic | DB Tables |
|---|---|---|---|---|---|
| D21 | `/add/custom-order/fulfillment` | POST | (superuser) | Create partial fulfillment; `CustomOrderFulfillmentRequestValidator` + sanitizer | `custom_order_fulfillment`, `custom_order_item_fulfillment` |
| D22 | `/update/custom-order/fulfillment` | PATCH | (superuser) | Update fulfillment | `custom_order_fulfillment` |
| D23 | `/get/super-user/custom-order/{orderId}/fulfillment-list` | GET | `CODE_SU` | List | `custom_order_fulfillment` |
| D24 | `/get/customer/custom-order/{orderId}/fulfillment-list` | GET | `CODE_CU` | List scoped to caller | `custom_order_fulfillment` |
| D25 | `/add/custom-order/ready` | POST | (superuser) | Create ready record; `CustomOrderReadyRequestValidator` | `custom_order_ready`, `custom_order_item_ready` |
| D26 | `/update/custom-order/ready` | PATCH | (superuser) | Update ready record | `custom_order_ready` |
| D27 | `/get/super-user/custom-order/{orderId}/ready-list` | GET | `CODE_SU` | List | `custom_order_ready` |
| D28 | `/get/super-user/custom-order-list` | GET | `CODE_SU` | Standard list | `custom_order_preview` |
| D29 | `/get/super-user/custom-order-list/search` | GET | `CODE_SU` | Keyword search (same semantics as C30) | `custom_order_preview` |
| D30 | `/add/custom-order-adjustment` | POST | `CODE_SU` | Adds a manual price-adjustment line (`particular`, `adjustmentAmount`, `currency`, `adjustmentType`, `sortOrder`) | `custom_order_adjustment` |
| D31 | `/update/custom-order-adjustment` | PATCH | `CODE_SU` | Updates an adjustment line | `custom_order_adjustment` |
| D32 | `/delete/custom-order-adjustment/{adjustmentId}` | DELETE | `CODE_SU` | Deletes an adjustment line | `custom_order_adjustment` |
| D33 | `/get/super-user/order/feedback/{feedbackId}` *(shared feedback GET, by id)* | GET | `CODE_SU` | Admin projection | `custom_order_adjustment` |
| D34 | table-explorer pair for adjustments | GET | `CODE_SU` | Admin projections | `custom_order_adjustment` |

**`CustomOrderAdjustment` fields (verified):** `customOrder` (FK), `adjustmentType` (int, default 1), `particular` (string, line description), `adjustmentAmount` (double), `currency`, `sortOrder` (int, default 0).

---

## E. Payment

### E.1 Razorpay (`payment/controller/RazorpayPaymentController.java`)

| # | Route | Method | Auth | Handler | DTO | Validation | Business Logic | DB Tables |
|---|---|---|---|---|---|---|---|---|
| E1 | `/create/payment-session` | POST | `CODE_CU` | `createPaymentSession` | `RazorpayPaymentRequest` | `RazorpayPaymentOrderValidator` — **stub, always returns `true` (source `// TODO: implement validation`); preserve as-is** | Creates a Razorpay order/session for the authenticated customer via `daoController.createSession(tenant, paymentRequest)`; returns a **custom response** (not the standard envelope) | `razorpay_transaction` |
| E2 | `/update/payment/success` | POST | `CODE_CU` | `updateTransactionSuccess` | `RazorpayPaymentSuccessRequest` | `RazorpayPaymentSuccessRequestValidator` | Client-reported payment success; **trust boundary for this client-driven confirmation was not located in the controller — verify signature/amount check inside `RazorpayTransactionDAOController.updateTransactionSuccess` before treating the client POST as authoritative in the migrated version** | `razorpay_transaction`, `orders` (payment status) |
| E3 | `/update/payment/failure` | POST | `CODE_CU` | `updateTransactionFailure` | `RazorpayPaymentFailureRequest` | `RazorpayPaymentFailureRequestValidator` | Client-reported payment failure | `razorpay_transaction`, `orders` |
| E4 | `/get/data-dump/transaction` | GET | `CODE_SU` | `getTransactionDataDump` | — | none | Full Razorpay transaction dump | `razorpay_transaction` |
| E5 | `/update/payment/transaction` | POST | `CODE_SU` | `updatePaymentTransaction` | `RazorpayPaymentUpdateRequest` | `RazorpayPaymentUpdateRequestValidator` | Manual superuser correction of a transaction record | `razorpay_transaction` |
| E6 | `/get/table-explorer/data/razorpay-transaction` | GET | `CODE_SU` | `getRazorpayTransactionData` | query `page`,`size` | none | Admin projection | `razorpay_transaction` |
| E7 | `/get/table-explorer/data/razorpay-transaction/{id}` | GET | `CODE_SU` | `getRazorpayTransactionById` | path `id` | none | Admin projection | `razorpay_transaction` |

**`RazorpayTransaction` fields (verified):** `razorpayOrderId`, `order` (FK, `orders`), `amount`, `paymentType` (default `"advance"`), `currency`, `transactionId`, `transactionSignature`, `status` (`TRANSACTION_STATUS`), `failedErrorCode` (default -1), `failedErrorMessage`, `dataDump` (raw payload), `createdAt`.

### E.2 Stripe (`payment/controller/StripePaymentController.java`)

| # | Route | Method | Auth | Handler | DTO | Validation | Business Logic | DB Tables |
|---|---|---|---|---|---|---|---|---|
| E8 | `/create/stripe/payment-session` | POST | `CODE_CU` | `createStripePaymentSession` | `StripePaymentOrder` | `StripePaymentValidator`: `customerEmail` 5–255 chars; `currency` must be a valid `CURRENCY_ENUM`; `totalAmount > 0`; `loomOrderId > 0`; `paymentType` must be `"advance"` or `"remaining"` | Creates a Stripe Checkout session; returns a **custom response** containing the checkout URL/session id | `stripe_transaction` |
| E9 | `/get/table-explorer/data/stripe-transaction` | GET | `CODE_SU` | `getStripeTransactionData` | query `page`,`size` | none | Admin projection | `stripe_transaction` |
| E10 | `/get/table-explorer/data/stripe-transaction/{id}` | GET | `CODE_SU` | `getStripeTransactionById` | path `id` | none | Admin projection | `stripe_transaction` |

**`StripeTransaction` fields (verified):** `stripeSessionId`, `stripePaymentIntentId`, `order` (FK), `amount`, `paymentType` (default `"advance"`), `currency`, `checkoutUrl`, `status` (`TRANSACTION_STATUS`), `failedErrorCode`(-1)/`failedErrorMessage`, `dataDump` (map), `createdAt`, `paymentMethod` (default `"card"`), `webhookReceived` (bool), `webhookReceivedAt`, `webhookDataDump`, `webhookEventType`.

### E.3 Stripe Webhook (`payment/webhook/controller/StripeWebhookController.java`) — **source of truth for Stripe state**

| # | Route | Method | Auth | Business Logic |
|---|---|---|---|---|
| E11 | `/checkout/stripe/webhook` | POST | None (unauthenticated route) — but **IP-allowlisted** to Stripe's published webhook IPs (`3.18.12.63`, `3.130.192.231`, `13.235.14.237`, `13.235.122.149`, `18.211.135.69`, `35.154.171.200`, `52.15.183.38`, `54.88.130.119`, `54.88.130.237`, `54.187.174.169`, `54.187.205.235`, `54.187.216.72`) via `@NVerseDomainValidated(headerKeys={"Stripe-Signature"}, headerValues={...})`, AND HMAC-verified via `Stripe.Webhook.constructEvent(payload, signatureHeader, webhookSecret)` (secret from `payment.stripe.webhook.secret` config) | On signature failure → `400` with the exception message. Otherwise dispatches by event type (`StripeWebhookEvent.fromString(event.getType())`): `CHECKOUT_SESSION_COMPLETED` / `CHECKOUT_SESSION_ASYNC_PAYMENT_SUCCEEDED` → `handlePaymentSuccess`; `CHECKOUT_SESSION_ASYNC_PAYMENT_FAILED` / `CHECKOUT_SESSION_EXPIRED` → `handlePaymentFailure`; `PAYMENT_INTENT_CREATED` → `handlePaymentIntentCreated`; `PAYMENT_INTENT_PAYMENT_FAILED` → `handlePaymentIntentFailed`; `PAYMENT_INTENT_CANCELED` → `handlePaymentIntentCancelled`; unrecognized event types → `200 OK` with body `"Unhandled event type: {type}"` (not an error). All handlers delegate to `StripeTransactionDAOController`; if the event's data object fails to deserialize, a `400` is *constructed* but **not actually returned** (source builds `ResponseEntity.status(400)...` but the method is `void` and the built response is discarded — the outer handler still returns `200 "Success"` in that case). **Flagging this exact behavior since it looks like a bug but must be preserved as-is per your instructions**, unless the team explicitly approves fixing it during migration (tracked in the checklist). |

---

## F. Cross-cutting notes for every endpoint above

- **CORS**: every controller is annotated `@CORSPermittedRestController` — a shared CORS policy, not endpoint-specific; confirm the concrete allowed-origins list from `configuration/` before migrating (not analyzed here — out of Core Commerce scope but needed for the Next.js API layer / edge config).
- **Domain validation**: every controller (except the Stripe webhook, which uses IP+signature instead) is annotated `@NVerseDomainValidated` — an additional request-origin check beyond auth token validation. Preserve as an equivalent Next.js middleware check.
- **Sanitization**: mutating endpoints run a dedicated `*Sanitizer` **before** validation (verified pattern: sanitize → validate → persist). The migration's validation layer must replicate this ordering (e.g. Zod `.transform()` before `.refine()`, or an explicit sanitize step before schema parsing).
- **Response envelope**: `RainTreeResponse` on writes typically carries `{success: boolean, message: string, data: <id or object>}`; several endpoints use an "enhanced" variant (`postEntityEnhancedResponse` / `idEnhancedResponse`) that additionally surfaces the created entity's id distinctly — confirm exact JSON shape from the `raintree` package before finalizing the target API's response DTOs (not fully enumerated here — flag as "Not found in current repository" for the *exact* serialized shape, though the semantic contract is verified).
