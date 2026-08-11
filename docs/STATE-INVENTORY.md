# State Inventory

Where client and server state lives across `apps/storefront` and `apps/cms`, verified by grep and
direct file reads on `chore/agent-substrate`. For the request paths that populate this state, see
[`DATA-FLOW.md`](./DATA-FLOW.md); for system layout, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

No `sessionStorage` usage was found anywhere in either app — every persisted key below is
`localStorage` or a cookie.

---

## 1. Zustand stores — `apps/storefront/src/stores/`

Two stores exist. Both use `persist` with no storage engine override, so both default to
`localStorage`.

| Store | File | State shape | Persist key | Storage | file:line (persist config) | Contains secrets |
|---|---|---|---|---|---|---|
| `auth.store.ts` | `apps/storefront/src/stores/auth.store.ts` | `jwt: string \| null`, `user: UserProfile \| null`, `isLoggedIn: boolean` | `anuprerna-auth` | localStorage (default) | `:51-53`, no `partialize` — all fields persisted | **Yes — raw JWT in plaintext localStorage** |
| `cart.store.ts` | `apps/storefront/src/stores/cart.store.ts` | `items: CartItem[]` (`{ productId, qty }`) | `anuprerna-cart` | localStorage (default) | `:16-25`, no `partialize` | No |

`auth.store.ts` also writes a JWT copy outside zustand entirely — see Section 3 (cookies). No CMS
equivalent of zustand exists; the CMS has no client-side store library, only `AuthContext` (React
Context, not persisted itself) plus direct `localStorage` calls from `auth-service.ts`.

---

## 2. localStorage keys

| Key | Written | Read | Removed | Lifetime | Secret | Notes |
|---|---|---|---|---|---|---|
| `anuprerna-auth` | zustand persist, `apps/storefront/src/stores/auth.store.ts:51-53` | same (zustand rehydration) | on logout, store reset | until logout / manual clear | **Yes, JWT** | Storefront. Whole store object, JSON. |
| `anuprerna-cart` | zustand persist, `apps/storefront/src/stores/cart.store.ts:16-25` | same | on clear() | until cleared | No | Storefront cart contents |
| `recentSearched` | `apps/storefront/src/components/search/SearchPageContent.tsx:64` | `:48` | not found | indefinite | No | Storefront recent-search list |
| `token` | `apps/cms/src/lib/auth-service.ts:28` | `:51` | `:94` | until logout | **Yes, plain JWT** | CMS |
| `jwt` | `apps/cms/src/lib/auth-service.ts:29` | `:51` | `:95` | until logout | **Yes, plain JWT** | CMS, duplicate of `token` |
| `KEY_033` | `apps/cms/src/lib/auth-service.ts:41` | `:54` | `:98` | until logout | **Yes, 1/5 JWT chunk** | See obfuscation note below |
| `KEY_06` | `apps/cms/src/lib/auth-service.ts:42` | `:55` | `:99` | until logout | **Yes, 1/5 JWT chunk** | |
| `KEY_40` | `apps/cms/src/lib/auth-service.ts:43` | `:56` | `:100` | until logout | **Yes, 1/5 JWT chunk** | |
| `KEY_63` | `apps/cms/src/lib/auth-service.ts:44` | `:57` | `:101` | until logout | **Yes, 1/5 JWT chunk** | |
| `KEY_25` | `apps/cms/src/lib/auth-service.ts:45` | `:58` | `:102` | until logout | **Yes, 1/5 JWT chunk** | |
| `user_email` | `apps/cms/src/lib/auth-service.ts:125` | `apps/cms/src/context/AuthContext.tsx:42` | `auth-service.ts:97` | until logout | No | |
| `authority` | `apps/cms/src/lib/auth-service.ts:171` | `apps/cms/src/context/AuthContext.tsx:45` | `auth-service.ts:96` | until logout | No (role flags) | JSON `{superuser, admin, user, guest}` |

**The five `KEY_*` names are obfuscation, not security.** `apps/cms/src/lib/auth-service.ts:18-22`
defines constants named to look randomized (`KEY_033 = 'nkbgUGFbfYHbJh'`, etc.), and `storeJWT()`
(`:25-46`) shatters the JWT into 5 substrings by length, one per key. `retrieveJWT()` (`:48-62`)
reconstructs it by concatenation — and actually prefers the plain `jwt`/`token` keys first (`:51`),
falling back to the chunks only if those are absent. The comment at `:31`, "Shatter into 5 chunks
matching Angular JWTService," confirms this mirrors the legacy Weave Angular app's
`jwt.service.ts` pattern verbatim: it is copied obfuscation-by-scattering, not encryption, and does
not increase resistance to XSS — anything that can read `localStorage` can read all five keys and
reassemble the token in one line.

