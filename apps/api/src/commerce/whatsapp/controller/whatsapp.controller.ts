// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WhatsappService } from '../service/whatsapp.service.js';
import { parseWhatsappOptInInput, parsePaginationInput } from '../dto/whatsapp.dto.js';
import { RolesGuard, RequireGate } from '../../common/auth/roles.guard.js';
import { GateCode } from '../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../common/response/rain-response.js';

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) {}

    @Post('customer/whatsapp/opt-in')
    @RequireGate(GateCode.CODE_CU)
    async optIn(@Body() body: any) {
        const input = parseWhatsappOptInInput(body);
        const success = await this.whatsappService.optIn(input.mobile);
        return simpleResponse(success, 'WhatsApp opt-in successful');
    }

    @Post('customer/whatsapp/opt-out')
    @RequireGate(GateCode.CODE_CU)
    async optOut(@Body() body: any) {
        const input = parseWhatsappOptInInput(body);
        const success = await this.whatsappService.optOut(input.mobile);
        return simpleResponse(success, 'WhatsApp opt-out successful');
    }

    @Post('customer/whatsapp/dismiss')
    @RequireGate(GateCode.CODE_CU)
    async dismiss(@Body() body: any) {
        const input = parseWhatsappOptInInput(body);
        const success = await this.whatsappService.dismiss(input.mobile);
        return simpleResponse(success, 'WhatsApp dismiss successful');
    }

    @Get('get/customers/whatsapp-status')
    @RequireGate(GateCode.CODE_SU)
    async getStatus(@Query() query: any) {
        const { page, size } = parsePaginationInput(query);
        const history = await this.whatsappService.getHistory(page, size);
        return keyedResponse('statusList', history);
    }

    @Get('get/table-explorer/data/whatsapp-notification-history')
    @RequireGate(GateCode.CODE_SU)
    async getHistoryData(@Query() query: any) {
        const { page, size } = parsePaginationInput(query);
        const history = await this.whatsappService.getHistory(page, size);
        return keyedResponse('whatsappHistory', history);
    }

    @Get('get/table-explorer/data/whatsapp-notification-history/:id')
    @RequireGate(GateCode.CODE_SU)
    async getHistoryDataById(@Param('id') id: string) {
        const recordId = parseInt(id, 10);
        if (isNaN(recordId)) throw new Error('Invalid ID');
        const record = await this.whatsappService.getHistoryById(recordId);
        return keyedResponse('whatsappHistoryRecord', record);
    }
}
