# Known Gaps — the honest ledger

Every open item in the codebase lives here, grouped by area, so no other doc has to hedge.
Verified against `chore/agent-substrate` on 2026-08-12. Format per item: what's wrong, evidence,
impact, status. "What to redo when X lands" flags where this entry goes stale.

Related docs, not duplicated here: `docs/ARCHITECTURE.md`, `docs/DATA-FLOW.md`,
`docs/STATE-INVENTORY.md`, `docs/DATA-INVENTORY.md`, `docs/MODULE-MAP.md`,
`docs/AGENT-FRAMEWORK.md`, `docs/ENDPOINT-INVENTORY.md`, `docs/TESTING.md`.

## The one thing to say before anything else: the API is not deployed

| | |
|---|---|
| What | `apps/api` (116 controllers, 550 routes, 42,685 LOC) exists in this branch but nothing points at it in production |
| Evidence | Both frontends hardwire the legacy Java backend: `apps/storefront` via `NEXT_PUBLIC_SPRINGBOOT_API_URL` (e.g. `apps/storefront/src/app/api/plp/route.ts:4`) and the storefront/CMS `[...path]` proxies; CMS via `TARGET_HOST = 'https://loom-v2.anuprerna.com'` (`apps/cms/src/app/api/backend/[...path]/route.ts:3`) |
| Impact | 0% of production traffic transits `apps/api`. Every gap below in `apps/api` is a pre-launch gap, not a live incident — but it is also why nothing here has been through real traffic yet |
| Status | Open. This is the headline framing for the whole document |
| Redo when | `apps/api` is cut over for even one route in production — re-audit which of the items below actually matter under load |

## Bugs the test programme found in code serving live customers

Unlike everything under `apps/api`, these are in the storefront and CMS, which **do** serve real
traffic today. Each is pinned by a test asserting current behaviour; none was fixed, because changing
customer-visible behaviour is a deliberate decision, not a side effect of writing tests.

| # | Bug | Evidence | Impact |
|---|---|---|---|
| 1 | **Customers are overcharged for delivery.** `dto.deliveryCharge \|\| (subtotal > 2000 ? 0 : 150)` treats an explicit `deliveryCharge: 0` from the backend as falsy and replaces it with the flat ₹150 fallback. | `apps/storefront/src/lib/api/adapters/legacy-cart.adapter.ts:40` | When the backend grants free shipping, the customer is billed ₹150 anyway. Money, and directly customer-facing. |
| 2 | **Out-of-stock products show as in stock.** `dto?.availableQuantity ? dto.availableQuantity > 0 : true` — `availableQuantity: 0` is falsy, so it takes the `true` branch. | `apps/storefront/src/lib/api/adapters/legacy-catalog.adapter.ts:62` | Zero-stock items are purchasable. Oversells. |
| 3 | **Profile repository returns the envelope, not the array.** `getAddressList`/`getOrderList` are typed `Address[]`/`Order[]` but never unwrap the `{success, message, addressList: [...]}` envelope the way the cart and catalog repositories do. | `apps/storefront/src/lib/api/repositories/profile.repository.ts` | Any caller doing `.map()` on the result throws. Masked today only because most profile routes are served by `dummy-data.ts` rather than this code. |
| 4 | **CMS reports a failed save as successful.** `SettingsService.updateSettingsItem()` always resolves `true`, regardless of whether the POST succeeded. | `apps/cms/src/services/settings-service.ts` | An admin changes a setting, sees success, and it silently did not save. Data loss with a false confirmation. |
| 5 | **CMS fabricates data on backend failure.** `SettingsService.getSettings()` swallows any error and returns hardcoded defaults (e.g. `DEFAULT_CURRENCY: 'INR'`). `logistic-service.ts` does the same across most methods, including `createShipment` returning a fake `{ success: true }` on a network failure. | `apps/cms/src/services/settings-service.ts`, `logistic-service.ts` | This is the exact "never fabricate data to fill a UI" rule from `apps/cms/CLAUDE.md`, violated inside the service layer. An operator cannot distinguish real state from a fallback. |
| 6 | **Review image upload is likely broken.** `uploadReviewImage` sets `Content-Type: multipart/form-data` manually on a `FormData` body, so no `boundary` parameter is generated. | `apps/cms/src/services/review-service.ts` | Multipart parsing fails server-side. Reproduced in-test: the call hangs past 8s with the header override and completes in under 100ms without it. |
| 7 | **`unwrapResponseData` picks arbitrarily when a response has multiple array keys** — first in `Object.keys()` order wins, with no name-based tie-break. | `apps/cms/src/lib/api-helper.ts` | Every one of the 96 CMS routes passes through this function. If the backend adds a second array field to any response, the wrong data starts flowing silently. |
| 8 | **`hasValidJWT()` ignores expiry** — it only checks the string is non-empty. `isTokenExpired()` exists and is correct but has zero callers. | `apps/cms/src/lib/auth-service.ts` | An expired token reads as valid client-side. The backend is still the real authority, so this is a UX and trust-boundary issue rather than an access-control hole. |

