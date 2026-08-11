import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { desc, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { product } from "../../database/schema/index.js";

export interface ProductListResult {
  rows: typeof product.$inferSelect[];
  total: number;
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findAll(limit: number, offset: number): Promise<ProductListResult> {
    try {
      const [rows, counts] = await Promise.all([
        this.db.select().from(product).orderBy(desc(product.id)).limit(limit).offset(offset),
        this.db.select({ count: sql<string>`count(*)` }).from(product),
      ]);
      const total = Number(counts[0]?.count ?? 0);
      this.logger.log(`Fetched ${rows.length} products (total=${total}, limit=${limit}, offset=${offset}).`);
      return { rows, total };
    } catch (error) {
      this.logger.error(`Failed to fetch products`, error);
      throw new InternalServerErrorException("Failed to fetch products from the database.");
    }
  }

  async findOne(id: number): Promise<typeof product.$inferSelect> {
    try {
      const [row] = await this.db.select().from(product).where(eq(product.id, BigInt(id))).limit(1);
      if (!row) {
        throw new NotFoundException("Product was not found.");
      }
      this.logger.log(`Fetched product id=${id}.`);
      return row;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch product id=${id}`, error);
      throw new InternalServerErrorException("Failed to fetch the product from the database.");
    }
  }

  async getAll(): Promise<typeof product.$inferSelect[]> {
    const { rows } = await this.findAll(20, 0);
    return rows;
  }

  async create(body: unknown): Promise<never> {
    this.logger.warn("Create product is not supported on this controller.");
    throw new InternalServerErrorException("Product creation is not supported.");
  }
}

