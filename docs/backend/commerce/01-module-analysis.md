# Core Commerce Module — Analysis
Source verified against: `loom-c90d2c239f3eef3075e40527418922a17c2aaddd` (Spring Boot / Java, package root `com.bloomscorp.loom`)

> Scope note: The target repo structure describes `apps/api/src/commerce/ # catalog, cart, checkout, orders, customers, payments`. The current Loom backend has no single "commerce" package — these concerns live in five sibling top-level packages: `cart`, `catalog`, `order` (covers both standard orders and "custom orders" — the checkout/order surface), and `payment` (Stripe + Razorpay + webhook). There is no dedicated "customers" package; customer/tenant identity is owned by the `tenant` package under Identity, which is already migrated per your instructions and is treated here strictly as an upstream dependency, not re-analyzed. This document therefore scopes **Core Commerce = Cart + Catalog + Order/CustomOrder + Payment**.

---

## 1. Responsibilities

### 1.1 Cart (`cart/`)
- Owns the customer's pre-checkout basket (`CartItem` entity).
- Supports fabric, finished-good and swatch product groups, each carrying different selection metadata (selected fabric, size option, finish list, custom size).
- Tracks marketing attribution (`clickId`, `utmSource/Medium/Campaign`) captured at add-to-cart time, later promoted onto the `Orders` record at checkout (see §4).
- Provides super-user analytics: a tenant-wide cart overview (abandoned cart detection) and a table-explorer admin data view.

### 1.2 Catalog (`catalog/`)
- Owns artisan-curated product catalogs shown to customers/wholesale buyers: `Catalog` (a named collection) → `CatalogItem` (line entries with price/qty/unit) → `CatalogItemMedia` (images/attachments per item).
- Owns asynchronous catalog PDF generation and its history (`CatalogPdfDownloadHistory`), including a long-poll "wait for completion" flow.
- Enforces a two-tier authorization model throughout: **superuser** (any catalog) vs **artisan** (only catalogs/items/media owned by that artisan, verified by walking the `CatalogItem → Catalog → Artisan` ownership chain on every mutating/disclosing artisan-scoped call).

### 1.3 Order / Custom Order (`order/`)
This is the largest sub-domain and covers the checkout → fulfillment → post-sale lifecycle for two parallel order types:
- **Standard orders** (`Orders`/`OrderItem`) — in-stock or made-to-order items placed through the normal cart → checkout flow.
- **Custom orders** (`CustomOrder`/`CustomOrderItem`) — bespoke/negotiated orders created directly by staff (no cart involved), supporting manual price adjustments (`CustomOrderAdjustment`) and CC'd emails.

Shared sub-concerns (each duplicated in parallel for standard vs. custom orders):
- **Fulfillment** — partial shipment records (`OrderFulfillment`/`OrderItemFulfillment`, `CustomOrderFulfillment`/`CustomOrderItemFulfillment`), additive to the legacy whole-order shipment fields still on `Orders`/`CustomOrder`.
- **Ready** — internal "received into ready-to-ship" records (`OrderReady`/`OrderItemReady`, `CustomOrderReady`/`CustomOrderItemReady`).
- **Preview** — flattened, search-optimized read projections (`OrdersPreview`/`OrderItemPreview`, `CustomOrderPreview`/`CustomOrderItemPreview`) used for admin list/search screens (search by order id, encoded email, customer name fragment, or SKU fragment).
- Order-level feedback, review-scheduling emails, workflow status linkage (ArtisanFlow — out of scope per your instructions, only referenced), and loyalty-program order info.
- Google Ads click/UTM attribution promotion from cart → order at order-creation time.
- Multi-currency exchange-rate snapshotting at order-creation time (USD/EUR/GBP vs. base currency).

### 1.4 Payment (`payment/`)
- Two independent payment gateways, each with its own transaction ledger entity:
  - **Razorpay** (`RazorpayTransaction`) — session creation, and explicit customer-driven success/failure callbacks plus a superuser manual-update endpoint.
  - **Stripe** (`StripeTransaction`) — session creation plus an authenticated Stripe webhook (`payment/webhook/`) that is the actual source of truth for Stripe payment state (checkout session completed/expired, payment-intent created/failed/cancelled), IP-allowlisted to Stripe's published webhook IP ranges and HMAC-verified via `Stripe-Signature`.
