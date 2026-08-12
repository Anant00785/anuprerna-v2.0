// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TableExplorerRepository } from '../repository/table_explorer.repository.js';

@Injectable()
export class TableExplorerService {
    constructor(private readonly repository: TableExplorerRepository) {}

    async getTableData(tableName: string, page: number, size: number) {
        try {
            const limit = size;
            const offset = (page - 1) * size;
            const [data, totalElements] = await Promise.all([
                this.repository.getTableData(tableName, limit, offset),
                this.repository.getTableDataCount(tableName)
            ]);
            const totalPages = Math.ceil(totalElements / size);
            
            return {
                data,
                pagination: {
                    page,
                    size,
                    totalElements,
                    totalPages
                }
            };
        } catch (e) {
            throw new BadRequestException(`Could not retrieve data for table ${tableName}`);
        }
    }

    async getTableRowById(tableName: string, id: string) {
        try {
            const data = await this.repository.getTableRowById(tableName, id);
            if (!data) {
                return null;
            }
            return data;
        } catch (e) {
             throw new BadRequestException(`Could not retrieve row for table ${tableName}`);
        }
    }
}
// @ts-nocheck
