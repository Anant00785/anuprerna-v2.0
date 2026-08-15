// @ts-nocheck
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Patch, UseGuards, Body, Param } from '@nestjs/common';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { LoyaltyprogramService } from '../service/loyaltyprogram.service.js';

@ApiBearerAuth()
@ApiTags("Loyalty Program")
@Controller('')
export class LoyaltyprogramController {
    constructor(private readonly service: LoyaltyprogramService) {}

    @Get('get/loyalty-program/config')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async getConfig() {
        return keyedResponse('config', await this.service.getConfig());
    }

    @Patch('update/loyalty-program/config')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async updateConfig(@Body() body: any) {
        await this.service.updateConfig(body);
        return simpleResponse(true, 'Config updated');
    }

    @Get('get/customer/loyalty-info')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_CU)
    async getCustomerInfo() {
        return keyedResponse('info', await this.service.getCustomerInfo());
    }

    @Get('get/table-explorer/data/loyalty-program-config')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async exploreConfig() {
        return keyedResponse('data', await this.service.exploreConfig());
    }

    @Get('get/table-explorer/data/loyalty-program-config/:id')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async exploreConfigById(@Param('id') id: string) {
        return keyedResponse('data', await this.service.exploreConfigById(id));
    }

    @Get('get/table-explorer/data/loyalty-program-config-audit-log')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async exploreAuditLog() {
        return keyedResponse('data', await this.service.exploreAuditLog());
    }

    @Get('get/table-explorer/data/loyalty-program-config-audit-log/:id')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async exploreAuditLogById(@Param('id') id: string) {
        return keyedResponse('data', await this.service.exploreAuditLogById(id));
    }
}
