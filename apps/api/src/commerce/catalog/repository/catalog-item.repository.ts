import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import { catalogItem } from "../../../database/schema/index.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

@Injectable()
export class CatalogItemRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase,
  ) {}

  async findById(id: bigint) {
    const [row] = await this.db.select().from(catalogItem).where(eq(catalogItem.id, id)).limit(1);
    return row ?? null;
  }

  async findAll() {
    return this.db.select().from(catalogItem).orderBy(desc(catalogItem.id));
  }
}
