// @ts-nocheck
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, UseGuards, Body, Param } from '@nestjs/common';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { ImpactService } from '../service/impact.service.js';
import { CreateImpactFactorDto, UpdateImpactFactorDto, parseImpactFactorInput } from '../dto/impact.dto.js';

@ApiBearerAuth()
@ApiTags("Impact")
@Controller('')
export class ImpactController {
    constructor(private readonly service: ImpactService) {}

    @Get('get/impact-factors')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SUCU)
    @ApiOperation({ summary: "Get all impact calculation factors." })
    @ApiResponse({ status: 200, description: "List of impact factors retrieved successfully." })
    async getFactors() {
        return keyedResponse('factors', await this.service.getFactors());
    }

    @Get('get/impact-factor/:id')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SUCU)
    @ApiOperation({ summary: "Get impact factor by ID." })
    @ApiParam({ name: "id", type: Number, description: "Impact factor unique identifier", example: 1 })
    @ApiResponse({ status: 200, description: "Impact factor details retrieved successfully." })
    async getFactorById(@Param('id') id: string) {
        return keyedResponse('factor', await this.service.getFactorById(id));
    }

    @Post('add/impact-factor')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    @ApiOperation({ summary: "Add a new impact factor." })
    @ApiBody({ type: CreateImpactFactorDto })
    @ApiResponse({ status: 201, description: "Impact factor successfully created." })
    async addFactor(@Body() body: CreateImpactFactorDto) {
        const dto = parseImpactFactorInput(body);
        return simpleResponse(true, 'Factor added', await this.service.addFactor(dto));
    }

    @Patch('update/impact-factor')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    @ApiOperation({ summary: "Update an existing impact factor." })
    @ApiBody({ type: UpdateImpactFactorDto })
    @ApiResponse({ status: 200, description: "Impact factor successfully updated." })
    async updateFactor(@Body() body: UpdateImpactFactorDto) {
        const dto = parseImpactFactorInput(body);
        return simpleResponse(true, 'Factor updated', await this.service.updateFactor(dto));
    }

    @Delete('delete/impact-factor/:id')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    @ApiOperation({ summary: "Delete an impact factor by ID." })
    @ApiParam({ name: "id", type: Number, description: "Impact factor identifier to delete", example: 1 })
    @ApiResponse({ status: 200, description: "Impact factor successfully deleted." })
    async deleteFactor(@Param('id') id: string) {
        return simpleResponse(true, 'Factor deleted', await this.service.deleteFactor(id));
    }

    @Get('get/product/impact/:productId')
    @ApiOperation({ summary: "Get calculated sustainability impact for a product." })
    @ApiParam({ name: "productId", type: Number, description: "Product identifier to calculate impact for", example: 2590 })
    @ApiResponse({ status: 200, description: "Calculated product impact metrics." })
    async getProductImpact(@Param('productId') productId: string) {
        return keyedResponse('impact', await this.service.getProductImpact(productId));
    }
}
