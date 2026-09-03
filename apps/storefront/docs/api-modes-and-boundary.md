# API modes and the strangler boundary

**Files:** `src/env.ts`, `src/lib/api/client.ts`, `src/lib/api/repositories/*`,
`src/app/api/backend/[...path]/route.ts`, `src/lib/loom/{config,client}.ts`.

## `NEXT_PUBLIC_API_MODE` — `legacy` (default) vs `nest`

Declared in `src/env.ts` as `z.enum(["legacy","nest"]).default("legacy")`, and additionally
defaulted with `process.env.NEXT_PUBLIC_API_MODE || "legacy"`. **`legacy` is the current default and
the mode everything is running in.** An unknown value fails the Zod parse at import and takes the
app down at boot — deliberate, so a typo cannot silently half-switch the storefront.

The flag is read in four kinds of place (`grep NEXT_PUBLIC_API_MODE src`):

| Site | What the mode changes |
|---|---|
| `lib/api/client.ts` `getBaseUrl()` | **Server-side only.** `nest` → `NEXT_PUBLIC_NEST_API_URL`, `legacy` → `NEXT_PUBLIC_SPRINGBOOT_API_URL`. In the browser the mode is ignored entirely: `getBaseUrl` returns `/api/backend` whenever `typeof window !== "undefined"`. |
| `lib/api/repositories/catalog.repository.ts` (4 methods) | Picks a whole branch: `legacy` calls Loom paths (`/get/navigation`, `/get/fabric-preview-list`) and maps through `legacy-catalog.adapter`; `nest` calls `/v1/...` and maps through `nest-catalog.adapter`. Different endpoint, different envelope, different mapper. |
| `lib/api/repositories/cart.repository.ts` `getCart()` | `nest` → `GET /v1/cart` + `mapNestCartToDomain`; `legacy` → `GET /get/cart-item/list` + `mapLegacyCartToDomain`, wrapped in a try/catch that returns an **empty cart** on any failure. |
| `app/api/{plp,product,stories,stories/[storyId],featured/[category]}/route.ts` | Only swaps the base URL between the Nest and Spring hosts. The path and the response handling do not change, so these five handlers assume the two backends serve the same shape — **unverified**. |

Only catalog and cart have a real `nest` implementation. Everything else — auth, checkout, profile,
wishlist, navigation, search, blogs, stories content — has no `nest` branch at all and goes to the
legacy backend whatever the flag says.

### The tests assume `legacy`

Running the suite with `NEXT_PUBLIC_API_MODE=nest` **fails 10 of the 94 tests under `src/lib/api`**
(measured 2026-09-02: 4 in `cart.repository.test.ts`, 6 in `catalog.repository.test.ts`). The
legacy-envelope assertions in `legacy-cart.adapter.test.ts` / `legacy-catalog.adapter.test.ts` and
the repository tests are written against the default. The two repository specs that *do* exercise
`nest` set `env.NEXT_PUBLIC_API_MODE = "nest"` inside the test and restore the captured original in
`afterEach` — copy that pattern rather than setting the env var globally.

## `/api/backend/[...path]` — the strangler boundary

`apps/api/src/proxy` is still an empty `@Module({})` shell (root `CLAUDE.md`), so **this route
handler is the real boundary today**. It is a transparent, method-preserving reverse proxy:

- **Target:** `${NEXT_PUBLIC_API_URL || env.NEXT_PUBLIC_API_URL || env.NEXT_PUBLIC_NEST_API_URL || "http://127.0.0.1:3000"}/<path>` plus the original query string. Note the target is the *Nest* base, not `LOOM_BASE_URL`.
- **Methods:** `GET`, `POST`, `PUT`, `DELETE`, `PATCH`. All five funnel into one `proxyRequest`.
- **Headers:** the inbound headers are forwarded wholesale, then `host` is deleted, `origin` is
  forced to `https://anuprerna.com` and `referer` to `https://anuprerna.com/` (the legacy CORS and
  domain filter reject anything else), and `X-Loom-Table-Explorer-Token` is injected when
  `LOOM_TABLE_EXPLORER_TOKEN` is set.
