// @ts-nocheck
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { IPLocationService } from '../service/iplocation.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { keyedResponse } from '../../../common/response/rain-response.js';

@ApiBearerAuth()
@ApiTags("Currency & Location")
@Controller('get/iplocation')
@UseGuards(RolesGuard)
export class IPLocationController {
    constructor(private readonly service: IPLocationService) {}

    @Get('current')
    async getCurrentIPLocation(@Req() req: Request) {
        let ip = req.headers['x-forwarded-for'] as string;
        if (!ip) {
            ip = req.socket?.remoteAddress || '127.0.0.1';
        }
        if (Array.isArray(ip)) ip = ip[0];
        
        const data = await this.service.getCurrencyCountryFromIPAddress(ip);
        return keyedResponse('location', data);
    }


    @Get(':ip')
    async getIPLocation(@Param('ip') ip: string) {
        const data = await this.service.getCurrencyCountryFromIPAddress(ip);
        return keyedResponse('location', data);
    }
}
