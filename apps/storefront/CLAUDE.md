# CLAUDE.md — apps/storefront (fabric, Next.js)

Public storefront. Vercel, CDN, ISR. Catalog, cart, checkout, accounts, 4 order types.

## Stack & structure
Next.js 15 App Router · TS · Tailwind · Zustand · Vitest. Code in `src/app` (routes), `src/components`,
`src/lib` (api client + utils — see rule 1 for the real path), `src/stores` (Zustand client state),
`src/env.ts` (zod env). Shared UI intended from `@anuprerna/ui` (currently `export {}`, empty — see
`docs/KNOWN-GAPS.md`), shared types from `@anuprerna/types`.

## Rules for working here
1. **Types at the boundary — target state.** Fetch through a Zod schema from `@anuprerna/types`.
   This is where the audit's 364 untyped reads are meant to get closed.
   > **Status:** `src/lib/api.ts` is dead code — zero importers, do not use it. The real fetch path
   > is `src/lib/api/{client,repositories,adapters}.ts` (`apiRequest()` in `client.ts` currently
   > casts `response.json()` with no runtime validation), and ten route handlers under
   > `src/app/api/*` bypass that path entirely and call `NEXT_PUBLIC_SPRINGBOOT_API_URL` directly.
   > See `docs/DATA-FLOW.md` §1 for the full trace before adding a new fetch site.
2. **Server Components by default.** Add `"use client"` only for interactivity. Keep secrets server-side.
3. **Reuse `@anuprerna/ui`** — do not fork the design system.
4. **Test co-located.** Each page/component ships a `*.test.tsx`. No feature merges without tests.
5. **Env via `src/env.ts`** only — never read `process.env` directly.

## Before building a feature
Read its spec in `docs/features/<feature>.md` and `docs/frontend-conventions.md`; make a todo per
acceptance criterion; follow TDD (write the component test first).
