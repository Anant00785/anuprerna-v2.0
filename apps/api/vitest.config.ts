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
  },
});
