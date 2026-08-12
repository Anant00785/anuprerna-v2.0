# State inventory

> **Generated file — do not edit.** Produced by `scripts/gen-docs/index.mjs` from the code
> itself. Run `pnpm docs:gen` to refresh; CI runs `pnpm docs:check` and fails if this file is
> stale. Where client state actually lives — every storage key, cookie and store, found by scanning.

**3 stores, 6 storage keys, 1 cookie writes.**

## Zustand stores

- `apps/storefront/src/stores/auth.store.ts`
- `apps/storefront/src/stores/cart.store.ts`
- `apps/storefront/src/stores/currency.store.ts`

## Storage keys

| Key | Written/read in |
|---|---|
| `localStorage:authority` | `apps/cms/src/context/AuthContext.tsx`<br>`apps/cms/src/lib/auth-service.ts` |
| `localStorage:jwt` | `apps/cms/src/lib/auth-service.ts` |
| `localStorage:recentSearched` | `apps/storefront/src/components/search/SearchPageContent.tsx` |
| `localStorage:selectedCurrency` | `apps/storefront/src/stores/currency.store.ts` |
| `localStorage:token` | `apps/cms/src/lib/auth-service.ts` |
| `localStorage:user_email` | `apps/cms/src/context/AuthContext.tsx`<br>`apps/cms/src/lib/auth-service.ts` |

## Cookies

| Name | Set in |
|---|---|
| `name` | `apps/storefront/src/stores/auth.store.ts` |
