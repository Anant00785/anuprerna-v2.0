// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import { catalog } from "../../../database/schema/index.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export interface CatalogListResult {
  rows: typeof catalog.$inferSelect[];
  total: number;
}

@Injectable()
export class CatalogRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof catalog>,
  ) {}

  async findById(id: bigint) {
    const [row] = await this.db.select().from(catalog).where(eq(catalog.id, id)).limit(1);
    return row ?? null;
  }

  async findAll(limit: number, offset: number): Promise<CatalogListResult> {
    const [rows, counts] = await Promise.all([
      this.db.select().from(catalog).orderBy(desc(catalog.id)).limit(limit).offset(offset),
      this.db.select({ count: sql<string>`count(*)` }).from(catalog),
    ]);

    return { rows, total: Number(counts[0]?.count ?? 0) };
  }
  
  async findByArtisan(artisanId: bigint) {
    return this.db.select().from(catalog).where(eq(catalog.artisanId, artisanId)).orderBy(desc(catalog.id));
  }

  async findRecent(limit: number) {
    return this.db.select().from(catalog).orderBy(desc(catalog.createdAt)).limit(limit);
  }
}
// @ts-nocheck
