# Frontend conventions (storefront + cms)

Both Next.js apps follow the same rules so an agent can move between them.

## App Router
- `src/app` is the router. `layout.tsx` (shell) + `page.tsx` (route). Nest folders for routes.
- **Server Components by default.** `"use client"` only for interactivity (state, effects, handlers).
- Secrets never reach the client — keep them in Server Components / route handlers.

## Data
- **Target:** all API reads go through a Zod-validated client. The schema comes from
  `@anuprerna/types`. This is meant to close the 364 untyped reads the audit found.
  > **Status:** not yet the practice. `apps/storefront/src/lib/api.ts` is dead code — zero
  > importers. The real storefront fetch path is `src/lib/api/{client,repositories,adapters}.ts`
  > (`client.ts`'s `apiRequest()` does `response.json() as Promise<T>`, a cast with no runtime
  > check), plus ten route handlers under `src/app/api/*` that bypass the repository/client stack
  > entirely and call `NEXT_PUBLIC_SPRINGBOOT_API_URL` directly. `apps/cms` funnels through
  > `src/services/*.ts` → `src/lib/api.ts` (an axios singleton, unrelated to the storefront file of
  > the same name) → `unwrapResponseData()`, also with no schema validation. See `docs/DATA-FLOW.md`
  > for the full trace — read it before adding a new fetch, this note is a summary, not the source.
- Caching: default ISR `revalidate: 60`; override per call. Static where possible (storefront).

## State management (Zustand)
- **Client state only** lives in `src/stores/*.store.ts` (cart, UI toggles, wizard steps). Use Zustand
  — small, hook-based, no provider boilerplate.
- **Server state stays server-side.** Fetch via `lib/api.ts` in Server Components; do NOT copy server
  data into a Zustand store (it goes stale and duplicates the source of truth).
- Persisted stores (`persist` middleware → localStorage) must hold **no secrets**.
- Each store ships a co-located `*.store.test.ts`. See `apps/storefront/src/stores/cart.store.ts`.

## Styling (Tailwind)
- Tailwind is configured per app (`tailwind.config.ts` + `postcss.config.mjs`); `globals.css` holds only
  the three `@tailwind` directives. The config scans `@anuprerna/ui` so shared components stay themed.

## Env
- `src/env.ts` validates env with Zod at boot. Import `env` from there; never touch `process.env`.

## UI
- Shared components are intended to live in `@anuprerna/ui`. Local one-offs in `src/components`. Do
  not fork the design system.
  > **Status:** `packages/ui/src/index.ts` is `export {}` — zero components exist there yet, so
  > every page currently hand-rolls its own markup in `src/components`. Populate `@anuprerna/ui`
  > rather than adding more local one-offs where a shared primitive would do.
- Tailwind; `globals.css` holds the three `@tailwind` directives only.

## Testing
- Co-located `*.test.tsx` (Vitest + Testing Library + jsdom). Test behavior, not markup.
- `pnpm --filter <app> test`. A page/component without a test does not merge.

## Auth
- Storefront: consumes sessions issued by the api. Dual-accept auth (accepting both legacy Loom and
  native tokens) is the target design — see `docs/features/0001-identity-dual-accept-auth.md`
  (status: NOT STARTED). Today the storefront only handles legacy Loom JWTs (localStorage +
  non-`HttpOnly` cookie — see `docs/DATA-FLOW.md` §2 and `docs/KNOWN-GAPS.md`).
- CMS: **target is a real server-side boundary** verifying JWT signatures. > **Status:** no
  `src/middleware.ts` exists anywhere in `apps/cms` and there is no server-side guard at all. The
  only gate today is a client-side, post-mount `useEffect` in `src/context/AuthContext.tsx` that
  runs after the protected page has already rendered and fetched — see `docs/DATA-FLOW.md` §4.
  Do not rely on it for security; the legacy backend is the only real authority until a real
  boundary is built.
