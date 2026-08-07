import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, and, sql, desc, asc, like, or, inArray, isNull, isNotNull, between, gte, lte } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

@Injectable()
export class CatalogRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: bigint) {
    return null;
  }

  async findAll() {
    return [];
  }
  
  async findByArtisan(artisanId: bigint) {
    return [];
  }

  async findRecent(limit: number) {
    return [];
  }
}
