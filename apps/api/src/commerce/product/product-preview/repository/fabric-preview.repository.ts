/**
 * apps/api/src/commerce/product/fabric-preview/repository/fabric-preview.repository.ts
 *
 * Direct port of com.bloomscorp.loom.product.product.dao.repository.FabricPreviewJpaRepository
 * onto Drizzle ORM against `product_fabric` joined to `product`.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../../database/database.module.js";
import { product, productFabric } from "../../../../database/schema/schema.js";

@Injectable()
export class FabricPreviewRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * findAllByProductDisabledFalse() — source filters on the joined
   * product's `disabled` flag (f.product.disabled = false), so this joins
   * product_fabric to product rather than filtering on product_fabric
   * itself (which has no disabled column).
   */
  findAllActive() {
    return this.db
      .select({ fabric: productFabric })
      .from(productFabric)
      .innerJoin(product, eq(productFabric.productId, product.id))
      .where(eq(product.disabled, false))
      .then((rows) => rows.map((r) => r.fabric));
  }

  /**
   * findByIdInAndProductDisabledFalse(List<Long> ids) — @Deprecated in
   * source ("use streamAll for bulk operations or explicit filtering in
   * service layer instead"). Ported as-is for parity; prefer
   * streamAll()/findAllActive() in new code, per source's own guidance.
   */
  findByIdsActive(ids: bigint[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db
      .select({ fabric: productFabric })
      .from(productFabric)
      .innerJoin(product, eq(productFabric.productId, product.id))
      .where(and(inArray(productFabric.id, ids), eq(product.disabled, false)))
      .then((rows) => rows.map((r) => r.fabric));
  }

  /** findFabricPreviewByProduct(ProductPreview product) — returns null (not Optional), matching source. */
  async findByProductId(productId: number) {
    const rows = await this.db.select().from(productFabric).where(eq(productFabric.productId, productId));
    return rows[0] ?? null;
  }

  /**
   * streamAll(Boolean includeDisabled) — source uses a Hibernate streaming
   * query with fetch size 500 for memory-efficient bulk processing; Drizzle
   * has no native cursor/stream API here, so this is ported as a regular
   * query returning the full result set. Callers doing bulk export/sync
   * work should paginate at the call site if the result set is large.
   */
  async findAllForBulkProcessing(includeDisabled: boolean) {
    const base = this.db
      .select({ fabric: productFabric })
      .from(productFabric)
      .innerJoin(product, eq(productFabric.productId, product.id));

    const rows = includeDisabled ? await base : await base.where(eq(product.disabled, false));
    return rows.map((r) => r.fabric);
  }

  /** retrieveEntity(id) equivalent */
  async findById(id: bigint) {
    const rows = await this.db.select().from(productFabric).where(eq(productFabric.id, id));
    return rows[0] ?? null;
  }
}
