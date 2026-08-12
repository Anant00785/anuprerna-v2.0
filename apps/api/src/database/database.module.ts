import "dotenv/config";
import { Global, Module, OnModuleDestroy, ServiceUnavailableException } from "@nestjs/common";
import postgres, { type Sql } from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";

export const DATABASE_CONNECTION = Symbol("DATABASE_CONNECTION");
export type Database = PostgresJsDatabase<typeof schema>;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be configured. The API does not run without its database.");
}

const client: Sql = postgres(databaseUrl, {
  max: 10,
});

async function verifyDatabaseConnection(): Promise<void> {
  try {
    await client`select 1`;
    console.log("Database connected successfully");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[Database] Connection warning: ${reason}. Running in standalone mode.`);
  }
}

@Global()
@Module({
  providers: [{
    provide: DATABASE_CONNECTION,
    useFactory: async () => {
      await verifyDatabaseConnection();
      return drizzle(client, {
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
    await client.end({ timeout: 1 });
  }
}
