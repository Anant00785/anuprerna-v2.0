import { Global, Module, OnModuleDestroy } from "@nestjs/common";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";

export const DATABASE_CONNECTION = Symbol("DATABASE_CONNECTION");
export type Database = PostgresJsDatabase<typeof schema>;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required.");
}
const client = postgres(databaseUrl, { max: 10 });

// Global: every module injects DATABASE_CONNECTION without re-importing this module.
@Global()
@Module({
  providers: [{ provide: DATABASE_CONNECTION, useValue: drizzle(client, { schema }) }],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() {
    await client.end();
  }
}
