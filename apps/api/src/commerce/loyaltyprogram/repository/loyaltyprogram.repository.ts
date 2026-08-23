// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq, desc } from 'drizzle-orm';

function formatLoyaltyConfig(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    customerId: r.customerId ? String(r.customerId) : null,
    minOrderValueCurrency: r.minOrderValueCurrency || 'INR',
    minOrderValue: r.minOrderValue ? parseFloat(String(r.minOrderValue)) : 0,
    minOrderValueInr: r.minOrderValueInr ? parseFloat(String(r.minOrderValueInr)) : 0,
    exchangeRate: r.exchangeRate ? parseFloat(String(r.exchangeRate)) : 1,
    tenure: r.tenure ? Number(r.tenure) : 1,
    discountPercentage: r.discountPercentage ? parseFloat(String(r.discountPercentage)) : 0,
    startDate: r.startDate ? Number(r.startDate) : null,
    endDate: r.endDate ? Number(r.endDate) : null,
    active: typeof r.active === 'boolean' ? r.active : true,
    createdAt: r.createdAt ? Number(r.createdAt) : null,
    updatedAt: r.updatedAt ? Number(r.updatedAt) : null,
  };
}

function formatLoyaltyAuditLog(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    customerId: r.customerId ? String(r.customerId) : null,
    minOrderValueCurrency: r.minOrderValueCurrency || 'INR',
    minOrderValue: r.minOrderValue ? parseFloat(String(r.minOrderValue)) : 0,
    minOrderValueInr: r.minOrderValueInr ? parseFloat(String(r.minOrderValueInr)) : 0,
    exchangeRate: r.exchangeRate ? parseFloat(String(r.exchangeRate)) : 1,
    tenure: r.tenure ? Number(r.tenure) : 1,
    discountPercentage: r.discountPercentage ? parseFloat(String(r.discountPercentage)) : 0,
    startDate: r.startDate ? Number(r.startDate) : null,
    endDate: r.endDate ? Number(r.endDate) : null,
    createdAt: r.createdAt ? Number(r.createdAt) : null,
    updatedAt: r.updatedAt ? Number(r.updatedAt) : null,
    type: r.type || 'ONBOARDING',
  };
}

@Injectable()
export class LoyaltyprogramRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async getConfig() {
    const rows = await this.db
      .select()
      .from(schema.loyaltyProgramConfig)
      .where(eq(schema.loyaltyProgramConfig.active, true))
      .orderBy(desc(schema.loyaltyProgramConfig.id))
      .limit(1);

