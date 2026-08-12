# Endpoint Inventory — the contract surface

Verified 2026-08-12 against `chore/agent-substrate` by grepping the actual call sites (not the
docs, not the specs). See "How to regenerate" at the bottom — this file is hand-generated today
and should not stay that way.

> **UNVALIDATED: ~172 of ~172 frontend calls (100%).** Every request either frontend sends to the
> legacy Java backend crosses the wire with zero runtime schema validation. `packages/types`
> contains exactly **one** Zod schema (`CustomerSchema`, `packages/types/src/schemas/customer.schema.ts`),
> and it has **zero importers** outside its own test file. This number is the contract-gap
> burn-down metric for the migration: every PR that adds a Zod schema and wires it into a real
> call site should move it down. Track it here.

## 0. The two catch-all proxies (read this first)

Both frontends also expose an unbounded pass-through:

- `apps/storefront/src/app/api/backend/[...path]/route.ts` — forwards any path to the legacy
  Loom API with a hardcoded bearer token (see `docs/KNOWN-GAPS.md`).
- `apps/cms/src/app/api/backend/[...path]/route.ts` (equivalent CMS proxy, `TARGET_HOST` hardcoded).

Because these are catch-alls, the *true* set of paths either app can reach is unbounded — any
path a component constructs at runtime gets forwarded. This inventory captures what the code
**actually calls today**, found by grepping literal path strings in the repository/service layers
below. It is a floor, not a ceiling.

## 1. Population A — what the frontends actually call (legacy Java backend)

Counted by grepping URL path literals in:
- `apps/storefront/src/lib/api/repositories/*.ts` (5 files: `auth`, `cart`, `catalog`, `plp`, `profile`)
- `apps/storefront/src/app/api/*/route.ts` and nested `route.ts` (10 Next.js route handlers that
  proxy server-side to `NEXT_PUBLIC_SPRINGBOOT_API_URL`, bypassing the repository layer entirely)
- `apps/cms/src/services/*.ts` — **24 files today, not the 30 the brief assumed.** Verified with
  `ls apps/cms/src/services | wc -l` → 24. Corrected here.

| Source | Distinct paths found | Notes |
|---|---|---|
| Storefront repositories — legacy mode | 24 | `mode` defaults to `"legacy"` and `NEXT_PUBLIC_API_MODE` is never set to `"nest"` anywhere in the repo (`apps/storefront/src/env.ts`), so these are the paths that actually run |
| Storefront repositories — nest mode (dead code path today) | 5 | `/v1/cart`, `/v1/cart/items`, `/v1/navigation`, `/v1/products`, `/v1/search` — written, unreachable until the mode switch flips |
| Storefront route handlers (`src/app/api/*/route.ts`) | 17 | Bypass the repository/`NEXT_PUBLIC_API_MODE` switch entirely; hardwire `NEXT_PUBLIC_SPRINGBOOT_API_URL` directly (`plp/route.ts:4`, `search/route.ts:4`, etc.) |
| CMS services (`apps/cms/src/services/*.ts`) | 131 raw string matches → **126 real** after removing 5 mock-data literals in `seo-service.ts:25,38,64,77,90` (sample SEO records, not endpoints) | |
| **Total distinct paths actually called** | **~172** (24 + 17 + 126, nest-mode 5 excluded as dead) | Audit draft said "~175+" — close; the gap is the services-file miscount and the seo-service mock-data false positives |

Grouped by domain (storefront):

| Domain | Repository file | Paths | Example |
|---|---|---|---|
| Auth | `auth.repository.ts` | 6 | `check-email/tenant`, `authenticate/email`, `authenticate/social`, `customer/registration`, `customer/registration/social`, `send/password-reset/email` |
| Cart | `cart.repository.ts` | 2 (legacy) + 2 (nest, dead) | `/get/cart-item/list`, `/add/cart-item` |
| Catalog | `catalog.repository.ts` | 8 | `/get/navigation`, `/get/fabric-preview-list`, `/get/fabric-product/slug/{slug}`, `/search/ai/`, `/get/navigation/fabric/craft`, `/get/stories/category/{category}`, `/get/blog-content-list/customer`, `/get/review` |
| Profile | `profile.repository.ts` | 8 | `get/customer/profile`, `update/customer/profile`, `get/address-list`, `add/address`, `update/address`, `delete/address/{id}`, `get/customer/order-list/all`, `get/customer/loyalty/info` |
| PLP | `plp.repository.ts` | 0 direct (proxies to internal `/api/plp*` routes) | see route handlers below |
| Route handlers (server-side proxy to legacy) | 10 files | 17 | `${BASE_URL}/get/color-list`, `/get/material-list`, `/get/pattern-list`, `/get/filter/fabric`, `/get/filter/finished`, `/search/ai/{q}`, `/search/ai/story/{q}`, `/search/ai/blog/{q}`, `/get/v2/fabric-product/slug/{slug}`, `/get/finished-product/slug/{slug}`, `/get/blog-content-list/customer`, `/get/blog-content/{id}`, `/get/story-content-list`, `/get/story-content/{id}`, `/get/related-products/id/{ids}`, `/get/filter/segment-list`, `/get/navigation/story/{type}` |

