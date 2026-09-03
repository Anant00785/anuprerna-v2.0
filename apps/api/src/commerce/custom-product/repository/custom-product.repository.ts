import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import type { CustomProductInput } from "../dto/custom-product.dto.js";

/** Loom: product/dao/controller/CustomProductDAOController. */
@Injectable()
export class CustomProductRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findById(id: number) {
    const rows = await this.db.select().from(schema.customProduct).where(eq(schema.customProduct.id, BigInt(id)));
    return rows[0] ?? null;
  }

  /** Loom: retrieveEntityList() — the whole table. */
  async findAll() {
    return this.db.select().from(schema.customProduct).orderBy(desc(schema.customProduct.id));
  }

  async insert(input: CustomProductInput) {
    const now = Date.now();
    const rows = await this.db
      .insert(schema.customProduct)
      .values({
        name: input.name,
        sku: input.sku,
        price: String(input.price),
        productGroup: input.productGroup,
        unit: input.unit as typeof schema.customProduct.$inferInsert.unit,
        remarks: input.remarks,
        heroImage: input.heroImage,
        additionalImages: input.additionalImages,
        additionalDocs: input.additionalDocs,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return rows[0] ?? null;
  }

  /**
   * Loom copies exactly these fields onto the existing row and returns
   * ActionCode.NO_ACTION when the id matches nothing. Note `sku` and
   * `createdAt` are deliberately NOT among them — Loom never reassigns a SKU
   * on update.
   */
  async update(id: number, input: CustomProductInput) {
    const rows = await this.db
      .update(schema.customProduct)
      .set({
        name: input.name,
        productGroup: input.productGroup,
        unit: input.unit as typeof schema.customProduct.$inferInsert.unit,
        price: String(input.price),
        heroImage: input.heroImage,
        additionalImages: input.additionalImages,
        additionalDocs: input.additionalDocs,
        remarks: input.remarks,
        updatedAt: Date.now(),
      })
      .where(eq(schema.customProduct.id, BigInt(id)))
      .returning();
    return rows[0] ?? null;
  }
}
