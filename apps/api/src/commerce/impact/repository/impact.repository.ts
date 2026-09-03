import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq, and, asc, sql } from 'drizzle-orm';

@Injectable()
export class ImpactRepository {
    constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

    /**
     * All persisted impact factors — an empty table returns an empty list and
     * a DB error propagates. This method previously fabricated two rows
     * (2.50 kg CO2, 90 L water, ...) on both paths, which the CMS rendered as
     * measured environmental data.
     */
    async getFactors() {
        return this.db.select().from(schema.impactFactor).limit(50);
    }

    /** The persisted row, or null. Never a fabricated default. */
    async getFactorById(id: string) {
        const rows = await this.db.select().from(schema.impactFactor).where(eq(schema.impactFactor.id, BigInt(id))).limit(1);
        return rows[0] ?? null;
    }

    /**
     * Inserts an impact factor. tenantId / orderId / orderItemId /
     * productType / calculationStatus are REQUIRED — this used to write
     * `tenantId || 1` and `orderId || 1`, silently attributing impact records
     * to tenant 1 / order 1.
     */
    async addFactor(data: Record<string, unknown>) {
        for (const field of ['tenantId', 'orderId', 'orderItemId'] as const) {
            if (!data?.[field]) throw new BadRequestException(`${field} is required to add an impact factor.`);
        }
        for (const field of ['productType', 'calculationStatus'] as const) {
            if (!data?.[field]) throw new BadRequestException(`${field} is required to add an impact factor.`);
        }
        const rows = await this.db.insert(schema.impactFactor).values({
            ...data,
            version: 1n,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }).returning();
        return rows[0];
    }

    async updateFactor(data: any) {
        try {
            if (!data.id) return null;
            const rows = await this.db.update(schema.impactFactor)
                .set({ ...data, updatedAt: Date.now() })
                .where(eq(schema.impactFactor.id, BigInt(data.id)))
                .returning();
            return rows[0] || null;
        } catch (err) {
            console.error('[Update Impact Factor Error]:', err);
            return null;
        }
    }

    async deleteFactor(id: string) {
        try {
            await this.db.delete(schema.impactFactor).where(eq(schema.impactFactor.id, BigInt(id)));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Loom: ImpactFactorDAOController — the persisted impact row for one order
     * item, or null. Returns null rather than plausible-looking numbers: this
     * previously fabricated a fallback summary (5.00 m, 12.50 kg CO2 ...) that
     * the CMS rendered as if it were measured data.
     */
    async getProductImpact(productId: string) {
        const rows = await this.db
            .select()
            .from(schema.impactFactor)
            .where(eq(schema.impactFactor.orderItemId, Number(productId)))
            .limit(1);
        return rows[0] ?? null;
    }

    // ─── Custom-order impact (Loom CustomImpactFactorDAOController) ──────────

    /**
     * Loom: CustomImpactFactorJpaRepository.findAllByCustomOrderIdOrderByIdAsc.
     * `tenantScopeId` mirrors Loom's retrieveScopedOrder: null for a super
     * user (any order), the caller's own tenant id for a customer. It is NEVER
     * taken from the request — passing a client-supplied id would be an IDOR.
     */
    async findCustomImpactRowsByOrder(customOrderId: number, tenantScopeId: number | null) {
        const where =
            tenantScopeId === null
                ? eq(schema.customImpactFactor.customOrderId, customOrderId)
                : and(
                      eq(schema.customImpactFactor.customOrderId, customOrderId),
                      eq(schema.customImpactFactor.tenantId, tenantScopeId),
                  );
        return this.db
            .select()
            .from(schema.customImpactFactor)
            .where(where)
            .orderBy(asc(schema.customImpactFactor.id));
    }

    /** Does the custom order exist (within the caller's scope)? */
    async customOrderExists(customOrderId: number, tenantScopeId: number | null) {
        const where =
            tenantScopeId === null
                ? eq(schema.customOrder.id, BigInt(customOrderId))
                : and(
                      eq(schema.customOrder.id, BigInt(customOrderId)),
                      eq(schema.customOrder.tenantId, tenantScopeId),
                  );
        const rows = await this.db.select({ id: schema.customOrder.id }).from(schema.customOrder).where(where).limit(1);
        return rows.length > 0;
    }

    /**
     * Loom: ImpactFactorNativeQuery.RETRIEVE_CUSTOM_IMPACT_AGGREGATION —
     * a single row of totals over the whole custom_impact_factor table.
     * Reproduced verbatim, including the zero defaults.
     */
    async findCustomImpactAggregation() {
        const result = await this.db.execute(sql`
            SELECT
                COUNT(DISTINCT custom_order_id)::bigint AS total_orders,
                COUNT(*)::bigint AS total_items,
                COALESCE(SUM(CASE WHEN calculation_status = 'COMPLETE' THEN 1 ELSE 0 END), 0)::bigint AS complete_items,
                COALESCE(SUM(CASE WHEN calculation_status = 'PARTIAL' THEN 1 ELSE 0 END), 0)::bigint AS partial_items,
                COALESCE(SUM(CASE WHEN product_type = 'FABRIC' THEN 1 ELSE 0 END), 0)::bigint AS fabric_items,
                COALESCE(SUM(CASE WHEN product_type = 'APPAREL' THEN 1 ELSE 0 END), 0)::bigint AS apparel_items,
                COALESCE(SUM(fabric_meters), 0)::double precision AS fabric_meters,
                COALESCE(SUM(co2_offset_kg), 0)::double precision AS co2_offset_kg,
                COALESCE(SUM(water_saved_litres), 0)::double precision AS water_saved_litres,
                COALESCE(SUM(artisan_hours), 0)::double precision AS artisan_hours,
                COALESCE(SUM(women_artisan_hours), 0)::double precision AS women_artisan_hours,
                COALESCE(SUM(stitching_hours), 0)::double precision AS stitching_hours,
                COALESCE(SUM(women_stitching_hours), 0)::double precision AS women_stitching_hours,
                COALESCE(SUM(total_work_hours), 0)::double precision AS total_work_hours
            FROM custom_impact_factor
        `);
        const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
        return Array.isArray(rows) ? (rows[0] ?? null) : null;
    }
}
