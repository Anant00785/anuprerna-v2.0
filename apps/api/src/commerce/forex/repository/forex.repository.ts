// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { eq, desc } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";

@Injectable()
export class ForexRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findAllExchangeRates() {
    const rows = await this.db.select().from(schema.forexExchangeRate).orderBy(desc(schema.forexExchangeRate.recordDate));
    return rows.map(r => ({
      id: r.id ? String(r.id) : null,
      recordDate: r.recordDate,
      gbp: r.gbp ? parseFloat(String(r.gbp)) : 0,
      eur: r.eur ? parseFloat(String(r.eur)) : 0,
      usd: r.usd ? parseFloat(String(r.usd)) : 0,
      createdAt: r.createdAt ? String(r.createdAt) : null,
    }));
  }

  async findExchangeRateByCode(code: string) {
    const rows = await this.db.select().from(schema.forexExchangeRate).orderBy(desc(schema.forexExchangeRate.recordDate)).limit(1);
    return rows[0] || null;
  }

  async upsertExchangeRate(code: string, rate: number, symbol?: string) {
    const rows = await this.db.insert(schema.forexExchangeRate).values({
      recordDate: Date.now(),
      gbp: String(rate),
      eur: String(rate),
      usd: String(rate),
      createdAt: BigInt(Date.now()),
    }).returning();
    return rows[0];
  }

  async findAllForexRecords() {
    return this.db.select().from(schema.forex).orderBy(desc(schema.forex.id));
  }
}
