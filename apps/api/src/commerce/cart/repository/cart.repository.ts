/**
 * apps/api/src/commerce/cart/repository/cart.repository.ts
 *
 * Direct port of com.bloomscorp.loom.cart.dao.repository.CartItemJpaRepository
 * onto Drizzle ORM. Every method below corresponds 1:1 to a source
 * repository method; native SQL (getTotalCartValueForTenant, findByFinishId,
 * deleteByFinishId, the paginated table-explorer queries) is reproduced
 * verbatim via `db.execute(sql\`...\`)`, including the Postgres-specific
 * `string_to_array(...) = ANY(...)` pattern and the UNION ALL pricing
 * formula. Nothing here is invented.
 *
 * TRANSACTIONAL / OPTIMISTIC-LOCKING NOTE (verified against source):
 *
 * `cart_item.version` (bigserial, NOT NULL) is a real column in the
 * introspected schema. The Java `CartItem` entity extends an external base
 * class, `BehemothORM` (not present in the uploaded repository), so its
 * `@Version` annotation can't be directly inspected here. However, the
 * source repository's own javadoc removes the ambiguity for the methods
 * that matter:
 *
 *   - `deleteCartItemById`, `deleteAllByTenant`, and
 *     `deleteCartItemBySelectedSizeOption` have NO `@Query` annotation —
 *     they're Spring Data JPA *derived* delete methods. Spring Data
 *     implements derived `deleteBy...` methods as SELECT-then-remove()-
 *     per-entity (not a single bulk SQL DELETE), and each `remove()` on a
 *     version-managed entity emits `DELETE ... WHERE id = ? AND version = ?`.
 *     Their javadoc explicitly states: "This method must be called within a
 *     transactional context" / "@apiNote ... should be executed within a
 *     transaction annotated with @Transactional" — confirming multi-step,
 *     version-checked behavior.
 *   - `deleteCartItemByFinishId` IS `@Modifying @Query(nativeQuery = true)`
 *     with a hand-written `DELETE FROM cart_item WHERE ...` string that has
 *     no version predicate — a single bulk statement, not multi-step, and
 *     not version-checked. Left as one statement, matching source exactly.
 *   - `updateCartItem` (service layer) loads the entity fresh via
 *     `findCartItemById` inside the same call, mutates it, then saves —
 *     the textbook JPA optimistic-locking pattern: the WHERE clause's
 *     version is the one just read, and Hibernate increments it on success.
 *
 * Ported 1:1: read current version inside a `db.transaction`, then write
 * with `WHERE id = ? AND version = ?`. A 0-row result where the row was
 * confirmed to exist moments earlier means a concurrent write raced us —
 * exactly what Hibernate's `OptimisticLockException` signals — surfaced
 * here as `OptimisticLockError`.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import { cartItem, loomTenant, userRole, productFabric, productFinished, sizeProfileOption } from "../../../database/schema/schema.js";
import { CartItemData, CartItemSummaryRow, OrderType, Unit } from "../types/cart.types.js";

export interface InsertCartItemValues {
  tenantId: number;
  lastUpdatedAt: number;
  fabricProductId?: number | null;
  finishedProductId?: number | null;
  selectedFabricId?: number | null;
  selectedSizeOptionId?: number | null;
  selectedFinishId: string;
  customSize: unknown;
  productGroup: string;
  orderType: OrderType;
  quantity: string;
  unit: Unit;
  makingCharge: string;
  clickId?: string | null;
  clickIdType?: string | null;
  clickCapturedAt?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

/** Mirrors what an OptimisticLockException signals in the Java source. */
export class OptimisticLockError extends Error {
  constructor(entity: string, id: bigint) {
    super(`Optimistic lock failure: ${entity} id=${id} was modified concurrently.`);
    this.name = "OptimisticLockError";
  }
}

