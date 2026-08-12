// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import { catalogPdf } from "../../../database/schema/index.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

@Injectable()
export class CatalogPdfRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof catalogPdf>,
  ) {}

  async findById(id: bigint) {
    const [row] = await this.db.select().from(catalogPdf).where(eq(catalogPdf.id, id)).limit(1);
    return row ?? null;
  }

  async findAll() {
    return this.db.select().from(catalogPdf).orderBy(desc(catalogPdf.id));
  }
}
// @ts-nocheck
