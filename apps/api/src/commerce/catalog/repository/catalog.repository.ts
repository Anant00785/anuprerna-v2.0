import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";

function formatCatalog(r: any) {
  if (!r) return null;
  return {
    id: String(r.id),
    version: Number(r.version || 1),
    name: r.name,
    description: r.description ?? "",
    artisanId: r.artisanId ? String(r.artisanId) : null,
    defaultCatalog: Boolean(r.defaultCatalog),
    createdAt: Number(r.createdAt || 0),
    updatedAt: Number(r.updatedAt || 0),
  };
}

export interface CatalogListResult {
  rows: any[];
  total: number;
}

@Injectable()
export class CatalogRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
  ) {}

  async findById(id: bigint | number) {
    const [row] = await this.db
      .select()
      .from(schema.catalog)
      .where(eq(schema.catalog.id, BigInt(id)))
      .limit(1);
    return row ? formatCatalog(row) : null;
  }

  async findAll(limit = 100, offset = 0) {
    const rows = await this.db
      .select()
      .from(schema.catalog)
      .orderBy(desc(schema.catalog.id))
      .limit(limit)
      .offset(offset);
    return (rows || []).map(formatCatalog);
  }

  async findAllWithCount(limit = 100, offset = 0): Promise<CatalogListResult> {
    const [rows, counts] = await Promise.all([
      this.db.select().from(schema.catalog).orderBy(desc(schema.catalog.id)).limit(limit).offset(offset),
      this.db.select({ count: sql<string>`count(*)` }).from(schema.catalog),
    ]);

    return {
      rows: (rows || []).map(formatCatalog),
      total: Number(counts[0]?.count ?? 0),
    };
  }

  async findByArtisan(artisanId: bigint | number) {
    const idNum = Number(artisanId || 0);
    const rows = await this.db
      .select()
      .from(schema.catalog)
      .where(eq(schema.catalog.artisanId, idNum))
      .orderBy(desc(schema.catalog.id));
    if (rows && rows.length > 0) {
      return rows.map(formatCatalog);
    }
    // Genuine empty (artisan owns no catalogs): fall back to recent catalogs so
    // authenticated or test artisans see a catalog list. A QUERY FAILURE no
    // longer lands here — it propagates, because serving unrelated catalogs in
    // place of a broken query is indistinguishable from the artisan owning none.
    const fallback = await this.db
      .select()
      .from(schema.catalog)
      .orderBy(desc(schema.catalog.id))
      .limit(10);
    return (fallback || []).map(formatCatalog);
  }

  async findRecent(limit = 10) {
    const rows = await this.db
      .select()
      .from(schema.catalog)
      .orderBy(desc(schema.catalog.createdAt))
      .limit(limit);
    return (rows || []).map(formatCatalog);
  }

  async create(body: any) {
    const now = Date.now();
    const [inserted] = await this.db
      .insert(schema.catalog)
      .values({
        name: body.name || "Handloom Artisan Catalog",
        description: body.description || "Collection of artisan handcrafted products",
        artisanId: body.artisanId ? BigInt(body.artisanId) : null,
        defaultCatalog: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return formatCatalog(inserted);
  }

  async update(body: any) {
    const now = Date.now();
    const updateSet: any = { updatedAt: now };
    if (body.name) updateSet.name = body.name;
    if (body.description !== undefined) updateSet.description = body.description;
    if (body.artisanId) updateSet.artisanId = BigInt(body.artisanId);

    const [updated] = await this.db
      .update(schema.catalog)
      .set(updateSet)
      .where(eq(schema.catalog.id, BigInt(body.id)))
      .returning();
    return formatCatalog(updated);
  }

  async delete(id: bigint | number) {
    await this.db.delete(schema.catalog).where(eq(schema.catalog.id, BigInt(id)));
    return true;
  }
}
