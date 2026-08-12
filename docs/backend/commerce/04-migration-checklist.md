# Core Commerce Module — Migration Checklist

> **Status: check marks are stale (2026-08-12).** Every item below reads "Not started"; the commerce
> module has since been built. Do not use the status column. The **testing checklists** in the right-hand
> column ARE current and largely unaddressed — `apps/api` ships 2 test files for ~42,700 lines, so treat
> that column as a test backlog. See `docs/TESTING.md` and `docs/KNOWN-GAPS.md`.

Status legend: 🔲 Not started · 🟡 Needs a team decision before starting (see note) · — all items below start at 🔲 unless flagged.

## Cart

| API | Status | Files to create | Files to migrate/reference | Dependencies | Testing checklist |
|---|---|---|---|---|---|
| A1–A9 (all Cart endpoints) | 🔲 | `cart.controller.ts`, `cart.service.ts`, `cart.repository.ts`, `cart.validation.ts`, `dto/*` | Source: `CartController.java`, `CartItemDAOController.java`, `CartItemValidator.java`, `CartItem.java` | `ProductCatalogClient` (Risk #1) must exist first; Identity/tenant auth | Unit: validator rules (fabric/finished id requirement, quantity ≥0.5, unit/orderType enum checks) exactly match source. Integration: A3 enrichment returns fabric/finished preview + selected size/finish data. A5 tenant overview totals match a manually computed fixture. A9 clears full cart only for caller's tenant (no cross-tenant leakage). |

## Catalog

| API | Status | Files to create | Files to migrate/reference | Dependencies | Testing checklist |
|---|---|---|---|---|---|
| B1–B13 (Catalog) | 🔲 | `catalog.controller.ts`, `catalog.service.ts`, `catalog.repository.ts`, `catalog.authorization.ts` | `CatalogController.java`, `CatalogDAOController.java`, `Catalog.java` | `ArtisanDAOController`/Artisan module read access | B3: confirm with product whether the unfiltered `limit` behavior (verified bug/TODO) should be preserved or fixed — **🟡 needs team decision**, tracked as its own task. B9/B11: artisan-forced-id and ownership re-check produce `NO_ACTION` equivalent on failure, not an error. |
| B14–B23 (Catalog Item) | 🔲 | `catalog-item.controller.ts`, `catalog-item.service.ts` | `CatalogItemController.java`, `CatalogItemDAOController.java` | Catalog module (parent) | B21 dual-ownership check (current catalog AND target catalog) both verified in tests, including the reassignment case. |
| B24–B27 (Catalog Item Media) | 🔲 | `catalog-item-media.controller.ts`, `catalog-item-media.service.ts` | `CatalogItemMediaController.java` | Catalog Item module | B25: 4-hop ownership chain (`Media→Item→Catalog→Artisan`) returns "not found" message, not a thrown error, on any broken link. |
| B28–B36 (Catalog PDF) | 🔲 | `catalog-pdf.controller.ts`, `catalog-pdf.service.ts`, queue/worker config | `CatalogPdfDownloadHistoryController.java`, `CatalogPdfDownloadService`, `CatalogPdfDownloadWaitService` | Async job infra (queue) not yet chosen — **🟡 needs team decision**: literal long-poll vs SSE/WebSocket for the `wait` endpoints (B31/B35) | Exception→message mapping (5 domain exceptions) tested 1:1 against source strings. |

## Order (standard)

| API | Status | Files to create | Files to migrate/reference | Dependencies | Testing checklist |
|---|---|---|---|---|---|
| C1–C21 (Order core) | 🔲 | `orders.controller.ts`, `orders.service.ts`, `orders.repository.ts`, `order-attribution.service.ts`, `orders.validation.ts` | `OrderController.java`, `OrderDAOController.java`, `OrdersValidator.java`, `Orders.java`, `OrderItem.java` | Cart (attribution source), Forex, Notification, Impact, Workflow (read-only), Address validator | **C3 `addOrder` is the highest-risk item** — write a golden-master test replaying the exact 8-step sequence from the API doc, including ad-attribution last-click-wins logic (click-id preferred, UTM fallback, no-attribution-found leaves client payload untouched), forex snapshot per currency, JSON serialization of `shippingMode`/`address`/`volumeDiscount`/`madeToOrderProfile`. Confirm with team whether server-side discount/stock validation (Risk #3) should be added — **🟡 needs team decision, do not silently add it**. |
| C22–C25 (Order Fulfillment) | 🔲 | `order-fulfillment.controller.ts`, `order-fulfillment.service.ts` | `OrderFulfillmentController.java`, `OrderFulfillmentDAOController.java` | Orders module | Confirm legacy whole-order shipment endpoint (C4) and new fulfillment sub-resource can coexist without conflicting state. |
| C26–C28 (Order Ready) | 🔲 | `order-ready.controller.ts`, `order-ready.service.ts` | `OrderReadyController.java` | Orders module | — |
| C29–C30 (Order Preview/search) | 🔲 | `order-preview.controller.ts`, `order-preview.service.ts` | `OrderPreviewController.java` | Orders preview projection | Search keyword interpretation (order id / encoded email / name fragment / SKU fragment) tested against all 4 forms. |

## Custom Order

| API | Status | Files to create | Files to migrate/reference | Dependencies | Testing checklist |
|---|---|---|---|---|---|
| D1–D20 (Custom Order core) | 🔲 | `custom-orders.controller.ts`, `custom-orders.service.ts`, `custom-orders.repository.ts` | `CustomOrderController.java`, `CustomOrderDAOController.java`, `CustomOrderValidator.java` | Notification, Address | **Preserve the intentionally weak `CustomOrderValidator` (item-only check, no order-level fields)** — do not strengthen without sign-off. Confirm the `/add/custom-order-items` route's `PATCH` verb (not `POST`) is intentional before "fixing" it — **🟡 needs team decision**. |
| D21–D24 (Fulfillment) | 🔲 | `custom-order-fulfillment.controller.ts`, service | `CustomOrderFulfillmentController.java` | Custom Orders module | — |
| D25–D27 (Ready) | 🔲 | `custom-order-ready.controller.ts`, service | `CustomOrderReadyController.java` | Custom Orders module | — |
| D28–D29 (Preview/search) | 🔲 | `custom-order-preview.controller.ts`, service | `CustomOrderPreviewController.java` | Preview projection | Same 4-form search test as C29–C30. |
| D30–D34 (Adjustment) | 🔲 | `custom-order-adjustment.controller.ts`, service | `CustomOrderAdjustmentController.java`, `CustomOrderAdjustment.java` | Custom Orders module | `sortOrder` default 0, `adjustmentType` default 1 preserved. |

## Payment

| API | Status | Files to create | Files to migrate/reference | Dependencies | Testing checklist |
|---|---|---|---|---|---|
| E1–E7 (Razorpay) | 🔲 | `razorpay-payment.controller.ts`, service, repository | `RazorpayPaymentController.java`, `RazorpayTransactionDAOController.java` | Orders module (transaction↔order FK) | **🟡 Security-critical**: before porting E2/E3 as client-trusted endpoints, locate and preserve whatever server-side signature/amount verification exists inside the Java DAO layer. Do not port as a bare "trust the client" endpoint without this confirmation — flag to security review explicitly. `RazorpayPaymentOrderValidator` stub (`return true`) preserved as-is unless team signs off on adding real validation. |
| E8–E10 (Stripe) | 🔲 | `stripe-payment.controller.ts`, service | `StripePaymentController.java` | Orders module | `StripePaymentValidator` rules (email length, currency enum, amount>0, orderId>0, paymentType in {advance,remaining}) unit-tested exactly. |
| E11 (Stripe Webhook) | 🔲 | `stripe-webhook.controller.ts`, `stripe-webhook.service.ts` | `StripeWebhookController.java` | Stripe SDK, Orders/StripeTransaction | **Highest-risk item in Payment**: signature verification test (valid/invalid/missing signature), IP allowlist test, full event-type dispatch table test (5 handled cases + default), and the "malformed payload still returns 200" edge case explicitly preserved and commented in code as intentional-per-source, with a linked ticket for the team to decide whether to fix it. |

## Cross-cutting

| Item | Status | Notes |
|---|---|---|
| `ProductCatalogClient` read boundary | 🔲 | Blocks Cart and Order migration (Risk #1). Must be built first. |
| Centralized Catalog ownership-chain authorization | 🔲 | Replaces per-endpoint repetition (Risk #8) — behavior-preserving refactor. |
| Table-explorer / data-dump admin endpoints (≈25 across all sub-modules) | 🔲 | Recommend a shared generic admin-pagination controller/service factory rather than hand-writing each — mechanically identical shape verified across every entity. |
| Response envelope decision | 🟡 | Standardize on real HTTP status codes vs. preserving the "always-200-with-envelope" RainTree pattern — needs team sign-off (see Migration Design §9). |
| Legacy route paths vs. REST-conventional paths | 🟡 | Needs team decision (see Migration Design §3 note) — affects every single endpoint's final path. |