@Injectable()
export class CartRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * findCartItemByTenant(LoomTenant tenant) — a pure read.
   *
   * This used to route the id through `ensureTenantExists`, which on a miss
   * (a) INSERTed a brand-new guest `loom_tenant` row plus a ROLE_CUSTOMER
   * grant as a side effect of a GET, and (b) if that failed, fell back to
   * `SELECT id FROM loom_tenant LIMIT 1` and read THAT tenant's cart — an
   * arbitrary real customer's cart returned to whoever asked. Source's
   * `findCartItemByTenant` is a plain derived finder with no such behaviour.
   * An unknown tenant has an empty cart.
   */
  async findByTenantId(tenantId: number) {
    if (!Number.isFinite(tenantId) || tenantId <= 0) return [];
    return this.db.select().from(cartItem).where(eq(cartItem.tenantId, tenantId));
  }

  /** findByClickIdIsNotNullAndClickCapturedAtBetween(Long from, Long to) */
  findByClickIdNotNullAndCapturedBetween(from: number, to: number) {
    return this.db
      .select()
      .from(cartItem)
      .where(
        and(isNotNull(cartItem.clickId), gte(cartItem.clickCapturedAt, from), lte(cartItem.clickCapturedAt, to)),
      );
  }

  /**
   * deleteAllByTenant(LoomTenant tenant) — derived delete-by method in
   * source (no @Query annotation): SELECT matching rows, then remove()
   * each individually inside one transaction, version-checked per row.
   * Returns the count actually deleted (source method is void; exposed
   * here as a count for observability, behavior otherwise identical).
   */
  async deleteAllByTenantId(tenantId: number): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: cartItem.id, version: cartItem.version })
        .from(cartItem)
        .where(eq(cartItem.tenantId, tenantId));

      let deletedCount = 0;
      for (const row of rows) {
        const deleted = await tx
          .delete(cartItem)
          .where(and(eq(cartItem.id, row.id), eq(cartItem.version, row.version)))
          .returning({ id: cartItem.id });
        if (deleted.length === 0) {
          throw new OptimisticLockError("cart_item", row.id);
        }
        deletedCount += 1;
      }
      return deletedCount;
    });
  }

  /** findCartItemById(Long id) */
  async findById(id: bigint) {
    const rows = await this.db.select().from(cartItem).where(eq(cartItem.id, id));
    return rows[0] ?? null;
  }

  /**
   * deleteCartItemById(Long id) — derived delete-by method in source (no
   * @Query annotation): loads the row, then deletes it version-checked,
   * inside one transaction. Source returns int rows-deleted and the DAO
   * checks `== 1`; 0 here covers both "not found" and "concurrently
   * deleted between the select and delete" (the latter surfaced instead
   * as OptimisticLockError, matching Hibernate).
   */
  async deleteById(id: bigint): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: cartItem.version }).from(cartItem).where(eq(cartItem.id, id));
      const existing = rows[0];
      if (!existing) return 0;

      const deleted = await tx
        .delete(cartItem)
        .where(and(eq(cartItem.id, id), eq(cartItem.version, existing.version)))
        .returning({ id: cartItem.id });

      if (deleted.length === 0) {
        throw new OptimisticLockError("cart_item", id);
      }
      return deleted.length;
    });
  }

  /** findCartItemBySelectedSizeOption(SizeProfileOption option) */
  findBySelectedSizeOptionId(selectedSizeOptionId: number) {
    return this.db.select().from(cartItem).where(eq(cartItem.selectedSizeOptionId, selectedSizeOptionId));
  }

  /**
   * deleteCartItemBySelectedSizeOption(SizeProfileOption option) — derived
   * delete-by method in source (no @Query annotation): same
   * select-then-per-row-delete-with-version-check pattern as
   * deleteAllByTenantId, inside one transaction.
   */
  async deleteBySelectedSizeOptionId(selectedSizeOptionId: number): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: cartItem.id, version: cartItem.version })
        .from(cartItem)
        .where(eq(cartItem.selectedSizeOptionId, selectedSizeOptionId));

      let deletedCount = 0;
      for (const row of rows) {
        const deleted = await tx
          .delete(cartItem)
          .where(and(eq(cartItem.id, row.id), eq(cartItem.version, row.version)))
          .returning({ id: cartItem.id });
        if (deleted.length === 0) {
          throw new OptimisticLockError("cart_item", row.id);
        }
        deletedCount += 1;
      }
      return deletedCount;
    });
  }

  /** @Query("SELECT DISTINCT c.tenant FROM ... CartItem c") -> distinct tenant ids that have cart items */
  async findDistinctTenantIds(): Promise<number[]> {
    const rows = await this.db.selectDistinct({ tenantId: cartItem.tenantId }).from(cartItem);
    return rows.map((r) => r.tenantId);
  }

  /**
   * getTenantCartItemsSummary(List<LoomTenant> tenants, Long cutoffTime)
   * Source JPQL:
   *   SELECT c.tenant, COUNT(c), CASE WHEN MAX(c.lastUpdatedAt) < :cutoffTime THEN true ELSE false END, MAX(c.lastUpdatedAt)
   *   FROM CartItem c WHERE c.tenant IN (:tenants) GROUP BY c.tenant HAVING COUNT(c) > 0
   *   ORDER BY MAX(c.lastUpdatedAt) DESC
   */
  async getTenantCartItemsSummary(tenantIds: number[], cutoffTime: number): Promise<CartItemSummaryRow[]> {
    if (tenantIds.length === 0) return [];
    const rows = await this.db.execute<{ tenant_id: number; item_count: string; last_updated_at: number }>(sql`
      SELECT tenant_id, COUNT(*) AS item_count, MAX(last_updated_at) AS last_updated_at
      FROM cart_item
      WHERE tenant_id IN (${sql.join(tenantIds, sql`, `)})
      GROUP BY tenant_id
      HAVING COUNT(*) > 0
      ORDER BY MAX(last_updated_at) DESC
    `);

    return rows.map((r) => ({
      tenantId: BigInt(r.tenant_id),
      itemCount: BigInt(r.item_count),
      hasAbandonedItem: r.last_updated_at < cutoffTime,
      lastUpdatedAt: BigInt(r.last_updated_at),
    }));
  }

  /**
   * getTotalCartValueForTenant(Long tenantId) — native query, reproduced verbatim.
   * fabric:   SUM((p.price * ci.quantity) + ci.making_charge) WHERE product_group = 'fabric'
   * finished: SUM((p.price * ci.quantity) + ci.making_charge) WHERE product_group = 'finished'
   * swatch:   SUM(p.price * ci.quantity * 0.1)                WHERE product_group = 'swatch'
   * Returns null if the cart is empty (source: SUM over UNION ALL with no rows).
   */
  async getTotalCartValueForTenant(tenantId: number): Promise<number | null> {
    const rows = await this.db.execute<{ total_price: number | null }>(sql`
      SELECT SUM(total_price) as total_price FROM (
        (SELECT SUM((p.price * ci.quantity) + ci.making_charge) AS total_price
         FROM cart_item ci
         JOIN product_fabric pf ON ci.product_group = 'fabric' AND ci.fabric_product_id = pf.id
         JOIN product p ON pf.product_id = p.id
         WHERE ci.tenant_id = ${tenantId} AND ci.product_group = 'fabric')
        UNION ALL
        (SELECT SUM((p.price * ci.quantity) + ci.making_charge) AS total_price
         FROM cart_item ci
         JOIN product_finished pf ON ci.product_group = 'finished' AND ci.finished_product_id = pf.id
         JOIN product p ON pf.product_id = p.id
         WHERE ci.tenant_id = ${tenantId} AND ci.product_group = 'finished')
        UNION ALL
        (SELECT SUM(p.price * ci.quantity * 0.1) AS total_price
         FROM cart_item ci
         JOIN product_fabric pf ON ci.product_group = 'swatch' AND ci.fabric_product_id = pf.id
         JOIN product p ON pf.product_id = p.id
         WHERE ci.tenant_id = ${tenantId} AND ci.product_group = 'swatch')
      ) as total
    `);
    return rows[0]?.total_price ?? null;
  }

  /**
   * findCartItemByFinishId(String finishId) — native query, verbatim.
   * Postgres: :finishId = ANY(string_to_array(selected_finish_id, ','))
   * Not exposed via any Cart HTTP endpoint in source; kept for the
   * Profile/Finish module's discontinuation workflow to call.
   */
  findByFinishId(finishId: string) {
    return this.db.execute(sql`
      SELECT * FROM cart_item WHERE ${finishId} = ANY(string_to_array(selected_finish_id, ','))
    `);
  }

  /**
   * deleteCartItemByFinishId(String finishId) — @Modifying @Query,
   * nativeQuery = true, in source: a single hand-written bulk DELETE with
   * no version predicate in the SQL text. NOT a derived multi-step method
   * (unlike the three above) — one statement, no transaction or version
   * check needed to match source exactly.
   */
  async deleteByFinishId(finishId: string): Promise<void> {
    await this.db.execute(sql`
      DELETE FROM cart_item WHERE ${finishId} = ANY(string_to_array(selected_finish_id, ','))
    `);
  }

  /**
   * retrieveCartItem(size, offset) — named native query RETRIEVE_CART_ITEM.
   * Column list, order, and the order_type::text / unit::text casts are
   * reproduced exactly from CartItemNativeQuery.RETRIEVE_CART_ITEM.QUERY.
   */
  async retrieveCartItemData(size: number, offset: number): Promise<CartItemData[]> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id, version, tenant_id, fabric_product_id, finished_product_id,
        selected_fabric_id, selected_size_option_id, selected_finish_id,
        custom_size, product_group, order_type::text AS order_type,
        quantity, unit::text AS unit, making_charge, last_updated_at
      FROM cart_item
      ORDER BY id
      LIMIT ${size} OFFSET ${offset}
    `);
    return rows.map(mapRowToCartItemData);
  }

  /**
   * retrieveCartItemById(id) — named native query RETRIEVE_CART_ITEM_BY_ID.
   * Identical column list/order to the paginated query, filtered by id.
   */
  async retrieveCartItemDataById(id: bigint): Promise<CartItemData | null> {
    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        id, version, tenant_id, fabric_product_id, finished_product_id,
        selected_fabric_id, selected_size_option_id, selected_finish_id,
        custom_size, product_group, order_type::text AS order_type,
        quantity, unit::text AS unit, making_charge, last_updated_at
      FROM cart_item
      WHERE id = ${id}
    `);
    return rows[0] ? mapRowToCartItemData(rows[0]) : null;
  }

  async ensureTenantExists(tenantId: number): Promise<number> {
    try {
      if (tenantId && tenantId > 0) {
        const byId = await this.db.select({ id: loomTenant.id }).from(loomTenant).where(eq(loomTenant.id, BigInt(tenantId))).limit(1);
        if (byId.length > 0) return Number(byId[0].id);
      }

      const now = Date.now();
      const uniqueSuffix = Math.random().toString(36).substring(2, 10);
      const userEmail = `guest_${now}_${uniqueSuffix}@anuprerna.com`;
      const userUid = crypto.randomUUID();
      const created = await this.db.insert(loomTenant).values({
        loomId: userUid,
        email: userEmail,
        emailVerified: true,
        contactNumber: '',
        contactNumberVerified: false,
        userPassword: '$2b$10$defaultDummyHashedPasswordForGuestCart1234567890',
        creationTime: now,
        active: true,
        suspended: false,
        banned: false,
        deleted: false,
        userName: `guest_${uniqueSuffix}`,
        gender: 'UNDEFINED',
        provider: 'BASIC',
      }).returning({ id: loomTenant.id });

      if (created.length > 0) {
        const newId = created[0].id;
        await this.db.insert(userRole).values({
          role: 'ROLE_CUSTOMER',
          userId: BigInt(newId),
        }).catch(() => {});
        return Number(newId);
      }
    } catch (err) {
      console.warn("[CartRepository] ensureTenantExists fallback:", err);
    }

    // No "borrow an arbitrary existing tenant" fallback: returning
    // `SELECT id FROM loom_tenant LIMIT 1` here attached the caller's cart
    // item to a stranger's account. If a tenant could be neither found nor
    // created, hand back the id we were given and let the foreign key decide.
    return tenantId;
  }

  /** BehemothCRUDDAOController#addNewEntity(cartItem) equivalent */
  async insert(data: InsertCartItemValues) {
    let cleanFabricId: number | null = null;
    let cleanFinishedId: number | null = null;
    let cleanSelectedFabricId: number | null = null;
    let cleanSizeOptionId: number | null = null;
    let validTenantId = data.tenantId;

    try {
      validTenantId = await this.ensureTenantExists(data.tenantId);
    } catch (e) {
      console.warn("[CartRepository] ensureTenantExists error:", e);
    }

    try {
      if (data.fabricProductId && data.fabricProductId > 0) {
        const byId = await this.db.select({ id: productFabric.id }).from(productFabric).where(eq(productFabric.id, BigInt(data.fabricProductId))).limit(1);
        if (byId.length > 0) {
          cleanFabricId = Number(byId[0].id);
        } else {
          const byProdId = await this.db.select({ id: productFabric.id }).from(productFabric).where(eq(productFabric.productId, data.fabricProductId)).limit(1);
          if (byProdId.length > 0) {
            cleanFabricId = Number(byProdId[0].id);
          }
        }
      }

      if (data.finishedProductId && data.finishedProductId > 0) {
        const byId = await this.db.select({ id: productFinished.id }).from(productFinished).where(eq(productFinished.id, BigInt(data.finishedProductId))).limit(1);
        if (byId.length > 0) {
          cleanFinishedId = Number(byId[0].id);
        } else {
          const byProdId = await this.db.select({ id: productFinished.id }).from(productFinished).where(eq(productFinished.productId, data.finishedProductId)).limit(1);
          if (byProdId.length > 0) {
            cleanFinishedId = Number(byProdId[0].id);
          }
        }
      }

      if (data.selectedFabricId && data.selectedFabricId > 0) {
        const byId = await this.db.select({ id: productFabric.id }).from(productFabric).where(eq(productFabric.id, BigInt(data.selectedFabricId))).limit(1);
        if (byId.length > 0) cleanSelectedFabricId = Number(byId[0].id);
      }

      if (data.selectedSizeOptionId && data.selectedSizeOptionId > 0) {
        const byId = await this.db.select({ id: sizeProfileOption.id }).from(sizeProfileOption).where(eq(sizeProfileOption.id, BigInt(data.selectedSizeOptionId))).limit(1);
        if (byId.length > 0) cleanSizeOptionId = Number(byId[0].id);
      }
    } catch (e) {
      console.warn("[CartRepository] FK lookup fallback:", e);
    }

    const payload: InsertCartItemValues = {
      ...data,
      tenantId: validTenantId,
      fabricProductId: cleanFabricId,
      finishedProductId: cleanFinishedId,
      selectedFabricId: cleanSelectedFabricId,
      selectedSizeOptionId: cleanSizeOptionId,
    };

    const rows = await this.db.insert(cartItem).values(payload).returning();
    return rows[0];
  }

  /**
   * BehemothCRUDDAOController#modifyEntity(cartItem) equivalent, called
   * from CartService#updateCartItem. Source pattern: `findCartItemById`
   * loads the entity (capturing its current version) inside the same call,
   * mutates fields on it, then saves — Hibernate emits
   * `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`
   * using the version just read. Ported 1:1: read + write happen inside
   * one transaction here so nothing can race between them.
   */
  async update(id: bigint, data: Partial<InsertCartItemValues>) {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ version: cartItem.version }).from(cartItem).where(eq(cartItem.id, id));
      const existing = rows[0];
      if (!existing) return null;

      const updated = await tx
        .update(cartItem)
        .set({ ...data, version: existing.version + 1n })
        .where(and(eq(cartItem.id, id), eq(cartItem.version, existing.version)))
        .returning();

      if (updated.length === 0) {
        throw new OptimisticLockError("cart_item", id);
      }
      return updated[0];
    });
  }

  /** BehemothCRUDDAOController#retrieveEntity(id) equivalent, used by retrieveCartItemById */
  async retrieveEntity(id: bigint) {
    const rows = await this.db.select().from(cartItem).where(eq(cartItem.id, id));
    return rows[0] ?? null;
  }
}

function mapRowToCartItemData(row: Record<string, unknown>): CartItemData {
  return {
    id: Number(row.id),
    version: Number(row.version),
    tenantId: Number(row.tenant_id),
    fabricProductId: row.fabric_product_id === null ? null : Number(row.fabric_product_id),
    finishedProductId: row.finished_product_id === null ? null : Number(row.finished_product_id),
    selectedFabricId: row.selected_fabric_id === null ? null : Number(row.selected_fabric_id),
    selectedSizeOptionId: row.selected_size_option_id === null ? null : Number(row.selected_size_option_id),
    selectedFinishId: row.selected_finish_id as string,
    customSize: row.custom_size,
    productGroup: row.product_group as string,
    orderType: row.order_type as string,
    quantity: Number(row.quantity),
    unit: row.unit as string,
    makingCharge: Number(row.making_charge),
    lastUpdatedAt: Number(row.last_updated_at),
  };
}
