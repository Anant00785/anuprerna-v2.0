import { Inject, Injectable } from "@nestjs/common";
import { eq, desc } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import { catalogItemMedia } from "../../../database/schema/index.js";

@Injectable()
export class CatalogItemMediaRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async findById(id: bigint) {
    const [row] = await this.db.select().from(catalogItemMedia).where(eq(catalogItemMedia.id, id)).limit(1);
    return row ?? null;
  }

  async findAll() {
    return await this.db.select().from(catalogItemMedia).orderBy(desc(catalogItemMedia.id));
  }
}
