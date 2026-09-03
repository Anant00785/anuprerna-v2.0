# Module documentation — `apps/api/src/commerce`

Verified against the code on `fix/flax-audit-remediation`, 2026-09-02. Counts in the inventory
table are mechanically derived from the source tree (decorator and file counts), not estimated.

**Scope note, stated up front.** Six modules below are documented in prose because their code was
read line by line against the Java original this pass: `order`, `cart`, `forex`, `discount`,
`loyaltyprogram`, and the `domain` pile. The rest appear in the inventory table with their
verifiable mechanical facts and are marked **not yet documented in prose** — the counts are true,
the behaviour is unaudited. Do not read absence from this file as evidence a module is fine.

Structural context lives in `docs/MODULE-MAP.md`; authorization in
`apps/api/docs/AUTHORIZATION.md`; the port pattern in `apps/api/docs/CROSS-MODULE-PORTS.md`.

## 0. Inventory

`routes` counts HTTP-method decorators; `gated` counts `@RequireGate`. A module where `gated` <
`routes` has public handlers — sometimes deliberately (`iplocation`, `misc`, `navigation`,
`color`), sometimes not audited. `workflow` shows `gated` > `routes` because some gates sit on the
controller class rather than a handler.

| module | routes | gated | services | repos | spec files | tables touched | ports |
|---|---:|---:|---:|---:|---:|---|---|
| `address` | 5 | 4 | 1 | 0 | 1 | — | — |
| `artisanpayment` | 6 | 6 | 1 | 1 | 1 | — | — |
| `cart` | 13 | 9 | 1 | 1 | 5 | `finishProfile`, `finishProfileItem`, `sizeProfileOption` | `EMAIL_ENCODER_PORT`, `FABRIC_PREVIEW_PORT`, `FINISHED_PREVIEW_PORT` +3 |
| `catalog` | 31 | 31 | 4 | 4 | 4 | `catalog` | — |
| `color` | 1 | 0 | 0 | 0 | 0 | — | — |
| `compatibility` | 3 | 0 | 1 | 0 | 1 | `blogContent`, `product`, `storyContent` | — |
| `content` | 48 | 31 | 2 | 2 | 2 | `blogContent`, `blogContentCategory`, `blogContentSection`, `blogContentType`, `storyContent` +3 | — |
| `custom-product` | 4 | 4 | 1 | 1 | 2 | `customProduct` | — |
| `custom-workflow` | 1 | 1 | 1 | 1 | 3 | — | — |
| `discount` | 2 | 2 | 1 | 0 | 2 | `discount` | — |
| `domain` | 294 | 286 | 0 | 0 | 25 | `address`, `artisan`, `artisanIncentiveConfig`, `artisanPaymentRecord`, `authenticationLog` +81 | — |
| `faq` | 8 | 8 | 1 | 1 | 3 | `faq`, `faqQuestion` | — |
| `filter` | 8 | 1 | 1 | 1 | 2 | — | — |
| `forex` | 8 | 3 | 2 | 1 | 4 | `forex`, `forexExchangeRate` | — |
| `image` | 2 | 2 | 1 | 0 | 2 | — | — |
| `impact` | 10 | 10 | 2 | 1 | 4 | `customImpactFactor`, `customOrder`, `impactFactor` | — |
| `inventory` | 22 | 22 | 2 | 1 | 5 | `inventoryAdjustment`, `inventoryAdjustmentItem`, `inventoryAdjustmentReason`, `inventoryRestockRequest`, `warehouse` | — |
| `iplocation` | 2 | 0 | 1 | 0 | 0 | — | — |
| `loyaltyprogram` | 7 | 7 | 1 | 1 | 1 | `loyaltyProgramConfig`, `loyaltyProgramConfigAuditLog` | — |
| `material` | 6 | 5 | 2 | 1 | 4 | `material` | — |
| `misc` | 2 | 0 | 2 | 0 | 1 | — | — |
| `navigation` | 7 | 0 | 2 | 1 | 0 | `category`, `color`, `material`, `pattern`, `product` +5 | — |
| `notification` | 3 | 3 | 2 | 1 | 1 | `emailNotificationHistory` | `SMTP_PORT` |
| `nverse` | 6 | 2 | 1 | 1 | 4 | `loomTenant`, `verificationToken` | — |
| `order` | 40 | 37 | 2 | 1 | 11 | `customOrder`, `customOrderItem`, `loomTenant`, `orderItem`, `orders` +1 | — |
| `pattern` | 6 | 5 | 1 | 1 | 4 | `pattern` | — |
| `payment` | 13 | 12 | 2 | 1 | 6 | `cartItem`, `loomTenant`, `orderItem`, `orders`, `razorpayTransaction` +1 | — |
| `product` | 114 | 83 | 19 | 19 | 12 | `badgeProfile`, `category`, `color`, `customSizeProfile`, `fabricProfile` +14 | `BADGE_PROFILE_PORT`, `CATEGORY_LOOKUP_PORT`, `COLOR_LOOKUP_PORT` +41 |
| `profile` | 24 | 24 | 1 | 1 | 6 | `badgeProfile`, `badgeProfileItem`, `madeToOrderProfile`, `sizeProfile`, `sizeProfileGuide` +2 | — |
| `report` | 1 | 1 | 1 | 1 | 1 | — | — |
| `review` | 10 | 6 | 1 | 1 | 4 | `orderItem`, `orders`, `review` | `ORDER_ITEM_PORT` |
| `search` | 9 | 4 | 1 | 1 | 3 | `blogContent`, `product`, `specialStatus`, `storyContent` | — |
| `seo` | 7 | 4 | 1 | 1 | 3 | `blogContent`, `category`, `product`, `productImageGallerySeo`, `segment` +2 | — |
| `settings` | 5 | 4 | 1 | 1 | 3 | `settings` | — |
| `shared` | 0 | 0 | 1 | 0 | 1 | — | — |
| `shipment` | 7 | 7 | 1 | 1 | 3 | `shipment` | — |
| `skill` | 4 | 4 | 1 | 1 | 3 | `artisanSkillMapping`, `skill` | — |
| `table_explorer` | 2 | 2 | 1 | 1 | 1 | — | — |
| `tenant` | 7 | 6 | 1 | 1 | 5 | `loomTenant`, `userRole` | — |
| `transmission` | 4 | 4 | 2 | 0 | 2 | — | — |
| `whatsapp` | 6 | 6 | 1 | 1 | 1 | `whatsappNotificationHistory` | — |
| `workflow` | 21 | 26 | 1 | 1 | 4 | `elementFeedback`, `stepElement`, `workflow`, `workflowArtisanMapping`, `workflowTemplate` | — |
| `zoho` | 5 | 1 | 2 | 0 | 1 | — | — |

