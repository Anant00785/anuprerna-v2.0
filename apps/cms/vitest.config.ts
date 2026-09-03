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
      //
      // `src/services/**` was in this list until 2026-09-02 and had not existed
      // since the service layer was replaced by src/lib/*-api.ts — a glob that
      // matches nothing contributes nothing and quietly made the number mean
      // less than it looked. The list now names the real data layer plus the
      // two server-side guards (the write forwarder and the session gate),
      // which is what "chosen to protect" means on this branch.
      include: [
        "src/lib/*-api.ts",
        "src/lib/auth-service.ts",
        "src/lib/backend-fetch-error.ts",
        "src/lib/load-or-banner.tsx",
        "src/lib/sandbox-floor.ts",
        "src/lib/signoff-identity.ts",
        "src/lib/feedback-identity.ts",
        "src/middleware.ts",
        "src/app/api/crud/route.ts",
        "src/app/api/auth/login/route.ts",
        "src/app/api/product/*/route.ts",
      ],
      // Ratchet: re-measured 2026-09-02 and set to (actual - 2%). Raise when you
      // improve coverage; never lower one to make a build pass.
      thresholds: { lines: 42, functions: 50, branches: 79, statements: 42 },
    },
  },
});
