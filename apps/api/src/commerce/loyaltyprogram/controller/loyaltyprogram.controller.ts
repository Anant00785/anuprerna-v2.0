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
import { Controller, Get, Patch, UseGuards, Body, Param } from "@nestjs/common";
import { IsOptional, IsString, IsNumber, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { LoyaltyprogramService } from "../service/loyaltyprogram.service.js";

export class UpdateLoyaltyProgramConfigDto {
  @ApiPropertyOptional({ example: 50935568, description: "Loyalty Program Config ID (e.g. 50935568, 78689120)" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional({ example: 50934301, description: "Customer ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;

  @ApiPropertyOptional({ example: "EUR", description: "Currency (EUR, GBP, USD, INR)" })
  @IsOptional()
  @IsString()
  minOrderValueCurrency?: string;

  @ApiPropertyOptional({ example: 1000, description: "Minimum order value" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minOrderValue?: number;

  @ApiPropertyOptional({ example: 12, description: "Discount percentage" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 1, description: "Tenure in months" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tenure?: number;

  @ApiPropertyOptional({ example: true, description: "Is loyalty config active" })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@ApiBearerAuth()
@ApiTags("Loyalty Program")
@Controller()
@UseGuards(RolesGuard)
export class LoyaltyprogramController {
  constructor(private readonly service: LoyaltyprogramService) {}

  @Get("/get/loyalty-program/config")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get current active loyalty program configuration" })
  @ApiResponse({ status: 200, description: "Active loyalty config" })
  async getConfig() {
    return keyedResponse("config", await this.service.getConfig());
  }

  @Patch("/update/loyalty-program/config")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update loyalty program configuration" })
  @ApiBody({ type: UpdateLoyaltyProgramConfigDto })
  @ApiResponse({ status: 200, description: "Config updated successfully" })
  async updateConfig(@Body() body: UpdateLoyaltyProgramConfigDto) {
    const updated = await this.service.updateConfig(body);
    return {
      success: true,
      message: "Config updated successfully.",
      config: updated,
    };
  }

  @Get("/get/customer/loyalty-info")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Get loyalty tier and discount information for customer" })
  @ApiResponse({ status: 200, description: "Customer loyalty program details" })
  async getCustomerInfo() {
    return keyedResponse("info", await this.service.getCustomerInfo());
  }

  @Get("/get/table-explorer/data/loyalty-program-config")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for Loyalty Program configurations" })
  @ApiResponse({ status: 200, description: "List of loyalty configs" })
  async exploreConfig() {
    return keyedResponse("data", await this.service.exploreConfig());
  }

  @Get("/get/table-explorer/data/loyalty-program-config/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Loyalty Program configuration by ID" })
  @ApiParam({ name: "id", example: 50935568, type: Number })
  @ApiResponse({ status: 200, description: "Loyalty config details" })
  async exploreConfigById(@Param("id") id: string) {
    return keyedResponse("data", await this.service.exploreConfigById(id));
  }

  @Get("/get/table-explorer/data/loyalty-program-config-audit-log")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for Loyalty Program audit logs" })
  @ApiResponse({ status: 200, description: "Loyalty audit logs" })
  async exploreAuditLog() {
    return keyedResponse("data", await this.service.exploreAuditLog());
  }

  @Get("/get/table-explorer/data/loyalty-program-config-audit-log/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Loyalty Program audit log by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Audit log details" })
  async exploreAuditLogById(@Param("id") id: string) {
    return keyedResponse("data", await this.service.exploreAuditLogById(id));
  }
}
