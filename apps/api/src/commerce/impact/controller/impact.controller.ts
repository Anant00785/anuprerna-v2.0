import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, UseGuards, Body, Param, BadRequestException } from '@nestjs/common';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { CurrentTenant } from '../../../common/auth/current-tenant.decorator.js';
import type { AuthenticatedTenant } from '../../../auth/types/auth.types.js';
import { ImpactService } from '../service/impact.service.js';
import { CustomOrderImpactService } from '../service/custom-order-impact.service.js';
import { CreateImpactFactorDto, UpdateImpactFactorDto, parseImpactFactorInput } from '../dto/impact.dto.js';

@ApiBearerAuth()
@ApiTags("Impact")
@Controller('')
@UseGuards(RolesGuard)
export class ImpactController {
    constructor(
        private readonly service: ImpactService,
        private readonly customOrderImpactService: CustomOrderImpactService,
    ) {}

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
        const created = await this.service.addFactor(dto);
        return simpleResponse(!!created, created ? 'Factor added' : 'Failed to add factor');
    }

    @Patch('update/impact-factor')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    @ApiOperation({ summary: "Update an existing impact factor." })
    @ApiBody({ type: UpdateImpactFactorDto })
    @ApiResponse({ status: 200, description: "Impact factor successfully updated." })
    async updateFactor(@Body() body: UpdateImpactFactorDto) {
        const dto = parseImpactFactorInput(body);
        const updated = await this.service.updateFactor(dto);
        return simpleResponse(!!updated, updated ? 'Factor updated' : 'Failed to update factor');
    }

    @Delete('delete/impact-factor/:id')
    @UseGuards(RolesGuard)
    @RequireGate(GateCode.CODE_SU)
    @ApiOperation({ summary: "Delete an impact factor by ID." })
    @ApiParam({ name: "id", type: Number, description: "Impact factor identifier to delete", example: 1 })
    @ApiResponse({ status: 200, description: "Impact factor successfully deleted." })
    async deleteFactor(@Param('id') id: string) {
        const deleted = await this.service.deleteFactor(id);
        return simpleResponse(!!deleted, deleted ? 'Factor deleted' : 'Failed to delete factor');
    }

    @Get('get/product/impact/:productId')
    @ApiOperation({ summary: "Get calculated sustainability impact for a product." })
    @ApiParam({ name: "productId", type: Number, description: "Product identifier to calculate impact for", example: 2590 })
    @ApiResponse({ status: 200, description: "Calculated product impact metrics." })
    @RequireGate(GateCode.CODE_SUCU)
    async getProductImpact(@Param('productId') productId: string) {
        return keyedResponse('impact', await this.service.getProductImpact(productId));
    }

    // ─── Custom-order impact (Loom ImpactFactorController) ───────────────────

    /**
     * Loom: ImpactFactorController.getCustomOrderImpact — CODE_SUCU, response
     * key `impact` (ResponseParameter.IMPACT).
     *
     * The tenant scope is Loom's: a super user reads ANY custom order, a plain
     * customer only their own. The scope comes from the JWT via @CurrentTenant,
     * never from the path or query — otherwise any customer could read any
     * order's impact. An order outside scope returns the same zeroed summary as
     * one that does not exist (Loom's ImpactSummary.emptyOrder), so the route
     * is not an existence oracle.
     */
    @Get('get/impact/custom-order/aggregation')
    @RequireGate(GateCode.CODE_SU)
    @ApiOperation({ summary: "Aggregated impact totals across all custom orders." })
    @ApiResponse({ status: 200, description: "Custom-order impact aggregation." })
    async getCustomOrderImpactAggregation() {
        return keyedResponse('impactAggregation', await this.service.getCustomImpactAggregation());
    }

    @Get('get/impact/custom-order/:customOrderId')
    @RequireGate(GateCode.CODE_SUCU)
    @ApiOperation({ summary: "Impact summary for one custom order." })
    @ApiParam({ name: 'customOrderId', type: Number, example: 1 })
    @ApiResponse({ status: 200, description: "Custom order impact summary." })
    async getCustomOrderImpact(
        @Param('customOrderId') customOrderId: string,
        @CurrentTenant() tenant: AuthenticatedTenant,
    ) {
        const orderId = Number.parseInt(customOrderId, 10);
        if (!Number.isInteger(orderId) || orderId <= 0) {
            throw new BadRequestException('customOrderId must be a positive integer.');
        }
        return keyedResponse('impact', await this.service.getCustomOrderImpact(orderId, tenantScopeOf(tenant)));
    }

    /**
     * Loom: ImpactFactorController.triggerCustomOrderImpact — CODE_SU, response
     * key `impactCalculation` (ResponseParameter.IMPACT_CALCULATION).
     *
     * Loom passes `null` as the tenant scope here (unlike the read above): the
     * gate is already superuser-only, so the recalculation covers any order.
     */
    @Post('trigger/impact/custom-order/:customOrderId')
    @RequireGate(GateCode.CODE_SU)
    @ApiOperation({ summary: "Recalculate and persist impact rows for one custom order." })
    @ApiParam({ name: 'customOrderId', type: Number, example: 1 })
    @ApiResponse({ status: 200, description: "Custom order impact recalculation result." })
    async triggerCustomOrderImpact(@Param('customOrderId') customOrderId: string) {
        const orderId = Number.parseInt(customOrderId, 10);
        if (!Number.isInteger(orderId) || orderId <= 0) {
            throw new BadRequestException('customOrderId must be a positive integer.');
        }
        return keyedResponse(
            'impactCalculation',
            await this.customOrderImpactService.calculateCustomOrderImpact(orderId, null),
        );
    }
}

/**
 * Loom: `superUser ? null : tenant` in getCustomOrderImpact. null means "no
 * tenant restriction"; anything else restricts the query to that tenant.
 */
function tenantScopeOf(tenant: AuthenticatedTenant | undefined): number | null {
    const roles = (tenant?.roles ?? []) as readonly string[];
    if (roles.includes('ROLE_GOD_MODE') || roles.includes('ROLE_SUPER_USER')) return null;
    const id = Number(tenant?.tenantId ?? tenant?.id ?? 0);
    // A CODE_SUCU caller that is neither SU nor a resolvable tenant gets a
    // scope that can match nothing, rather than an unscoped read.
    return Number.isInteger(id) && id > 0 ? id : -1;
}