Cleared on inspection, worth recording as checked: logout **does** correctly clear all persisted auth
state in both apps — all nine keys in the CMS (including the five obfuscated chunks) and both the
`localStorage` entry and `jwt_token` cookie in the storefront. Tests now pin this.

## The "116 controllers" number is real but badly misleading

Found on 2026-08-12 while writing tests. Anyone quoting the controller count as a measure of migration
progress — including earlier revisions of these docs — is overstating it. The honest breakdown:

| | Count | What it is |
|---|---|---|
| Controller **files** carrying `@Controller` | 116 | Real, hand-ported from the Java source |
| …of those, referenced by any `*.module.ts` | 100 | Actually reachable |
| …orphaned, wired into nothing | **16** | Dead on arrival — see below |
| **Additionally**: auto-generated generic CRUD controllers | **50** | Machine-produced from a name list, not ported logic |

### The 50 generic controllers serve empty tables, not your data

`apps/api/src/commerce/rest-api.module.ts:66-77` holds a flat list of 50 resource names
(`"address", "artisan", "order", "payment", …`) and maps each through a `commerceController(resource)`
factory that emits identical `GET / GET :id / POST / PATCH / DELETE` handlers.

Each one delegates to `CommerceDataService`, which resolves its table as
`commerce_<resource>` and, on first use, runs `CREATE TABLE IF NOT EXISTS` for a generic
`(id, name, payload jsonb)` shape (`commerce-data.service.ts:20, 94`).

**Only two resources are mapped to real domain tables** — `commerce-data.service.ts:117-121`
special-cases `commerce_product` → `product` and `commerce_cart` → `cart_item`. Everything else falls
through to the generic blob table.

**There are zero `commerce_*` tables in the introspected production schema** (`grep -c 'pgTable("commerce_'`
→ 0). So on deployment, 48 of these endpoints would create brand-new empty side tables and serve
nothing from the real 116-table database. A caller hitting `GET /order` gets rows from
`commerce_order`, not from `orders`.

| Impact | These are placeholder scaffolding, not a migrated API. They should not be counted as migrated surface, and they must not be exposed publicly — they would silently accept and return arbitrary JSON alongside the real schema. |
|---|---|
| Status | Open. No production traffic reaches any of it today. |
| Redo when | Each domain gets a real controller — delete its name from the `resources` list in the same change, or the generic route will shadow the real work. |

### Orphaned rich controllers, with thin generic ones wired in their place

The starkest case is `order/`. `order.module.ts` wires a 24-line generic
`order/order.controller.ts` and an 11-line `order/order.service.ts` that extends `CommerceDataService`.
Meanwhile the substantial port — `order/controller/order.controller.ts` plus its
`service/`, `repository/`, `dto/` and `types/` siblings, and the `custom-order`,
`order-fulfillment` and `order-feedback` controllers — is imported by nothing.

