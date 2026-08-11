import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" -> "./src/*" mapping in tsconfig.json.
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Scoped to the layers this repo has chosen to protect. A whole-app
      // threshold would either be uselessly low or block unrelated work.
      include: ["src/lib/api-helper.ts", "src/lib/auth-service.ts", "src/services/**"],
      // Ratchet: set to (actual - 2%) on 2026-08-12. Raise when you improve
      // coverage; never lower one to make a build pass.
      thresholds: { lines: 27, functions: 32, branches: 51, statements: 27 },
    },
  },
});
