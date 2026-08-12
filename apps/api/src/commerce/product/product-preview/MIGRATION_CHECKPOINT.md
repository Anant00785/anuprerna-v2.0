# Migration Checkpoint

_Last updated: Product Preview layer migration session._

## Completed Domains

### Core (previously completed)
- Auth
- Cart
- Tag
- SpecialStatus
- Category
- Segment
- SkuGroup
- SubCategory
- Product
- FabricProduct
- FinishedProduct
- CustomProduct
- ProductSizeProfile
- ProductZohoRelation

### Product Preview layer (this session)
All 7 preview domains generated with `types` / `mapper` / `repository` / `service` only, per scope (no controllers, no module wiring):

1. **ProductPreview** — `apps/api/src/commerce/product/product-preview/`
   Maps onto the `product` table (same table as `Product`; JPA read-projection, not a separate table). Full 1:1 port of `ProductPreviewJpaRepository`, including the color/material array filters, the sub_category → segment → category name-join queries, and the combined faceted-filter query (`findProductPreviewsByAllFilterIds`). The two `ProductSearchResult`-returning named native queries (`findProductSearchResultBySKU`, etc.) are **not source-verified** — their `@NamedNativeQuery` SQL bodies aren't in the uploaded source, only their calling signatures — flagged inline in the repository.
   Known gap: `productSpecificSizeProfile` / `productSpecificSizeProfileEnabled` exist on `ProductPreview.java` but have no corresponding column in the introspected `product` pgTable in `schema.ts` — omitted rather than guessed at; add once that DB migration lands and `schema.ts` is regenerated.

2. **FabricPreview** — `apps/api/src/commerce/product/fabric-preview/`
   Maps onto `product_fabric`. Full 1:1 port of `FabricPreviewJpaRepository`. `streamAll(Boolean)` (Hibernate streaming, fetch size 500) has no Drizzle cursor equivalent — ported as a plain query (`findAllForBulkProcessing`); paginate at the call site for very large result sets.

3. **FinishedPreview** — `apps/api/src/commerce/product/finished-preview/`
   Maps onto `product_finished`. Source repository declares only `findAllByProductDisabledFalse()`; a `findByProductId` lookup was added by analogy with `FabricPreviewJpaRepository#findFabricPreviewByProduct` and is flagged **not source-verified** in the repository file.

4. **MainProductPreview** — `apps/api/src/commerce/product/main-product-preview/`
   Maps onto `product`. Full 1:1 port of `MainProductPreviewJpaRepository` (variant listing, active-variant listing).

5. **NavProductPreview** — `apps/api/src/commerce/product/nav-product-preview/`
   Maps onto `product`. Full 1:1 port of `NavProductPreviewJpaRepository`. `category` / `segment` are `@Transient` in source with their `@ManyToOne` mappings commented out entirely — ported as permanently-`null` fields with no active lookup path, matching source's current (disabled) state rather than re-enabling a mapping the Java code itself doesn't use.

6. **ReviewProductPreview** — `apps/api/src/commerce/product/review-product-preview/`
   Maps onto `product`. Source repository is an empty `JpaRepository<ReviewProductPreview, Long>` (no custom methods) — only inherited CRUD-style reads (`findById`, `findAllById`) are ported.

7. **ProductSearchPreview** — `apps/api/src/commerce/product/product-search-preview/`
   Maps onto `product`. **No Java repository, service, or controller exists in the uploaded source** for this entity — only `ProductSearchPreview.java` itself. The generated repository/service are a minimal, clearly-flagged reconstruction (CRUD reads, SKU lookup, name-prefix autocomplete) based on the entity's own javadoc use-cases, not a 1:1 source port. Confirm against the real Spring artifacts (if they exist elsewhere) before treating this as a public contract.

### Cross-cutting notes for this session
- No existing NestJS output for the `Product` domain family was present in the uploaded workspace slice, despite being listed as complete — conventions were inferred from the `Cart` module (mapper/repository/service split, `Port` interfaces + DI tokens for unmigrated cross-module dependencies, numeric-as-string Drizzle column handling, `db.execute(sql\`...\`)` for native/array/join queries).
- Cross-module dependencies (Material, Color, Pattern, Category, Segment, ProductPreview-from-Fabric/FinishedPreview) are exposed as `Port` interfaces with `Symbol` DI tokens, `@Optional()`-injected in each service — mirrors `cart.service.ts`'s pattern. Wire real providers for these tokens in `product.module.ts` as the underlying modules become reachable in this workspace.
- Every native/derived query from the Java `JpaRepository` interfaces was ported 1:1 where source existed; anything reconstructed (FinishedPreview's `findByProductId`, all of ProductSearchPreview) is explicitly commented as **NOT source-verified**.

## Not Done / Explicitly Out of Scope This Session
- No controllers generated (per instructions).
- `ProductModule` not created/wired; `CommerceModule` not touched.
- Cart and Auth untouched.
- No validators/dto/sanitizer generated for any of the 7 preview domains — none exist in the corresponding Java source (`ProductPreview`, `FabricPreview`, `FinishedPreview`, `MainProductPreview`, `NavProductPreview`, `ReviewProductPreview`, `ProductSearchPreview` have no `@Valid`/sanitizer classes in the uploaded product.zip).

## Remaining Work (future sessions)
- Wire `product.module.ts` once ready: register the 7 preview services/repositories, and provide real implementations for the lookup Ports (Material, Color, Pattern, Category, Segment, ProductPreview-from-Fabric/Finished) as their owning modules are migrated.
- Locate and verify the `@NamedNativeQuery` SQL bodies referenced by `ProductPreviewJpaRepository` (`findProductSearchResultBySKU`, `findProductSearchResultsByColorId`, `...ByMaterialId`, `...ByPatternId`, `...BySubCategoryName`, `...BySegmentName`, `...ByCategoryName`) against the real `ProductPreview` entity definition (not fully present in the uploaded slice) and diff against the reconstructed SQL in `product-preview.repository.ts`.
- Locate any real Spring repository/service/controller for `ProductSearchPreview`, if one exists outside the uploaded slice, and reconcile with the reconstruction in this session.
- Controllers for all 7 preview domains (explicitly out of scope this session).
- `ProductModule` creation and `CommerceModule` wiring (explicitly out of scope this session).
