import { defineConfig } from "vitest/config";

// Unit tests only. `*.int.spec.ts` files need a live Postgres and run via
// `pnpm test:int` (see vitest.int.config.ts) — keeping them out of `test`
// is what makes `pnpm test` runnable on a clean checkout with no services up.
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    exclude: ["src/**/*.int.spec.ts"],
    environment: "node",
    setupFiles: ["dotenv/config"],
    coverage: {
      provider: "v8",
      // Scoped to the layers this repo has chosen to protect: the near-pure
      // validators, sanitizers and mappers, plus shared middleware. The other
      // ~470 files are a ported Java transliteration; a whole-app threshold
      // would be uselessly low.
      include: ["src/commerce/**/validators/**", "src/commerce/**/mapper/**", "src/common/**"],
      // Ratchet: set to (actual - 2%) on 2026-08-12. Raise when you improve
      // coverage; never lower one to make a build pass.
      thresholds: { lines: 33, functions: 91, branches: 89, statements: 33 },
    },
  },
});
