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
      version: r.version ? Number(r.version) : null,
      recordDate: r.recordDate,
      gbp: r.gbp ? parseFloat(String(r.gbp)) : 0,
      eur: r.eur ? parseFloat(String(r.eur)) : 0,
      usd: r.usd ? parseFloat(String(r.usd)) : 0,
      createdAt: r.createdAt ? String(r.createdAt) : null,
    }));
  }

  async findExchangeRateByCode(code: string) {
    const rows = await this.db.select().from(schema.forexExchangeRate).orderBy(desc(schema.forexExchangeRate.recordDate)).limit(1);
    if (!rows || rows.length === 0) return null;
    const latest = rows[0];
    const upper = (code || "").toUpperCase();
    if (upper === "USD") return { currency: "USD", rate: parseFloat(String(latest.usd || "0")) };
    if (upper === "EUR") return { currency: "EUR", rate: parseFloat(String(latest.eur || "0")) };
    if (upper === "GBP") return { currency: "GBP", rate: parseFloat(String(latest.gbp || "0")) };
    return {
      id: latest.id ? String(latest.id) : null,
      recordDate: latest.recordDate,
      gbp: latest.gbp ? parseFloat(String(latest.gbp)) : 0,
      eur: latest.eur ? parseFloat(String(latest.eur)) : 0,
      usd: latest.usd ? parseFloat(String(latest.usd)) : 0,
    };
  }

  async upsertExchangeRate(code: string, rate: number, symbol?: string) {
    const upperCode = (code || "").toUpperCase();
    const latest = await this.db.select().from(schema.forexExchangeRate).orderBy(desc(schema.forexExchangeRate.recordDate)).limit(1);

    let gbp = latest[0]?.gbp ? String(latest[0].gbp) : "106.80";
    let eur = latest[0]?.eur ? String(latest[0].eur) : "91.20";
    let usd = latest[0]?.usd ? String(latest[0].usd) : "83.50";

    if (upperCode === "USD") usd = String(rate);
    else if (upperCode === "EUR") eur = String(rate);
    else if (upperCode === "GBP") gbp = String(rate);

    const [inserted] = await this.db.insert(schema.forexExchangeRate).values({
      recordDate: Date.now(),
      gbp,
      eur,
      usd,
      createdAt: BigInt(Date.now()),
    }).returning();

    // Also update forex currency rate in table
    try {
      await this.db.update(schema.forex).set({ rate: String(rate) }).where(eq(schema.forex.currency, upperCode));
    } catch {}

    return inserted ? {
      id: inserted.id ? String(inserted.id) : null,
      recordDate: inserted.recordDate,
      gbp: inserted.gbp ? parseFloat(String(inserted.gbp)) : 0,
      eur: inserted.eur ? parseFloat(String(inserted.eur)) : 0,
      usd: inserted.usd ? parseFloat(String(inserted.usd)) : 0,
    } : null;
  }

  async findAllForexRecords() {
    const rows = await this.db.select().from(schema.forex).orderBy(desc(schema.forex.id));
    return rows.map(r => ({
      id: r.id ? String(r.id) : null,
      version: r.version ? Number(r.version) : null,
      country: r.country,
      currency: r.currency,
      rate: r.rate ? parseFloat(String(r.rate)) : null,
    }));
  }
}
