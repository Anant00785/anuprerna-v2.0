import "dotenv/config";
import { Global, Module, OnModuleDestroy, ServiceUnavailableException } from "@nestjs/common";
import postgres, { type Sql } from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";

export const DATABASE_CONNECTION = Symbol("DATABASE_CONNECTION");
export type Database = PostgresJsDatabase<typeof schema>;

// The connection is created lazily, on first use, rather than at module load.
//
// This module exports the DATABASE_CONNECTION token, so every service that
// injects the database imports this file. When the env check and the postgres()
// call ran at module scope, merely importing a service — as a unit test does —
// threw "DATABASE_URL must be configured" and opened a connection pool. That
// made services untestable without a live database and broke CI, which has no
// .env. Deferring both means importing the token is free, while actually
// resolving the provider still fails fast and loudly.
let client: Sql | undefined;

function getClient(): Sql {
  if (!client) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL must be configured. The API does not run without its database.");
    }
    client = postgres(databaseUrl, { max: 10 });
  }
  return client;
}

async function verifyDatabaseConnection(): Promise<void> {
  try {
    await getClient()`select 1`;
    console.log("Database connected");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new ServiceUnavailableException(`Database connection failed: ${reason}`);
  }
}

@Global()
@Module({
  providers: [{
    provide: DATABASE_CONNECTION,
    useFactory: async () => {
      await verifyDatabaseConnection();
      return drizzle(getClient(), {
        schema,
        logger: {
          logQuery(query, params) {
            // Do not interpolate parameters: they can contain credentials or PII.
            console.log(`[db] ${query} | params=${params.length}`);
          },
        },
      });
    },
  }],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() {
    // May never have been created if the app shut down before first use.
    await client?.end({ timeout: 1 });
  }
}
