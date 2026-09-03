import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { BadRequestException, Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from '../service/notification.service.js';
import { parsePaginationInput } from '../dto/notification.dto.js';
import { EmailNotificationTriggerType } from '../types/notification.types.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';

@ApiBearerAuth()
@ApiTags("Notifications")
@Controller()
@UseGuards(RolesGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Ports ReportMapper.SEND_EMAIL_ORDER_NOTIFICATION / OrderEmailTriggerService.trigger:
     * the recipient and customer name are reloaded from the order, never taken
     * from the caller (the previous implementation hardcoded
     * customer@example.com).
     */
    @Post('retrigger/email/order/:orderId')
    @RequireGate(GateCode.CODE_SU)
    async retriggerOrderEmail(
        @Param('orderId') orderId: string,
        @Query('triggerType') triggerType?: string,
    ) {
        if (!/^\d+$/.test(orderId)) throw new BadRequestException('Invalid Order ID');
        const type = triggerType && triggerType in EmailNotificationTriggerType
            ? EmailNotificationTriggerType[triggerType as keyof typeof EmailNotificationTriggerType]
            : EmailNotificationTriggerType.ORDER_CONFIRMATION;
        const success = await this.notificationService.triggerOrderEmail(BigInt(orderId), type);
        return simpleResponse(success, success ? 'Email retriggered successfully' : 'Email retrigger failed');
    }

    @Get('get/table-explorer/data/email-notification-history')
    @RequireGate(GateCode.CODE_SU)
    async getHistoryData(@Query() query: Record<string, unknown>) {
        const { page, size } = parsePaginationInput(query);
        const history = await this.notificationService.getHistory(page, size);
        return keyedResponse('emailHistory', history);
    }

    @Get('get/table-explorer/data/email-notification-history/:id')
    @RequireGate(GateCode.CODE_SU)
    async getHistoryDataById(@Param('id') id: string) {
        if (!/^\d+$/.test(id)) throw new BadRequestException('Invalid ID');
        const record = await this.notificationService.getHistoryById(BigInt(id));
        return keyedResponse('emailHistoryRecord', record);
    }
}
