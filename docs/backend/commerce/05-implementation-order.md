# Core Commerce Module — Implementation Order

> **Status: historical (2026-08-12).** The commerce migration was completed in a different order than
> proposed here. Kept as a record of the intended sequencing. For current state see `docs/MODULE-MAP.md`.

Small, sequential tasks. Each is scoped to be completable and independently testable/reviewable.

---

### Task 1 — Shared contracts & enums
- **Goal**: Establish `packages/types` enums (`OrderStatus`, `PaymentStatus`, `PaymentMode`, `TransactionStatus`, `OrderType`) and base response types shared across all Core Commerce sub-modules.
- **Files**: `packages/types/enums/order.ts`, `packages/types/enums/payment.ts`, `packages/types/common/response.ts`
- **Complexity**: Low
- **Dependencies**: None

### Task 2 — Product/Profile read-only client boundary
- **Goal**: Define `ProductCatalogClient` interface (fabric preview, finished preview, size profile option, finish profile item lookups) so Cart/Order can be built without waiting for Product/Profile module migration.
- **Files**: `apps/api/src/commerce/shared/product-catalog-client.ts`, its Prisma-backed implementation
- **Complexity**: Medium
- **Dependencies**: Task 1

### Task 3 — Payment: Stripe webhook (signature + dispatch)
- **Goal**: Port `StripeWebhookController` — IP allowlist, HMAC signature verification, event-type dispatch table, including the verified "malformed payload → 200" edge case.
- **Files**: `payments/stripe/stripe-webhook.controller.ts`, `stripe-webhook.service.ts`
- **Complexity**: Medium (security-sensitive)
- **Dependencies**: Task 1

### Task 4 — Payment: Stripe session creation + admin reads
- **Goal**: Port `StripePaymentController` (E8–E10).
- **Files**: `payments/stripe/stripe-payment.controller.ts`, `stripe-payment.service.ts`, `stripe-payment.repository.ts`, `dto/stripe-payment-order.dto.ts`, `stripe.validation.ts`
- **Complexity**: Low
- **Dependencies**: Task 3 (shares `StripeTransaction` model)

### Task 5 — Payment: Razorpay (session + success/failure + admin update)
- **Goal**: Port `RazorpayPaymentController` (E1–E7). **Security review checkpoint**: confirm and preserve server-side verification behind E2/E3 before marking complete.
- **Files**: `payments/razorpay/*`
- **Complexity**: Medium (security-sensitive on E2/E3)
- **Dependencies**: Task 1

### Task 6 — Cart: read + enrichment
- **Goal**: Port `getCartItemList`, `getCartItemListUsingUid`, `getCartItemListForTenants`, table-explorer reads (A1–A5).
- **Files**: `cart/cart.controller.ts` (read methods), `cart.service.ts` (read methods), `cart.repository.ts`
- **Complexity**: Medium (enrichment via `ProductCatalogClient`)
- **Dependencies**: Task 2

### Task 7 — Cart: mutations
- **Goal**: Port `addCartItem`, `updateCartItem`, `deleteCartItem`, `deleteAllCartItem` (A6–A9) with `CartItemValidator` rules ported exactly.
- **Files**: `cart/cart.validation.ts`, remaining `cart.controller.ts`/`cart.service.ts` methods
- **Complexity**: Low
- **Dependencies**: Task 6

### Task 8 — Catalog core CRUD
- **Goal**: Port `Catalog` entity endpoints (B1–B13), including the artisan-forced-id and ownership re-check rules; centralize the ownership-chain check into `catalog.authorization.ts`.
- **Files**: `catalog/catalog.controller.ts`, `catalog.service.ts`, `catalog.repository.ts`, `catalog.authorization.ts`
- **Complexity**: Medium
- **Dependencies**: Task 1; Artisan module read access (assumed already available via Identity)

### Task 9 — Catalog Item + Media
- **Goal**: Port `CatalogItem` (B14–B23) and `CatalogItemMedia` (B24–B27) endpoints, reusing `catalog.authorization.ts`.
- **Files**: `catalog/catalog-item.*`, `catalog/catalog-item-media.*`
- **Complexity**: Medium (dual-ownership check on update)
- **Dependencies**: Task 8

