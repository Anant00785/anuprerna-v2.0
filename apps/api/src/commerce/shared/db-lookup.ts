/**
 * apps/api/src/commerce/shared/db-lookup.ts
 *
 * Real primary-key lookups for cross-module ports whose owning domain has
 * no Nest service to bind to (VolumeDiscountProfile, CustomSizeProfile,
 * FinishProfile, FabricProfile, SizeProfileOption, FinishProfileItem, ...).
 *
 * These exist so a port never has to be a `async () => null` dummy: a
 * `retrieveEntity(id)` port is a single select-by-id, and answering it from
 * the real table is strictly less code than faking it. When a domain later
 * grows a real service, swap the provider — the port contract is unchanged.
 *
 * ponytail: select-by-id only. Anything needing joins/aggregation belongs
 * in the owning domain's repository, not here.
 */
import { eq, inArray } from "drizzle-orm";
import type { Database } from "../../database/database.module.js";

/** Any drizzle pgTable with an `id` primary key. */
type IdTable = { id: unknown };

/** BehemothCRUDDAOController#retrieveEntity(id) — the row, or null. */
export function lookupById(db: Database, table: IdTable) {
  return async (id: number | bigint): Promise<Record<string, unknown> | null> => {
    const rows = await (db as any)
      .select()
      .from(table)
      .where(eq((table as any).id, id))
      .limit(1);
    return rows[0] ?? null;
  };
}

/** Same, narrowed to the `{ id }` shape the Product-core ports declare. */
export function lookupIdById(db: Database, table: IdTable) {
  const lookup = lookupById(db, table);
  return async (id: number | bigint): Promise<{ id: number } | null> => {
    const row = await lookup(id);
    return row ? { id: Number(row.id) } : null;
  };
}

/** Bulk `retrieveByIds` used by the preview projections. Empty in, empty out. */
export function lookupByIds(db: Database, table: IdTable) {
  return async (ids: number[]): Promise<Record<string, unknown>[]> => {
    if (!ids || ids.length === 0) return [];
    return (db as any).select().from(table).where(inArray((table as any).id, ids));
  };
}