- `PAYMENT_MODE` on `Orders` records which gateway (or `BANK`/`COD`) was used; `TRANSACTION_STATUS` (`CREATED`/`PAID`/`FAILED`) tracks each transaction row independently of order-level `PAYMENT_STATUS` (`PENDING`/`PREPAID`/`PAID`/`FAILED`).

---

## 2. Dependencies

### 2.1 Upstream (Core Commerce depends on, does not own)
| Dependency | Package | Nature |
|---|---|---|
| Tenant / identity / auth | `tenant`, `nverse` (`NVerseAuthorityResolver`, `NVerseGatekeeper`) | Every endpoint resolves the acting `LoomTenant` from the bearer token via `NVerseAuthorityResolver`; authorization is enforced by `NVerseGatekeeper` action codes `CODE_SU=1` (superuser), `CODE_CU=2` (customer user), `CODE_AR=3` (artisan), `CODE_SUCU=4` (superuser-or-customer). **Already migrated — not re-documented here.** |
| Artisan | `artisan` (`ArtisanDAOController`) | Catalog ownership resolution. |
| Product | `product/product` (`FabricPreview`, `FinishedPreview`, product previews), `profile/finish`, `profile/size_profile` | Cart items and order items reference fabric/finished product previews, selected finish items, size profile options — all read-only lookups from Product/Profile modules. **Not migrated in this pass** — flagged as an external dependency; see §4 Risks. |
| Discount / Volume discount | `discount`, `profile/volume_discount` | Coupon codes and per-item volume discount snapshots appear on `Orders`/`OrderItem` but the discount *calculation* engine lives outside this module. **Not found in current repository within the analyzed files** — order-side code only stores/validates pre-computed discount values; no discount-calculation logic was located inside `order/`, `cart/`, `catalog/`, or `payment/`. |
| Forex | `forex` (`ForexExchangeRateDAOController`) | `addOrder` snapshots the latest USD/EUR/GBP exchange rate onto the order. |
| Impact / analytics | `impact` (`ImpactRefreshPublisherService`) | Fire-and-forget refresh trigger after order creation. |
| Notifications | `notifire`/email, `whatsapp` (`OrderEmailNotificationService`, `WhatsappNotificationAdapterService`) | Order confirmation, prepared-order, and review-scheduled emails; WhatsApp notifications on order events. |
| Workflow (ArtisanFlow) | `workflow` (`WorkflowDAOController`) | Order detail responses enrich with workflow status; explicitly out of scope per your instructions (clean extraction seam already identified in target architecture). |
| Address | `address` (`AddressValidator`) | Order address payload is validated by the Address module's validator. |
| Zoho | `zoho`, `zoho_adapter` | `zohoOrderId`/`zohoPackageId` fields are populated by an external Zoho sync (webhook path `/zoho/webhook/sales-order`) — **not part of Core Commerce**, treated as an external integration writing into commerce tables. |
| Framework infra | `behemoth` (`CRUDController`, `BehemothCRUDDAOController`, `BehemothORM`), `raintree` (`RainTree`/`RainTreeResponse`), `alfred` (`LoomLogBook`, `LoomCronManager`), `nverse` sanitizers/validators framework, `pastebox` (`Pastebox` utility, time helpers) | Proprietary in-house framework the migration must replace with target-stack equivalents (Next.js route handlers/Server Actions, a service+repository layer, structured logging, Zod validation). |

### 2.2 Downstream (things that depend on Core Commerce)
- `workflow` (ArtisanFlow) reads order/order-item ids to attach production workflow status.
- `impact` reads order data for impact aggregation/reporting.
- `ads_conversion` reads attributed orders (`retrieveAttributedOrders`) for ad-spend reporting.
- `zoho`/`zoho_adapter` sync order/package ids outward to Zoho Inventory/Books.
- `loyaltyprogram` reads customer order history for loyalty program eligibility/info.

---

## 3. Database Entities (verified from `orm` packages)

