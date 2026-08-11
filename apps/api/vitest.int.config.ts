import { defineConfig } from "vitest/config";

// Integration tests. Require a reachable Postgres at DATABASE_URL.
// Locally: docker compose up -d db. In CI: a Postgres service container.
// Kept separate from `test` so a clean checkout can run `pnpm test` green.
export default defineConfig({
  test: {
    include: ["src/**/*.int.spec.ts"],
    environment: "node",
    setupFiles: ["dotenv/config"],
    // Integration suites share one database; parallel files would race.
    fileParallelism: false,
  },
});
