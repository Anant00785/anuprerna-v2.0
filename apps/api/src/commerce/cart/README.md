# Cart module — migration notes

Direct, rule-for-rule port of the Java Cart module onto this project's real
architecture (NestJS + Drizzle ORM). No Prisma, no missing packages.

## What this project actually looked like (important correction)

The brief assumed a mature codebase with existing commerce modules, a
response wrapper, auth guards, and DTO conventions to mirror. On inspection,
`identity/`, `workflow/`, `migration/`, `proxy/`, and (until now) `commerce/`
are all empty `@Module({})` skeletons. The only real, reusable conventions
in the project are:

- `DatabaseModule` — `@Global()`, exports `DATABASE_CONNECTION` (Drizzle
  `postgres-js` client). Cart's repository injects this directly.
- The introspected schema in `database/schema/schema.ts` (`cart_item` table,
  `orderTypeEnum`, `unitEnum`).

`@anuprerna/types` is an empty workspace stub, and neither `zod` nor
`class-validator` is in `package.json`. CLAUDE.md's "Zod schema in
@anuprerna/types" rule can't be followed yet without adding a dependency
that isn't installed — so request parsing here is hand-written instead
(`dto/cart.dto.ts`), matching the "never depend on a missing package" rule.
Once `zod` is actually added to the workspace, this is a natural place to
swap in a schema.

## Where the business logic came from

A prior draft existed at `commerce/CART/` using Prisma (banned) and a
nonexistent `@loom/types` alias. Its Prisma calls and package references
were unusable, but its source analysis (endpoint list, native SQL, the
`CartItemValidator`/`CartItemSanitizer` rule-for-rule ports, the RainTree
response envelope, the gatekeeper auth pattern) was source-verified against
the Java files and reused as-is — every SQL query and business rule below
is unchanged from that analysis, just re-expressed in Drizzle instead of
Prisma.

## Folder structure

```
commerce/cart/
  controller/cart.controller.ts   9 routes, CODE_SU / CODE_CU gates preserved
  service/cart.service.ts         business logic (CartItemDAOController port)
  repository/cart.repository.ts   Drizzle queries incl. raw-SQL native queries
  dto/cart.dto.ts                 request parsing (no validation lib installed)
  mapper/cart.mapper.ts           CartItemInput -> Drizzle insert/update shapes
  types/cart.types.ts             domain types, ports, message constants
  validators/cart-item.validator.ts   business-rule validation
  validators/cart-item.sanitizer.ts   XSS-stripping sanitizer
  cart.module.ts
```