### Task 10 — Catalog PDF generation
- **Goal**: Port async PDF generation + status + wait endpoints (B28–B36). Team decision required on long-poll vs. SSE/WebSocket for `wait` endpoints before starting.
- **Files**: `catalog/catalog-pdf.*`, queue/worker wiring
- **Complexity**: High (async infra decision + exception mapping)
- **Dependencies**: Task 8, Task 9, team decision on async transport

### Task 11 — Order: read endpoints
- **Goal**: Port `getCustomerOrder`, `getSuperUserOrder`, order lists, data-dumps, table-explorer reads (C1–C2, C11–C21).
- **Files**: `orders/orders.controller.ts` (read methods), `orders.service.ts` (read methods), `orders.repository.ts`
- **Complexity**: Medium
- **Dependencies**: Task 1

### Task 12 — Order: attribution service extraction
- **Goal**: Port `promoteAdAttribution` and its helpers as a standalone, unit-testable `OrderAttributionService`, decoupled from `addOrder` so Task 13 can consume it.
- **Files**: `orders/order-attribution.service.ts`
- **Complexity**: Medium (last-click-wins logic must match exactly)
- **Dependencies**: Task 6 (reads raw cart items)

### Task 13 — Order: `addOrder` (checkout)
- **Goal**: Port the full verified 8-step `addOrder` sequence (tenant/timestamp setup, per-item prep, JSON serialization, forex snapshot, attribution promotion, persistence, impact-refresh event). Golden-master test against source behavior.
- **Files**: `orders/orders.controller.ts` (addOrder), `orders.service.ts` (addOrder), `orders.validation.ts`
- **Complexity**: High (highest-risk task in the module)
- **Dependencies**: Task 11, Task 12, Forex module read access, Impact module event publisher

### Task 14 — Order: shipment/status/note/cancel/delete
- **Goal**: Port C4–C10 (shipment update, full update, global note, cancel, delete, prepared/confirmation emails).
- **Files**: remaining `orders.controller.ts`/`orders.service.ts` methods
- **Complexity**: Medium
- **Dependencies**: Task 13

### Task 15 — Order Fulfillment & Ready sub-resources
- **Goal**: Port C22–C28.
- **Files**: `orders/order-fulfillment.*`, `orders/order-ready.*`
- **Complexity**: Low–Medium
- **Dependencies**: Task 14

### Task 16 — Order Preview / search
- **Goal**: Port C29–C30 keyword search (order id / encoded email / name fragment / SKU fragment).
- **Files**: `orders/order-preview.*`
- **Complexity**: Medium (multi-form keyword interpretation)
- **Dependencies**: Task 11

### Task 17 — Custom Order core
- **Goal**: Port D1–D20, preserving the intentionally minimal `CustomOrderValidator`.
- **Files**: `custom-orders/custom-orders.*`
- **Complexity**: High (large surface, mirrors Order but staff-only creation path)
- **Dependencies**: Task 13 (shares patterns: shipment update, global note, cancel), Task 1

### Task 18 — Custom Order Fulfillment & Ready
- **Goal**: Port D21–D27.
- **Files**: `custom-orders/custom-order-fulfillment.*`, `custom-order-ready.*`
- **Complexity**: Low–Medium
- **Dependencies**: Task 17

### Task 19 — Custom Order Preview / search
- **Goal**: Port D28–D29.
- **Files**: `custom-orders/custom-order-preview.*`
- **Complexity**: Medium
- **Dependencies**: Task 17

### Task 20 — Custom Order Adjustment
- **Goal**: Port D30–D34.
- **Files**: `custom-orders/custom-order-adjustment.*`
- **Complexity**: Low
- **Dependencies**: Task 17

### Task 21 — Table-explorer/admin-projection shared factory
- **Goal**: Refactor the ~25 mechanically-identical paginated admin read endpoints (identified across every task above) into a shared generic controller/service factory, without changing any individual endpoint's route, auth, or response shape.
- **Files**: `shared/admin-projection.factory.ts`, refactor call sites across Tasks 6–20
- **Complexity**: Medium (refactor-only, must be regression-tested against every affected endpoint)
- **Dependencies**: Tasks 6–20 complete

### Task 22 — End-to-end regression pass
- **Goal**: Run the full Core Commerce endpoint list (§A–E in the API documentation) against the migrated system, comparing response shapes and status codes to the legacy system for a fixed set of recorded fixtures (cart → checkout → payment → fulfillment happy path, plus every flagged 🟡 edge case).
- **Files**: `test/e2e/commerce/*`
- **Complexity**: High
- **Dependencies**: All prior tasks
