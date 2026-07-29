import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema/index.ts",
  out: "./src/database/schema",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