| Entity | Table (via `*Contract.TABLE`) | Module | Key relationships |
|---|---|---|---|
| `CartItem` | cart item table | cart | → `LoomTenant` (owner), references `fabricProductId`/`finishedProductId`/`selectedFabricId`/`selectedSizeOptionId` (product/profile FKs, not owned here) |
| `Catalog` | catalog table | catalog | → `Artisan` (owner), 1—N `CatalogItem` |
| `CatalogItem` | catalog item table | catalog | → `Catalog`, 1—N `CatalogItemMedia` |
| `CatalogItemMedia` | catalog item media table | catalog | → `CatalogItem` |
| `CatalogPdfDownloadHistory` | catalog pdf table | catalog | → `Artisan`/`Catalog` (generation request + status) |
| `Orders` | orders table | order | → `LoomTenant`, 1—N `OrderItem`, 1—N `RazorpayTransaction` |
| `OrderItem` | order item table | order | → `Orders` |
| `OrderFulfillment` | order fulfillment table | order | → `Orders`, 1—N `OrderItemFulfillment` |
| `OrderItemFulfillment` | order item fulfillment table | order | → `OrderFulfillment`, → `OrderItem` |
| `OrderReady` | order ready table | order | → `Orders`, 1—N `OrderItemReady` |
| `OrderItemReady` | order item ready table | order | → `OrderReady`, → `OrderItem` |
| `OrdersPreview` / `OrderItemPreview` | read-projection views/tables | order | Search-optimized denormalized projections of `Orders`/`OrderItem` |
| `OrderReviewScheduledEmail` | scheduled email table | order | → `Orders` |
| `CustomOrder` | custom order table | order | → `LoomTenant`, 1—N `CustomOrderItem`, 1—N `CustomOrderAdjustment` |
| `CustomOrderItem` | custom order item table | order | → `CustomOrder` |
| `CustomOrderAdjustment` | custom order adjustment table | order | → `CustomOrder` (manual price line items) |
| `CustomOrderFulfillment` / `CustomOrderItemFulfillment` | — | order | Mirrors standard-order fulfillment, scoped to `CustomOrder` |
| `CustomOrderReady` / `CustomOrderItemReady` | — | order | Mirrors standard-order ready records, scoped to `CustomOrder` |
| `CustomOrderPreview` / `CustomOrderItemPreview` | — | order | Search projection mirror for custom orders |
| `RazorpayTransaction` | razorpay transaction table | payment | → `Orders` |
| `StripeTransaction` | stripe transaction table | payment | → `Orders` |
| `StripeWebhookEvent` | (enum, not a table) | payment/webhook | Maps Stripe's `event.type` strings to a typed enum |

**Enums**: `ORDER_STATUS` (`INITIATED, PROCESSING, CANCELLED, IN_TRANSIT, PARTIALLY_DISPATCHED, DISPATCHED, DELIVERED, FAILED`), `PAYMENT_STATUS` (`PENDING, PREPAID, PAID, FAILED`), `PAYMENT_MODE` (`RAZORPAY, STRIPE, BANK, COD`), `TRANSACTION_STATUS` (`CREATED, PAID, FAILED`), `ORDER_TYPE` (`IN_STOCK, MADE_TO_ORDER, PRE_ORDER`, defined in `cart.orm`, reused by order items).

---

## 4. Risks