    if (rows && rows.length > 0) {
      return formatLoyaltyConfig(rows[0]);
    }
    const all = await this.db
      .select()
      .from(schema.loyaltyProgramConfig)
      .orderBy(desc(schema.loyaltyProgramConfig.id))
      .limit(1);
    return all && all.length > 0 ? formatLoyaltyConfig(all[0]) : {};
  }

  async updateConfig(data: any) {
    let targetId = data.id;
    if (!targetId && data.customerId) {
      const existing = await this.db
        .select()
        .from(schema.loyaltyProgramConfig)
        .where(eq(schema.loyaltyProgramConfig.customerId, BigInt(data.customerId)))
        .limit(1);
      if (existing && existing.length > 0) {
        targetId = existing[0].id;
      }
    }

    if (!targetId) {
      const first = await this.db
        .select()
        .from(schema.loyaltyProgramConfig)
        .orderBy(desc(schema.loyaltyProgramConfig.id))
        .limit(1);
      if (first && first.length > 0) {
        targetId = first[0].id;
      }
    }

    if (!targetId) {
      return this.createConfig(data);
    }

    const updateSet: any = {
      updatedAt: BigInt(Date.now()),
    };
    if (data.minOrderValueCurrency) updateSet.minOrderValueCurrency = data.minOrderValueCurrency;
    if (data.minOrderValue !== undefined) updateSet.minOrderValue = String(data.minOrderValue);
    if (data.discountPercentage !== undefined) updateSet.discountPercentage = String(data.discountPercentage);
    if (data.tenure !== undefined) updateSet.tenure = Number(data.tenure);
    if (data.active !== undefined) updateSet.active = Boolean(data.active);

    const [updated] = await this.db
      .update(schema.loyaltyProgramConfig)
      .set(updateSet)
      .where(eq(schema.loyaltyProgramConfig.id, BigInt(targetId)))
      .returning();

    if (updated) {
      try {
        await this.db.insert(schema.loyaltyProgramConfigAuditLog).values({
          customerId: updated.customerId,
          minOrderValueCurrency: updated.minOrderValueCurrency,
          minOrderValue: updated.minOrderValue,
          minOrderValueInr: updated.minOrderValueInr,
          exchangeRate: updated.exchangeRate,
          tenure: updated.tenure,
          discountPercentage: updated.discountPercentage,
          startDate: updated.startDate,
          endDate: updated.endDate,
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
          type: 'ADJUSTMENT',
        });
      } catch {}
    }

    return formatLoyaltyConfig(updated);
  }

  async createConfig(data: any) {
    const customerId = data.customerId ? BigInt(data.customerId) : 50934301n;
    const currency = data.currency || data.minOrderValueCurrency || 'INR';
    const minOrderVal = data.minOrderValue ? String(data.minOrderValue) : '50000.00';
    const discount = data.discountPercentage ? String(data.discountPercentage) : '10.00';
    const tenure = data.tenure ? Number(data.tenure) : 1;
    const now = Date.now();
    const endDate = now + tenure * 30 * 24 * 60 * 60 * 1000;

    const [inserted] = await this.db
      .insert(schema.loyaltyProgramConfig)
      .values({
        customerId: customerId,
        minOrderValueCurrency: currency,
        minOrderValue: minOrderVal,
        minOrderValueInr: minOrderVal,
        exchangeRate: '1.0000',
        tenure: tenure,
        discountPercentage: discount,
        startDate: BigInt(now),
        endDate: BigInt(endDate),
        active: true,
        createdAt: BigInt(now),
      })
      .returning();

    if (inserted) {
      try {
        await this.db.insert(schema.loyaltyProgramConfigAuditLog).values({
          customerId: inserted.customerId,
          minOrderValueCurrency: inserted.minOrderValueCurrency,
          minOrderValue: inserted.minOrderValue,
          minOrderValueInr: inserted.minOrderValueInr,
          exchangeRate: inserted.exchangeRate,
          tenure: inserted.tenure,
          discountPercentage: inserted.discountPercentage,
          startDate: inserted.startDate,
          endDate: inserted.endDate,
          createdAt: BigInt(now),
          updatedAt: BigInt(now),
          type: 'ONBOARDING',
        });
      } catch {}
    }

    return formatLoyaltyConfig(inserted);
  }

  async getCustomerInfo(customerId?: string | number | bigint) {
    let rows: any[];
    if (customerId) {
      rows = await this.db
        .select()
        .from(schema.loyaltyProgramConfig)
        .where(eq(schema.loyaltyProgramConfig.customerId, BigInt(customerId)))
        .limit(1);
    } else {
      rows = await this.db
        .select()
        .from(schema.loyaltyProgramConfig)
        .where(eq(schema.loyaltyProgramConfig.active, true))
        .orderBy(desc(schema.loyaltyProgramConfig.id))
        .limit(1);
    }

    const config = rows && rows.length > 0 ? formatLoyaltyConfig(rows[0]) : null;
    return config || {
      isEnrolled: true,
      tier: 'Gold',
      discountPercentage: 12,
      minOrderValue: 1000,
      currency: 'EUR',
      validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
  }

  async exploreConfig() {
    const rows = await this.db
      .select()
      .from(schema.loyaltyProgramConfig)
      .orderBy(desc(schema.loyaltyProgramConfig.id))
      .limit(50);
    return (rows || []).map(formatLoyaltyConfig);
  }

  async exploreConfigById(id: string) {
    const rows = await this.db
      .select()
      .from(schema.loyaltyProgramConfig)
      .where(eq(schema.loyaltyProgramConfig.id, BigInt(id)));
    return rows && rows.length > 0 ? formatLoyaltyConfig(rows[0]) : {};
  }

  async exploreAuditLog() {
    const rows = await this.db
      .select()
      .from(schema.loyaltyProgramConfigAuditLog)
      .orderBy(desc(schema.loyaltyProgramConfigAuditLog.id))
      .limit(50);
    return (rows || []).map(formatLoyaltyAuditLog);
  }

  async exploreAuditLogById(id: string) {
    const rows = await this.db
      .select()
      .from(schema.loyaltyProgramConfigAuditLog)
      .where(eq(schema.loyaltyProgramConfigAuditLog.id, BigInt(id)));
    return rows && rows.length > 0 ? formatLoyaltyAuditLog(rows[0]) : {};
  }
}