`custom-order.controller.ts` additionally calls `OrderService` methods (`createCustomOrder`,
`getCustomOrderById`) that exist on neither `OrderService` class, so it would fail at runtime if it
were ever wired up.

Consequences for the commerce migration checklist, all confirmed by grep rather than assumed:
- **Order attribution (row C3)** — `promoteAdAttribution` does not exist anywhere in `apps/api`.
  `clickId`/`utm*` appear only under `cart/`. The feature is unbuilt, not broken.
- **Order-preview search (row C29)** — no `order-preview/` directory, no search endpoint.
- **Custom-order validation (rows D3/D13)** — no `CustomOrderValidator` exists at all.

> **Redo when:** any orphaned controller is wired up — re-check that its service methods exist first,
> and remove the corresponding generic resource name so the two do not collide.

## Payment: the port dropped signature verification the legacy system performs

Found on 2026-08-12 by the unit-test programme, before `apps/api` ever carried traffic. This is a
**migration regression**, not a pre-existing flaw: the live Java backend does this correctly and the
TypeScript port silently lost it. Both items below must be fixed before `apps/api` handles a single
real payment.

### 1. Razorpay success is accepted on the client's word

| | |
|---|---|
| Legacy (correct) | `RazorpayTransactionDAOController.java:273-282` calls `paymentService.isValidSignature(razorpayOrderId, transactionId, transactionSignature)`, implemented at `RazorpayPaymentService.java:61-73` as `Utils.verifyPaymentSignature(options, PAYMENT_KEY_SECRET)`. Failure routes to `processInvalidTransactionSignature` / `processSignatureValidationFailure`, and `TransactionFailureCode` carries dedicated codes 1 and 2 for exactly this. |
| Port (broken) | `apps/api/src/commerce/payment/service/razorpay-payment.service.ts:59` contains the comment `// Verify signature here` and **no verification of any kind**. Execution continues straight to `transaction.status = TransactionStatus.PAID`. |
| Impact | A client can POST a fabricated payment success for a real order. The server marks the transaction PAID, moves the order to processing, and fires the confirmation email and WhatsApp notification. **Free goods.** |
| Status | Open. Pinned by a test that names checklist row E2 so the gap cannot silently persist; the test asserts current behaviour and will fail loudly when verification is added — which is the point. |

### 2. The Stripe webhook does not verify its signature

| | |
|---|---|
| Legacy (correct) | `StripeWebhookController.java:125-132` calls `Webhook.constructEvent(payload, signatureHeader, webhookSecret)` and returns 400 on `SignatureVerificationException`. |
| Port (broken) | `apps/api/src/commerce/payment/controller/payment.controller.ts:174-179` checks only that the `Stripe-Signature` **header is present**, then `const event = payload; // In a real scenario, this would be constructed using the Stripe SDK to verify the signature.` |
| Impact | Any unauthenticated caller who knows the URL can forge a webhook and drive order state. |
| Status | Open. |

### 3. No idempotency on either provider

| | |
|---|---|
| Evidence | Neither service checks transaction status before overwriting, nor dedupes by provider event id (`razorpay-payment.service.ts`, `stripe-payment.service.ts`). |
| Impact | Providers retry webhooks by design. A duplicate `checkout.session.completed` re-runs the whole success path — re-sending the confirmation email and WhatsApp message, and re-clearing the cart. |
| Status | Open. Documented as absent rather than covered by an invented test. |

### 4. Three documented Stripe events have no handler

| | |
|---|---|
| Evidence | Only `handlePaymentSuccess` and `handlePaymentFailure` exist. `PAYMENT_INTENT_CREATED`, `PAYMENT_FAILED` and `CANCELED` are documented in `docs/backend/commerce/02-api-documentation.md` §E but land in the default branch. |
| Impact | Those events are silently discarded. |
| Status | Open. |

### 5. Stripe input validation is weaker than the documented contract

