import { Injectable } from '@nestjs/common';
import { ImpactRepository } from '../repository/impact.repository.js';
import { CustomImpactRepository } from '../repository/custom-impact.repository.js';
import { IMPACT_ASSUMPTIONS_NOT_CONFIGURED } from '../dto/impact-assumptions.js';
import {
    buildCustomOrderImpactSummary,
    emptyImpactSummary,
    toImpactAggregation,
    type ImpactAggregation,
    type ImpactSummary,
} from '../dto/impact-summary.js';

@Injectable()
export class ImpactService {
    constructor(
        private readonly repo: ImpactRepository,
        private readonly customImpactRepo: CustomImpactRepository,
    ) {}

    async getFactors() { return this.repo.getFactors(); }
    async getFactorById(id: string) { return this.repo.getFactorById(id); }
    async addFactor(data: any) { return this.repo.addFactor(data); }
    async updateFactor(data: any) { return this.repo.updateFactor(data); }
    async deleteFactor(id: string) { return this.repo.deleteFactor(id); }
    async getProductImpact(productId: string) { return this.repo.getProductImpact(productId); }

    /**
     * Loom: CustomImpactFactorDAOController.retrieveCustomOrderImpact.
     *
     * An order outside the caller's scope (or absent) yields
     * ImpactSummary.emptyOrder(id) — Loom deliberately returns a zeroed summary
     * rather than a 404, so an out-of-scope id is indistinguishable from an
     * order with no impact rows and leaks nothing.
     *
     * `tenantScopeId` is null ONLY for a super user; for a customer it is that
     * customer's own tenant id, taken from the JWT.
     */
    async getCustomOrderImpact(customOrderId: number, tenantScopeId: number | null): Promise<ImpactSummary> {
        const exists = await this.repo.customOrderExists(customOrderId, tenantScopeId);
        if (!exists) return emptyImpactSummary(customOrderId);

        const rows = await this.repo.findCustomImpactRowsByOrder(customOrderId, tenantScopeId);
        const summary = buildCustomOrderImpactSummary(customOrderId, rows);

        // Loom: retrieveCustomOrderImpact flags the summary when the assumptions
        // setting is missing, so a reader can tell "not yet calculated" from
        // "calculated as zero". Without this the CMS renders stale rows as if
        // they were current.
        if ((await this.customImpactRepo.findImpactAssumptions()) === null) {
            summary.configurationError = IMPACT_ASSUMPTIONS_NOT_CONFIGURED;
        }
        return summary;
    }

    /** Loom: CustomImpactFactorDAOController.retrieveImpactAggregation. */
    async getCustomImpactAggregation(): Promise<ImpactAggregation> {
        return toImpactAggregation(await this.repo.findCustomImpactAggregation());
    }
}
