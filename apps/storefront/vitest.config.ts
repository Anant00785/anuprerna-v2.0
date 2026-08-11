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
      // Raised to (actual - 2%) once the suites land.
      thresholds: { lines: 0, functions: 0, branches: 0, statements: 0 },
    },
  },
  resolve: { alias: { "@": resolve(__dirname, "src") } },
});