Totals: **804 route decorators across 98 controllers, 678 carrying `@RequireGate`.**

---

## 1. `commerce/domain` — 294 routes with no service layer

**Read this before any other module entry.** It is more than a third of the API surface.

| | |
|---|---|
| Purpose | A flat pile of 28 `*-migrated.controller.ts` / ad-hoc controllers registered directly in `commerce/commerce.module.ts`. Nominally the landing zone for endpoints migrated from Loom ahead of their domain module |
| Routes | 294 decorators, 286 gated |
| Tables | 86 distinct `schema.*` references, spread across every domain |
| Ports | none |
| Services / repositories | **zero.** All 28 controllers inject `DATABASE_CONNECTION` directly and query Drizzle inline |
| Failure behaviour | Per-handler `try/catch` returning an empty envelope. No validator, no sanitizer, no mapper, no tenant scoping |

Three things are true of this directory and each matters:

1. **It bypasses the entire service layer.** `grep -l DATABASE_CONNECTION commerce/domain/*.controller.ts`
   returns 28 of 28. Nothing here goes through a repository, so nothing here is covered by the
   repository-level tenant-scoping and soft-delete work, and nothing here can be unit-tested below
   the controller.
2. **It does not shadow the domain modules.** Comparing route sets, only 2 of its 292 distinct
   `(method, path)` pairs collide with a module controller (both
   `/get/table-explorer/data/verification-token*`, against `commerce/nverse`). So it is a parallel
   surface, not a replacement one — which makes it easy to miss.
