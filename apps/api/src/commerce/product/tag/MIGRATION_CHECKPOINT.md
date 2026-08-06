# Anuprerna v2.0 — Product Domain Migration Checkpoint

## Session note

This chat session started fresh (no prior MIGRATION_CHECKPOINT.md was
present in the uploaded files, and no earlier analysis was retrievable).
Before generating anything, the six uploaded archives were extracted and
inspected directly:

- `auth.zip`, `cart.zip`, `common.zip`, `database.zip` → the **already
  completed NestJS output** from prior work (Auth, Cart, Common, Database
  modules — matches the "already completed and compiling" status given).
- `product.zip` → the **Java source** for the Product domain, not yet
  migrated. Contains 7 sub-domains: `tag`, `special_status`, `sku_group`,
  `segment`, `sub_category`, `category`, and the core `product` package
  (product/custom-product/fabric-product/finished-product + previews).
- `package.zip` → `package.json` only (dependency source of truth).

Established conventions were reverse-engineered from the Cart module
(the closest prior art) before writing anything new:
- Domain folders live at `apps/api/src/<domain>/<subdomain>/...`
  (`commerce/cart` is the only precedent). **No existing top-level folder
  for Product was found** — `catalog` was chosen as the domain name for
  the Product family (`apps/api/src/catalog/product/<subdomain>/`) since
  none of `identity/ workflow/ migration/ proxy/ commerce/` fit. **Please
  confirm this name** — trivial to rename before more sub-domains are built
  on top of it.
- No `zod` / `class-validator` installed → hand-written DTO parsing
  (matches `cart.dto.ts`).
- `DatabaseModule` is `@Global()` → repositories inject `DATABASE_CONNECTION`
  directly, no explicit import needed in feature modules.
- Optimistic locking (`version` column, `bigserial NOT NULL` on every
  table incl. `tag`) → read-then-write-with-version-predicate inside a
  `db.transaction`, throwing `OptimisticLockError` on a 0-row result —
  ported verbatim from `cart.repository.ts`.
- Cross-module "port" pattern (safe dummy `useValue` providers for
  not-yet-migrated dependencies) — not yet needed for Tag (no cross-module
  calls), will apply to sub-domains that reference each other (e.g. core
  Product ↔ Category/SubCategory/Segment/SkuGroup/SpecialStatus/Tag).

## Blockers (do not stop the migration for these — see rules)

| # | Missing source | Impact | Status |
|---|---|---|---|
| 1 | `RequestMapper.java` | All controller-layer files across every sub-domain | **Blocked** — generate everything else first |
| 2 | `com.bloomscorp.loom.nverse.validator.TagValidator` (and the equivalent per-entity validator for every other sub-domain except Category, which was provided) | Exact validation rules | **Worked around** — see `validators/tag.validator.ts` header. Only `CategoryValidator.java` was provided as an example; other sub-domains' validators are inferred from schema + that one example and flagged per-file. Confirm against real source when available. |
| 3 | `com.bloomscorp.loom.nverse.sanitizer.TagSanitizer` (and equivalents) | Low risk — every sanitizer we've seen (`CartItemSanitizer`) is a one-line passthrough to the shared, already-ported `NVerseSanitizer` pipeline. Reused with confidence, flagged per-file. |
| 4 | `com.bloomscorp.loom.support.LogMessage` constants for Tag (and other sub-domains) | Controller-layer response message text | Deferred with controllers (blocker #1) |

## Completed this session

### Tag sub-domain (`apps/api/src/catalog/product/tag/`) — layers 2–9, controller deferred

| File | Depends on |
|---|---|
| `types/tag.types.ts` | none |
| `dto/tag.dto.ts` | `types/tag.types.ts` |
| `validators/tag.validator.ts` | `types/tag.types.ts` |
| `validators/tag.sanitizer.ts` | `types/tag.types.ts` |
| `mapper/tag.mapper.ts` | `types/tag.types.ts`, `repository/tag.repository.ts` (type only) |
| `repository/tag.repository.ts` | `database/database.module.ts`, `database/schema/schema.ts`, `types/tag.types.ts` |
| `service/tag.service.ts` | `repository/`, `mapper/`, `validators/`, `types/` |
| `tag.module.ts` | `service/`, `repository/` |

**Not generated:** `controller/tag.controller.ts` (blocked on `RequestMapper.java`).

### Compile verification performed (mental, against provided sources)

- Relative import depth checked for every file (`apps/api/src/catalog/product/tag/<layer>/*.ts` → `../../../../database/...`).
- No duplicate provider registrations (`TagService`, `TagRepository` each declared once, in `tag.module.ts` only).
- No circular imports (`types` has zero internal imports; `dto`/`validators`/`mapper` depend only on `types`; `repository` depends on `types` + `database`; `service` depends on all of the above; `module` depends only on `service`/`repository`).
- `TagService` exports match what a future composition root (`ProductModule`/`CatalogModule`) will need to import Tag without re-declaring `TagRepository`.
- No new packages referenced — `@nestjs/common`, `drizzle-orm` only (both already in `package.json`).
- **Not independently `tsc`-verified** — the sandbox only has the isolated module archives, not the full monorepo (`node_modules`, `tsconfig.json` path aliases, sibling `@anuprerna/*` workspace packages aren't present here), so a real `tsc --noEmit` couldn't be run in this session. Recommend running `pnpm typecheck` in the actual repo after copying these files in.

## Compile risks flagged for follow-up

1. **`catalog` domain folder name is an assumption** — confirm or rename before `sku_group`, `segment`, etc. land on top of it.
2. **`validators/tag.validator.ts` rule (length 1–255) is inferred**, not verified against real `TagValidator.java`.
3. No `app.module.ts` was provided, so `TagModule` has **not been wired into the app** — that import line still needs to be added once the real composition root is available.

## Remaining work (in migration-plan order)

- [ ] Confirm `catalog` domain folder name
- [ ] `special_status` sub-domain (types → module wiring)
- [ ] `sku_group` sub-domain
- [ ] `segment` sub-domain
- [ ] `sub_category` sub-domain (has an extra `SubCategoryAuditService.java` — service-layer, not blocked)
- [ ] `category` sub-domain (validator/sanitizer source IS available — no inference needed here)
- [ ] Core `product` package (largest: Product/CustomProduct/FabricProduct/FinishedProduct + ~10 preview/DAO variants + `ProductPreparationService.java`) — will need real ports wired for the six dummy ports already sitting in `cart.module.ts` (`FabricPreviewPort`, `FinishedPreviewPort`, `SizeProfileOptionPort`, etc.) once these ORMs exist
- [ ] TODO list of blocked controllers (grows by one per sub-domain as each is completed): `TagController`
- [ ] Once `RequestMapper.java` is provided: generate all controller-layer files in one pass
