# CLAUDE.md — tests/ (cross-app contract & e2e only)

## Testing strategy (why tests are split this way)
- **Unit tests are co-located** as `*.spec.ts` next to the source they test. They move WITH the code
  during the strangler migration (code relocates constantly) and stay fast. This is the industry
  standard for NestJS/Turborepo and beats a mirrored top-level test tree that rots on every refactor.
- **This folder is for cross-app tests** that no single app owns: contract tests (storefront ⇄ api
  against `@anuprerna/types`), and end-to-end user journeys (Playwright).

## Rules
- Every feature merges with its co-located unit tests. Add a contract/e2e here only when a flow spans apps.
- CI runs `pnpm test` (unit, per-package) and `pnpm test:e2e` (this folder).