Grouped by domain (CMS, 126 real paths across 24 service files) — by verb prefix, the shape of
the legacy API surface:

| Verb prefix | Count | What it covers |
|---|---|---|
| `/get/*` | ~48 | List/read endpoints: artisan-payments, catalog, category, color, customers, diagnostics, discount, faqs, forex, inventory, material, order feedback, pattern, product, segment, settings, shipment, size/finish/badge/custom-size/made-to-order/volume-discount profiles, skills, sku-group, special-status, story/blog content, sub-category, table-explorer, tag, tenant cart, warehouse, workflow templates |
| `/add/*` | ~27 | Create endpoints, one per catalog/profile entity (artisan, category, color, custom-order, discount, forex, material, pattern, review, segment, shipment, skill, sku-group, story/blog content, sub-category, tag, warehouse, and 8 product "profile" types) |
| `/update/*` | ~24 | Update endpoints, same entity set as `/add/*` |
| `/cancel/*`, `/disable/*`, `/enable/*` | 5 | `cancel/custom-order`, `cancel/order`, `disable/fabric-product`, `disable/finished-product`, `enable/loyalty-program` |
| `/poll/*`, `/sync/*`, `/upload/*`, `/logistic/*`, `/manage-*` | ~7 | WhatsApp delivery polling, stock sync, image upload, forex/shipping lookups |
| misc singletons | ~15 | `customer/registration/email`, `update/super-user/review`, image-optimization discovery/pause/resume, inventory-restock-request status |

Full raw path lists (not pasted here to keep this file reviewable) are saved at:
`/private/tmp/claude-501/-Users-saqlainrashid-Downloads-Anuprerna/b2a549d0-ae2b-40c9-aae6-b3733129c760/scratchpad/cms-urls-dedupe.txt`
and the storefront repository/route-handler greps in the same directory. These are throwaway
scratch files, not part of the repo — regenerate them with the commands in §4.

## 2. Population B — what `apps/api` now exposes

`apps/api/src` (post-merge, this branch): **116 controller files**, verified with
`find apps/api/src -name "*.controller.ts" | wc -l`.

| Decorator | Count |
|---|---|
| `@Get(` | 320 |
| `@Post(` | 136 |
| `@Patch(` | 59 |
| `@Delete(` | 35 |
| **Total route handlers** | **550** |
| Distinct `@Controller(...)` path prefixes | 66 |

Grouped by module — `apps/api/src/commerce/` has **55 subdomains** (verified: `ls apps/api/src/commerce | wc -l` minus the two `.module.ts` files = 55 directories), one controller-cluster each:
`address, ads_conversion, ai, alfred, artisan, artisanpayment, behemoth, bloomsight, cart, catalog,
color, compatibility, configuration, content, diagnostics, discount, faq, feedback, filter, forex,
image, impact, inventory, iplocation, loyaltyprogram, material, misc, msg91, navigation,
notification, nverse, order, pattern, payment, product, profile, report, restful, review, search,
seo, settings, shared, shipment, sitemap, skill, support, table_explorer, tenant, transmission,
utility, whatsapp, workflow, zoho, zoho_adapter`, plus `auth/`, `identity/`, `health/`,
`migration/`, `proxy/` outside `commerce/`.

550 route handlers behind 116 controllers means the API's *nominal* surface (550) is roughly 3x
the frontends' actual call volume (172) — expected, since one legacy monolith endpoint often maps
to several REST-shaped NestJS endpoints (list/get/create/update/delete per entity) plus admin-only
routes the frontends don't call yet.

## 3. Reconciliation — the important column

