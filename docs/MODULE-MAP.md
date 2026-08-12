# Module Map

The definitive navigation reference for `apps/api`. Written for a client demo and for AI coding
agents adding or modifying backend modules.

Verified directly against the code on `main`, 2026-08-12:

- 628 TypeScript files under `apps/api/src`
- 117 `*.controller.ts` files
- 348 files still carrying `@ts-nocheck`
- 55 subdomains under `apps/api/src/commerce/`

The API now boots — `node dist/main.js` runs on `:4000` and serves Swagger at `/docs` — but it is
still not deployed and carries zero production traffic; see `docs/ARCHITECTURE.md` §2.

For system architecture and request flow, see `docs/ARCHITECTURE.md` and `docs/DATA-FLOW.md`. For
the data these modules operate on, see `docs/DATA-INVENTORY.md`. For runtime/process state, see
`docs/STATE-INVENTORY.md`.

## 1. Top-level modules

| Module | Owns | Entry file | State |
|---|---|---|---|
| `auth/` | Password auth (`GatekeeperService`: `bcrypt(pepper + password)` at cost 11 via `bcryptjs`, tokens signed with `jose`), tenant lookup, `RolesGuard`. Auth0/social login bound to a dummy that always rejects. | `auth/auth.module.ts` | **Real implementation.** Controller, service, repository, DTOs, types all present (6 files). |
| `commerce/` | Catalog, cart, checkout, orders (all 4 types), customers, payments, and every other business subdomain — 55 subdomains, wired through `commerce.module.ts` (56 imports). | `commerce/commerce.module.ts` | **Real implementation** — the bulk of the backend. |
| `common/` | Shared cross-cutting code: pino-style logger stub, request-id middleware, auth decorators/guard, error codes, response envelope (`RainResponse`), a `health/health.module.ts`. | no single entry — a grab-bag under `common/*` | **Partially real.** `request-id.middleware.ts` and `roles.guard.ts` are implemented but `request-id.middleware.ts` is never registered anywhere (see section 5). `common/logger/` has only a README, no logger code. |
| `database/` | Drizzle ORM client, `DATABASE_CONNECTION` provider (global), schema (`schema/schema.ts`, `relations.ts`, one migration snapshot). | `database/database.module.ts` | **Real implementation**, plus the repo's only two DB-adjacent tests (`database.int.spec.ts`). |
| `health/` | `/health` liveness endpoint. | `health/health.controller.ts` | **Real but minimal** — one endpoint, new code (not a port), documented in its own header comment as intentionally added since no health controller existed in the legacy source. |
| `identity/` | Documented to own auth/sessions/dual-accept tokens/delegated resolver. | `identity/identity.module.ts` | **Empty shell.** `@Module({})` with only a comment; `identity/dto/` and `identity/guards/` subdirectories exist but are empty (0 files). All of this functionality actually lives in `auth/` today. |
| `migration/` | Documented to own extract/land/profile/model/reconcile pipeline. | `migration/migration.module.ts` | **Empty shell.** `@Module({})`, one file, comment points to `../../loom-local-db` for the working prototype — nothing is implemented in `apps/api` itself. |
| `proxy/` | Strangler-fig catch-all: forward unconverted reads to legacy Loom, 501 writes; meant to shrink to zero as features move out. | `proxy/proxy.module.ts` | **Empty shell.** `@Module({})`, one file, comment only — no actual proxying/forwarding code exists yet. |
| `workflow/` | Documented to own ArtisanFlow (`/af/*` routes, `af_` tables). | `workflow/workflow.module.ts` | **Empty shell, and the doc comment inside it is inaccurate** — no `af_` tables exist (see `docs/DATA-INVENTORY.md` section 5) and no `/af/*` routes are registered here. The real ArtisanFlow implementation lives under `commerce/artisan/`, `commerce/workflow/`, and `commerce/skill/`, which are fully built out. |

**Net finding:** of the 9 top-level modules, 4 (`identity`, `migration`, `proxy`, `workflow`) are
still single-file empty shells post-merge, despite `identity` and `workflow` in particular having
real, working implementations elsewhere in the tree (`auth/`, `commerce/artisan|workflow|skill/`).
An agent looking for "where ArtisanFlow lives" should go to `commerce/`, not `workflow/`.

## 2. The 55 `commerce/` subdomains

All 55 have a `*.module.ts`. Grouped by family; controller/service counts are file counts, not
endpoint counts (some subdomains have multiple controllers, e.g. one per sub-resource).

### Commerce core — product, cart, order, checkout