3. **Some of it is placeholder scaffolding shipped as live, gated endpoints.** In
   `domain/order-migrated.controller.ts`, five registered handlers —
   `GET /get/impact/order/:orderId`, `POST /trigger/impact/order/:orderId`,
   `GET /get/impact/order/aggregation`, `GET /get/order/:orderId/workflow-list`,
   `GET /get/order/:orderId/workflow/:orderItemId` — each execute
   `select().from(schema.product).limit(50)` and ignore their path parameter entirely. They return
   **products** in response to order and workflow queries. Ten controllers in this directory contain
   at least one `from(schema.product)` handler of this shape. See `docs/KNOWN-GAPS.md`.

Controllers are out of scope for this pass's edits, so none of that was changed — only recorded.

---

## 2. `commerce/order`

| | |
|---|---|
| Purpose | Regular orders (`orders` / `order_item`) and custom orders (`custom_order` / `custom_order_item`), plus the customer-facing order-preview reads |
| Routes | 40 across 5 controllers (`order`, `custom-order`, `order-feedback`, `order-fulfillment`, plus a dead top-level one), 37 gated |
| Tables owned | `orders`, `order_item`, `custom_order`, `custom_order_item`; reads `loom_tenant`, `workflow`, `workflow_custom_order_mapping` |
| Ports | none — it reaches `loom_tenant` and `workflow` through raw SQL in the preview queries |
| Registered | `OrderModule` provides `service/order.service.ts` + `repository/order.repository.ts` |

**Dead code:** `commerce/order/order.controller.ts` and `commerce/order/order.service.ts` (the
generic blob-table pair) are imported by nothing but their own specs. `order.module.ts` registers
neither. Six of the eight `commerce/<m>/<m>.service.ts` files are dead in exactly this way — the
exceptions are `misc` and `transmission`, whose modules do register the top-level file.

**Order previews.** `findOrderPreviewsByTenant` / `findCustomOrderPreviewsByTenant` are verbatim
ports of Loom's two named native queries, including the status CASE ladder and the 6-hour
(21,600,000 ms) `IN_STOCK` grace window. One deliberate divergence is commented in place: Loom
writes `LIMIT :pageSize OFFSET :pageNo`, treating the page *number* as a row offset; the port uses
`page * size`. Every known caller passes page 0, so the bug is unobservable today.

**Status transitions.** An order's customer-visible status is *derived* from its items by the
preview query, not stored on the header. The only transition ported is `CANCELLED`, which — as of
this pass — stamps the header **and** drives every item to `CANCELLED` with a fresh `updatedAt`,
matching `OrderDAOController.updateOrderStatusToCancelled`. Before this pass the item write was
missing, so a cancelled order still read `PROCESSING`/`DISPATCHED` to its owner.
`updateOrderStatusToProcessing` (which also moves `paymentStatus` to `PAID`/`PREPAID` by order
type) is **not ported**; any non-`CANCELLED` status writes only an audit note and moves nothing.

**Deletes are soft.** `deleteOrder` / `deleteCustomOrder` set `deleted = true`; every read filters
`deleted = false`. Both tables carry `deleted boolean NOT NULL DEFAULT false` and every Loom finder
is a `...AndDeletedFalse` variant. A hard `DELETE` would also violate
`stripe_transaction.fk_loom_order_id`.

