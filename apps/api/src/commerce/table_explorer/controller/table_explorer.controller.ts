// @ts-nocheck
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TableExplorerService } from '../service/table_explorer.service.js';
import { parseTablePaginationInput } from '../dto/table_explorer.dto.js';
import { RolesGuard, RequireGate } from '../../common/auth/roles.guard.js';
import { GateCode } from '../../auth/types/auth.types.js';
import { keyedResponse, simpleResponse } from '../../common/response/rain-response.js';

@Controller('get/table-explorer')
@UseGuards(RolesGuard)
export class TableExplorerController {
    constructor(private readonly service: TableExplorerService) {}

    @Get('data/:tableName')
    @RequireGate(GateCode.CODE_SU)
    async getTableData(@Param('tableName') tableName: string, @Query() query: any) {
        const { page, size } = parseTablePaginationInput(query);
        const result = await this.service.getTableData(tableName, page, size);
        return keyedResponse('tableData', result);
    }

    @Get('data/:tableName/:id')
    @RequireGate(GateCode.CODE_SU)
    async getTableRowById(@Param('tableName') tableName: string, @Param('id') id: string) {
        const result = await this.service.getTableRowById(tableName, id);
        if (!result) {
            return simpleResponse(false, 'Row not found');
        }
        return keyedResponse('rowData', result);
    }
}
// @ts-nocheck