| Subdomain | Controllers | Services | Module | Notes |
|---|---|---|---|---|
| `product` | 13 | 20 | yes | Largest subdomain by far; contains `category`, `custom-product`, `fabric-product`, `finished-product`, `product`, `product-preview`, `product-size-profile`, `product-zoho-relation`, `segment`, `sku-group`, `special-status`, `sub-category`, `tag` as sibling directories. |
| `catalog` | 6 | 5 | yes | — |
| `cart` | 3 | 2 | yes | Dummy-bound ports: `EMAIL_ENCODER_PORT`, `FABRIC_PREVIEW_PORT`, `FINISHED_PREVIEW_PORT`, `FINISH_PROFILE_ITEM_PORT`, `SIZE_PROFILE_OPTION_PORT`, `TENANT_LOOKUP_PORT` — see section 4. |
| `order` | 5 | 2 | yes | Standard order flow (`orders`/`order_item`). |
| `inventory` | 2 | 2 | yes | — |
| `shipment` | 2 | 2 | yes | — |
| `payment` | 2 | 3 | yes | Has its own `ports/` directory. |
| `discount` | 1 | 1 | yes | — |

### Content, taxonomy, and merchandising

| Subdomain | Controllers | Services | Module | Notes |
|---|---|---|---|---|
| `content` | 3 | 3 | yes | Sub-splits into `blog/` and `story/`. |
| `faq` | 2 | 2 | yes | — |
| `color` | 2 | 1 | yes | — |
| `material` | 2 | 2 | yes | — |
| `pattern` | 2 | 2 | yes | — |
| `filter` | 2 | 2 | yes | — |
| `search` | 2 | 2 | yes | — |
| `seo` | 2 | 2 | yes | — |
| `navigation` | 2 | 2 | yes | — |
| `sitemap` | 2 | 2 | yes | — |
| `review` | 2 | 2 | yes | — |
| `feedback` | 1 | 1 | yes | — |
| `impact` | 2 | 2 | yes | — |

### Artisan / workflow (ArtisanFlow)

| Subdomain | Controllers | Services | Module | Notes |
|---|---|---|---|---|
| `artisan` | 1 | 1 | yes | — |
| `workflow` | 5 | 2 | yes | The real ArtisanFlow workflow engine — not the top-level `src/workflow/` shell. |
| `skill` | 2 | 2 | yes | — |
| `artisanpayment` | 1 | 1 | yes | — |

### Tenant, identity-adjacent, and access

| Subdomain | Controllers | Services | Module | Notes |
|---|---|---|---|---|
| `tenant` | 2 | 2 | yes | — |
| `address` | 1 | 1 | yes | — |
| `profile` | 5 | 2 | yes | — |
| `loyaltyprogram` | 2 | 2 | yes | — |

### Integrations and external systems

| Subdomain | Controllers | Services | Module | Notes |
|---|---|---|---|---|
| `zoho` | 2 | 3 | yes | External ERP sync. |
| `zoho_adapter` | 1 | 2 | yes | Adapter layer for `zoho`. |
| `msg91` | 1 | 2 | yes | SMS provider. |
| `whatsapp` | 2 | 2 | yes | — |
| `notification` | 2 | 3 | yes | Email/WhatsApp notification orchestration. |
| `iplocation` | 2 | 2 | yes | — |
| `forex` | 1 | 1 | yes | — |
| `nverse` | 2 | 2 | yes | Contains a `Dummy`-suffixed identifier in `nverse.service.ts` itself (not just its module), worth checking before extending. |
| `ads_conversion` | 1 | 1 | yes | — |
| `bloomsight` | 1 | 1 | yes | — |
| `behemoth` | 1 | 1 | yes | — |
| `alfred` | 1 | 1 | yes | — |

### Admin, ops, and platform utility

| Subdomain | Controllers | Services | Module | Notes |
|---|---|---|---|---|
| `settings` | 2 | 2 | yes | — |
| `configuration` | 1 | 1 | yes | — |
| `report` | 2 | 2 | yes | — |
| `diagnostics` | 1 | 1 | yes | — |
| `table_explorer` | 2 | 2 | yes | Generic table-browsing admin tool. |
| `restful` | 1 | 2 | yes | — |
| `transmission` | 1 | 2 | yes | — |
| `image` | 2 | 2 | yes | Image optimization pipeline. |
| `compatibility` | 1 | 1 | yes | — |
| `misc` | 2 | 2 | yes | — |
| `support` | 1 | 1 | yes | — |
| `utility` | 1 | 1 | yes | — |
| `ai` | 1 | 1 | yes | Vector search / embeddings (`product_vector`, `blog_vector`). |
| `shared` | 0 | 0 | n/a | Not a feature subdomain — shared helpers used across `commerce/*`, no controller/service/module of its own. |

55 feature subdomains total (56 directories under `commerce/` minus `shared`, which is
infrastructure, not a subdomain).

## 3. Per-domain file convention

