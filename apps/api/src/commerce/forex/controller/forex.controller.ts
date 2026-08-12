// @ts-nocheck
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ForexService } from "../service/forex.service.js";

@ApiTags("forex")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ForexController {
  constructor(private readonly service: ForexService) {}

  @Get("/get/forex/exchange-rate/list")
  @ApiOperation({ summary: "Get all forex exchange rates" })
  async getExchangeRates() {
    const rates = await this.service.getAllExchangeRates();
    return keyedResponse("exchangeRateList", rates);
  }

  @Get("/get/forex/exchange-rate/:code")
  @ApiOperation({ summary: "Get exchange rate by currency code" })
  async getExchangeRateByCode(@Param("code") code: string) {
    const rate = await this.service.getExchangeRateByCode(code);
    return keyedResponse("exchangeRate", rate);
  }

  @Patch("/update/forex/exchange-rate")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update forex exchange rate" })
  async updateExchangeRate(@Body() body: { currencyCode: string; rate: number; symbol?: string }) {
    const result = await this.service.updateExchangeRate(body.currencyCode, body.rate, body.symbol);
    return simpleResponse(!!result, result ? "Exchange rate updated successfully." : "Failed to update exchange rate.");
  }

  @Get("/get/forex/list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get all forex records" })
  async getForexList() {
    const records = await this.service.getAllForexRecords();
    return keyedResponse("forexList", records);
  }
}
