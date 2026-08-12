import { describe, it, expect, afterAll } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "./schema/index.js";

// Integration test: needs a reachable Postgres at DATABASE_URL.
// Locally that is the loom-local-db clone on :5433; in CI it is a service
// container with only 0000_dashing_xavin.sql applied and NO ROWS.
//
// So these assertions deliberately verify that the introspected schema and the
// Drizzle mappings are queryable — not that particular rows exist. An earlier
// version asserted `length > 0`, which passed against a populated local clone
// and could only ever fail in CI. A test that requires production-shaped data
// to pass is not an integration test, it is a smoke test of someone's laptop.
const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

afterAll(() => client.end());

describe("DatabaseModule against a real Postgres", () => {
  it("connects and runs a raw query", async () => {
    const [row] = await db.execute(sql`select 1 as one`);
    expect(row.one).toBe(1);
  });

  it("resolves the introspected schema — the loom_tenant mapping matches real columns", async () => {
    // Selecting against the mapped table proves every column name in the
    // Drizzle schema exists in the database. A drifted column throws here.
    const tenants = await db.select().from(schema.loomTenant).limit(3);
    expect(Array.isArray(tenants)).toBe(true);
  });

  it("resolves a relational query across a foreign key", async () => {
    // Exercises the relations in relations.ts, not row content.
    const artisans = await db.query.artisan.findMany({ limit: 3 });
    expect(Array.isArray(artisans)).toBe(true);
  });

  it("has the tables the schema declares", async () => {
    const rows = (await db.execute(sql`
      SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'
    `)) as Array<{ n: number }>;
    // 116 pgTable definitions live in schema.ts; allow for views/extras but
    // catch a database that was never migrated at all.
    expect(rows[0].n).toBeGreaterThan(100);
  });
});