Every ported subdomain follows the same shape, mirroring the original Java package layout:

```
commerce/<domain>/
  controller/       one *.controller.ts per REST resource in the domain
  dto/              request/response DTOs (input/output shape, not DB shape)
  mapper/           entity <-> DTO conversion
  repository/       Drizzle queries against database/schema
  service/          business logic, orchestrates repository + mapper + ports
  types/            port interfaces/tokens (the `*_PORT` symbols used in useValue wiring)
  validators/        request validation/sanitization
  <domain>.module.ts   NestJS module: controllers, providers, dummy-bound ports, exports
```

Not every subdomain has every folder (e.g. `msg91` has no `dto/`, `restful` has no `controller/`
subfolder) — folders appear only where the domain needs them. `mapper/` and `validators/` are the
two most commonly skipped.

### Worked example: `commerce/product/category/`

Clean, complete, and small enough to read end to end — use it as the template for a new domain.

```
commerce/product/category/
  category.module.ts
  dto/category.dto.ts
  mapper/category.mapper.ts
  repository/category.repository.ts
  service/category.service.ts
  types/category.types.ts
  validators/category.sanitizer.ts
  validators/category.validator.ts
```

`category.module.ts` (trimmed) — this port is **no longer a dummy**:

```ts
{ provide: IMAGE_STORAGE_PORT, useFactory: imageStorageAdapter, inject: [ImageService] },
```

`category`, `segment`, and `sub-category` all now bind `IMAGE_STORAGE_PORT` (`sub-category`:
`S3_STORAGE_PORT`) to a `useFactory` adapter that delegates to the real `ImageService`, not a
dummy that returned `""`. This is the pattern to copy going forward for closing out a dummy port:
real controller/service/repository/mapper wired normally through Nest's DI, and the previously
out-of-scope cross-domain dependency now wired to its real sibling service via `useFactory`. Note
the controller lives in a shared `commerce/product/controller/` directory rather than inside
`category/controller/` — controllers for `product`'s many sibling domains are consolidated there;
check the parent domain's `controller/` folder, not just the leaf directory, when adding a route.

## 4. Dummy-bound ports — technical debt inventory

