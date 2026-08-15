// @ts-nocheck
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { IPLocationService } from "../service/iplocation.service.js";
import { RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse } from "../../../common/response/rain-response.js";

@ApiBearerAuth()
@ApiTags("Currency & Location")
@Controller("get/iplocation")
@UseGuards(RolesGuard)
export class IPLocationController {
  constructor(private readonly service: IPLocationService) {}

  @Get("current")
  @ApiOperation({ summary: "Get country and currency from current request IP" })
  @ApiResponse({ status: 200, description: "Location & currency details" })
  async getCurrentIPLocation(@Req() req: Request) {
    let ip = req.headers["x-forwarded-for"] as string;
    if (!ip) {
      ip = req.socket?.remoteAddress || "127.0.0.1";
    }
    if (Array.isArray(ip)) ip = ip[0];

    const data = await this.service.getCurrencyCountryFromIPAddress(ip);
    return keyedResponse("location", data);
  }

  @Get(":ip")
  @ApiOperation({ summary: "Get country and currency for a given IP" })
  @ApiParam({ name: "ip", example: "8.8.8.8", description: "IP Address" })
  @ApiResponse({ status: 200, description: "Location & currency details" })
  async getIPLocation(@Param("ip") ip: string) {
    const data = await this.service.getCurrencyCountryFromIPAddress(ip);
    return keyedResponse("location", data);
  }
}
