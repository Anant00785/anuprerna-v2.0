import { Injectable, Inject } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { FabricStockRecord, FinishedStockRecord, ReportConfig } from '../types/report.types.js';

/**
 * Ports ProductZohoRelationJpaRepository.streamAllByFabricProduct /
 * streamAllByFinishedProduct:
 *
 *   SELECT r FROM product_zoho_relation r JOIN FETCH r.product p
 *   WHERE p.product_group = '<group>' AND (:includeDisabled = true OR p.disabled = false)
 */
@Injectable()
export class ReportRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private groupFilter(productGroup: string, includeDisabled: boolean) {
    const group = eq(schema.product.productGroup, productGroup);
    return includeDisabled ? group : and(group, eq(schema.product.disabled, false));
  }

  async getFabricStock(config: ReportConfig): Promise<FabricStockRecord[]> {
    const rows = await this.db
      .select({
        productId: schema.product.id,
        productName: schema.product.name,
        productSku: schema.product.sku,
        zohoItemId: schema.productZohoRelation.zohoItemId,
        quantity: schema.product.quantity,
        externalQuantity: schema.product.externalQuantity,
        price: schema.product.price,
        disabled: schema.product.disabled,
      })
      .from(schema.productZohoRelation)
      .innerJoin(schema.product, eq(schema.productZohoRelation.productId, schema.product.id))
      .where(this.groupFilter('fabric', config.includeDisabled));

    return rows.map((r) => ({
      productId: Number(r.productId),
      productName: r.productName,
      productSku: r.productSku,
      zohoItemId: r.zohoItemId,
      quantity: Number(r.quantity),
      externalQuantity: Number(r.externalQuantity),
      price: Number(r.price),
      disabled: r.disabled,
    }));
  }

  async getFinishedStock(config: ReportConfig): Promise<FinishedStockRecord[]> {
    // FinishedStockReport resolves the per-relation quantity as the FIRST
    // product_size_profile of the same product whose size_profile_option_sku
    // equals the relation's sku, defaulting to 0.0 when none matches — hence
    // the LEFT JOIN plus COALESCE rather than an inner join.
    const rows = await this.db
      .select({
        productId: schema.product.id,
        productName: schema.product.name,
        sku: schema.productZohoRelation.sku,
        zohoItemId: schema.productZohoRelation.zohoItemId,
        zohoQuantity: sql<number>`coalesce(${schema.productSizeProfile.quantity}, 0)`,
        disabled: schema.product.disabled,
      })
      .from(schema.productZohoRelation)
      .innerJoin(schema.product, eq(schema.productZohoRelation.productId, schema.product.id))
      .leftJoin(
        schema.productSizeProfile,
        and(
          eq(schema.productSizeProfile.productId, schema.product.id),
          eq(schema.productSizeProfile.sizeProfileOptionSku, schema.productZohoRelation.sku),
        ),
      )
      .where(this.groupFilter('finished', config.includeDisabled));

    return rows.map((r) => ({
      productId: Number(r.productId),
      productName: r.productName,
      sku: r.sku,
      zohoItemId: r.zohoItemId,
      zohoQuantity: Number(r.zohoQuantity),
      disabled: r.disabled,
    }));
  }
}
