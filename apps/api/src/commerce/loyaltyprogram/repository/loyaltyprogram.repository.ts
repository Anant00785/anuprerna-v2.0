// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/database.module.js';
import * as schema from '../../database/schema/schema.js';

@Injectable()
export class LoyaltyprogramRepository {
    constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

    async getConfig() { return {}; }
    async updateConfig(data: any) { return {}; }
    async getCustomerInfo() { return {}; }
    async exploreConfig() { return []; }
    async exploreConfigById(id: string) { return {}; }
    async exploreAuditLog() { return []; }
    async exploreAuditLogById(id: string) { return {}; }
}
// @ts-nocheck
// @ts-nocheck