Found independently while testing `payment/validators/`. Each is pinned by an `it.fails` test in
`apps/api/src/commerce/payment/validators/payment.validator.spec.ts`.

| Rule per `backend/commerce/02-api-documentation.md` §E8 | What the port actually does |
|---|---|
| `paymentType` must be one of `advance` \| `remaining` | Only checks the string is non-blank — `"bogus"` passes |
| `customerEmail` must be 5-255 characters | **Never inspected at all** |
| `currency` must be a valid `CURRENCY_ENUM` | Only checks non-blank |

Note the inverse also occurs: `validateRazorpayPaymentInput` **rejects** a non-positive `orderId`,
where the documented Java source (`RazorpayPaymentOrderValidator`) is a stub that always returns
`true`. So the port is stricter in one place and looser in three — it was not a faithful
transliteration in either direction, which is the general lesson for the rest of the migration.

> **Redo when:** any of the above is fixed — the pinning tests in
> `apps/api/src/commerce/payment/**/*.spec.ts` are written to fail at that moment, on purpose.
> Update this section rather than deleting the tests.

## apps/api

| Item | Evidence | Impact | Status |
|---|---|---|---|
| 386/572 files carry `@ts-nocheck` (re-verified this pass: **387/573**, essentially the same figure — the audit's count was accurate within rounding) | `grep -rl "@ts-nocheck" apps/api/src \| wc -l` → 387 | Type errors in ~68% of the API are silently suppressed; `pnpm typecheck` passing (6/6, verified below) is not evidence these files are type-safe | Open |
| 240 `: any` usages claimed by the audit; re-verified count is **270** (`grep -ro ": any" apps/api/src \| wc -l`) | count run 2026-08-12 | Correction: the real number is higher than the audit stated. Same conclusion — heavy escape-hatch usage | Open, correcting the audit |
| 2 test files for ~42,700 LOC | `apps/api/src/database/database.int.spec.ts` (3 tests), `apps/api/src/common/middleware/request-id.middleware.spec.ts` (2 tests) — see `docs/TESTING.md` | No regression protection on 550 route handlers | Open |
| `request-id.middleware.ts` exists but is never registered | `grep -n "request-id\|configure(" apps/api/src/app.module.ts` → no matches. The middleware and its own spec exist (`apps/api/src/common/middleware/request-id.middleware.ts`, `...spec.ts`), but no `NestModule.configure()` call wires it into the request pipeline | Request IDs are not attached to any real request; the root `CLAUDE.md` observability invariant ("request-id, traceable across all apps") is unmet even though the building block is built | Open |
| `main.ts` deliberately stamps `additionalProperties: true` onto the OpenAPI doc | `apps/api/src/main.ts:89,102` — post-processes the generated Swagger doc to widen every request/response schema, with a comment that migrated handlers "deliberately parse unknown JSON through their existing validators" | The published API contract is untyped by design. Any consumer generating a typed client from this OpenAPI doc gets `any` back, not real shapes | Open — deliberate stopgap during migration, not an oversight |
| Several modules are empty shells | `apps/api/src/proxy/proxy.module.ts` is `@Module({})`; root `CLAUDE.md:15` says "the `proxy/` module only shrinks" — it has never grown or shrunk, because it was never populated | The invariant in the root agent brief describes a mechanism that doesn't exist yet | Open |
| Committed dev scripts and test-credential doc at `apps/api/` root | `apps/api/seed_dev_user.js`, `simple_seed.js`, `simple_test.js`, `test_auth.js`, `test_auth_complete.js`, `apps/api/SOLUTION.md` (documents `test@example.com` / `password123`) | Dev debris in the shipped tree; test credentials committed to source control (low severity if never reused in a real environment, but should not be there) | Open |
| Stray root-level `custom product/` directory (with a space in the name) | `custom product/Custom product.dto.ts`, `Custom product.mapper.ts`, 9 files total, outside `apps/` | Orphaned code outside the workspace structure; not part of any build target, easy to miss in review | Open |
| Several cross-domain ports bound to null/dummy implementations | Root `TODO.md` / `MIGRATION_CHECKPOINT.md`: `SIZE_PROFILE_OPTION_PORT`, `FINISH_PROFILE_ITEM_PORT`, `EMAIL_ENCODER_PORT`, plus BadgeProfile/VolumeDiscountProfile/MadeToOrderProfile/CustomSizeProfile/SizeProfile/FinishProfile/FabricProfile/ImageGallerySeo ports referenced in `apps/api/src/commerce/product/product.module.ts` | These commerce sub-flows will silently no-op or return null rather than fail loudly, until the real adapters are written | Open |
| `sub-category/` has no module file | `apps/api/src/commerce/product/product.module.ts:7` imports `./sub-category/subcategory.module.js`, which does not exist — `sub-category/` has dto/mapper/repository/service/types/validators, no module | This is the one type error blocking a clean `tsc --noEmit` on the pre-merge branch; re-check whether it's still present post-merge | Unverified in this pass — re-check against current `apps/api` build output |
| No pino, hand-rolled scrypt auth | `GatekeeperService` — 16-byte salt / 64-byte key, `saltHex:hashHex` format, not a vetted library (bcrypt/argon2) | Auth crypto is hand-rolled rather than using a reviewed library; not inherently broken, but unaudited | Open |

## Storefront

| Item | Evidence | Impact | Status |
|---|---|---|---|
| No `/checkout` route at all | `find apps/storefront/src/app -iname "*checkout*"` → zero files | The storefront cannot complete a purchase | Open — highest-priority gap in the storefront |
| Also missing vs the legacy `fabric` storefront (61 routes there vs 30 here) | `/wishlist`, `/review`, `/fabric-wholesaler[/:city]`, 6 `/b2b/*` PSEO pages, 3 `/ads/*` pages | Roughly half the legacy route surface isn't rebuilt yet | Open |
| `dummy-data.ts` backs 9 of 10 profile routes, not 7 as an earlier pass claimed | `apps/storefront/src/lib/profile/dummy-data.ts` (326 lines), imported by `profile/order/[id]`, `profile/thank-you/[id]`, `profile/wholesale-program`, `profile/order`, `profile/notification-settings`, `profile/custom-order/[id]`, `profile/address`, `profile/dashboard`, `profile/account` — verified with `grep -rl "dummy-data" apps/storefront/src`. Only `profile/page.tsx` itself has no dummy-data import | Order-detail, thank-you, custom-order-detail, address, account, notification-settings render fabricated data with no live fetch at all; dashboard and order-list fall back to dummy data **silently on fetch failure**, indistinguishable from a real empty state in the UI | Open — correcting the count from 7/10 to 9/10 |
| `packages/ui` is empty despite being mandated | `packages/ui/src/index.ts` is `export {};` with a comment "port the existing Fabric design system" — 0 exports, 0 importers. `apps/storefront/CLAUDE.md:8` says "Shared UI from `@anuprerna/ui`" | Every page hand-rolls markup; no shared design-system primitives exist to reuse | Open |
| `src/lib/api.ts` — the file every doc tells agents to use — has zero importers | Real fetch path is `src/lib/api/{client,repositories,adapters}`, undocumented in `apps/storefront/CLAUDE.md:11` and `docs/frontend-conventions.md:11-14` | Following the documented convention leads an agent to dead code | Open — fix by updating `apps/storefront/CLAUDE.md` to point at the real path, or deleting `api.ts` |
| ~30 routes vs 61 in the legacy storefront | `find apps/storefront/src/app -name page.tsx \| wc -l` → 30 | Roughly half the legacy surface area is rebuilt | Open, same fact as the route-gap item above, restated as a coverage ratio |
| 0 of ~50 fetch sites are Zod-validated | See `docs/ENDPOINT-INVENTORY.md` — 1 unused schema total in `packages/types` | No runtime contract checking anywhere in the storefront | Open |

## CMS

| Item | Evidence | Impact | Status |
|---|---|---|---|
| ~15 routes render fabricated data instead of calling their service | `/diagnostics/host` (`page.tsx:20-22` static "Server OS: Linux 6.1..."), `/diagnostics/thread-dump` (fabricated Java stack trace), `/diagnostics/application` (static uptime string), `/image-optimization/attention`, `/image-optimization/ledger` (static "Total bandwidth saved: 4.8 GB"), `/tools`, `/history`, `/queue` (25-29 line stub files, 0 service calls), `/manage-workflow/process` (`page.tsx:8-11` inline hardcoded array), `/manage-workflow/custom-process`, `/manage-workflow/artisan-payments` (hardcoded array), `/manage-workflow/feedback`, `/custom-feedback` (static placeholder), `/manage-workflow/template/add` (`<form>` with no `onSubmit`), `/manage-workflow/template/update/[id]`, `/view/[id]` (hardcoded `defaultValue`, no fetch/save), `/ai-embeddings`, `/manage-product/custom-product`, `/user/cart/[uid]` (`page.tsx:22-27` static placeholder) | These screens look functional in a demo but do not read or write real data | Open. Cheap-fix note: `workflow-service.ts` already implements `getWorkflows()`, `getCustomWorkflows()`, `getWorkflowFeedback()`, `getArtisanPayments()` — several of these pages just don't call the existing service. It has no POST/PUT methods yet, so template add/update need new service code, not just wiring |
| No server-side auth guard | No `middleware.ts` anywhere in `apps/cms` (contradicts `docs/ENGINEERING-GUIDE.md:82`, which says CMS has one). The only gate is a post-mount `useEffect` in `AuthContext.tsx:72-80` | Protected page code and its fetches run before any redirect fires — a client with dev tools open, or a slow redirect, can see a flash of protected content/data | Open, security-adjacent |
| JWT in localStorage | `apps/cms/src/lib/auth-service.ts:28-45` — writes `token`, `jwt`, and five obfuscated chunk keys (`KEY_033`, `KEY_06`, `KEY_40`, `KEY_63`, `KEY_25`), copied from `weave-master/src/app/authentication/jwt.service.ts:20`. `isTokenExpired()` (`auth-service.ts:64-81`) has zero callers — dead code; `hasValidJWT()` only checks the string is non-empty; no 401 interceptor, no refresh (`api.ts:24-27`) | Token theft via XSS is not mitigated by the chunking (obfuscation, not security); expired tokens are not detected client-side | Open |
| 0 tests, no test script, no vitest config | `find apps/cms -iname "vitest*" -o -iname "*.test.*" -o -iname "*.spec.*"` → nothing. `grep '"test' apps/cms/package.json` → nothing | The largest workspace (145 files, 29,095 LOC) has no regression protection at all | Open, see `docs/TESTING.md` |
| `ConfigurationService` bakes `process.env` at module load | `apps/cms/src/lib/config.ts:1,22,24` — `RAW_SERVER_ENDPOINT`, `LFS_SERVER_ENDPOINT`, `IMAGE_RESOURCE_API` read `process.env.NEXT_PUBLIC_*` at import time with hardcoded fallbacks to production hosts (`https://loom-v2.anuprerna.com`, `https://hercules.bloomscorp.com`) | Not reconfigurable per test or per environment without a full module reload; a misconfigured env still silently falls back to prod hosts | Open — see testability note in `docs/TESTING.md` |
| `FAKE_API`, `BYPASS_AUTH`, `MAINTENANCE_MODE`, `SECURE_CONNECT` dead flags | 0 references outside `lib/config.ts`; `PRODUCTION` hardcoded `true` | Dead configuration surface that looks load-bearing but isn't | Open |
| 143 TypeScript errors on `main`, all one root cause | All `TS2322`/`TS2345`, mention `RouteImpl<>`/`UrlObject`, across 77 files — caused by `tsconfig.json` including `.next/types/**/*.ts` while `next.config.ts` has no explicit `typedRoutes: false`. Fix is one config line, not 77 file edits. **On `chore/agent-substrate`, `pnpm typecheck` currently passes 6/6** (verified 2026-08-12) — this appears already resolved on this branch | Was a false alarm about scope (looked like 143 separate bugs, was one config gap) | Resolved on this branch — reconcile with any doc still citing 143 errors |

## Security — read this section first if triaging

| Item | Evidence | Impact | Status |
|---|---|---|---|
| Live production token hardcoded in source, committed and pushed | `apps/storefront/src/app/api/backend/[...path]/route.ts:4-5` — `LOOM_TABLE_EXPLORER_TOKEN`, a 128-char token, in git history since the PR that introduced the proxy | A committed, still-live credential in a private repo cannot be scrubbed from history without a rotation — removal from the working tree is not sufficient | **Open — verify whether this has been rotated on the Loom side since discovery.** Private repo, shared credential; treat as compromised until rotated regardless of repo access controls |
| Both `/api/backend` proxies spoof `Origin`/`Referer` to defeat backend CORS | Storefront `route.ts:19-20` → `http://localhost:4200`; CMS `route.ts:14-16` → `https://weave.bloomscorp.com` | The proxies exist specifically to bypass the legacy backend's CORS allowlist by lying about where the request originates | Open, structural — will remain necessary until `apps/api` is the system of record and legacy CORS no longer needs defeating |
| CMS proxy sets `Access-Control-Allow-Origin: *` | `apps/cms/src/app/api/backend/[...path]/route.ts:44` | Wildcard CORS on a relay that forwards `Authorization` bearer tokens — any origin can ride a logged-in session through this proxy if it can reach it | Open |
| CMS proxy hardcodes `TARGET_HOST` | `apps/cms/src/app/api/backend/[...path]/route.ts:3` — `'https://loom-v2.anuprerna.com'`, no env override | Cannot point the CMS at a staging/local backend without editing source | Open |
| JWT in localStorage, both apps | See CMS and Storefront sections above; storefront's `auth.store.ts` uses `zustand/persist` + `document.cookie` with no `HttpOnly`/`Secure` flags | Standard XSS-exfiltration exposure for session tokens in both apps | Open |

## Docs / infra

| Item | Evidence | Impact | Status |
|---|---|---|---|
| No CI | `find . -maxdepth 2 -iname ".github"` → nothing; no `.github/workflows` anywhere | Nothing enforces `pnpm test` / `pnpm typecheck` / `pnpm build` staying green on a PR — they're currently green (see `docs/TESTING.md`) purely because someone ran them by hand | Open |
| `packages/config` has zero consumers | `grep -rl "@anuprerna/config"` across every `package.json` in the repo → only `packages/config/package.json` itself. `apps/api/eslint.config.mjs:4` says "Mirrors packages/config/eslint.base.mjs; self-contained" — hand-duplicated instead of imported | A shared-config package exists but nothing actually shares it; every workspace hand-rolls its own lint/tsconfig | Open |
| Lint config inconsistent across workspaces | `apps/api` and `apps/cms` on ESLint 9 flat config (`eslint.config.mjs`); `apps/storefront` on legacy `.eslintrc.json`; `packages/types` and `packages/ui` have no lint config or script at all | `pnpm lint` behaves differently per workspace; no single lint contract | Open |

## Corrections to the source audit made during this verification pass

- CMS services directory has **24 files**, not the 30 assumed going in.
- `apps/api` `: any` count is **270**, not 240.
- `apps/api` `@ts-nocheck` count is **387/573** files, essentially matching the 386/572 figure (rounding/timing difference).
- Storefront `dummy-data.ts` backs **9 of 10** profile routes, not 7 — only the top-level `profile/page.tsx` has no dummy-data dependency.
- CMS's 143 `typedRoutes` TypeScript errors are **not currently reproducible** on `chore/agent-substrate` — `pnpm typecheck` passes 6/6. Worth confirming whether a fix already landed or the errors are environment-dependent.