**Dangerous, plainly:** both apps store the live JWT in plaintext `localStorage`, which is
readable by any script that runs on the page — a single XSS bug in either app is a full account
takeover, and the CMS additionally writes the same token seven different ways for no security
benefit.

---

## 3. Cookies

| Cookie | Written | Flags set | Flags missing | Read | Notes |
|---|---|---|---|---|---|
| `jwt_token` | `apps/storefront/src/stores/auth.store.ts:24-28` (`setCookie`, called from `setToken` at `:42`) via `document.cookie` | `path=/; SameSite=Lax` | **`Secure`, `HttpOnly`** (`HttpOnly` is inherently impossible to set from client JS; `Secure` was simply omitted) | Server: `apps/storefront/src/app/api/backend/[...path]/route.ts:34` `request.cookies.get("jwt_token")` | Deleted on logout, `auth.store.ts:32` (`deleteCookie`) |

No other `document.cookie` writes were found in either app. No `cookies()` (next/headers) usage
exists anywhere in `apps/storefront` or `apps/cms` outside the one proxy read above — the CMS has
no cookie writes at all; its auth transport is `localStorage` + the `Authorization` header only
(Section 2, `apps/cms/src/lib/api.ts:12-19`).

**Missing `Secure`/`HttpOnly` on `jwt_token` is worth flagging plainly:** the cookie is readable by
any script (no `HttpOnly` protection is even attempted) and would be sent over plain HTTP if the
site were ever served without TLS termination in front of it.

---

## 4. URL / search-param state

| File | Hook location | Drives |
|---|---|---|
| `apps/storefront/src/components/plp/ProductListingPage.tsx` | `:36`, params read `:40-42` | `category` filter, `page` (pagination number), `sort-by` |
| `apps/storefront/src/components/auth/AuthContainer.tsx` | `:25-26` | post-login `returnUrl` redirect target |
| `apps/storefront/src/components/search/SearchPageContent.tsx` | `:31,33` | initial search query (`search` / `q` param) |

No `useSearchParams` usage found anywhere in `apps/cms/src` — CMS pages do not drive state from
the URL.

---

## 5. Server-side caching

All caching is in `apps/storefront`; no `revalidate`/`cache:`/`next:` usage was found anywhere in
`apps/cms/src` — every CMS request is uncached, live to the legacy backend on every call.

| File:line | Value | Scope |
|---|---|---|
| `apps/storefront/src/app/api/plp/route.ts:22` | `revalidate: 60` | Product list |
| `apps/storefront/src/app/api/plp/route.ts:23-25` | `revalidate: 3600` (×3) | Color / material / pattern filter lists |
| `apps/storefront/src/app/api/plp/segments/route.ts:20` | `revalidate: 300` | PLP segments |
| `apps/storefront/src/app/api/plp/related/route.ts:20` | `revalidate: 300` | Related products |
| `apps/storefront/src/app/api/blogs/route.ts:14` | `revalidate: 300` | Blog list |
| `apps/storefront/src/app/api/navigation/story/[type]/route.ts:20` | `revalidate: 300` | Navigation stories |
| `apps/storefront/src/app/api/content/[blogId]/route.ts:24` | `revalidate: 300` | Blog content |
| `apps/storefront/src/app/api/product/route.ts:23,41` | `revalidate: 60` (×2) | Product detail |
| `apps/storefront/src/app/api/stories/route.ts:14` | `revalidate: 300` | Story list |
| `apps/storefront/src/app/api/stories/[storyId]/route.ts:24` | `revalidate: 300` | Single story |
| `apps/storefront/src/app/api/search/route.ts:29,33,37` | `revalidate: 60` (×3) | Search results |
| `apps/storefront/src/lib/api/client.ts:55` | `revalidate: 60` | Path-A `apiRequest` default |
| `apps/storefront/src/lib/api.ts:10` | `revalidate: 60` | Documented default in the dead `api.ts` file — not actually used, since `api.ts` has zero importers |
| `apps/storefront/src/lib/api/repositories/plp.repository.ts:26,50,69` | `cache: "no-store"` | Opts PLP's three fetches (Section 1 of DATA-FLOW.md) out of caching entirely, overriding the route-level `revalidate` values above at the call site that actually matters |

Net effect for PLP specifically: the route handler (`app/api/plp/route.ts`) sets ISR revalidate
windows, but the repository that calls it (`plp.repository.ts`) requests `no-store` on its own
`fetch`, so the effective caching behavior for the browser-facing request is uncached even though
the route handler's own upstream fetches are ISR-cached.

---

## 6. Module-load-time state — `apps/cms/src/lib/config.ts`

`ConfigurationService` is a plain object literal evaluated once at module import — every field
below is fixed for the life of the process/bundle, not re-read per request.

