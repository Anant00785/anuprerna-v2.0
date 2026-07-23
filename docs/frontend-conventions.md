# Frontend conventions (storefront + cms)

Both Next.js apps follow the same rules so an agent can move between them.

## App Router
- `src/app` is the router. `layout.tsx` (shell) + `page.tsx` (route). Nest folders for routes.
- **Server Components by default.** `"use client"` only for interactivity (state, effects, handlers).
- Secrets never reach the client — keep them in Server Components / route handlers.

## Data
- All API reads go through `src/lib/api.ts` → `apiGet(path, ZodSchema)`. The schema comes from
  `@anuprerna/types`. This closes the 364 untyped reads the audit found. **Never** raw `fetch().json()`.
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
- Shared components live in `@anuprerna/ui`. Local one-offs in `src/components`. Do not fork the design system.
- Tailwind; `globals.css` holds the three `@tailwind` directives only.

## Testing
- Co-located `*.test.tsx` (Vitest + Testing Library + jsdom). Test behavior, not markup.
- `pnpm --filter <app> test`. A page/component without a test does not merge.

## Auth
- Storefront: consumes sessions issued by the api (dual-accept during migration).
- CMS: **own boundary, verify JWT signatures** in `src/middleware.ts`. SSO with storefront.