**Failure behaviour.** Repository errors propagate. `findById`/`findCustomOrderById` return `null`
when absent and skip the item read. `cancelCustomOrder` returns `false` — and writes nothing — when
the order is not the tenant's. `createCustomOrder` throws on a non-positive tenant id. The one
swallowed failure is per-item insert inside `createOrder`, which logs and continues, so a partial
order is possible.

**Known hazard, not fixed:** `createOrder` with no tenant id in the body and no authenticated
tenant adopts an arbitrary existing tenant via `SELECT id FROM loom_tenant LIMIT 1`. Pinned by a
test, recorded in `docs/KNOWN-GAPS.md`; supplying the tenant is the controller's job and
controllers were out of scope.

---

## 3. `commerce/cart`

| | |
|---|---|
| Purpose | The tenant's cart (`cart_item`), the enrichment pass that hydrates each row into a client view, and the abandoned-cart overview |
| Routes | 13, 9 gated |
| Tables owned | `cart_item`; reads `loom_tenant`, `user_role`, `product`, `product_fabric`, `product_finished`, `size_profile_option`, `finish_profile*` |
| Ports | `FABRIC_PREVIEW_PORT`, `FINISHED_PREVIEW_PORT`, `SIZE_PROFILE_OPTION_PORT`, `FINISH_PROFILE_ITEM_PORT`, `TENANT_LOOKUP_PORT`, `EMAIL_ENCODER_PORT` |

This is the best-documented port in the codebase: `cart.service.ts` and `cart.repository.ts` both
carry long headers naming the source method behind each function, and two source quirks are
preserved rather than silently fixed (`updateCartItem` writes only `quantity` + `lastUpdatedAt`;
`prepareCartItems` keeps "last finish wins" while resolving sequentially for determinism).

**Optimistic locking is real here.** `deleteById` and `deleteAllByTenantId` run inside a
transaction, select `version`, then `DELETE … WHERE id = ? AND version = ?`, raising
`OptimisticLockError` on a 0-row delete — reproducing what Spring Data's derived `deleteBy…` does
with a version-managed entity. `deleteAllByTenantId` aborts the whole transaction if any one row
loses its race, so a cart is never partially cleared while reporting success.

**Fixed this pass:** `findByTenantId` used to route the tenant id through `ensureTenantExists`,
which on a miss (a) INSERTed a new guest `loom_tenant` row plus a `ROLE_CUSTOMER` grant as a side
effect of a GET, and (b) if that failed, fell back to `SELECT id FROM loom_tenant LIMIT 1` and read
**that** tenant's cart. It is now a plain scoped read; an unknown tenant has an empty cart. The
same arbitrary-tenant fallback was removed from `ensureTenantExists` itself, which the insert path
still uses.

**Failure behaviour.** `addCartItem` catches and returns `ActionCode.INSERT_FAILURE`.
`updateCartItem` catches and returns `UPDATE_FAILURE`, but deliberately re-throws
`OptimisticLockError` so it surfaces, mirroring an uncaught `OptimisticLockException` in Java. The
cart overview swallows a per-tenant email-decode failure so one bad row does not abort the report.

**Deliberate stub:** `EMAIL_ENCODER_PORT` is the codebase's one allowlisted silent dummy — the
legacy AES key derivation is not recoverable from the available source, and guessing it would
garble data instead of failing.

---

## 4. `commerce/forex`

| | |
|---|---|
| Purpose | The GBP/EUR/USD exchange rates every foreign-currency price is derived from |
| Routes | 8, 3 gated |
| Tables owned | `forex_exchange_rate` (dated three-currency snapshots), `forex` (country → currency → rate) |
| Registered | `ForexModule` provides `service/forex.service.ts`; `forex/forex.service.ts` is dead |

Authority: `ForexExchangeRateDAOController.retrieveLatestForexExchangeRate`, which is
`findFirstByRecordDateOrderByCreatedAtDesc(getDateInMillisecondsWithoutTime(now))`, and
`ForexHelperService`'s GBP/EUR/USD switch.

