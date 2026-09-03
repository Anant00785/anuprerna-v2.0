# State inventory

> **Generated file — do not edit.** Produced by `scripts/gen-docs/index.mjs` from the code
> itself. Run `pnpm docs:gen` to refresh; CI runs `pnpm docs:check` and fails if this file is
> stale. Where client state actually lives — every storage key, cookie and store, found by scanning.

**5 stores, 8 storage keys, 2 cookie writes.**

## Zustand stores

- `apps/storefront/src/stores/auth.store.ts`
- `apps/storefront/src/stores/cart.store.ts`
- `apps/storefront/src/stores/currency.store.ts`
- `apps/storefront/src/stores/toast.store.ts`
- `apps/storefront/src/stores/wishlist.store.ts`

## Storage keys

| Key | Written/read in |
|---|---|
| `localStorage:anuprerna-auth` | `apps/storefront/src/lib/api/repositories/checkout.repository.ts`<br>`apps/storefront/src/lib/api/repositories/profile.repository.ts` |
| `localStorage:authority` | `apps/cms/src/lib/auth-service.ts` |
| `localStorage:jwt` | `apps/cms/src/lib/auth-service.ts` |
| `localStorage:loom_auth` | `apps/storefront/src/lib/api/repositories/checkout.repository.ts`<br>`apps/storefront/src/lib/api/repositories/profile.repository.ts` |
| `localStorage:recentSearched` | `apps/storefront/src/components/search/SearchPageContent.tsx` |
| `localStorage:selectedCurrency` | `apps/storefront/src/stores/currency.store.ts` |
| `localStorage:token` | `apps/cms/src/lib/auth-service.ts` |
| `localStorage:user_email` | `apps/cms/src/lib/auth-service.ts` |

## Cookies

| Name | Set in |
|---|---|
| `BUYER_MODE_COOKIE` | `apps/storefront/src/components/BuyerModeProvider.tsx` |
| `name` | `apps/storefront/src/stores/auth.store.ts` |
