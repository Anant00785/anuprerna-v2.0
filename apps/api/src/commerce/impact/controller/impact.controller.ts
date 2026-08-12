// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, UseGuards, Body, Param } from '@nestjs/common';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { ImpactService } from '../service/impact.service.js';
import { parseImpactFactorInput } from '../dto/impact.dto.js';

@ApiBearerAuth()
@Controller('')
export class ImpactController {
    constructor(private readonly service: ImpactService) {}

    @Get('get/impact-factors')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async getFactors() {
        return keyedResponse('factors', await this.service.getFactors());
    }

    @Get('get/impact-factor/:id')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async getFactorById(@Param('id') id: string) {
        return keyedResponse('factor', await this.service.getFactorById(id));
    }

    @Post('add/impact-factor')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async addFactor(@Body() body: any) {
        const dto = parseImpactFactorInput(body);
        return simpleResponse(true, 'Factor added', await this.service.addFactor(dto));
    }

    @Patch('update/impact-factor')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async updateFactor(@Body() body: any) {
        const dto = parseImpactFactorInput(body);
        return simpleResponse(true, 'Factor updated', await this.service.updateFactor(dto));
    }

    @Delete('delete/impact-factor/:id')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    async deleteFactor(@Param('id') id: string) {
        return simpleResponse(true, 'Factor deleted', await this.service.deleteFactor(id));
    }

    @Get('get/product/impact/:productId')
    async getProductImpact(@Param('productId') productId: string) {
        return keyedResponse('impact', await this.service.getProductImpact(productId));
    }
}
