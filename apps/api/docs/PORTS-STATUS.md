# TODO — Remaining Integration Blockers

> **Moved from the repo root on 2026-08-12** (was `TODO.md`). Records the cross-domain ports still
> bound to `null`-returning dummies, and the files the migration upload never delivered. Items here are
> real, actionable debt — cross-referenced from `docs/MODULE-MAP.md` and `docs/KNOWN-GAPS.md`.
> Note the state has moved on since it was written: the missing `SubCategory` module has since been
> added, so verify each item against the code before acting on it.


Generated after the safe cart-wiring pass on 2026-08-02. Everything below is a
**missing file**, not a design decision — nothing here should be regenerated
from the Java source without your sign-off, per the migration rules.

## 1. SpecialStatus domain — entirely missing

Listed as a completed domain, but zero TypeScript files exist anywhere in the
uploaded workspace (`auth.zip`, `cart.zip`, `common.zip`, `database.zip`,
`package.zip`, `product.zip`, `product_zip.zip`). `production/Product.module.ts`
already flags this itself and binds `SPECIAL_STATUS_PORT` to a dummy.

Missing files (paths inferred from sibling domains' conventions):
- `apps/api/src/product/special-status/types/special-status.types.ts`
- `apps/api/src/product/special-status/repository/special-status.repository.ts`
- `apps/api/src/product/special-status/service/special-status.service.ts`
- `apps/api/src/product/special-status/mapper/special-status.mapper.ts`
- `apps/api/src/product/special-status/module/special-status.module.ts` (or wherever your convention places it)

## 2. Controllers — missing for every product-domain module

No `controller/` directory or `*.controller.ts` file exists for any of the
following, even though their services/repositories are complete:

- Category, Segment, SkuGroup, SubCategory, Tag
- Product (core)
- FabricProduct, FinishedProduct, CustomProduct
- ProductSizeProfile, ProductZohoRelation
- ProductPreview, FabricPreview, FinishedPreview, MainProductPreview,
  NavProductPreview, ReviewProductPreview, ProductSearchPreview

Expected paths follow the `apps/api/src/.../controller/<name>.controller.ts`
pattern used by `auth/controller/auth.controller.ts` and
`commerce/cart/controller/cart.controller.ts`.

## 3. Aggregator modules — not fabricated per your instruction, still needed eventually

- No top-level `ProductModule` exists that imports/aggregates the individual
  per-domain modules (`Product.module.ts`, `category.module.ts`,
  `SkuGroup.module.ts`, `tag.module.ts`, `segment.module.ts`,
  `finished-product.module.ts`, `Fabric product.module.TS`,
  `Product zoho relation.module.ts`, `product-size-profile.module.ts`).
- No `CommerceModule` exists anywhere.
- `custom product/` and `subcategory/` don't even have their own
  `*.module.ts` — no module file to aggregate in the first place.
- `productpreview/` (all 7 preview services) has **no module file at all** —
  this integration pass registered `FabricPreviewService`/
  `FabricPreviewRepository`/`FinishedPreviewService`/`FinishedPreviewRepository`
  directly as `CartModule` providers as a stopgap (see updated
  `cart.module.ts`), but a proper `ProductPreviewModule` (or one module per
  preview type) is still needed for the other 5 preview services and for any
  other consumer besides Cart.

## 4. Conflicting duplicate files in `subcategory/`

These pairs have genuinely different content (confirmed via diff, not just a
rename) — need your call on which is canonical before SubCategory can be
integrated anywhere:
- `SubCategory.sanitizer (1).ts` vs. `SubCategory.sanitizer.ts` — wait, only
  duplicates that actually differ are listed below (checked via diff):
  - `SubCategory.types.ts` vs `SubCategory.types (1).ts`
  - `SubCategory.mapper (1).ts` vs. no unsuffixed mapper present under that
    exact name — verify against `Subcategory.mapper.TS` (different casing)
  - `SubCategory.validator (1).ts` vs `SubCategory.validator.ts`
  - `SubCategory.dto (1).ts` vs `Subcategory.dto.TS`
  - `SubCategory.sanitizer (1).ts` vs `Subcategory.sanitizer.TS`

  Recommend re-diffing every pair once you tell us which timestamp/branch is
  authoritative — do not assume the unsuffixed or the `(1)` file is newer.

## 5. Out-of-scope Cart ports with no implementation anywhere

Kept as dummy per your explicit instruction. Listed here only so the gap is
tracked — no inferred path given because no sibling domain establishes a
naming convention for these:
- `SizeProfileOptionPort` (`retrieveSizeProfileOption`)
- `FinishProfileItemPort` (`retrieveEntity` → `{ finishProfile: { displayName } }`)
- `EmailEncoderPort` (`decode`)

`production/Product.module.ts`'s own dummy list additionally documents these
as out of scope for the whole migration, not just Cart:
`BadgeProfilePort`, `VolumeDiscountProfilePort`, `MadeToOrderProfilePort`,
`MadeToOrderProductPreviewPort`, `CustomSizeProfilePort`, `SizeProfilePort`,
`FinishProfilePort`, `FabricProfilePort`, `ImageGallerySeoPort`.

## 6. Root MIGRATION_CHECKPOINT.md

No root-level checkpoint file existed in the upload prior to this session —
see the accompanying `MIGRATION_CHECKPOINT.md` for the freshly-written one.
