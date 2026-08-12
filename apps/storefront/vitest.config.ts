import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      // Scoped to the layers this repo has chosen to protect. A whole-app
      // threshold would either be uselessly low or block unrelated work.
      include: ["src/lib/api/**", "src/lib/plp/**", "src/stores/**"],
      // Ratchet: set to (actual - 2%) on 2026-08-12. Raise when you improve
      // coverage; never lower one to make a build pass.
      thresholds: { lines: 80, functions: 78, branches: 78, statements: 80 },
    },
  },
  resolve: { alias: { "@": resolve(__dirname, "src") } },
});
