# CLAUDE.md — apps/cms (weave, Next.js)

Admin / content. Vercel. Own auth boundary, SSO. Admin, content, workflow screens.

## Stack & structure
Next.js 15 App Router · TS · Tailwind · Zustand · Vitest. Code in `src/app` (routes), `src/components`,
`src/lib` (typed api client + utils), `src/stores` (Zustand client state), `src/env.ts` (zod env). Shared UI from `@anuprerna/ui`,
shared types from `@anuprerna/types`.

## Auth (this app owns its boundary)
- **Verify JWT signatures** in `src/middleware.ts` — the legacy CMS middleware did NOT (a forged
  cookie granted admin). Never repeat that.
- SSO with the storefront; keep the admin session separate and short-lived.

## Rules for working here
1. **Types at the boundary.** Fetch only through `src/lib/api.ts` + a Zod schema from `@anuprerna/types`.
   This is where the audit's 364 untyped reads get closed. No `any`, no raw `fetch().json()`.
2. **Server Components by default.** Add `"use client"` only for interactivity. Keep secrets server-side.
3. **Reuse `@anuprerna/ui`** — do not fork the design system.
4. **Test co-located.** Each page/component ships a `*.test.tsx`. No feature merges without tests.
5. **Env via `src/env.ts`** only — never read `process.env` directly.

## Before building a feature
Read its spec in `docs/features/<feature>.md` and `docs/frontend-conventions.md`; make a todo per
acceptance criterion; follow TDD (write the component test first).
