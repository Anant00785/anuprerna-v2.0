# CLAUDE.md — tests/ (cross-app contract & e2e only)

## Testing strategy (why tests are split this way)
- **Unit tests are co-located** as `*.spec.ts` next to the source they test. They move WITH the code
  during the strangler migration (code relocates constantly) and stay fast. This is the industry
  standard for NestJS/Turborepo and beats a mirrored top-level test tree that rots on every refactor.
- **This folder is for cross-app tests** that no single app owns: contract tests (storefront ⇄ api
  against `@anuprerna/types`), and end-to-end user journeys (Playwright).

## Rules
- Every feature merges with its co-located unit tests. Add a contract/e2e here only when a flow spans apps.
- CI (`.github/workflows/ci.yml`) genuinely exists now and runs `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, and `pnpm build` on every push/PR, plus a separate job running
  `pnpm --filter @anuprerna/api test:int` against a real Postgres service container, plus a
  gitleaks secret scan.
  > **Status:** there is no `test:e2e` script anywhere in this repo, and this folder is currently
  > empty except for this file — Playwright is **not installed**
  > (`grep -rn playwright package.json apps/*/package.json` finds no matches). The task CI actually
  > runs for cross-service coverage today is the api's `test:int`, not an e2e suite from this
  > folder. Until Playwright is added and specs are written here, treat "cross-app e2e" as a target,
  > not a running check. See `docs/TESTING.md` §1 and `docs/KNOWN-GAPS.md`.
