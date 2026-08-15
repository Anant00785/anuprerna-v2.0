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

  @Get(["/get/forex/exchange-rate/list", "/get/forex-exchange-rate-list", "/get/data-dump/forex"])
  @ApiOperation({ summary: "Get all forex exchange rates history dump" })
  @ApiResponse({ status: 200, description: "List of all exchange rate history" })
  async getExchangeRates() {
    const rates = await this.service.getAllExchangeRates();
    return {
      success: true,
      message: "",
      data: rates,
      exchangeRateList: rates,
    };
  }

  @Get(["/get/forex-exchange-rate/latest", "/get/forex/exchange-rate/latest"])
  @ApiOperation({ summary: "Get latest live exchange rates" })
  @ApiResponse({ status: 200, description: "Latest exchange rates" })
  async getLatestExchangeRate() {
    const rate = await this.service.getExchangeRateByCode("LATEST");
    return {
      success: true,
      message: "",
      data: rate ? [rate] : [],
      exchangeRate: rate,
    };
  }

  @Get(["/get/forex/list", "/get/forex-list"])
  @ApiOperation({ summary: "Get all supported forex currencies" })
  @ApiResponse({ status: 200, description: "List of supported forex records" })
  async getForexList() {
    const records = await this.service.getAllForexRecords();
    return {
      success: true,
      message: "",
      data: records,
      forexList: records,
    };
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