Also added (didn't exist before, needed by Cart, reusable by future modules):
`common/auth/roles.guard.ts`, `common/auth/current-tenant.decorator.ts`,
`common/response/rain-response.ts`, `common/errors/action-code.ts`.

## Cross-module dependencies — safe dummies, not throwing stubs

`CartService` depends on six ports (`FabricPreviewPort`, `FinishedPreviewPort`,
`SizeProfileOptionPort`, `FinishProfileItemPort`, `TenantLookupPort`,
`EmailEncoderPort`) for calls that originally went into the Product,
Profile, and Identity modules — all out of scope for this task. `cart.module.ts`
binds each to a dummy implementation that returns the "nothing found" value
its own interface contract allows — `null` for every nullable lookup, `""`
for `EmailEncoderPort#decode` (its contract is `Promise<string>`, not
nullable, so the string-typed analogue of null/[] is used) — instead of
throwing or inventing Product/Profile/Identity behavior.

This keeps the module bootable on its own (verified — see below) and keeps
every Cart endpoint that doesn't need those modules working end to end:
listing a cart, updating quantity, deleting an item, adding a plain item
with no fabric/finished/size/finish reference. A request that *does*
reference one of those (e.g. `addCartItem` with a `fabricProductId`) still
degrades gracefully — the service's existing "preview not found → insert
failure" branch fires, which is a normal `simpleResponse(false, ...)`, not
a 500.

Replace each dummy with a real provider as Product, Profile, and Identity
land.

## Preserved source quirks (not "fixed")

1. `updateCartItem` only ever writes `quantity` — every other field on the
   PATCH body is parsed (for contract compatibility) but ignored, exactly
   as the Java source does (`// TODO: need to make the logic more secure`).
2. `selectedFabricId` / `selectedSizeOptionId` are NOT NULL at the DB level
   but the validator doesn't require either — preserved; a payload with
   `productGroup: "finished"` and no size/fabric selection can still fail
   at the DB constraint rather than at validation.
3. `finishDisplayName` resolution is "last write wins" when more than one
   finish id is selected (source resolves this via a non-deterministic
   parallel stream; the port resolves sequentially for determinism, same
   assignment semantics).
4. No discount or stock-decrement logic exists anywhere in Cart — confirmed
   absent in the Java source, not added here.

## Verification performed

- Real `npm install` of the exact `package.json` dependency set in an
  isolated sandbox, with a TS config approximating the project's real
  `tsconfig.json` (its `tsconfig.base.json` wasn't in the upload).
- `tsc --noEmit`: 0 errors, including under `--noUnusedLocals
  --noUnusedParameters --noImplicitReturns --noImplicitOverride`.
- `eslint` using the project's own flat config: 0 errors.
- Full-tree check with the real `app.module.ts` / `commerce.module.ts`
  wiring in place, not just the Cart files in isolation.
- Live bootstrap check via `@nestjs/testing`: `CartModule` compiled and
  `app.init()` succeeded with only `DATABASE_CONNECTION` mocked (everything
  else — including all six placeholder ports — resolved through the real
  module). Each port was then called directly and confirmed to return its
  contract's safe value (`null` / `""`) without throwing.

## Transactions & optimistic locking (verified against source)

`cart_item.version` is a real `bigserial NOT NULL` column in the
introspected schema — confirmed by direct inspection, not assumed. The Java
`CartItem` entity extends an external base class, `BehemothORM`, which is
**not present in the uploaded repository**, so its `@Version` annotation
can't be read directly. What *is* verifiable in the provided Java source:

- `deleteCartItemById`, `deleteAllByTenant`, and
  `deleteCartItemBySelectedSizeOption` in `CartItemJpaRepository` have no
  `@Query` annotation — they're Spring Data **derived** delete methods,
  which Spring Data implements as SELECT-then-`remove()`-per-entity, not a
  single bulk `DELETE`. Each method's own javadoc states it "must be called
  within a transactional context." Ported 1:1: each now runs inside a
  `db.transaction`, selecting the affected rows' `id`/`version` first, then
  deleting each one with `WHERE id = ? AND version = ?`.
- `deleteCartItemByFinishId` **is** `@Modifying @Query(nativeQuery = true)`
  with a hand-written `DELETE ... WHERE ...` string containing no version
  predicate — genuinely single-statement, not multi-step. Left as one
  `db.execute(sql...)` call, matching source exactly; no transaction or
  version check added.
- `CartItemDAOController#updateCartItem` loads the entity via
  `findCartItemById` inside the same method call, mutates it, then saves —
  the standard JPA optimistic-locking pattern (Hibernate emits
  `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?` using
  the version just read). Ported 1:1 in `CartRepository#update`: read +
  write happen inside one transaction.

A 0-row result on a version-checked write, where the row was confirmed to
exist moments earlier in the same transaction, means a concurrent write won
the race — exactly what Hibernate's `OptimisticLockException` signals. This
is surfaced as `OptimisticLockError` (repository) and mapped to `409
Conflict` at the controller for the three write endpoints that can raise it
(`PATCH /update/cart-item`, `DELETE /delete/cart-item/:cartItemId`,
`DELETE /delete/all-cart-item`). The exact HTTP status Java's
`OptimisticLockException` maps to isn't verifiable without `BehemothORM`'s
exception handling, which also isn't in this repo — 409 is the conventional
choice for this class of error, not a confirmed source behavior.

No column was invented: `version` was already in the introspected schema
before this change; nothing new was added to `cart_item`.

## Still to do

- Bind the six ports to real implementations as Product/Profile/Identity
  land.
- Add `zod` (or another validator) as a real dependency and move
  `dto/cart.dto.ts` onto it, per CLAUDE.md's "types first" rule.
- Swap the sanitizer's Stage 3 HTML allowlist approximation for a vetted
  library (e.g. `sanitize-html`) — flagged in the sanitizer's own comments.
- Co-located `*.spec.ts` tests (CLAUDE.md requires one per
  service/controller before merge) — not yet written.
