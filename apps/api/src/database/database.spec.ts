import { describe, it, expect, afterAll } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "./schema/index.js";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

afterAll(() => client.end());

describe("DatabaseModule against loom-local-db", () => {
  it("connects and runs a raw query", async () => {
    const [row] = await db.execute(sql`select 1 as one`);
    expect(row.one).toBe(1);
  });

  it("reads real rows through the introspected schema", async () => {
    const tenants = await db.select().from(schema.loomTenant).limit(3);
    expect(tenants.length).toBeGreaterThan(0);
    expect(tenants[0]).toHaveProperty("id");
  });

  it("resolves a relational query across a foreign key", async () => {
    const artisans = await db.query.artisan.findMany({ limit: 3 });
    expect(artisans.length).toBeGreaterThan(0);
  });
});
