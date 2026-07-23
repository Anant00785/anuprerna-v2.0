# @anuprerna/storefront (fabric)

Public storefront. Vercel, CDN, ISR. Catalog, cart, checkout, accounts, 4 order types.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind · Vitest + Testing Library. Deploys to Vercel.

## Develop
```bash
pnpm --filter @anuprerna/storefront dev        # http://localhost:3000
pnpm --filter @anuprerna/storefront test
pnpm --filter @anuprerna/storefront typecheck
```

## Layout
```
src/
├── app/            # App Router: layout.tsx, page.tsx, route folders, globals.css
├── components/     # local components (shared ones live in @anuprerna/ui)
├── lib/            # api.ts (typed client), utilities
├── stores/         # Zustand client-state stores (*.store.ts)
└── env.ts          # zod-validated env, imported everywhere instead of process.env
```

## Conventions
- Data fetching goes through `src/lib/api.ts` with a Zod schema from `@anuprerna/types`. No untyped `fetch`.
- Server Components by default; `"use client"` only when you need interactivity.
- Reuse `@anuprerna/ui`; do not fork the design system.
- Every page/component ships a co-located `*.test.tsx`. See root `docs/frontend-conventions.md`.
