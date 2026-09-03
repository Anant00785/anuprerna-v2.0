import "dotenv/config";
import { Global, Module, OnModuleDestroy, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import postgres, { type Sql } from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";
import type { EnvironmentVariables } from "../common/config/env.schema.js";

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
//
// ConfigService reads the already-validated DATABASE_URL, but this stays a
// module-scope let + function rather than a class field: it's a singleton
// connection pool regardless of how many times the factory below runs, and
// the lazy check it guards must survive even if a caller obtains the client
// outside the factory (see database.int.spec.ts).
let client: Sql | undefined;

function getClient(config: Pick<ConfigService<EnvironmentVariables, true>, "get">): Sql {
  if (!client) {
    const databaseUrl = config.get("DATABASE_URL", { infer: true });
    if (!databaseUrl) {
      throw new Error("DATABASE_URL must be configured. The API does not run without its database.");
    }
    // connect_timeout bounds how long a request waits for a connection. Without
    // it a request that cannot reach Postgres hangs forever, which is what made
    // the App Runner deploy 500 with no diagnosable error: /health (no database)
    // answered in 200ms while every database-backed route hung indefinitely.
    client = postgres(databaseUrl, { max: 10, connect_timeout: 10 });
  }
  return client;
}

async function verifyDatabaseConnection(config: ConfigService<EnvironmentVariables, true>): Promise<void> {
  try {
    // Keeps this branch's lazy getClient(): creating the pool at module scope
    // made every unit test that merely imports a service require a live
    // database. Log wording taken from origin/docs/core-commerce-planning.
    await getClient(config)`select 1`;
    console.log("Database connected successfully");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    // There is no "standalone mode": every commerce route reads the database, so
    // a process that boots without one serves nothing but /health. Swallowing
    // this made the first App Runner deploy undiagnosable — /health answered in
    // 200ms while sign-in, checkout, cart and every catalogue route hung until
    // the caller gave up, with the real reason buried in one startup log line.
    // Fail at boot instead, so a broken DATABASE_URL or blocked egress surfaces
    // as a failed deploy naming its cause.
    throw new Error(
      `[Database] Cannot reach the database: ${reason}. The API does not run without it. ` +
        `Check DATABASE_URL and that this host can reach the database (egress/VPC/security groups).`,
    );
  }
}

@Global()
@Module({
  providers: [{
    provide: DATABASE_CONNECTION,
    inject: [ConfigService],
    useFactory: async (config: ConfigService<EnvironmentVariables, true>) => {
      await verifyDatabaseConnection(config);
      return drizzle(getClient(config), {
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
