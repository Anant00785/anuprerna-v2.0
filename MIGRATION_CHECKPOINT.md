# Migration Checkpoint

> No root-level `MIGRATION_CHECKPOINT.md` existed in the uploaded workspace
> (`auth.zip`, `cart.zip`, `common.zip`, `database.zip`, `package.zip`,
> `product.zip`, `product_zip.zip`) prior to this session. This file is
> written fresh from what was actually verifiable in those zips, not from
> any prior document.

## Completed integration (this session)

`apps/api/src/commerce/cart/cart.module.ts` updated — 3 of its 6
out-of-scope ports are now wired to real providers instead of dummies:

| Port | Was | Now |
|---|---|---|
| `FABRIC_PREVIEW_PORT` | dummy (`null`) | `FabricPreviewService` (commerce/product/fabric-preview), via a `useFactory` adapter that converts the `number` id Cart passes into the `bigint` `FabricPreviewService#retrieveEntity` expects, and aliases `retrieveFabricProductByProductId` → `FabricPreviewService#findByProductId` |
| `FINISHED_PREVIEW_PORT` | dummy (`null`) | `FinishedPreviewService` (commerce/product/finished-preview), same `number`→`bigint` adapter on `retrieveEntity` |
| `TENANT_LOOKUP_PORT` | dummy (`null`) | `TenantLookupRepository` (auth), via `useExisting` — method signature already matched `TenantLookupPort` exactly, no adapter needed |

`FabricPreviewRepository`/`FinishedPreviewRepository` and their services are
registered directly as `CartModule` providers (no `ProductPreviewModule`
exists to import instead — see TODO.md item 3). `AuthModule` is now imported
into `CartModule` to expose `TenantLookupRepository`; as a side effect this
also satisfies the DI requirement `RolesGuard` already had on `AuthModule`
(`CartController` uses `@UseGuards(RolesGuard)`, and `RolesGuard` depends on
`GatekeeperService` from `AuthModule` — this dependency existed before this
session but was previously unresolved since nothing imported `AuthModule`
into `CartModule`).

Left as dummy, per explicit instruction — no real implementation exists
anywhere in the uploaded workspace for any of these:
- `SIZE_PROFILE_OPTION_PORT`
- `FINISH_PROFILE_ITEM_PORT`
- `EMAIL_ENCODER_PORT`

No controllers were generated. No `ProductModule` or `CommerceModule` was
fabricated. No completed domain's service/repository/dto/mapper/validator/
sanitizer/types file was regenerated or altered — the only file changed is
`cart.module.ts`.

## Remaining blockers

See `TODO.md` for the full breakdown. Summary:

1. **SpecialStatus domain** — zero TypeScript files anywhere in the upload,
   despite being listed as completed.
2. **Controllers** — missing for every product-domain module (Category,
   Segment, SkuGroup, SubCategory, Tag, Product core, FabricProduct,
   FinishedProduct, CustomProduct, ProductSizeProfile, ProductZohoRelation,
   and all 7 Preview services).
3. **No `ProductModule` aggregator, no `CommerceModule`** — only isolated
   per-domain modules exist, and `custom product/`, `subcategory/`, and the
   7 preview services don't even have their own module files.
4. **Conflicting duplicate files in `subcategory/`** — several `*.ts` /
   `* (1).ts` pairs differ line-for-line; needs your call on which is
   canonical before SubCategory can be wired anywhere.
5. **Three Cart ports with no implementation anywhere in scope**
   (`SizeProfileOptionPort`, `FinishProfileItemPort`, `EmailEncoderPort`),
   plus nine more out-of-scope ports already flagged inside
   `production/Product.module.ts` itself (`BadgeProfilePort`,
   `VolumeDiscountProfilePort`, `MadeToOrderProfilePort`,
   `MadeToOrderProductPreviewPort`, `CustomSizeProfilePort`,
   `SizeProfilePort`, `FinishProfilePort`, `FabricProfilePort`,
   `ImageGallerySeoPort`).

## Exact missing files

See `TODO.md` sections 1–5 for the itemized list with inferred paths.
