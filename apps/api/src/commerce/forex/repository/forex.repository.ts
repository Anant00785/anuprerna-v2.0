import { Inject, Injectable, Logger } from "@nestjs/common";
import { eq, desc } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";

@Injectable()
export class ForexRepository {
  private readonly logger = new Logger(ForexRepository.name);
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findAllExchangeRates() {
    const rows = await this.db.select().from(schema.forexExchangeRate).orderBy(desc(schema.forexExchangeRate.recordDate));
    return rows.map(r => ({
      id: r.id ? String(r.id) : null,
      version: r.version === null || r.version === undefined ? null : Number(r.version),
      recordDate: r.recordDate,
      gbp: r.gbp ? parseFloat(String(r.gbp)) : 0,
      eur: r.eur ? parseFloat(String(r.eur)) : 0,
      usd: r.usd ? parseFloat(String(r.usd)) : 0,
      createdAt: r.createdAt ? String(r.createdAt) : null,
    }));
  }

  /** The most recent forex_exchange_rate row, shaped as Loom's ForexExchangeRate entity. */
  async findLatestExchangeRate() {
    const rows = await this.db
      .select()
      .from(schema.forexExchangeRate)
      // Loom: findFirstByRecordDateOrderByCreatedAtDesc — createdAt breaks the
      // tie between several rows written on the same record date. Ordering by
      // recordDate alone left "latest" non-deterministic among same-day rows.
      .orderBy(desc(schema.forexExchangeRate.recordDate), desc(schema.forexExchangeRate.createdAt))
      .limit(1);
    const latest = rows[0];
    if (!latest) return null;
    return {
      id: latest.id ? String(latest.id) : null,
      version: latest.version === null || latest.version === undefined ? null : Number(latest.version),
      recordDate: latest.recordDate,
      gbp: latest.gbp ? parseFloat(String(latest.gbp)) : 0,
      eur: latest.eur ? parseFloat(String(latest.eur)) : 0,
      usd: latest.usd ? parseFloat(String(latest.usd)) : 0,
    };
  }

  async findExchangeRateByCode(code: string) {
    const rows = await this.db
      .select()
      .from(schema.forexExchangeRate)
      .orderBy(desc(schema.forexExchangeRate.recordDate), desc(schema.forexExchangeRate.createdAt))
      .limit(1);
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

  /**
   * Appends a new forex_exchange_rate row carrying the updated currency.
   *
   * The row is a full snapshot of all three rates, so the two currencies the
   * caller did not supply are carried over from the previous snapshot. There is
   * deliberately NO fallback constant: this method used to seed a missing
   * snapshot with a hardcoded GBP 106.80 / EUR 91.20 / USD 83.50, which
   * persisted three invented exchange rates into the table every foreign-currency
   * price is derived from. With no prior snapshot there is nothing to carry over
   * and the caller must be told so.
   */
  async upsertExchangeRate(code: string, rate: number, symbol?: string) {
    const upperCode = (code || "").toUpperCase();
    if (upperCode !== "USD" && upperCode !== "EUR" && upperCode !== "GBP") {
      throw new Error(`upsertExchangeRate: unsupported currency "${code}"`);
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`upsertExchangeRate: rate must be a positive number, got ${rate}`);
    }

    const latest = await this.db
      .select()
      .from(schema.forexExchangeRate)
      .orderBy(desc(schema.forexExchangeRate.recordDate), desc(schema.forexExchangeRate.createdAt))
      .limit(1);

    const previous = latest[0];
    if (!previous) {
      throw new Error(
        "upsertExchangeRate: no forex_exchange_rate snapshot exists to carry the other " +
          "currencies over from; seed the table with a full GBP/EUR/USD snapshot first",
      );
    }

    let gbp = String(previous.gbp);
    let eur = String(previous.eur);
    let usd = String(previous.usd);

    if (upperCode === "USD") usd = String(rate);
    else if (upperCode === "EUR") eur = String(rate);
    else gbp = String(rate);

    const now = Date.now();
    const [inserted] = await this.db.insert(schema.forexExchangeRate).values({
      // Loom keys its lookup on the date WITHOUT time
      // (LoomUtility.getDateInMillisecondsWithoutTime), so a full millisecond
      // timestamp here produces rows its own reader can never find.
      recordDate: startOfUtcDay(now),
      gbp,
      eur,
      usd,
      // `created_at` is bigint({ mode: "number" }) in the schema; the previous
      // `BigInt(now)` only typechecked because this file carried @ts-nocheck.
      createdAt: now,
    }).returning();

    // Also update forex currency rate in table
    try {
      await this.db.update(schema.forex).set({ rate: String(rate) }).where(eq(schema.forex.currency, upperCode));
    } catch (err) {
      this.logger.warn(`failed to update forex currency rate: ${err}`);
    }

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
      version: r.version === null || r.version === undefined ? null : Number(r.version),
      country: r.country,
      currency: r.currency,
      rate: r.rate === null || r.rate === undefined ? null : parseFloat(String(r.rate)),
    }));
  }
}

/** Loom's LoomUtility.getDateInMillisecondsWithoutTime — UTC midnight of `ms`. */
function startOfUtcDay(ms: number): number {
  return Math.floor(ms / 86_400_000) * 86_400_000;
}
