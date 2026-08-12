// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import { sql } from 'drizzle-orm';

@Injectable()
export class TableExplorerRepository {
    constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

    async getTableData(tableName: string, limit: number, offset: number): Promise<any[]> {
        const query = sql`SELECT * FROM ${sql.identifier(tableName)} LIMIT ${limit} OFFSET ${offset}`;
        const result = await this.db.execute(query);
        return result.rows || result; // Fallback depending on driver
    }
    
    async getTableDataCount(tableName: string): Promise<number> {
        const query = sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`;
        const result = await this.db.execute(query);
        const rows = result.rows || result;
        return Number(rows[0]?.count || 0);
    }

    async getTableRowById(tableName: string, id: any): Promise<any> {
        const query = sql`SELECT * FROM ${sql.identifier(tableName)} WHERE id = ${id}`;
        const result = await this.db.execute(query);
        const rows = result.rows || result;
        return rows[0] || null;
    }
}
// @ts-nocheck
// @ts-nocheck