| file:line | Field | Value |
|---|---|---|
| `:1` | `RAW_SERVER_ENDPOINT` (module-scope const, not exported directly) | `process.env.NEXT_PUBLIC_SERVER_ENDPOINT \|\| 'https://loom-v2.anuprerna.com'` |
| `:19` | `SERVER_ENDPOINT` | `typeof window !== 'undefined' ? '/api/backend' : RAW_SERVER_ENDPOINT` — branches once at load, not per call |
| `:22` | `LFS_SERVER_ENDPOINT` | `process.env.NEXT_PUBLIC_LFS_SERVER_ENDPOINT \|\| 'https://hercules.bloomscorp.com'` |
| `:23` | `API_ENDPOINT` | Same `window`-branch pattern as `:19` |
| `:24` | `IMAGE_RESOURCE_API` | `process.env.NEXT_PUBLIC_IMAGE_API \|\| 'https://loom-v2.anuprerna.com'` |

Dead flags in the same object, hardcoded, confirmed zero references anywhere else in either app
(full-repo grep; the only other `PRODUCTION`-adjacent hits are the unrelated
`DOMAIN_PRODUCTION`/`LFS_DOMAIN_PRODUCTION` string constants):

| file:line | Flag | Value |
|---|---|---|
| `:4` | `PRODUCTION` | `true`, hardcoded |
| `:5` | `MAINTENANCE_MODE` | `false` |
| `:6` | `FAKE_API` | `false` |
| `:7` | `BYPASS_AUTH` | `false` |
| `:8` | `SECURE_CONNECT` | `true` |

None of these five flags gate any code path — they are vestigial from the source this file was
copied from (`weave-master`'s `configuration.service.ts`) and can be deleted without behavior
change, but an agent grepping for `BYPASS_AUTH` expecting it to do something will be misled.

---

## 7. Hardcoded/mock data standing in for state

`apps/storefront/src/lib/profile/dummy-data.ts` (327 lines) exports fully fabricated fixtures:
`mockUserProfile`, `mockAddresses` (3), `mockOrderList` (4), `mockSingleOrderDetails`,
`mockCustomOrderDetails`, `mockWholesaleMembershipInfo`, `mockWholesaleOrderInfo`,
`mockNotificationPreferences` (4), `mockNotificationLogs` (3) — fake names, addresses, order IDs.
The file itself contains no fallback logic; it is imported directly by page code.

| Route | file:line | Behavior |
|---|---|---|
| `apps/storefront/src/app/profile/order/page.tsx` | `:4,12` | `useState(mockOrderList)` seed; has a `catch`, falls back to mock silently on fetch failure — **indistinguishable from a real, empty result in the UI** |
| `apps/storefront/src/app/profile/dashboard/page.tsx` | `:5,12-13,42-43` | Same pattern — comment at `:42-43` "Fall back to mock order list" in `catch` |
| `apps/storefront/src/app/profile/wholesale-program/page.tsx` | `:6-9,15-16,46` | Same pattern — comment at `:30-31` "Fall back to default static mock" in `catch` |
| `apps/storefront/src/app/profile/notification-settings/page.tsx` | `:3,8-9` | Unconditional prop pass, no fetch attempted at all |
| `apps/storefront/src/app/profile/order/[id]/page.tsx` | `:3,14-16` | Unconditional spread of `mockSingleOrderDetails`, no fetch attempted |
| `apps/storefront/src/app/profile/custom-order/[id]/page.tsx` | `:3,13-15` | Unconditional spread of `mockCustomOrderDetails`, no fetch attempted |
| `apps/storefront/src/app/profile/thank-you/[id]/page.tsx` | `:3,13-15` | Unconditional spread of `mockSingleOrderDetails`, no fetch attempted |
| `apps/storefront/src/app/profile/address/page.tsx` | `:3,6` | Unconditional render, no fetch attempted |
| `apps/storefront/src/app/profile/account/page.tsx` | `:3,6` | Unconditional render, no fetch attempted |

Nine profile routes total. Three (`order`, `dashboard`, `wholesale-program`) attempt a real fetch
and fall back to the mock silently on failure — a backend outage on these three pages looks
identical to success. The other six (`notification-settings`, `order/[id]`, `custom-order/[id]`,
`thank-you/[id]`, `address`, `account`) never attempt a live fetch at all; they are pure
placeholders for state that has not been wired up yet, not resilience fallbacks. See
[`KNOWN-GAPS.md`](./KNOWN-GAPS.md) for the equivalent CMS-side list of ~15 routes that render
hardcoded data instead of calling their already-implemented service methods.

**Dangerous, plainly:** on `order`, `dashboard`, and `wholesale-program`, a live backend failure
renders fabricated order/address data with no visual difference from a successful real response.
