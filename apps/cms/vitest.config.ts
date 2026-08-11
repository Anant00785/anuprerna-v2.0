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
      // Raised to (actual - 2%) once the suites land; 0 until then so the
      // gate exists from day one rather than being bolted on later.
      thresholds: { lines: 0, functions: 0, branches: 0, statements: 0 },
    },
  },
});
