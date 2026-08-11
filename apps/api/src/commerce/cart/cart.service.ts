import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { desc, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { cartItem } from "../../database/schema/index.js";

export interface CartListResult {
  rows: typeof cartItem.$inferSelect[];
  total: number;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findAll(limit: number, offset: number): Promise<CartListResult> {
    try {
      const [rows, counts] = await Promise.all([
        this.db.select().from(cartItem).orderBy(desc(cartItem.id)).limit(limit).offset(offset),
        this.db.select({ count: sql<string>`count(*)` }).from(cartItem),
      ]);
      const total = Number(counts[0]?.count ?? 0);
      this.logger.log(`Fetched ${rows.length} cart items (total=${total}, limit=${limit}, offset=${offset}).`);
      return { rows, total };
    } catch (error) {
      this.logger.error(`Failed to fetch cart items`, error);
      throw new InternalServerErrorException("Failed to fetch cart items from the database.");
    }
  }

  async findOne(id: number): Promise<typeof cartItem.$inferSelect> {
    try {
      const [row] = await this.db.select().from(cartItem).where(eq(cartItem.id, BigInt(id))).limit(1);
      if (!row) {
        throw new NotFoundException("Cart item was not found.");
      }
      this.logger.log(`Fetched cart item id=${id}.`);
      return row;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch cart item id=${id}`, error);
      throw new InternalServerErrorException("Failed to fetch the cart item from the database.");
    }
  }

  async getAll(): Promise<typeof cartItem.$inferSelect[]> {
    const { rows } = await this.findAll(20, 0);
    return rows;
  }

  async create(body: unknown): Promise<never> {
    this.logger.warn("Create cart item is not supported on this controller.");
    throw new InternalServerErrorException("Cart item creation is not supported.");
  }
}

