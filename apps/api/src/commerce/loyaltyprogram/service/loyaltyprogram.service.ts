// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { LoyaltyprogramRepository } from '../repository/loyaltyprogram.repository.js';

@Injectable()
export class LoyaltyprogramService {
    constructor(private readonly repo: LoyaltyprogramRepository) {}

    async getConfig() { return this.repo.getConfig(); }
    async updateConfig(data: any) { return this.repo.updateConfig(data); }
    async getCustomerInfo() { return this.repo.getCustomerInfo(); }
    async exploreConfig() { return this.repo.exploreConfig(); }
    async exploreConfigById(id: string) { return this.repo.exploreConfigById(id); }
    async exploreAuditLog() { return this.repo.exploreAuditLog(); }
    async exploreAuditLogById(id: string) { return this.repo.exploreAuditLogById(id); }
}
// @ts-nocheck
