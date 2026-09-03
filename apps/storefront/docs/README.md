# apps/storefront — module documentation

Per-module reference for the Next.js 15 storefront. Follows the same convention as
`apps/api/docs/`: app-local documents live beside the app; cross-app documents stay in the
repo-root `docs/`.

> **Verified against the code on 2026-09-02**, branch `fix/flax-audit-remediation`. Every claim
> below names the file it came from. Where behaviour could not be verified by reading the code, it
> says *unverified* rather than guessing. Anything missing or broken goes in
> [`docs/KNOWN-GAPS.md`](../../../docs/KNOWN-GAPS.md), not here.

| Document | Covers |
|---|---|
| [`auth-session.md`](./auth-session.md) | login → Loom `/authenticate/email` → `loom_jwt` cookie → `/api/auth/me`; the passwordless code lane; required env vars |
| [`api-modes-and-boundary.md`](./api-modes-and-boundary.md) | `NEXT_PUBLIC_API_MODE` legacy/nest, the `/api/backend/[...path]` proxy, and what still calls the legacy backend directly |
| [`cart-and-checkout.md`](./cart-and-checkout.md) | guest cart, account cart, merge-on-login, the four checkout steps and the money boundary |

Repo-root documents this app is described in, and which are **not** duplicated here:
`docs/ARCHITECTURE.md` §3 (strangler boundary), `docs/DATA-FLOW.md` §1 (the fetch-path trace),
`docs/STATE-INVENTORY.md`, `docs/TESTING.md`, `docs/KNOWN-GAPS.md`.

## The three fetch paths, in one table

The storefront has **three** ways of reaching a backend, not one. Adding a fourth is a mistake.

| # | Path | Used by | Base URL from | Notes |
|---|---|---|---|---|
| 1 | `lib/loom/client.ts` (`loomGet`/`loomPost`/…) → `lib/loom/endpoints.ts` | Server-side route handlers under `src/app/api/**` (auth, cart, checkout, profile) | `LOOM_BASE_URL` (`lib/loom/config.ts`) | `import 'server-only'`. Carries the demo write-guard. **This is the intended path.** |
| 2 | `lib/api/client.ts` (`apiRequest`) → `lib/api/repositories/*` | Client and server catalog/cart/profile reads | `/api/backend` in the browser; `NEXT_PUBLIC_{SPRINGBOOT,NEST}_API_URL` on the server | No runtime validation — `apiRequest` casts `response.json()` |
| 3 | A bare `fetch()` built from `env.NEXT_PUBLIC_SPRINGBOOT_API_URL` inside the route handler itself | 13 route handlers, listed in [`api-modes-and-boundary.md`](./api-modes-and-boundary.md) | `env.NEXT_PUBLIC_SPRINGBOOT_API_URL` (via `@/env`, so rule 5 is satisfied) | Bypasses both wrappers, and therefore the write-guard and the Loom `Origin` header |

`src/lib/api.ts` is dead code with zero importers (`apps/storefront/CLAUDE.md` rule 1). Do not use it.
