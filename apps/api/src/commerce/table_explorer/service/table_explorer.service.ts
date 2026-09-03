import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TableExplorerRepository } from '../repository/table_explorer.repository.js';
import { isTableExplorerTableAllowed } from '../table_explorer.allowlist.js';

@Injectable()
export class TableExplorerService {
    constructor(private readonly repository: TableExplorerRepository) {}

    /**
     * The repository puts `tableName` into `sql.identifier(...)`, so an
     * un-checked name addresses ANY relation in the database. Reject before the
     * query is built — outside the try/catch below, which exists only to turn a
     * genuine query failure into a 400 and must not be able to swallow this.
     */
    private assertAllowed(tableName: string): void {
        if (!isTableExplorerTableAllowed(tableName)) {
            throw new BadRequestException(`Table ${tableName} is not exposed by the table explorer`);
        }
    }

    async getTableData(tableName: string, page: number, size: number) {
        this.assertAllowed(tableName);
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
        this.assertAllowed(tableName);
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
