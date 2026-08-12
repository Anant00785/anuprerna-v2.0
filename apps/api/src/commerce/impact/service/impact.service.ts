// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { ImpactRepository } from '../repository/impact.repository.js';

@Injectable()
export class ImpactService {
    constructor(private readonly repo: ImpactRepository) {}

    async getFactors() { return this.repo.getFactors(); }
    async getFactorById(id: string) { return this.repo.getFactorById(id); }
    async addFactor(data: any) { return this.repo.addFactor(data); }
    async updateFactor(data: any) { return this.repo.updateFactor(data); }
    async deleteFactor(id: string) { return this.repo.deleteFactor(id); }
    async getProductImpact(productId: string) { return this.repo.getProductImpact(productId); }
}
// @ts-nocheck