The migration bound cross-domain dependencies that were out of scope for a given module's own port
to no-op dummies rather than leaving them unwired (which would crash Nest's DI at boot). **S3 image
ports have since been wired for real:** `category`, `segment`, and `sub-category` now delegate
`IMAGE_STORAGE_PORT`/`S3_STORAGE_PORT` to the real `ImageService` via `useFactory` adapters instead
of a dummy returning `""` — see the worked example in section 3. Every other port below is still a
dummy. Found via `grep -rln "Dummy" apps/api/src` (excluding specs): 10 files contain `Dummy`
identifiers; the table below lists every `useValue:` binding to one. Re-derive this list with the
same grep rather than trusting it verbatim on a later pass — it will drift as ports get wired.

| Port token | Bound in | Should eventually point at |
|---|---|---|
| `AUTH0_VALIDATION_PORT` | `auth/auth.module.ts` | Real Auth0 JWKS validation client — social login rejects every attempt until this is wired (dummy's `validateToken` always returns `false`). |
| `PRODUCT_PORT`, `COLOR_PORT`, `MATERIAL_PORT`, `PATTERN_PORT`, `TAG_PORT`, `MAIN_PRODUCT_PREVIEW_PORT`, `SIZE_PROFILE_PORT`, `ZOHO_ADAPTER_PORT`, `PRODUCT_ZOHO_RELATION_PORT`, `PRODUCT_SIZE_PROFILE_PORT` | `commerce/product/finished-product/finished-product.module.ts` | Their respective real sibling services under `commerce/product/*` and `commerce/zoho_adapter`. |
| `CUSTOM_ORDER_ITEM_PORT`, `SYNC_ERROR_LOGGER_PORT` | `commerce/product/custom-product/custom-product.module.ts` | Real `custom_order_item` repository access; a real error-logging sink. |
| `SUB_CATEGORY_PORT`, `SKU_GROUP_PORT`, `SPECIAL_STATUS_PORT`, `BADGE_PROFILE_PORT`, `VOLUME_DISCOUNT_PROFILE_PORT`, `MADE_TO_ORDER_PROFILE_PORT`, `MADE_TO_ORDER_PRODUCT_PREVIEW_PORT`, `CUSTOM_SIZE_PROFILE_PORT`, `SIZE_PROFILE_PORT`, `FINISH_PROFILE_PORT`, `FABRIC_PROFILE_PORT`, `PRODUCT_SIZE_PROFILE_PORT`, `PRODUCT_ZOHO_RELATION_PORT`, `IMAGE_GALLERY_SEO_PORT` | `commerce/product/product/product.module.ts` | Their respective real sibling services — `product` is the most heavily dummy-dependent module in the codebase (14 dummy ports). |
| `SIZE_PROFILE_OPTION_PORT` | `commerce/product/product-size-profile/product-size-profile.module.ts` | Real `size_profile_option` repository access. |
| `MATERIAL_LOOKUP_PORT`, `COLOR_LOOKUP_PORT`, `PATTERN_LOOKUP_PORT`, `CATEGORY_LOOKUP_PORT`, `SEGMENT_LOOKUP_PORT`, `NAV_MATERIAL_LOOKUP_PORT`, `NAV_COLOR_LOOKUP_PORT`, `NAV_PATTERN_LOOKUP_PORT` | `commerce/product/product-preview/Product-preview.module.ts` | Real lookup services for each attribute (note the `.module.ts` file has an inconsistent capital-P filename). |
| `COLOR_PORT`, `MATERIAL_PORT`, `PATTERN_PORT`, `TAG_PORT`, `MAIN_PRODUCT_PREVIEW_PORT`, `SIZE_PROFILE_PREPARE_PORT`, `FABRIC_PROFILE_ENRICH_PORT`, `SUB_CATEGORY_HIERARCHY_PORT`, `FABRIC_PRODUCT_ZOHO_RELATION_PORT`, `ZOHO_ADAPTER_PORT` | `commerce/product/fabric-product/fabric-product.module.ts` | Same sibling-service targets as `finished-product`. |
| `SEGMENT_PORT`, `BADGE_PROFILE_PORT`, `MADE_TO_ORDER_PROFILE_PORT`, `VOLUME_DISCOUNT_PROFILE_PORT`, `CUSTOM_SIZE_PROFILE_PORT`, `SIZE_PROFILE_PORT`, `FINISH_PROFILE_PORT`, `FABRIC_PROFILE_PORT` | `commerce/product/sub-category/subcategory.module.ts` | Real sibling services — note `S3_STORAGE_PORT` on this module is **no longer a dummy** (wired to real `ImageService`, see section 3); everything else in this row still is. |
| `EMAIL_ENCODER_PORT`, `FABRIC_PREVIEW_PORT`, `FINISHED_PREVIEW_PORT`, `FINISH_PROFILE_ITEM_PORT`, `SIZE_PROFILE_OPTION_PORT`, `TENANT_LOOKUP_PORT` | `commerce/cart/cart.module.ts` | `EMAIL_ENCODER_PORT` in particular blocks the encrypted-email decrypt path described in `docs/DATA-INVENTORY.md` section 4 — cart's tenant overview currently cannot decrypt an email through this port. |

**Reading this table:** `commerce/product/*` still accounts for the overwhelming majority of
remaining dummy bindings — the product domain's sub-splits (`product`, `fabric-product`,
`finished-product`, `product-preview`) each depend on several sibling `product/*` services that
were not yet wired together at merge time. `category`, `segment`, and `sub-category`'s image ports
were the first to close; wiring `product`'s remaining 14 ports to their real siblings (all of which
already exist and are implemented — see section 2) is the next highest-leverage step.

## 5. Health warnings — verified counts

| Metric | Count | How verified |
|---|---|---|
| Files with `@ts-nocheck` | **348 of 628** (55.4%) | `grep -rl "@ts-nocheck" --include="*.ts" apps/api/src \| wc -l` against `find apps/api/src -name "*.ts" \| wc -l` |
| `: any` occurrences | **273** | `grep -ro ": any" --include="*.ts" apps/api/src \| wc -l` |
| Test files (`*.spec.ts`) | **52**, 330 tests passing (`vitest run`) | `find apps/api/src -name "*.spec.ts" \| wc -l` |
| `request-id.middleware.ts` registered in `app.module.ts`? | **No.** `app.module.ts` imports only `DatabaseModule`, `AuthModule`, `CommerceModule` and registers `HealthController` directly — there is no `MiddlewareConsumer.apply(...)` call anywhere in it, so `RequestIdMiddleware` (tested in isolation by its own spec) is never wired into the actual request pipeline. | Read `apps/api/src/app.module.ts` in full; grepped for `request-id` across `apps/api/src` — only the middleware file and its own spec reference it. |

Test coverage has grown substantially since the last pass (2 spec files to 52, 330 passing tests),
but `@ts-nocheck` coverage is still over half the codebase even after dropping from 67.5% to
55.4%. Both figures are current as of this document's writing (2026-08-12) — re-verify before
quoting them again if the branch has moved on. `@ts-nocheck` at 55.4% still means type errors
across over half the backend are currently invisible to `tsc`; treat any refactor touching a
`@ts-nocheck` file as untyped until that pragma is removed and the file is made to compile clean.
