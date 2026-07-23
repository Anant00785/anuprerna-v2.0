# @anuprerna/cms (weave)

Admin / content. Vercel. Own auth boundary, SSO. Admin, content, workflow screens.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind · Vitest + Testing Library. Deploys to Vercel.

## Develop
```bash
pnpm --filter @anuprerna/cms dev        # http://localhost:3010
pnpm --filter @anuprerna/cms test
pnpm --filter @anuprerna/cms typecheck
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
