// @ts-nocheck
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from '../service/notification.service.js';
import { parsePaginationInput } from '../dto/notification.dto.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';

@ApiBearerAuth()
@ApiTags("Notifications")
@Controller()
@UseGuards(RolesGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Post('retrigger/email/order/:orderId')
    @RequireGate(GateCode.CODE_SU)
    async retriggerOrderEmail(@Param('orderId') orderId: string) {
        const id = parseInt(orderId, 10);
        if (isNaN(id)) throw new Error('Invalid Order ID');
        // hardcoded for demo, normally fetched from context/db
        const success = await this.notificationService.triggerOrderEmail(id, 'customer@example.com', 'Customer');
        return simpleResponse(success, success ? 'Email retriggered successfully' : 'Email retrigger failed');
    }

    @Get('get/table-explorer/data/email-notification-history')
    async getHistoryData(@Query() query: any) {
        const { page, size } = parsePaginationInput(query);
        const history = await this.notificationService.getHistory(page, size);
        return keyedResponse('emailHistory', history);
    }

    @Get('get/table-explorer/data/email-notification-history/:id')
    async getHistoryDataById(@Param('id') id: string) {
        const recordId = parseInt(id, 10);
        if (isNaN(recordId)) throw new Error('Invalid ID');
        const record = await this.notificationService.getHistoryById(recordId);
        return keyedResponse('emailHistoryRecord', record);
    }
}
