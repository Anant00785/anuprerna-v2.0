import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ReviewInput } from "../dto/review.dto.js";

export const ORDER_ITEM_PORT = Symbol("ORDER_ITEM_PORT");
export interface OrderItemPort {
    updateReviewId(orderItemId: number, reviewId: bigint): Promise<void>;
    getOrderId(orderItemId: number): Promise<number | null>;
}

export function formatReview(r: any) {
  if (!r) return null;
  return {
    id: typeof r.id === "bigint" ? Number(r.id) : (r.id ? Number(r.id) : null),
    version: typeof r.version === "bigint" ? Number(r.version) : (r.version ? Number(r.version) : 0),
    name: r.name || "",
    city: r.city || "",
    country: r.country || "",
    rating: typeof r.rating === "bigint" ? Number(r.rating) : (r.rating ? Number(r.rating) : 5),
    description: r.description || "",
    productId: typeof r.productId === "bigint" ? Number(r.productId) : (r.productId || r.product_id ? Number(r.productId || r.product_id) : null),
    orderId: typeof r.orderId === "bigint" ? Number(r.orderId) : (r.orderId || r.order_id ? Number(r.orderId || r.order_id) : null),
    productImages: r.productImages || r.product_images || "",
    status: r.status || "APPROVED",
    activeUrl: r.activeUrl || r.active_url || "",
    adminAdded: Boolean(r.adminAdded ?? r.admin_added ?? false),
    link: r.link || "",
    createdAt: r.createdAt || r.created_at ? Number(r.createdAt || r.created_at) : Date.now(),
    updatedAt: r.updatedAt || r.updated_at ? Number(r.updatedAt || r.updated_at) : Date.now(),
  };
}

@Injectable()
export class ReviewRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    @Inject(ORDER_ITEM_PORT) private readonly orderItemPort: OrderItemPort
  ) {}

  async findById(id: bigint) {
    const rows = await this.db.select().from(schema.review).where(eq(schema.review.id, id));
    return rows[0] ? formatReview(rows[0]) : null;
  }

  /** Site-wide when `productId` is omitted; that product's own otherwise. */
  async findStatistics(productId?: number) {
    const scope = productId === undefined ? sql`` : sql` AND r.product_id = ${productId}`;
    const query = sql`SELECT COUNT(r.id) AS count, CEIL(COALESCE(AVG(r.rating), 0)) AS rating FROM review r WHERE r.status = 'APPROVED'${scope}`;
    const res = await this.db.execute(query);
    const rows = Array.isArray(res) ? res : (res?.rows || []);
    if (rows.length === 0) return { count: 0, rating: 0 };
    return { 
        count: Number(rows[0].count), 
        rating: Number(rows[0].rating) 
    };
  }

  async findApprovedReviews(page: number, size: number) {
    const rows = await this.db.select().from(schema.review)
        .where(eq(schema.review.status, 'APPROVED'))
        .orderBy(desc(schema.review.createdAt))
        .limit(size).offset(page * size);
    return rows.map(formatReview);
  }

  async findReviewsByStatus(status: "PENDING" | "APPROVED" | "REMOVED", page: number, size: number) {
    const rows = await this.db.select().from(schema.review)
        .where(eq(schema.review.status, status))
        .orderBy(desc(schema.review.createdAt))
        .limit(size).offset(page * size);
    return rows.map(formatReview);
  }

  async findProductReviews(productId: number, page: number, size: number) {
    const rows = await this.db.select().from(schema.review)
        .where(and(eq(schema.review.productId, productId), eq(schema.review.status, 'APPROVED')))
        .orderBy(desc(schema.review.createdAt))
        .limit(size).offset(page * size);
    return rows.map(formatReview);
  }

  async findPaginated(page: number, size: number) {
    const rows = await this.db.select().from(schema.review).limit(size).offset(page * size);
    return rows.map(formatReview);
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
    return inserted[0]?.id ? Number(inserted[0].id) : null;
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
    try {
      const res = await this.db.select({ id: schema.review.id })
        .from(schema.review)
        .innerJoin(schema.orders, eq(schema.review.orderId, schema.orders.id))
        .where(and(eq(schema.review.id, reviewId), eq(schema.orders.tenantId, tenantId)));
      return res.length > 0;
    } catch {
      return true;
    }
  }
}
