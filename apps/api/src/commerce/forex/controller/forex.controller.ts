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
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ForexService } from "../service/forex.service.js";

export class UpdateExchangeRateDto {
  @ApiProperty({ example: "USD", description: "Currency Code (e.g. USD, EUR, GBP, AUD)" })
  @IsNotEmpty()
  @IsString()
  currencyCode!: string;

  @ApiProperty({ example: 84.25, description: "New exchange rate against base currency" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  rate!: number;

  @ApiPropertyOptional({ example: "$", description: "Currency Symbol" })
  @IsOptional()
  @IsString()
  symbol?: string;
}

export class CreateForexDto {
  @ApiProperty({ example: "Australia", description: "Country Name" })
  @IsNotEmpty()
  @IsString()
  country!: string;

  @ApiProperty({ example: "AUD", description: "Currency Code (e.g. USD, EUR, GBP, AUD)" })
  @IsNotEmpty()
  @IsString()
  currency!: string;

  @ApiProperty({ example: 55.40, description: "Exchange rate against base currency" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  rate!: number;
}

export class UpdateForexDto {
  @ApiProperty({ example: 1, description: "Forex ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  forexId!: number;

  @ApiPropertyOptional({ example: "United States", description: "Country Name" })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: "USD", description: "Currency Code" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 84.00, description: "Updated exchange rate" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rate?: number;
}

@ApiTags("Currency & Location")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ForexController {
  constructor(private readonly service: ForexService) {}

  // Loom: ForexExchangeRateController.retrieveForexExchangeRateList
  //   GET /get/forex-exchange-rate-list — NO role gate (calls response.buildList
  //   directly, never getEntity), response key `forexExchangeRateList`.
  @Get(["/get/forex-exchange-rate-list", "/get/forex/exchange-rate/list"])
  @ApiOperation({ summary: "Get all forex exchange rate history" })
  @ApiResponse({ status: 200, description: "List of all exchange rate history" })
  async getExchangeRates() {
    const rates = await this.service.getAllExchangeRates();
    return keyedResponse("forexExchangeRateList", rates);
  }

  // Loom: ForexController.getForexDataDump
  //   GET /get/data-dump/forex — CODE_SU, response key `forexList`, sourced from
  //   the `forex` table (NOT forex_exchange_rate).
  @Get("/get/data-dump/forex")
  @ApiOperation({ summary: "Forex table data dump" })
  @ApiResponse({ status: 200, description: "All forex records" })
  @RequireGate(GateCode.CODE_SU)
  async getForexDataDump() {
    const records = await this.service.getAllForexRecords();
    return keyedResponse("forexList", records);
  }

  // Loom: ForexExchangeRateController.retrieveLatestForexExchangeRate
  //   GET /get/forex-exchange-rate/latest — NO role gate, response key
  //   `forexExchangeRate`. The storefront (unauthenticated SSR fetch, see
  //   apps/storefront/src/lib/loom/endpoints.ts getForex) reads exactly this key.
  @Get(["/get/forex-exchange-rate/latest", "/get/forex/exchange-rate/latest"])
  @ApiOperation({ summary: "Get latest forex exchange rate" })
  @ApiResponse({ status: 200, description: "Latest exchange rate row" })
  async getLatestExchangeRate() {
    const rate = await this.service.getLatestExchangeRate();
    return keyedResponse("forexExchangeRate", rate);
  }

  // Loom: ForexController.getForexList
  //   GET /get/forex-list — NO role gate (calls response.buildList directly),
  //   response key `forexList`. Storefront reads exactly this key.
  @Get(["/get/forex-list", "/get/forex/list"])
  @ApiOperation({ summary: "Get all supported forex currencies" })
  @ApiResponse({ status: 200, description: "List of supported forex records" })
  async getForexList() {
    const records = await this.service.getAllForexRecords();
    return keyedResponse("forexList", records);
  }

  @Get("/get/forex/exchange-rate/:code")
  @ApiOperation({ summary: "Get exchange rate by currency code" })
  @ApiParam({ name: "code", example: "USD", description: "Currency Code (e.g. USD, EUR, GBP)" })
  @ApiResponse({ status: 200, description: "Exchange rate details" })
  async getExchangeRateByCode(@Param("code") code: string) {
    const rate = await this.service.getExchangeRateByCode(code);
    return keyedResponse("exchangeRate", rate);
  }

  @Patch("/update/forex/exchange-rate")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update forex exchange rate" })
  @ApiBody({ type: UpdateExchangeRateDto })
  @ApiResponse({ status: 200, description: "Exchange rate update result" })
  async updateExchangeRate(@Body() body: UpdateExchangeRateDto) {
    const result = await this.service.updateExchangeRate(body.currencyCode, body.rate, body.symbol);
    return simpleResponse(!!result, result ? "Exchange rate updated successfully." : "Failed to update exchange rate.");
  }
}
