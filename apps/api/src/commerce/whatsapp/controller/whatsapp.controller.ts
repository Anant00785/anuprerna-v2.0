// @ts-nocheck
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { Controller, Post, Patch, Get, Body, Param, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { WhatsappService } from "../service/whatsapp.service.js";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";

export class WhatsappOptInDto {
  @ApiPropertyOptional({ example: "+919876543210", description: "Mobile Number with country code" })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 54667705, description: "Customer ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;
}

export class WhatsappDismissDto {
  @ApiPropertyOptional({ example: "+919876543210", description: "Mobile Number" })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 54667705, description: "Customer ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;

  @ApiPropertyOptional({ example: "User dismissed prompt", description: "Dismiss reason" })
  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiBearerAuth()
@ApiTags("Notifications")
@Controller()
@UseGuards(RolesGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post("customer/whatsapp/opt-in")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Opt-in customer to WhatsApp notifications (POST)" })
  @ApiBody({ type: WhatsappOptInDto })
  @ApiResponse({ status: 200, description: "Customer opted in" })
  async optIn(@Body() body: WhatsappOptInDto) {
    const mobile = body?.mobile || "+919876543210";
    const success = await this.whatsappService.optIn(mobile);
    return simpleResponse(true, "Customer opted in to WhatsApp notifications successfully.");
  }

  @Post("customer/whatsapp/opt-out")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Opt-out customer from WhatsApp notifications (POST)" })
  @ApiBody({ type: WhatsappOptInDto })
  @ApiResponse({ status: 200, description: "Customer opted out" })
  async optOut(@Body() body: WhatsappOptInDto) {
    const mobile = body?.mobile || "+919876543210";
    const success = await this.whatsappService.optOut(mobile);
    return simpleResponse(true, "Customer opted out of WhatsApp notifications successfully.");
  }

  @Post("customer/whatsapp/dismiss")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Dismiss WhatsApp prompt for customer (POST)" })
  @ApiBody({ type: WhatsappDismissDto })
  @ApiResponse({ status: 200, description: "WhatsApp prompt dismissed" })
  async dismiss(@Body() body: WhatsappDismissDto) {
    const mobile = body?.mobile || "+919876543210";
    const success = await this.whatsappService.dismiss(mobile);
    return simpleResponse(true, "WhatsApp notification prompt dismissed successfully.");
  }

    @Get('get/customers/whatsapp-status')
    async getStatus(@Query() query: any) {
        const { page, size } = parsePaginationInput(query);
        const history = await this.whatsappService.getHistory(page, size);
        return keyedResponse('statusList', history);
    }

    @Get('get/table-explorer/data/whatsapp-notification-history')
    async getHistoryData(@Query() query: any) {
        const { page, size } = parsePaginationInput(query);
        const history = await this.whatsappService.getHistory(page, size);
        return keyedResponse('whatsappHistory', history);
    }

    @Get('get/table-explorer/data/whatsapp-notification-history/:id')
    async getHistoryDataById(@Param('id') id: string) {
        const recordId = parseInt(id, 10);
        if (isNaN(recordId)) throw new Error('Invalid ID');
        const record = await this.whatsappService.getHistoryById(recordId);
        return keyedResponse('whatsappHistoryRecord', record);
    }
}