1. **Cross-module coupling to Product/Profile is deep and bidirectional at the DAO layer.** `CartItemDAOController` directly injects `FabricPreviewDAOController`, `FinishedPreviewDAOController`, `FinishProfileItemDAOController`, `SizeProfileOptionDAOController` to enrich cart items before returning them. A commerce-only migration must define a clean read-only contract (repository interface / API boundary) against Product & Profile rather than re-implementing those modules — attempting to migrate Cart in isolation without that boundary will break enrichment.
2. **JSON-in-column fields.** Several fields are stored as serialized JSON strings inside otherwise relational columns: `Orders.shippingMode`, `Orders.address`, `OrderItem.volumeDiscount`, `OrderItem.madeToOrderProfile`, `CartItem.customSize`. The migration must decide whether to preserve this pattern (JSONB columns in Postgres/Prisma `Json` type) or normalize — **preserving it is the lower-risk default** since business logic (e.g. `objectMapper.convertValue(entity.getAddress(), OrderAddress.class)` in `OrdersValidator`) depends on round-tripping the exact shape.
3. **Discount-calculation and inventory-decrement logic were not located inside Cart/Catalog/Order/Payment.** `addOrder` persists `order.getOrderItems()` with client-supplied `volumeDiscount`, `saleDiscountPercentage`, `autoDiscount`, `couponDiscount` values as given — no server-side recomputation or stock decrement was found in `OrderDAOController.addOrder`. This is either (a) computed client-side and trusted, or (b) computed by a module not yet analyzed (Discount/Inventory). **Flagging explicitly rather than inventing logic**: "Not found in current repository" for server-side discount/stock validation within Core Commerce. This must be confirmed before the migrated `addOrder` server action is treated as the sole source of truth for pricing.
4. **Two independent, structurally different payment gateways with different trust models.** Razorpay's success/failure endpoints are called by the *client* (`CODE_CU`), meaning the client self-reports payment success — trust boundary lives in Razorpay signature verification inside the DAO layer (not directly visible in the controller; needs confirmation before treating this as informational-only vs. authoritative). Stripe's state instead flows exclusively through a signed server-to-server webhook. **Migrating Razorpay's flow naively (trusting the client POST) without preserving the DAO-layer signature check would be a security regression.**
5. **Validators with `// TODO` stubs are load-bearing today.** `RazorpayPaymentOrderValidator.validate()` always returns `true` and `CustomOrderValidator.validate()` only delegates to item validation (no order-level checks) — these are not migration bugs to "fix" but **existing production behavior that must be preserved as-is** per your instruction not to invent stricter validation.
6. **Dual CRUD surface per entity** (`*Controller` = REST + `*DAOController` = persistence/business-logic, despite the confusing "DAO" name doing far more than data access — e.g. cart enrichment, order email dispatch, ad-attribution promotion). The migration's service/repository split must map `*Controller` → Next.js route handler / Server Action, and `*DAOController` → service layer (business logic) + repository layer (Prisma/ORM calls) — these two responsibilities are currently fused and should be **separated** during migration even though the source doesn't separate them, since the target architecture's repository layer is a new concept being introduced.
7. **Table-explorer / data-dump endpoints are numerous and admin-only.** Every entity exposes `GET_TABLE_EXPLORER_DATA_*` (paginated) and `*_BY_ID` admin projection endpoints. These add ~2 endpoints per entity (≈20+ across Core Commerce) that are mechanically identical in shape — worth generating from a shared pattern in the target stack rather than hand-writing each.
8. **Superuser vs. artisan ownership-chain checks in Catalog are re-implemented per endpoint** (e.g. `CatalogItemMedia → CatalogItem → Catalog → Artisan`). Any change to this chain must be updated in every controller method that repeats it; the migration is an opportunity to centralize this as a single authorization policy function, without changing the resulting authorization behavior.

## 5. Migration Strategy

1. **Define the Product/Profile read boundary first** (a typed client/interface for fabric preview, finished preview, size profile option, finish profile item lookups) so Cart and Order migration isn't blocked on migrating Product/Profile wholesale. This can be a thin repository interface backed by direct DB reads (same database, Prisma models for the read-only tables) until those modules are migrated in a later phase.
2. **Migrate Payment first, in isolation**, since it has the smallest, most self-contained surface (5 controllers, 3 entities, no dependency on Cart/Catalog) and the Stripe webhook's signature-verification logic must be proven correct in the new stack before anything depends on it.
3. **Migrate Cart second** — small (2 controllers, 1 entity) but exercises the Product/Profile read boundary defined in step 1.
4. **Migrate Catalog third** — self-contained except for Artisan ownership checks (small, well-defined interface) and async PDF generation (may initially remain a synchronous-looking call to a queue/worker rather than a literal port of the Java `DeferredResult` long-poll pattern — flag as a technical adaptation decision for the team, not a business-logic change).
5. **Migrate standard Order last**, since it's the largest surface and integrates Cart (ad-attribution promotion), Payment (transaction linkage), Forex, Notification, Workflow (read-only), and Impact.
6. **Migrate Custom Order in parallel with, or immediately after, standard Order**, reusing the same fulfillment/ready/preview/adjustment patterns established there — the two are structurally parallel enough that shared service abstractions should be extracted (e.g. a generic `FulfillmentService<TOrder>` if the target stack's typing supports it), without deduplicating them if doing so would change behavior; when in doubt, keep them separate and verified rather than force a shared abstraction.
7. **Preserve exact route strings, HTTP verbs, and status/validation behavior** at every step; introduce Next.js-idiomatic paths only via a compatibility layer, not by breaking the existing contract, unless the team explicitly signs off per endpoint (tracked in the Migration Checklist, §4 in the companion document).
