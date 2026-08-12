# Loom → Anuprerna Product Migration Checkpoint

Last updated: after **SkuGroup** vertical.

## Completed Product domains (compile-verified, do NOT regenerate)

1. Tag
2. SpecialStatus
3. Category
4. Segment
5. **SkuGroup** ← just completed this session

All five are simple `BehemothCRUDDAOController`-style entities (id/version +
a handful of scalar fields), each ported as a flat vertical:
`<Domain>.types.ts`, `.dto.ts`, `.validator.ts`, `.sanitizer.ts`,
`.mapper.ts`, `.repository.ts`, `.service.ts`, `.module.ts`, at
`apps/api/src/product/<domain_snake_case>/`.

### SkuGroup — what was generated this session

- `SkuGroup.types.ts` — `CreateSkuGroupInput`, `UpdateSkuGroupInput`,
  `SkuGroupEntity`, `SkuGroupData` (native-query projection), plus
  `SkuGroupMessages` (log-message topic constants; exact prose NOT in
  repo — flagged, not invented).
- `SkuGroup.dto.ts` — hand-written request parsing (no zod/class-validator
  installed project-wide), mirrors `commerce/cart/dto/cart.dto.ts` style.
- `SkuGroup.validator.ts` — ports `nverse.validator.SkuGroupValidator`
  (external, NOT in uploaded repo). Modeled on the one in-repo comparable
  validator, `product.category.validator.CategoryValidator`
  (`stringValidator.validate(name, 1, 255)`), with Category's image-field
  checks correctly omitted (SkuGroup has no image fields). **Flagged**:
  confirm exact bounds against the live `nverse` package before shipping.
- `SkuGroup.sanitizer.ts` — ports `nverse.sanitizer.SkuGroupSanitizer`
  (external, NOT in uploaded repo). Same 3-stage pipeline already ported in
  `commerce/cart/validators/cart-item.sanitizer.ts` (null-byte strip → XSS
  regex strip → OWASP-allowlist approximation), applied only to `name`.
  **Flagged**: Stage 3 is a conservative allowlist approximation, not a
  verified port of the OWASP Java HTML Sanitizer policy.
- `SkuGroup.mapper.ts` — `toInsertValues` (server-sets `timeOfCreation`,
  matches `Pastebox.getCurrentTimeInMillis()`), `toUpdateValues` (writes
  `name` only — source `updateSkuGroup` never touches `timeOfCreation`).
- `SkuGroup.repository.ts` — Drizzle port of `SkuGroupJpaRepository` +
  the `BehemothCRUDDAOController` base methods it uses. Both named native
  queries (`RETRIEVE_SKU_GROUP`, `RETRIEVE_SKU_GROUP_BY_ID`) reproduced
  verbatim. `update()` uses the same version-checked
  read-then-write-in-a-transaction pattern as `cart.repository.ts`
  (`OptimisticLockError` on a concurrent-write race). `deleteSkuGroup` is
  an **unimplemented stub in source** (`//TODO: implement delete; return
  true;`) — preserved verbatim, no delete SQL issued anywhere in this port.
- `SkuGroup.service.ts` — 1:1 port of `SkuGroupDaoController`
  (`retrieveSkuGroupList`, `createSkuGroup`, `updateSkuGroup`,
  `deleteSkuGroup` [stub, returns `true`], `retrieveSkuGroupData`,
  `retrieveSkuGroupById`, `retrieveSkuGroupDataById`).
- `SkuGroup.module.ts` — providers only (`SkuGroupService`,
  `SkuGroupRepository`), no controller registered (see below).

**Controller skipped intentionally**: `RequestMapper.java` (route path
constants — `GET_SKU_GROUP_LIST`, `ADD_SKU_GROUP`, `UPDATE_SKU_GROUP`,
`DELETE_SKU_GROUP`, `GET_TABLE_EXPLORER_DATA_SKU_GROUP`,
`GET_TABLE_EXPLORER_DATA_SKU_GROUP_BY_ID`) has not been uploaded yet. Java
source is fully captured in
`product/product/sku_group/controller/SkuGroupController.java` for when it
is available.

**Compile verification**: all 8 files type-checked cleanly, both as a group
and individually, against the real `apps/api/src/database/schema/schema.ts`
(`skuGroup` table), `database.module.ts`, and
`common/errors/action-code.ts` — using
`moduleResolution: Bundler` (the strict `NodeNext` setting fails on a
pre-existing extension-less import inside the *generated*
`schema/relations.ts`, unrelated to this vertical).

## Remaining Product domains (dependency order)

Based on `product/product/*` Java source directories not yet ported:

1. **SubCategory** — next up. References `Segment` (FK `segment_id`,
   already migrated) plus five profile FKs (`badgeProfileId`,
   `customSizeProfileId`, `fabricProfileId`, `finishProfileId`,
   `madeToOrderProfileId`) that belong to other not-yet-migrated modules —
   those will need port stubs/dummy providers, same pattern as Cart's
   Fabric/Finished/SizeProfile ports. Also has a
   `SubCategoryAuditService.java` (audit trail) to account for. Source:
   `product/product/sub_category/**`.
2. **Product (core)** — depends on SubCategory and SkuGroup (both FKs on
   `product` table: `sub_category_id`, `sku_group_id`), must come after
   SubCategory. Source: `product/product/orm/Product.java` +
   `contract/ProductContract.java` + `dao/**` + `nativequery/**`.
3. **CustomProduct / FabricProduct / FinishedProduct** — extend/reference
   core Product. Source: `product/product/orm/{CustomProduct,
   FabricProduct, FinishedProduct}.java`.
4. **ProductPreview family** — `ProductPreview`, `FabricPreview`,
   `FinishedPreview`, `ProductSearchPreview`, and the larger preview set
   under `product/product/product/orm/` (`MainProductPreview`,
   `NavProductPreview`, `FabricOrderPreview`, `FinishedOrderPreview`,
   `MadeToOrderProductPreview`, `ProductOrderPreview`,
   `ProductStockPreview`, `ReviewProductPreview`,
   `FabricProductPreview`).
5. **ProductSizeProfile**, **ProductZohoRelation** — auxiliary product
   sub-entities under `product/product/product/orm/`.

Not yet reachable (blocked on other not-yet-uploaded modules; flagged for
awareness, not for immediate action): Product's dependency on Profile
modules (badge/custom-size/fabric/finish/made-to-order/volume-discount
profiles) referenced by SubCategory and downstream Product tables.

## Next action

Continue with **SubCategory** vertical (types → dto → validator →
sanitizer → mapper → repository → service → module), skipping its
controller and `SubCategoryAuditService` until their dependencies
(RequestMapper.java, and the audit trail's target table) are confirmed
available.