- **Auth:** the `jwt_token` cookie is promoted to `Authorization: Bearer <value>` — but **not** when
  the caller already sent an `Authorization` header, and **not** for the auth entry points matched by
  `/^(authenticate|customer\/registration|check-email|validate\/provider|send\/password-reset|reset\/password)\b/`.
  Sending a live session to `/authenticate` would let the backend answer for the wrong identity.
- **Response:** status, statusText and body stream are passed through unchanged, minus
  `transfer-encoding`, `content-encoding` and `content-length` (which would be wrong after the hop).
  A backend `401` reaches the browser as a `401`; nothing is masked as success.
- **Failure:** a `fetch` throw becomes `502` with the legacy envelope
  `{ error: true, success: false, payload: [], entity: [], message }` — callers destructure
  `payload`/`entity`, so a bare `{error}` would crash them.

All of the above is pinned in `src/app/api/backend/[...path]/route.test.ts`.

Note the cookie name asymmetry: this proxy reads **`jwt_token`**, while the storefront's own session
cookie is **`loom_jwt`** (`lib/loom/config.ts`). They are different cookies; the proxy does not
forward the storefront session as a bearer token.

## What still talks to the legacy backend directly

Two categories, neither of which transits `/api/backend`.

**1. `lib/loom/client.ts` → `LOOM_BASE_URL`.** Every server-side route handler for auth, cart writes,
checkout, profile, addresses, wishlist and contact. This is the sanctioned path and it carries the
demo write-guard (below).

**2. Thirteen route handlers that build their own `fetch` from `env.NEXT_PUBLIC_SPRINGBOOT_API_URL`,**
bypassing both `loomGet` and `apiRequest`:

`app/api/blogs`, `app/api/content/[blogId]`, `app/api/featured/[category]`,
`app/api/navigation/category/[type]`, `app/api/navigation/finish/[category]`,
`app/api/navigation/story/[type]`, `app/api/plp`, `app/api/plp/related`, `app/api/plp/segments`,
`app/api/product`, `app/api/search`, `app/api/stories`, `app/api/stories/[storyId]`.

(`apps/storefront/CLAUDE.md` says "ten"; the current count is thirteen.) They all read the URL from
`@/env` rather than `process.env`, so rule 5 holds, but they are outside the write-guard and do not
send Loom's required `Origin: localhost` header. All thirteen are GET-only reads, so the write-guard
gap is currently theoretical — but nothing structural keeps it that way.

## The demo write-guard (`lib/loom/client.ts`)

This is the mechanism that stops a public preview mutating live Loom, and it is worth knowing before
adding any backend call. `loomPost` runs `assertPostAllowed`, `loomPatch`/`loomPut`/`loomDelete` run
`assertWriteAllowed`; both throw `LoomWriteBlockedError` **before any fetch is issued**.

- POST: an exact allowlist of 16 paths plus the `/authenticate` prefix.
- PATCH: `/update/cart-item` only. PUT: `/manage/wishlist/*` only. DELETE: `/delete/cart-item/<digits>` only.
- The path is normalised (leading slash added, query string stripped) before matching, so
  `/delete/everything?ok=/add/cart-item` and `/evil/add/cart-item` are both blocked.

`.harness/zero-mutation-gate.mjs` keeps a **duplicate, hardcoded** copy of this allowlist and must be
edited in the same change. That duplication is a standing trap, recorded in `docs/KNOWN-GAPS.md`.

Pinned in `src/lib/loom/client.test.ts`, including that the six Loom gateway action routes
(`/create/payment-session`, `/create/stripe/payment-session`, `/update/payment/success`,
`/update/payment/failure`, `/update/payment/transaction`, `/checkout/stripe/webhook`) stay blocked.