**Fixed this pass:**
- `upsertExchangeRate` used to seed a missing snapshot with a hardcoded GBP 106.80 / EUR 91.20 /
  USD 83.50, persisting three invented exchange rates into the table that prices every
  foreign-currency order. It now refuses, and rejects an unsupported currency or a non-positive
  rate, rather than writing something plausible.
- `recordDate` is now stamped at UTC midnight. Loom keys its lookup on the date *without* time, so
  the previous full millisecond timestamp produced rows Loom's own reader could never find.
- "Latest" now orders by `recordDate DESC, createdAt DESC`. Ordering on `recordDate` alone left the
  answer non-deterministic among same-day snapshots — which is exactly what `upsertExchangeRate`
  produces.
- `version ? Number(version) : null` reported a legitimate version `0` as `null`; same for a zero
  rate. Both now round-trip.
- The file no longer carries `@ts-nocheck`, which was concealing `createdAt: BigInt(now)` written
  into a `bigint({ mode: "number" })` column.

**Divergence pinned, not changed:** `findExchangeRateByCode` answers an unknown currency with the
whole three-currency snapshot. `ForexHelperService` throws `IllegalArgumentException` instead. The
current shape is what the `/forex` read route serves, so it is pinned by a test and recorded in
`docs/KNOWN-GAPS.md`.

**Failure behaviour.** No snapshot → `null` from both read paths (never a fabricated rate). The
secondary `forex.rate` mirror update inside `upsertExchangeRate` is best-effort and logs a warning
on failure without failing the write.

---

## 5. `commerce/discount`

| | |
|---|---|
| Purpose | Serves the coupon/discount catalogue |
| Routes | 2, both gated |
| Tables | `discount`, falling through to the generic `commerce_discount` blob table |
| Registered | `DiscountModule` provides `discount.service.ts` (the top-level file — this module has no `service/` directory) |

There is no Discount DAO in the Java original; the table is read directly.

**Fixed this pass:** when the `discount` table was empty or unreadable, `getAll()` returned a
fabricated `WELCOME15` coupon — 15% off, minimum order 1000 — from a live, gated route as though it
were configuration. It now returns whatever the generic table holds, and `[]` when that is empty.

**Failure behaviour.** A `discount` table read failure logs a warning and falls through to
`CommerceDataService.getAll()`. `Boolean(r.active)` means a `NULL` `active` reads as `false`, so a
row with unknown state is never served as a live discount.

---

## 6. `commerce/loyaltyprogram`

| | |
|---|---|
| Purpose | Per-customer loyalty configuration and its audit log |
| Routes | 7, all gated |
| Tables owned | `loyalty_program_config` (unique on `customer_id`), `loyalty_program_config_audit_log` |
| Ports | none |

`loyaltyprogram.service.ts` is a 17-line pass-through to the repository and carries `@ts-nocheck`.
**Not audited against Loom this pass, and it has one spec file (a controller gate spec) and no
service or repository spec.** The config table holds money columns (`min_order_value`,
`min_order_value_inr`, `exchange_rate`, `discount_percentage`) that are all `NOT NULL`, and
`exchange_rate` is `numeric(8,4)` — the same class of value the forex bugs above were found in.
Flagged in `docs/KNOWN-GAPS.md` as the highest-priority remaining money module.

---

## 7. Everything else

Not yet documented in prose. Use the inventory table above for routes/tables/ports, and read the
module's own file headers — the better-ported domains (`cart`, `payment`, `review`, `impact`) carry
accurate per-method references to their Java source. Treat a module with `spec files` ≤ 2 and a
service that carries `@ts-nocheck` as unverified.

**310 of the 665 `.ts` files under `src/` (502 of them non-spec) still carry `@ts-nocheck`**, so the typechecker is not
protecting them. The forex fix above found a real type error the moment the pragma came off.
