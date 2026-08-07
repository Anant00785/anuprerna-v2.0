import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, or, ilike } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ProductSearchResult } from "../types/search.types.js";

@Injectable()
export class SearchRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async searchProducts(keyword: string): Promise<ProductSearchResult[]> {
    const term = `%${keyword}%`;
    const rows = await this.db.select({
      id: schema.product.id,
      sku: schema.product.sku,
      name: schema.product.name,
      heroImage: schema.product.heroImage,
      hoverImage: schema.product.hoverImage,
      heroImageAltText: schema.product.heroImageAlt,
      hoverImageAltText: schema.product.hoverImageAlt,
      slug: schema.product.slug,
      productGroup: schema.product.productGroup,
      price: schema.product.price,
      unit: schema.product.unit,
      specialStatus: schema.specialStatus.name,
    })
    .from(schema.product)
    .leftJoin(schema.specialStatus, eq(schema.product.specialStatusId, schema.specialStatus.id))
    .where(
      or(
        ilike(schema.product.name, term),
        ilike(schema.product.sku, term),
        ilike(schema.product.productOverview, term)
      )
    )
    .limit(150);

    return rows.map(row => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      heroImage: row.heroImage ?? "",
      hoverImage: row.hoverImage ?? "",
      heroImageAltText: row.heroImageAltText ?? "",
      hoverImageAltText: row.hoverImageAltText ?? "",
      slug: row.slug,
      productGroup: row.productGroup,
      price: Number(row.price),
      specialStatus: row.specialStatus ?? null,
      unit: row.unit,
    }));
  }
}
