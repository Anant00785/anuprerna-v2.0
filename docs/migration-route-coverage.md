> **UPDATED 2026-09-02 — the four families with live frontend callers have been closed.**
> Re-measured with `node scripts/route-coverage.mjs`: **637/694 matched (91.8%), 57 missing**
> (was 619/694, 75 missing). Two things changed the number besides new code:
> (a) the script's route regex now understands Nest's array form `@Get(["a","b"])`, which it
> previously could not see — that alone is why the whole **forex** family read as absent when the
> alias paths were in fact declared; (b) a concurrent pass deleted the unregistered controllers,
> so the "declared but never served" column is now 0.
> The forex, order and inventory sections below are **closed**; custom-made is partially closed and
> the deliberate remainder is tracked in [`KNOWN-GAPS.md`](./KNOWN-GAPS.md).

> **UPDATED 2026-09-02 (later pass) — remaining gaps triaged to a decision each.**
> Re-measured: **651/694 matched (93.8%), 43 missing** (from 637/694, 57 missing).
> Every remaining family now has an explicit disposition in
> [§3a Disposition of the remaining gap](#3a-disposition-of-the-remaining-gap-2026-09-02)
> — implemented, deferred to the owning agent, or intentionally not migrated with a reason.
> Nothing in this pass was stubbed.

# Migration route coverage — measured

**Produced by:** `scripts/route-coverage.mjs` (run: `node scripts/route-coverage.mjs --list`)
**Measured on:** 2026-09-02, branch `fix/flax-audit-remediation`
**Legacy authority:** `../loom` (Spring Boot, `src/main/java/**/*Controller.java`)
**New side:** `apps/api/src/**`

Every number on this page is printed by that script. Nothing here is estimated,
carried over from an earlier report, or rounded to agree with one. Re-run the
script to regenerate; it is deterministic (same input → byte-identical JSON).

---

## 1. Headline numbers

| Measure | Value |
|---|---|
| Legacy controller files | 281 |
| Legacy `String` route constants resolved | 2515 / 2533 declared |
| **Legacy routes (unique method+path)** | **694** |
| Legacy annotations with an unresolvable path expression (excluded) | 2 (both commented-out) |
| New-side controllers | 118 |
| New-side route declarations | 926 |
| New-side controllers not listed in any module's `controllers[]` | 15 (62 declared routes never served) |
| **Legacy routes matched on the new side** | ~~619 (89.2%)~~ → **637 (91.8%)** |
| — of which the only match is on an **unregistered** controller | ~~36~~ → **0** |
| **Legacy routes with no counterpart at all** | ~~75~~ → **57** |
| **Effective gap at runtime (75 absent + 36 declared-but-unrouted)** | **111 (16.0% of 694)** |
| New-side routes with no legacy counterpart | 267 |

### Matching confidence (the error bar, counted rather than asserted)

| Rule | Matches |
|---|---|
| R0–R3 direct (param/slash/case normalisation only) | 618 |
| R4 verb-prefix stripping (fuzzy) | 0 |
| R5 segment-set reorder (fuzzy, weak) | 1 |

Only **1 of 619** matches (0.16%) depends on a fuzzy rule. The new API kept the
legacy verb-prefixed path shape (`/get/cart-item/list`, `/add/product`), so
normalisation is nearly a no-op here and the coverage figure is not sensitive to
it. That is the whole error bar — there is no ±5% band.

### Why the missing routes are missing

| Diagnostic | Count | Meaning |
|---|---|---|
| `D0_absent` | 53 | No route on the new side under any verb or parameterised form. |
| `D1_method_mismatch` | 11 | Same path exists on the new side under a **different HTTP verb** — a client calling the legacy verb gets 404/405. |
| `D2_param_superseded` | 11 | Covered by a generic parameterised handler (`/get/table-explorer/data/:tableName`). Behaviourally probably fine; listed for confirmation, not for reimplementation. |

---

## 2. Discrepancy against the earlier audit (535 / 413 / 122, ±5%)

| | Earlier audit | This measurement | Cause |
|---|---|---|---|
| Legacy routes | 535 | **694** | The audit's parser under-resolved `RequestMapper.*` constants. This script builds a transitive constant table from every `public static final String` in the loom tree (2515 resolved) before reading the annotations, and handles multi-line `@GetMapping(value = …, produces = …)` blocks. |
| Matched | 413 | **619** | Direct consequence of the larger, correctly-resolved legacy set — plus the new API deliberately preserving legacy path shapes, which a literal-only parse cannot see. |
| Missing | 122 | **75 absent, 111 effective** | The audit's 122 is close to the *effective* gap (111) rather than the absent gap (75). The 36-route "declared but no module registers the controller" bucket is the likely reason the two figures nearly coincide by different routes. |

The two documents in `docs/migration-audit/` cited **686** legacy endpoints,
which is within 1.2% of the 694 measured here — so the endpoint census in those
reports was roughly right; their *completion* claims were not (see §6).

---

## 3. Missing legacy routes, by feature family

Frontend evidence: each family was checked by grepping `apps/storefront/src` and
`apps/cms/src` for the exact legacy path prefix. Counts below are files/lines
that reference the path, and the checked string is named explicitly.


### custom-made — 15 routes (7 CLOSED 2026-09-02)

Closed: `GET|POST|PATCH /get|add|update/custom-product` (+`/{productId}`) in the new
`commerce/custom-product` module; `GET /get/custom-workflow-list/{status}` in the new
`commerce/custom-workflow` module; `GET /get/impact/custom-order/{customOrderId}` and
`GET /get/impact/custom-order/aggregation` in `commerce/impact`.
The 15 that remain are **deliberately absent, not stubbed** — each one needs an engine
(workflow step cascades, the impact calculation service) rather than an endpoint. They are
enumerated with their Java source and the reason in [`KNOWN-GAPS.md`](./KNOWN-GAPS.md).

#### original table (22 routes, pre-2026-09-02)

| Method | Legacy path | Java controller.method | Diagnostic | Nearest new route |
|---|---|---|---|---|
| POST | `/add/custom-product` | `CustomProductController.addCustomProduct` | D0_absent | — |
| POST | `/add/custom-size-profile` | `CustomSizeProfileController.createNewCustomSizeProfile` | D0_absent | — |
| POST | `/add/custom-workflow` | `CustomWorkflowController.addWorkflow` | D0_absent | — |
| DELETE | `/delete/custom-size-profile/{profileId}` | `CustomSizeProfileController.deleteCustomSizeProfile` | D0_absent | — |
| GET | `/get/artisan/custom-workflow-list/{status}` | `CustomWorkflowController.retrieveWorkflowListForArtisan` | D0_absent | — |
| GET | `/get/custom-order/{orderId}/workflow-list` | `CustomWorkflowController.retrieveOrderWiseWorkflowList` | D0_absent | — |
| GET | `/get/custom-order/{orderId}/workflow/{orderItemId}` | `CustomWorkflowController.retrieveOrderwiseWorkflow` | D0_absent | — |
| GET | `/get/custom-product/{productId}` | `CustomProductController.getCustomProduct` | D0_absent | — |
| GET | `/get/custom-product` | `CustomProductController.getCustomProducts` | D0_absent | — |
| GET | `/get/custom-size-profile-list` | `CustomSizeProfileController.getCustomSizeProfileList` | D0_absent | — |
| GET | `/get/custom-size-profile/{profileId}` | `CustomSizeProfileController.getCustomSizeProfile` | D0_absent | — |
| GET | `/get/custom-workflow-list/{status}` | `CustomWorkflowController.retrieveWorkflowList` | D0_absent | — |
| GET | `/get/custom-workflow/{workflowId}` | `CustomWorkflowController.retrieveWorkflow` | D0_absent | — |
| GET | `/get/custom-workflow/element/feedback` | `ElementFeedbackController.retrieveCustomWorkflowElementFeedbackList` | D0_absent | — |
| GET | `/get/data-dump/custom-order-item` | `CustomOrderController.getCustomOrderItemDataDump` | D0_absent | — |
| GET | `/get/data-dump/custom-order` | `CustomOrderController.getCustomOrderDataDump` | D0_absent | — |
| GET | `/get/impact/custom-order/{customOrderId}` | `ImpactFactorController.getCustomOrderImpact` | D0_absent | — |
| GET | `/get/impact/custom-order/aggregation` | `ImpactFactorController.getCustomOrderImpactAggregation` | D0_absent | — |
| POST | `/trigger/impact/custom-order/{customOrderId}` | `ImpactFactorController.triggerCustomOrderImpact` | D0_absent | — |
| PATCH | `/update/custom-product` | `CustomProductController.updateCustomProduct` | D0_absent | — |
| PATCH | `/update/custom-size-profile` | `CustomSizeProfileController.updateCustomSizeProfile` | D0_absent | — |
| PATCH | `/update/custom-workflow` | `CustomWorkflowController.updateWorkflow` | D0_absent | — |

### filter — 13 routes

| Method | Legacy path | Java controller.method | Diagnostic | Nearest new route |
|---|---|---|---|---|
| POST | `/add/filter-page-config` | `FilterPageConfigController.createFilterPageConfig` | D0_absent | — |
| DELETE | `/delete/filter-page-config/{filterPageConfigId}` | `FilterPageConfigController.deleteFilterPageConfig` | D0_absent | — |
| GET | `/get/filter-page-config-list` | `FilterPageConfigController.getFilterPageConfigList` | D0_absent | — |
| GET | `/get/filter-page-config/{filterPageConfigId}` | `FilterPageConfigController.getFilterPageConfig` | D0_absent | — |
| GET | `/get/v2/filter/fabric/filtered/count` | `FilterController.getFilteredFabricFilterPreviewCountV2` | D0_absent | — |
| GET | `/get/v2/filter/fabric/filtered/facets` | `FilterController.getFilteredFabricFilterPreviewFacetsV2` | D0_absent | — |
| GET | `/get/v2/filter/fabric/filtered/page` | `FilterController.getFilteredFabricFilterPreviewPageV2` | D0_absent | — |
| GET | `/get/v2/filter/fabric/filtered` | `FilterController.getFilteredFabricFilterPreviewListV2` | D0_absent | — |
| GET | `/get/v2/filter/finished/filtered/count` | `FilterController.getFilteredFinishedFilterPreviewCountV2` | D0_absent | — |
| GET | `/get/v2/filter/finished/filtered/facets` | `FilterController.getFilteredFinishedFilterPreviewFacetsV2` | D0_absent | — |
| GET | `/get/v2/filter/finished/filtered/page` | `FilterController.getFilteredFinishedFilterPreviewPageV2` | D0_absent | — |
| GET | `/get/v2/filter/finished/filtered` | `FilterController.getFilteredFinishedFilterPreviewListV2` | D0_absent | — |
| PATCH | `/update/filter-page-config/{filterPageConfigId}` | `FilterPageConfigController.updateFilterPageConfig` | D0_absent | — |

### table-explorer — 11 routes

| Method | Legacy path | Java controller.method | Diagnostic | Nearest new route |
|---|---|---|---|---|
| GET | `/get/table-explorer/data/badge-profile-item/{id}` | `BadgeProfileController.getBadgeProfileItemById` | D2_param_superseded | `GET /get/table-explorer/data/:tableName/:id` |
| GET | `/get/table-explorer/data/custom-order-adjustment/{id}` | `CustomOrderAdjustmentController.getCustomOrderAdjustmentById` | D2_param_superseded | `GET /get/table-explorer/data/:tableName/:id` |
| GET | `/get/table-explorer/data/custom-order-fulfillment/{id}` | `CustomOrderFulfillmentController.getCustomOrderFulfillmentById` | D2_param_superseded | `GET /get/table-explorer/data/:tableName/:id` |
| GET | `/get/table-explorer/data/custom-order-item/{id}` | `CustomOrderController.getCustomOrderItemById` | D2_param_superseded | `GET /get/table-explorer/data/:tableName/:id` |
| GET | `/get/table-explorer/data/custom-product` | `CustomProductController.getCustomProductData` | D2_param_superseded | `GET /get/table-explorer/data/:tableName` |
| GET | `/get/table-explorer/data/custom-size-profile-item/{id}` | `CustomSizeProfileController.getCustomSizeProfileItemById` | D2_param_superseded | `GET /get/table-explorer/data/:tableName/:id` |
| GET | `/get/table-explorer/data/custom-size-profile-item` | `CustomSizeProfileController.getCustomSizeProfileItemData` | D2_param_superseded | `GET /get/table-explorer/data/:tableName` |
| GET | `/get/table-explorer/data/custom-size-profile/{id}` | `CustomSizeProfileController.getCustomSizeProfileById` | D2_param_superseded | `GET /get/table-explorer/data/:tableName/:id` |
| GET | `/get/table-explorer/data/custom-size-profile` | `CustomSizeProfileController.getCustomSizeProfileData` | D2_param_superseded | `GET /get/table-explorer/data/:tableName` |
| GET | `/get/table-explorer/data/customer` | `CustomerController.getCustomerData` | D2_param_superseded | `GET /get/table-explorer/data/:tableName` |
| GET | `/get/table-explorer/data/fabric-product-data` | `FabricProductController.getFabricProductData` | D2_param_superseded | `GET /get/table-explorer/data/:tableName` |

### media — 10 routes

| Method | Legacy path | Java controller.method | Diagnostic | Nearest new route |
|---|---|---|---|---|
| POST | `/update/image-optimization/discovery/run` | `ImageOptimizationController.runDiscovery` | D1_method_mismatch | `PATCH /update/image-optimization/discovery/run` |
| POST | `/update/image-optimization/main/pause` | `ImageOptimizationController.pauseMain` | D1_method_mismatch | `PATCH /update/image-optimization/main/pause` |
| POST | `/update/image-optimization/main/resume` | `ImageOptimizationController.resumeMain` | D1_method_mismatch | `PATCH /update/image-optimization/main/resume` |
| POST | `/update/image-optimization/main/settings` | `ImageOptimizationController.updateMainSettings` | D1_method_mismatch | `PATCH /update/image-optimization/main/settings` |
| POST | `/update/image-optimization/requeue` | `ImageOptimizationController.runRequeue` | D1_method_mismatch | `PATCH /update/image-optimization/requeue` |
| POST | `/update/image-optimization/tools/enabled` | `ImageOptimizationController.setToolEnabled` | D1_method_mismatch | `PATCH /update/image-optimization/tools/enabled` |
| POST | `/update/image-optimization/tools/option` | `ImageOptimizationController.setToolOption` | D1_method_mismatch | `PATCH /update/image-optimization/tools/option` |
| POST | `/update/image-optimization/tools/preset` | `ImageOptimizationController.applyToolPreset` | D1_method_mismatch | `PATCH /update/image-optimization/tools/preset` |
| POST | `/update/image-optimization/workers/start` | `ImageOptimizationController.startWorkers` | D0_absent | — |
| POST | `/update/image-optimization/workers/stop` | `ImageOptimizationController.stopWorkers` | D0_absent | — |

### forex — 0 routes (CLOSED 2026-09-02)

All four now resolve on `commerce/forex/controller/forex.controller.ts`. They were never a rename
break: the legacy paths were already declared as `@Get([...])` aliases that the coverage script
could not parse. The **real** break was authorization — a gate-coverage pass had put
`@RequireGate(CODE_SU)` on three routes that Loom leaves ungated, and the storefront calls them
with no token at all, so every SSR page render was getting a 401.

| Method | Legacy path | Java gate | Now |
|---|---|---|---|
| GET | `/get/forex-list` | **none** (`buildList` direct, no `getEntity`) | ungated, key `forexList` |
| GET | `/get/forex-exchange-rate/latest` | **none** | ungated, key `forexExchangeRate` (was wrongly `exchangeRate`) |
| GET | `/get/forex-exchange-rate-list` | **none** | ungated, key `forexExchangeRateList` |
| GET | `/get/data-dump/forex` | `CODE_SU` | CODE_SU, key `forexList`, split off the exchange-rate handler it had been sharing |

### order — 1 route (3 of 4 CLOSED 2026-09-02)

Added to `commerce/order/controller/order.controller.ts`, all `CODE_CU` and all scoped by
`@CurrentTenant()` (never by a client-supplied id). Loom's two native preview queries
(`findCustomerOrderListWithStatusMapping`, `findCustomerCustomOrderListWithStatusMapping`) are
ported verbatim into `order/repository/order.repository.ts`.

| Method | Legacy path | Java controller.method | Status |
|---|---|---|---|
| GET | `/get/customer/order-list/v2` | `OrderController.getCustomerOrderList` | **done** — key `orderList` |
| GET | `/get/customer/order-list/all` | `OrderController.getCustomerAllOrderList` | **done** — key `orderList`, regular + custom merged newest-first |
| GET | `/get/customer/orders/status/processing` | `OrderController.getProcessingOrderStatus` | **done** — RainEntity key `entity`, payload `{hasProcessingOrder}` |
| GET | `/get/customer/order-list/loyalty` | `LoyaltyProgramInfoController.getCustomerLoyaltyOrderList` | still absent — belongs to `commerce/loyaltyprogram`, not the order module |

### analytics — 3 routes

| Method | Legacy path | Java controller.method | Diagnostic | Nearest new route |
|---|---|---|---|---|
| GET | `/get/super-user/ga-attribution/abandoned-carts` | `GaAttributionController.getGaAttributionAbandonedCarts` | D0_absent | — |
| GET | `/get/super-user/ga-attribution/orders` | `GaAttributionController.getGaAttributionOrders` | D0_absent | — |
| GET | `/get/super-user/ga-attribution/summary` | `GaAttributionController.getGaAttributionSummary` | D0_absent | — |

### whatsapp — 3 routes

| Method | Legacy path | Java controller.method | Diagnostic | Nearest new route |
|---|---|---|---|---|
| POST | `/poll/whatsapp/delivery-status/{id}` | `WhatsappNotificationController.pollWhatsappDeliveryStatusById` | D1_method_mismatch | `GET /poll/whatsapp/delivery-status/:id` |
| POST | `/poll/whatsapp/delivery-status/stale` | `WhatsappNotificationController.pollStaleWhatsappDeliveryStatus` | D1_method_mismatch | `GET /poll/whatsapp/delivery-status/stale` |
| POST | `/poll/whatsapp/delivery-status` | `WhatsappNotificationController.pollWhatsappDeliveryStatus` | D1_method_mismatch | `GET /poll/whatsapp/delivery-status` |

### product — 3 routes

| Method | Legacy path | Java controller.method | Diagnostic | Nearest new route |
|---|---|---|---|---|
| GET | `/get/fabric-overview-list` | `FabricProductController.getFabricOverviewList` | D0_absent | — |
| GET | `/get/product-gist-list` | `ProductController.getProductGistList` | D0_absent | — |
| GET | `/get/v2/fabric-product/slug/{productSlug}` | `FabricProductController.getFabricProductBySlugV2` | D0_absent | — |

### inventory — 0 routes (CLOSED 2026-09-02)

`PATCH /update/inventory-adjustment-reason` (`CODE_SU`) added to
`commerce/inventory/controller/inventory.controller.ts`. Copies only `reason` and `description`
onto the existing row and reports `success:false` when the id matches nothing, matching
`InventoryAdjustmentReasonDAOController.updateInventoryAdjustmentReason`'s `ActionCode.NO_ACTION`.

### other — 1 route

| Method | Legacy path | Java controller.method | Diagnostic | Nearest new route |
|---|---|---|---|---|
| GET | `/get/finished-preview-list` | `FinishedPreviewController.getFinishedPreviewList` | D0_absent | — |

### Per-family judgement (evidence-based)

| Family | n | Frontend evidence (string grepped) | Judgement |
|---|---|---|---|
| custom-made | 22 | `/get/custom-product` → cms 4, storefront 0; `/get/custom-workflow` → cms 9; `/update/custom-workflow` → cms 10; `/get/custom-size-profile` → cms 2; `/get/impact/custom-order` → cms 6 | **Genuinely needed.** The CMS calls these today. The whole made-to-order/workflow vertical (`CustomProductController`, `CustomWorkflowController`, `CustomSizeProfileController`, `ElementFeedbackController`, `ImpactFactorController`) has no NestJS counterpart. Highest-priority family. |
| filter | 13 | `/get/v2/filter/` → storefront 0, cms 0; `/get/filter-page-config` → 0/0 | **Not called by either frontend today.** The v2 filter endpoints and `FilterPageConfigController` are candidates for "dead in the legacy app" — but confirm against production access logs before deleting, since storefront filtering may go through the v1 paths that *are* matched. |
| table-explorer | 11 | `/get/table-explorer/data/custom-product` → 0/0; `/get/table-explorer/data/customer` → 0/0; family prefix `table-explorer` → cms 10 files | **Superseded.** All 11 are `D2_param_superseded` by `GET /get/table-explorer/data/:tableName[/:id]` on `TableExplorerController`. No reimplementation needed; verify the generic handler whitelists these table names. |
| media (image-optimization) | 10 | `/update/image-optimization` → 0/0 | **8 are verb drift, 2 absent.** `ImageOptimizationDomainController` exposes the same 8 paths as `PATCH` where legacy is `POST`; `workers/start` and `workers/stop` are absent. Internal ops tooling — no frontend caller, low priority, but the verb mismatch is a one-line fix. |
| forex | 4 | `/get/forex-list` → **storefront 12**, cms 2; `/get/forex-exchange-rate/latest` → **storefront (called)** | **Genuinely needed and currently broken.** The storefront calls `/get/forex-list` and `/get/forex-exchange-rate/latest`; the new `ForexController` exposes `/get/forex` and `/get/forex/exchange-rate/:code` instead. This is a live rename break, not a gap on paper. Highest-severity single item. |
| order | 4 | `/get/customer/order-list` → **storefront 4** | **Genuinely needed.** `/get/customer/order-list/v2`, `/all`, `/loyalty` and `/get/customer/orders/status/processing` are storefront-facing. |
| analytics (GA attribution) | 3 | `ga-attribution` → 0/0 | **No frontend caller.** Super-user reporting only; the new side has `/get/ads-conversion/*` on `MiscMigratedDomainController`, which may be the intended replacement — confirm before treating as a gap. |
| whatsapp | 3 | `poll/whatsapp` → 0/0 | **Verb drift only.** All three are `D1_method_mismatch` (legacy `POST` → new `GET` on `NotificationsDomainController`). Server-to-server polling, no frontend caller. Fix the verb. |
| product | 3 | `/get/fabric-overview-list` → 0/0; `/get/product-gist-list` → 0/0; `/get/v2/fabric-product/slug/{slug}` → 0/0 | **No frontend caller found.** Likely superseded by the matched v1 slug/preview endpoints on `FabricProductController`; low priority. |
| inventory | 1 | `inventory-adjustment-reason` → cms 3 | **Needed.** The CMS references the family; only the `PATCH` update is missing (create/list matched). |
| other | 1 | `/get/finished-preview-list` → 0/0 | No caller; low priority. |

**Ranked by "a frontend calls it today":**
1. **forex** (storefront, currently broken by rename) — 4 routes
2. **custom-made** (CMS, entire vertical absent) — 22 routes
3. **order / customer order lists** (storefront) — 4 routes
4. **inventory adjustment reason** (CMS) — 1 route
5. everything else — no frontend caller found in `apps/storefront/src` or `apps/cms/src`

---

## 3a. Disposition of the remaining gap (2026-09-02)

Second triage pass. Every family below has one of three outcomes: **implemented**,
**deferred** (the files belong to another concurrent agent, exact fix recorded), or
**intentionally not migrated** (with the reason). Nothing was stubbed — no route was
added that returns `null`, `[]`, or fabricated data to make a number move.

Measured before this pass: 637/694 (91.8%), 57 missing.
Measured after: **651/694 (93.8%), 43 missing**.

### Implemented (3 routes)

| Method | Legacy path | Java original | Gate | Note |
|---|---|---|---|---|
| GET | `/get/fabric-overview-list` | `FabricProductController.getFabricOverviewList` → `getEntity(..., CODE_SU, UNAUTH_FABRIC_OVERVIEW_LIST_REQUEST)` | **CODE_SU** | The handler already existed as `/get/fabric-product/overview/list` (same repo query `findFabricOverview`, same `fabricOverviewList` envelope). Added the legacy path as an alias rather than renaming, so any unmigrated client keeps working. It was **ungated** here while Loom gates it CODE_SU; the gate was restored — no frontend calls either path, so nothing breaks. |
| GET | `/get/table-explorer/data/fabric-product-data` | `FabricProductController.getFabricProductData` → `getEntity(..., CODE_SU)` | **CODE_SU** | Pure rename (`fabric-product-data` → `fabric-product`). Legacy path added as an alias on the existing handler. |
| GET | `/get/customer/order-list/loyalty` | `LoyaltyProgramInfoController.getCustomerLoyaltyOrderList` → `getEntity(..., CODE_CU, UNAUTH_ORDER_LIST_REQUEST)` | **CODE_CU** | Real port, not a stub. Both Loom named native queries reproduced verbatim in `loyaltyprogram.repository.ts`: `findCustomerLoyaltyProgramOrders` (regular) and `findCustomerLoyaltyProgramCustomOrders` (custom), merged in Loom's order (regular then custom, each `created_at DESC`, **no combined re-sort** — reproduced exactly, not "fixed"). Envelope `{ orderList }`, which is what `apps/storefront/src/lib/api/repositories/profile.repository.ts:335` reads. Tenant comes from `@CurrentTenant`, never a param; Loom's `:tenantId IS NULL` "all customers" branch is deliberately dropped so a missing tenant 401s instead of leaking every customer's orders. |

### Deferred — owned by a concurrent agent (14 routes)

These are in `apps/api/src/commerce/domain/**`, owned by another agent during this
pass. They were **not** edited to avoid clobbering in-flight work. Each is a
one-line change; the exact fix is recorded so the owner can apply it directly.

| n | Routes | File | Exact fix |
|---|---|---|---|
| 8 | `POST /update/image-optimization/{discovery/run, requeue, main/pause, main/resume, main/settings, tools/preset, tools/option, tools/enabled}` | `commerce/domain/image-optimization.controller.ts:190-242` | Pure verb drift: the handlers exist and are correct but are declared `@Patch`. Loom publishes them as `POST`. Add `@Post(<same path>)` alongside each existing `@Patch` (Nest allows both decorators on one handler) — do **not** drop the `@Patch`, the CMS may already use it. |
| 2 | `POST /update/image-optimization/workers/{start, stop}` | same file | `D0_absent` — genuinely missing, not verb drift. Needs the worker start/stop logic from `ImageOptimizationController.startWorkers`/`stopWorkers`; do not add a route that no-ops. |
| 3 | `POST /poll/whatsapp/delivery-status[/stale\|/:id]` | `commerce/domain/notifications.controller.ts:310-344` | Verb drift the other way: declared `@Get`, Loom publishes `POST`. Add `@Post(<same path>)` alongside each `@Get`. |
| 1 | `GET /get/table-explorer/data/customer` | `commerce/domain/customer.controller.ts:87` | Only `/customer/:id` exists; the list form is missing. Loom `CustomerController.getCustomerData` is `CODE_SU`. |

### Intentionally not migrated (26 routes)

#### filter — 13 routes. Reason: no consumer, and the V2 half needs an engine that does not exist.

Verified by grep across `apps/storefront/src` and `apps/cms/src`: **zero callers** for
all 13.

- **`FilterPageConfigController` (5)** — `POST /add/filter-page-config`,
  `GET /get/filter-page-config-list`, `GET /get/filter-page-config/{id}`,
  `PATCH /update/filter-page-config/{id}`, `DELETE /delete/filter-page-config/{id}`.
  All `CODE_SU` in Loom. The `filter_page_config` table **does** exist in the Drizzle
  schema (`database/schema/schema.ts:2895`), so this is a cheap future add — but nothing
  reads or writes it, and the CMS nav entry that would reach it
  (`apps/cms/src/lib/nav-menu.ts:171` → `/filter-page-seo`) points at a page that does
  not exist. Building admin CRUD for a table with no UI and no caller is the liability
  this pass is removing elsewhere, so it stays out.
- **`FilterController` V2 (8)** — `GET /get/v2/filter/{fabric,finished}/filtered[/count|/facets|/page]`.
  **Public** in Loom (every one calls `buildList`/`buildEntity` directly, no `getEntity`,
  no `CODE_*`). Not migrated because they are not endpoints, they are an engine: the V2
  methods take a wider parameter set (`FabricProductFilterParametersV2` — minAvailability,
  maxAvailability, category, inStock, sortBy) and call distinct DAO methods, and the
  `/page` variants compose list + count + facets + `filterPageSeoResolver.resolve(...)`,
  which depends on the FilterPageConfig data above. No facet or count logic exists in
  `filter.service.ts`/`filter.repository.ts`. The migrated V1 `/get/filter/fabric/filtered`
  is **not** a superset and does not supersede these.
  Note `/get/v2/filter/fabric` already exists on the new side (`filter.controller.ts:43`) —
  that is `GET_FILTER_FABRIC_PAGE`, the preview grid, an unrelated route with a
  confusingly similar path. It is not a V2-filtered implementation.

#### table-explorer — 10 routes. Reason: unmigrated vertical, **not** "superseded by the generic handler".

**Correction to the §3 per-family judgement above, which said these were superseded by
`GET /get/table-explorer/data/:tableName[/:id]` and only needed a whitelist check.**
That is wrong, and the reason matters:

`TableExplorerRepository` passes `tableName` straight into `sql.identifier(tableName)`
(`commerce/table_explorer/repository/table_explorer.repository.ts`), i.e. it addresses a
**physical Postgres table**. Loom's table-explorer vocabulary is a curated, mostly-singular,
hyphenated **entity slug** set — `custom-order-item`, `badge-profile-item`, `product-fabric`.
The CMS knows this and compensates: `apps/cms/src/app/api/table-explorer/route.ts` tries a
candidate list (raw name, then a `SLUG_EXCEPTIONS` map, then a hyphenate+singularise
heuristic) and takes the first slug that returns 200. So the generic handler covers
*raw table names* only; a hyphenated legacy slug resolves to a table that does not exist
and returns 400, not the projection. The per-entity routes also return entity-specific
envelope keys (`faqDataList`, `whatsappNotificationHistoryList`) whereas the generic one
returns `tableData` — a different response contract.

The 10 that remain are all `custom-*` / `badge-profile-item` projections belonging to the
made-to-order vertical (`CustomOrderController`, `CustomOrderAdjustmentController`,
`CustomOrderFulfillmentController`, `CustomSizeProfileController`, `CustomProductController`,
`BadgeProfileController`). That vertical is tracked in [`KNOWN-GAPS.md`](./KNOWN-GAPS.md);
its table-explorer projections should land with it, not before it. Zero frontend callers today.

> **Follow-up worth filing separately (not a route gap):** `sql.identifier(tableName)` with
> no allowlist means any `GOD_MODE`/`SUPER_USER` token can dump *any* table in the database
> through one endpoint. It is correctly gated `CODE_SU` and is not injectable (the identifier
> is quoted), so this is a blast-radius concern rather than a hole — but an explicit
> slug→table allowlist would fix the vocabulary mismatch above and shrink that radius in the
> same change.

#### analytics — 3 routes. Reason: no consumer; partial, differently-shaped replacement already exists.

`GET /get/super-user/ga-attribution/{summary,orders,abandoned-carts}`,
`GaAttributionController`, all `CODE_SU` in Loom.

- No caller in either frontend. The CMS nav entry `apps/cms/src/lib/nav-menu.ts:263` →
  `/ads-conversion` points at a directory that does not exist.
- A partial replacement is already served under a different name:
  `commerce/domain/super-user.controller.ts:241,277,296` →
  `/get/super-user/ads-conversion/{summary,orders,abandoned-carts}`, all `CODE_SU`.
  It is **not** equivalent — no INR normalisation via exchange rate, no
  `utmCampaign|utmSource|clickIdType` grouping, hard `limit(200)`/`limit(50)`, envelope key
  `data`, and abandoned carts are neither grouped per tenant nor filtered by click id/window.
- The backing columns exist (`cart_item.click_id/utm_*` at `schema.ts:284-289`,
  `orders` equivalents at `:952-957`), so a faithful port is possible later. It is not done
  now because reproducing `GaAttributionService`'s aggregation without a consumer to validate
  it against is exactly how fabricated analytics get shipped.

---

## 3b. Scaffold-route disposition (2026-09-02)

The pinned question was ~80 scaffold `GET /get/<entity>` + `POST /create/<entity>` pairs
gated `CODE_SU`. A previous pass had already deleted 94 such pairs across 51 entities.
Re-running that analysis over what remained found the family had shrunk to **three pairs**
(order, forex, inventory) plus their dead services — and all of it was already unreachable:

- **No Java original.** No `"/get/forex"`, `"/create/forex"`, `"/get/inventory"`,
  `"/create/inventory"`, `"/get/order"` or `"/create/order"` constant exists anywhere in
  `loom/src`.
- **No caller** in `apps/storefront/src` or `apps/cms/src`.
- **Not even registered.** `order.module.ts`, `forex.module.ts` and `inventory.module.ts`
  each list only the real controller under `controller/` and the real service under
  `service/`. The module-root `<m>.controller.ts` / `<m>.service.ts` files (which shadow the
  real ones by class name) were imported by nothing except their own spec files, so they
  served **zero routes at runtime**. A prior pass had already recorded this in
  `order.service.spec.ts`'s header — "they are DEAD CODE" — but deleted neither.
- **What they did.** All of them extend `CommerceDataService`, which `CREATE TABLE IF NOT
  EXISTS commerce_<name>` on first use and stores arbitrary JSON blobs. So `GET /get/forex`
  never read the real `forex` table; it read an auto-created `commerce_forex` bucket that
  no domain code writes. A raw table-dump and raw table-insert endpoint over a table that
  exists only because the endpoint created it is precisely the liability being removed.

**Deleted — 13 files, 388 lines:**

| File | Lines |
|---|---|
| `commerce/order/order.controller.ts` | 30 |
| `commerce/order/order.service.ts` | 11 |
| `commerce/forex/forex.controller.ts` | 29 |
| `commerce/forex/forex.service.ts` | 11 |
| `commerce/inventory/inventory.controller.ts` | 30 |
| `commerce/inventory/inventory.service.ts` | 11 |
| `commerce/navigation/navigation.service.ts` | 11 |
| `commerce/material/material.service.ts` | 11 |
| `commerce/order/order.controller.gates.spec.ts` | 25 |
| `commerce/order/order.controller.spec.ts` | 60 |
| `commerce/order/order.service.spec.ts` | 133 |
| `commerce/forex/forex.controller.gates.spec.ts` | 13 |
| `commerce/inventory/inventory.controller.gates.spec.ts` | 13 |

`navigation.service.ts` and `material.service.ts` had no controller at all — dead services
with no route. The five spec files tested only the deleted dead code.

**Kept, and why:**

- `commerce/transmission/transmission.service.ts` — also a `CommerceDataService` subclass, but
  `TransmissionModule` **does** register it and `tracking.controller.ts` uses it. Load-bearing;
  `/track/*` is owned by another agent this pass.
- `commerce/impact/impact.controller.ts` + `impact.service.ts` — same scaffold shape, but
  `commerce/impact/**` is another agent's area this pass. Flagged, not touched.
- `CompatibilityService`, `MiscService`, `DiscountService` — their controllers
  (`redirect/*`, `send/contact-us`, `apply/voucher/discount`) carry real routes and are
  registered, but none of the three ever references `this.service`. The injection is dead
  even though the controller is not. Left alone to keep this diff to route-bearing dead code;
  worth a follow-up.

---

## 3c. Blog/story listing gates — decision (2026-09-02)

**Question.** `/get/blog-content-category-list` and `/get/story-content-category-list`
(`CODE_SU`) and `/get/blog-content-types` (`CODE_SUCU`) are gated in Loom, but were
suspected of feeding public blog/story listing pages — in which case following Java would
401 anonymous blog navigation, the way three forex routes once 401'd **every** storefront
page render.

**Decision: keep all three gates. The analogy to forex does not hold.**

Evidence:

1. **No storefront caller at all.** Grepping the entire `apps/storefront` tree — not just
   `src`, but build output and `.harness` reports too — for `content-category-list` and
   `blog-content-types` returns **zero** hits. Nothing anonymous can be 401'd by a route it
   never requests.
2. **The only callers are the CMS, and they send a token.**
   `apps/cms/src/lib/content-api.ts:43,49,52` call all three through
   `fetchContentList(path, token)` → `contentGet(path, token)` → `loomGetJson("content-api",
   path, token)`. These are authenticated admin reads.
3. **The storefront's anonymous blog/story surface uses different endpoints**, all already
   public and already pinned: `/get/blog-content-list/customer`
   (`lib/api/repositories/catalog.repository.ts:241`, `components/Stories.tsx:67`),
   `/get/story-content-list` (`components/content-list/loom.ts:77`, `app/api/stories/route.ts`),
   `/get/blog-content/slug/:slug`, `/get/story-content/slug/:slug`.
4. **No storefront page renders a category or type filter** — no `categor*` reference in
   `app/blogs/page.tsx`, `app/stories/[slug]/page.tsx` or `components/content-list/loom.ts` —
   so no server component, `generateStaticParams` or `generateMetadata` needs these lists.

The three current gates also match the Java originals exactly:
`BlogContentCategoryController.getBlogContentCategoryList` → `getEntity(..., CODE_SU,
UNAUTH_BLOG_CONTENT_CATEGORY_LIST_REQUEST)`;
`StoryContentCategoryController.getStoryContentCategories` → `getEntity(..., CODE_SU)`;
`BlogContentTypeController.getBlogContentTypeList` → `getEntity(..., CODE_SUCU)`.

**Pinned by test.** `apps/storefront/src/lib/loom/public-route-contract.test.ts` gained a
`GATED_CALLS` block — the mirror of its existing `ANONYMOUS_CALLS` block — asserting these
three keep a `@RequireGate`, with the evidence above inline so a future "make blog public"
sweep cannot quietly open an admin list to the internet.

---

## 4. Matched on paper, not served at runtime

15 controllers declare routes but appear in no module's `controllers[]` array, so
Nest never routes them. 36 legacy routes match **only** these controllers — they
are counted in the 619 "matched" figure and must not be counted as migrated.

| Unregistered controller | Legacy routes it is the only match for | Examples |
|---|---|---|
| `SizeProfileController` | 9 | `GET /get/size-profile/{profileId}`, `GET /get/size-profile-list`, `POST /add/size-profile`, … |
| `BadgeProfileController` | 8 | `GET /get/badge-profile-list`, `GET /get/badge-profile/{profileId}`, `POST /add/badge-profile`, … |
| `MadeToOrderProfileController` | 7 | `GET /get/made-to-order-profile-list`, `GET /get/made-to-order-profile/{profileId}`, `POST /add/made-to-order-profile`, … |
| `SkuGroupController` | 5 | `POST /add/sku-group`, `PATCH /update/sku-group`, `GET /get/table-explorer/data/sku-group`, … |
| `SpecialStatusController` | 5 | `GET /get/table-explorer/data/special-status`, `POST /add/special-status`, `PATCH /update/special-status`, … |
| `AddressMigratedDomainController` | 2 | `GET /get/table-explorer/data/address`, `GET /get/table-explorer/data/address/{id}` |

Full list of the 15: `AddressMigratedDomainController`, `ArtisanpaymentController`,
`BadgeProfileController`, `CartApiController`, `CatalogController`, `ColorController`,
`CommerceController`, `ContentController`, `MadeToOrderProfileController`,
`ProductApiController`, `ProfileController`, `SizeProfileController`,
`SkuGroupController`, `SpecialStatusController`, `TenantProfileController`.

Frontend evidence for the highest-impact of these (same grep method as §3):
`made-to-order` → storefront 57 / cms 19; `/content` → storefront 145 / cms 48;
`/catalog` → storefront 29 / cms 55; `/color` → 9/9; `size-profile` → 2/18;
`sku-group` → 0/18; `special-status` → 1/13; `badge-profile` → 1/12.
`TenantProfileController`, `ProfileController` and `CartApiController` have no
frontend references to their paths and look like duplicate/abandoned controllers.

**Action:** for each, either register it in the owning module or delete it. A
declared-but-unregistered controller is the exact failure mode that lets a
completion report claim coverage the running server does not have.

---

## 5. Routes that exist only on the new side (267) — flagged for review

267 route declarations across 86 controllers have no legacy counterpart. Most are
either (a) scaffolded CRUD stubs auto-generated per module (`POST /create/<module>`,
`GET /get/<module>` appear on nearly every controller), or (b) deliberate
redesigns. They need a decision each: keep, or delete as scaffolding.

| New controller | Routes with no legacy match | Examples |
|---|---|---|
| `ProductController` | 16 | `POST /add/product`, `POST /create/product`, `DELETE /delete/product/:id`, `GET /get/product/:id`, … |
| `ProductZohoRelationController` | 9 | `POST /add/product-zoho-relation`, `GET /get/product-zoho-relation/:id`, `GET /get/product-zoho-relation/active-with-active-product`, `GET /get/product-zoho-relation/by-product-and-sku`, … |
| `ImpactController` | 8 | `POST /add/impact-factor`, `POST /create/impact`, `DELETE /delete/impact-factor/:id`, `GET /get/impact-factor/:id`, … |
| `NVerseController` | 8 | `POST /create/nverse`, `GET /get/nverse`, `POST /nverse/email/verify`, `GET /nverse/get/table-explorer/data/verification-token/:id`, … |
| `ImageOptimizationDomainController` | 8 | `PATCH /update/image-optimization/discovery/run`, `PATCH /update/image-optimization/main/pause`, `PATCH /update/image-optimization/main/resume`, `PATCH /update/image-optimization/main/settings`, … |
| `ProductSizeProfileController` | 7 | `POST /add/product-size-profile`, `DELETE /delete/product-size-profile/:id`, `DELETE /delete/product-size-profile/by-size-option/:sizeProfileOptionId`, `GET /get/product-size-profile/:id`, … |
| `AuthController` | 7 | `POST /auth/authenticate/social`, `POST /auth/authenticate`, `GET /auth/authority`, `POST /auth/register/email`, … |
| `ArtisanPaymentController` | 6 | `POST /add/artisan-payment/record`, `GET /get/artisan-payment/incentive-config/list`, `GET /get/artisan-payment/record/:id`, `GET /get/artisan-payment/record/artisan/:artisanId`, … |
| `LoomLegacyAuthController` | 6 | `GET /authority/token`, `POST /authority/token`, `GET /check-email/tenant`, `POST /get/authority/token`, … |
| `CartController` | 6 | `POST /create/cart`, `GET /get/cart`, `DELETE /v1/cart/items/:cartItemId`, `PATCH /v1/cart/items/:cartItemId`, … |
| `FabricProductController` | 6 | `GET /get/fabric-product/filter-preview/by-ids`, `GET /get/fabric-product/filter-preview/filtered`, `GET /get/fabric-product/filter-preview/page`, `GET /get/fabric-product/filter-preview`, … |
| `CommerceController` | 5 | `DELETE /:id`, `GET /:id`, `PATCH /:id`, `GET /`, … |
| `LoyaltyprogramController` | 5 | `POST /create/loyaltyprogram`, `GET /get/customer/loyalty-info`, `GET /get/loyalty-program/config`, `GET /get/loyaltyprogram`, … |
| `NotificationController` | 5 | `POST /create/notification`, `GET /get/notification`, `GET /get/table-explorer/data/email-notification-history/:id`, `GET /get/table-explorer/data/email-notification-history`, … |
| `PaymentController` | 5 | `POST /create/payment`, `GET /get/payment`, `PATCH /update/payment/failure`, `PATCH /update/payment/success`, … |
| `WhatsappController` | 5 | `POST /create/whatsapp`, `POST /customer/whatsapp/dismiss`, `POST /customer/whatsapp/opt-in`, `POST /customer/whatsapp/opt-out`, … |
| `ForexController` | 4 | `POST /create/forex`, `GET /get/forex/exchange-rate/:code`, `GET /get/forex`, `PATCH /update/forex/exchange-rate` |
| `IPLocationController` | 4 | `POST /create/iplocation`, `GET /get/iplocation/:ip`, `GET /get/iplocation/current`, `GET /get/iplocation` |
| `SkillController` | 4 | `POST /create/skill`, `GET /get/skill-list`, `GET /get/skill/:skillId`, `GET /get/skill` |
| `TableExplorerController` | 4 | `POST /create/table_explorer`, `GET /get/table_explorer`, `GET /get/table-explorer/data/:tableName/:id`, `GET /get/table-explorer/data/:tableName` |
| `MiscMigratedDomainController` | 4 | `GET /get/ads-conversion/abandoned-carts`, `GET /get/ads-conversion/summary`, `GET /users/users`, `POST /users` |
| `ArtisanMigratedDomainController` | 4 | `GET /get/artisan/workflow/:workflowId/assigned-element-de`, `GET /get/master/:masterId/worker/:artisanId/workflow/:workflowId`, `GET /get/subprocess-element/:subProcessId/artisan-assign`, `POST /update/skill` |
| `SegmentController` | 4 | `GET /get/segment/by-id/:id`, `GET /get/segment/fuzzy-search`, `GET /get/segment/list`, `GET /get/segment/preview/list` |
| `NotificationsDomainController` | 4 | `GET /poll/whatsapp/delivery-status/:id`, `GET /poll/whatsapp/delivery-status/stale`, `GET /poll/whatsapp/delivery-status`, `POST /send/email` |
| `TrackingController` | 4 | `GET /track/all`, `GET /track/awb/:trackingNumber`, `GET /track/batch/:batchNo`, `GET /track/order/:orderId` |

(Top 25 of 86 controllers. Full list: `node scripts/route-coverage.mjs --json out.json`,
field `newOnly`.)

The recurring `POST /create/<module>` + `GET /get/<module>` pair is the clearest
signal of generated scaffolding — it appears on `CartController`, `PaymentController`,
`ForexController`, `NotificationController`, `WhatsappController`, `SkillController`,
`IPLocationController`, `LoyaltyprogramController`, `TableExplorerController`,
`NVerseController` and others. None of these correspond to anything in loom.

`CommerceController` in `src/commerce/rest-api.module.ts` declares bare `/:id`
routes with an empty `@Controller()` base — it is unregistered, and if it were
registered those routes would shadow every other top-level path. Delete it.

---

## 6. Status of the earlier migration reports

`docs/migration-audit/migration-completion-report.md` and
`docs/migration-audit/swagger-gap-report.md` claimed a completed, comprehensive
migration. They are replaced by a pointer to this document; see their headers.
Their legacy endpoint census (686) was close to correct (694 measured); their
completion claims were not — 111 legacy routes are not reachable on the new API,
15 controllers are declared but never registered, and at least one storefront
integration (forex) is broken by a path rename.

## 7. Reproducing

```
node scripts/route-coverage.mjs              # summary
node scripts/route-coverage.mjs --list       # + every missing route
node scripts/route-coverage.mjs --json rc.json
node scripts/route-coverage.mjs --loom /path/to/loom
```

Normalisation rules and their individual match counts are documented in the
comment block at the top of the script.