For each frontend domain: does `apps/api` have a matching module, and is there a Zod schema for
the payload?

| Frontend domain | Frontend paths | Matching `apps/api` module exists? | Zod schema in `packages/types`? | Status |
|---|---|---|---|---|
| Auth | 6 | `apps/api/src/auth/`, `apps/api/src/identity/` — yes, module scaffolding exists | No | UNVALIDATED |
| Cart | 4 (2 legacy + 2 dead nest) | `apps/api/src/commerce/cart/` — yes | No | UNVALIDATED |
| Catalog / Product | 8 (storefront) + ~30 (CMS product profiles) | `apps/api/src/commerce/catalog/`, `product/` — yes | No | UNVALIDATED |
| Profile / Address | 8 | `apps/api/src/commerce/profile/`, `address/` — yes | No | UNVALIDATED |
| Order | CMS: cancel/order, order feedback | `apps/api/src/commerce/order/` — yes | No | UNVALIDATED |
| Artisan / ArtisanPayment | CMS: add/update/get artisan, artisan-payments | `apps/api/src/commerce/artisan/`, `artisanpayment/` — yes | No | UNVALIDATED |
| Discount / Forex / Shipment | CMS: ~9 | `apps/api/src/commerce/discount/`, `forex/`, `shipment/` — yes | No | UNVALIDATED |
| Inventory | CMS: 4 | `apps/api/src/commerce/inventory/` — yes | No | UNVALIDATED |
| Workflow (templates, feedback, custom-process) | CMS: ~8 | `apps/api/src/workflow/` (top-level, separate from `commerce/`) — yes | No | UNVALIDATED |
| WhatsApp | CMS: 4 (consent, audit, delivery polling) | `apps/api/src/commerce/whatsapp/` — yes | No | UNVALIDATED |
| Zoho | not called by either frontend today (internal integration only) | `apps/api/src/commerce/zoho/`, `zoho_adapter/` — yes | No | N/A — no frontend caller |
| Diagnostics / Image Optimization | CMS: ~7 (mostly render fabricated data client-side, see `docs/KNOWN-GAPS.md`) | `apps/api/src/commerce/diagnostics/`, `image/` — yes, but pages don't call them | No | UNVALIDATED where called at all |
| Settings / Table Explorer / SEO / Skill / Review | CMS: ~10 | modules exist under `commerce/` | No | UNVALIDATED |
| Search / Navigation / PLP / Blog / Story content | Storefront: ~14 | `apps/api/src/commerce/search/`, `navigation/`, `content/` — yes | No | UNVALIDATED |

**Every row is UNVALIDATED.** The reconciliation isn't "which endpoints are missing on `apps/api`"
— module scaffolding exists for essentially every domain the frontends call. The gap is (a)
whether the *specific* route + request/response shape matches what the frontend sends today
(not independently verified per-route in this pass — that's the natural next audit), and (b) that
none of it is contract-checked at runtime in either direction.

**The API is not deployed.** 0% of the 172 frontend calls above actually reach `apps/api` today —
both frontends point at the legacy Java backend (`NEXT_PUBLIC_SPRINGBOOT_API_URL` /
`TARGET_HOST`). This inventory is a map for the migration, not a description of production
traffic. See `docs/KNOWN-GAPS.md`.

## 4. How to regenerate this file

This file is hand-generated (grep + manual grouping, 2026-08-12) and will rot the moment either
frontend or `apps/api` changes. It should be generated by a script, not maintained by hand. Intended
approach, not yet built:

```
scripts/gen-docs/
  extract-frontend-calls.ts   # AST-walk apps/*/src/lib/api/repositories, app/api/*/route.ts,
                               # apps/cms/src/services — collect string literals passed to the
                               # fetch wrapper, not a blind path-literal grep (avoids false
                               # positives like the seo-service.ts mock data caught in this pass)
  extract-api-routes.ts       # ts-morph over apps/api/src/**/*.controller.ts — read @Controller
                               # + @Get/@Post/@Patch/@Delete/@Put decorator args, resolve full path
  extract-zod-coverage.ts     # walk packages/types/src/schemas, cross-reference against both
                               # of the above by path string
  render-endpoint-inventory.ts # emit this file's tables from the three JSON outputs above
```
Run target: `pnpm gen:docs` (not wired up yet — add to root `package.json` when the script exists).
Until then, treat every count in this file as accurate as of 2026-08-12 and re-verify before
quoting it in a later conversation.
