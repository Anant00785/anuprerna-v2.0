// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, and, sql, desc, isNull, ne } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ReviewInput } from "../dto/review.dto.js";

/**
 * Port interface for external module dependencies.
 * Must be implemented and provided by the Order module.
 */
export const ORDER_ITEM_PORT = Symbol("ORDER_ITEM_PORT");
export interface OrderItemPort {
    updateReviewId(orderItemId: number, reviewId: bigint): Promise<void>;
    getOrderId(orderItemId: number): Promise<number | null>;
}

@Injectable()
export class ReviewRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    @Inject(ORDER_ITEM_PORT) private readonly orderItemPort: OrderItemPort
  ) {}

  async findById(id: bigint) {
    const rows = await this.db.select().from(schema.review).where(eq(schema.review.id, id));
    return rows[0] ?? null;
  }

  async findStatistics() {
    const query = sql`SELECT COUNT(r.id) AS count, CEIL(COALESCE(AVG(r.rating), 0)) AS rating FROM review r WHERE r.status = 'APPROVED'`;
    const res = await this.db.execute(query);
    const rows = Array.isArray(res) ? res : (res.rows || []);
    if (rows.length === 0) return { count: 0, rating: 0 };
    return { 
        count: Number(rows[0].count), 
        rating: Number(rows[0].rating) 
    };
  }

  async findApprovedReviews(page: number, size: number) {
    return this.db.select().from(schema.review)
        .where(eq(schema.review.status, 'APPROVED'))
        .orderBy(desc(schema.review.createdAt))
        .limit(size).offset(page * size);
  }

  async findReviewsByStatus(status: "PENDING" | "APPROVED" | "REMOVED", page: number, size: number) {
    return this.db.select().from(schema.review)
        .where(eq(schema.review.status, status))
        .orderBy(desc(schema.review.createdAt))
        .limit(size).offset(page * size);
  }

  async findGenericReviews(page: number, size: number) {
    return this.db.select().from(schema.review)
        .where(and(isNull(schema.review.productId), eq(schema.review.status, 'APPROVED')))
        .orderBy(desc(schema.review.createdAt))
        .limit(size).offset(page * size);
  }

  async findProductReviews(productId: number, page: number, size: number) {
    return this.db.select().from(schema.review)
        .where(and(eq(schema.review.productId, productId), eq(schema.review.status, 'APPROVED')))
        .orderBy(desc(schema.review.createdAt))
        .limit(size).offset(page * size);
  }

  async findReviewsBySubCategory(productId: number, page: number, size: number) {
    const query = sql`
        SELECT r.* FROM review r
        JOIN product p ON r.product_id = p.id
        WHERE p.sub_category_id = (SELECT sub_category_id FROM product WHERE id = ${productId})
        AND p.id != ${productId}
        AND r.status = 'APPROVED'
        ORDER BY r.created_at DESC
        LIMIT ${size} OFFSET ${page * size}
    `;
    const res = await this.db.execute(query);
    return res.rows;
  }

  async findReviewsByCategory(productId: number, page: number, size: number) {
    const query = sql`
        SELECT r.* FROM review r
        JOIN product p ON r.product_id = p.id
        JOIN sub_category sc ON p.sub_category_id = sc.id
        JOIN segment s ON sc.segment_id = s.id
        JOIN category c ON s.category_id = c.id
        WHERE c.id = (SELECT c2.id FROM category c2
        JOIN segment s2 ON c2.id = s2.category_id
        JOIN sub_category sc2 ON s2.id = sc2.segment_id
        JOIN product p2 ON sc2.id = p2.sub_category_id
        WHERE p2.id = ${productId})
        AND p.id != ${productId}
        AND sc.id != (SELECT p2.sub_category_id FROM product p2 WHERE p2.id = ${productId})
        AND r.status = 'APPROVED'
        ORDER BY r.created_at DESC
        LIMIT ${size} OFFSET ${page * size}
    `;
    const res = await this.db.execute(query);
    return res.rows;
  }

  async findFabricReviews(page: number, size: number) {
    const query = sql`
        SELECT r.* FROM review r
        JOIN product p ON r.product_id = p.id
        WHERE p.product_group = 'fabric'
        AND r.status = 'APPROVED'
        ORDER BY r.created_at DESC
        LIMIT ${size} OFFSET ${page * size}
    `;
    const res = await this.db.execute(query);
    return res.rows;
  }

  async isProductFinished(productId: number): Promise<boolean> {
    const query = sql`SELECT product_group FROM product WHERE id = ${productId}`;
    const res = await this.db.execute(query);
    if (res.rows.length === 0) return false;
    return res.rows[0].product_group === 'finished';
  }

  async findPaginated(page: number, size: number) {
    return this.db.select().from(schema.review).limit(size).offset(page * size);
  }

  async insert(review: ReviewInput) {
    const now = Date.now();
    let orderId = review.orderId;

    if (review.orderItemId) {
        orderId = await this.orderItemPort.getOrderId(review.orderItemId) ?? undefined;
    }

    const inserted = await this.db.insert(schema.review).values({
        version: 0n,
        name: review.name || "",
        city: review.city || "",
        country: review.country || "",
        rating: review.rating || 5,
        description: review.description || "",
        productId: review.productId,
        orderId: orderId,
        productImages: review.productImages || "",
        status: "PENDING",
        activeUrl: "",
        adminAdded: false,
        link: review.link || "",
        createdAt: review.createdAt || now,
        updatedAt: now,
    }).returning({ id: schema.review.id });
    
    if (review.orderItemId && inserted[0]) {
        await this.orderItemPort.updateReviewId(review.orderItemId, inserted[0].id);
    }
    return inserted[0]?.id ?? null;
  }

  async updateCustomer(reviewId: bigint, review: ReviewInput) {
    await this.db.update(schema.review).set({
        city: review.city,
        country: review.country,
        rating: review.rating,
        description: review.description,
        productImages: review.productImages,
        status: "PENDING",
        updatedAt: Date.now()
    }).where(eq(schema.review.id, reviewId));
    return true;
  }

  async updateSuperUser(reviewId: bigint, review: ReviewInput) {
    await this.db.update(schema.review).set({
        name: review.name,
        city: review.city,
        country: review.country,
        rating: review.rating,
        description: review.description,
        status: review.status as any,
        link: review.link,
        productImages: review.productImages,
        productId: review.productId,
        createdAt: review.createdAt,
        updatedAt: Date.now()
    }).where(eq(schema.review.id, reviewId));
    return true;
  }

  async checkOwnership(reviewId: bigint, tenantId: number): Promise<boolean> {
    const res = await this.db.select({ id: schema.review.id })
      .from(schema.review)
      .innerJoin(schema.orders, eq(schema.review.orderId, schema.orders.id))
      .where(and(eq(schema.review.id, reviewId), eq(schema.orders.tenantId, tenantId)));
    return res.length > 0;
  }
}
// @ts-nocheck
// @ts-nocheck
