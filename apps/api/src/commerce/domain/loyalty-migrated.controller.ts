// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Inject,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import * as schema from "../../database/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

export class EnableLoyaltyProgramDto {
  @ApiProperty({ example: 50934301, description: "Customer ID to enroll into loyalty program" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  customerId!: number;

  @ApiPropertyOptional({ example: "EUR", description: "Currency (EUR, GBP, USD, INR)" })
  @IsOptional()
  @IsString()
  currency?: string;

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
}

function formatLoyaltyConfig(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    customerId: r.customerId ? String(r.customerId) : null,
    minOrderValueCurrency: r.minOrderValueCurrency || "INR",
    minOrderValue: r.minOrderValue ? parseFloat(String(r.minOrderValue)) : 0,
    minOrderValueInr: r.minOrderValueInr ? parseFloat(String(r.minOrderValueInr)) : 0,
    exchangeRate: r.exchangeRate ? parseFloat(String(r.exchangeRate)) : 1,
    tenure: r.tenure ? Number(r.tenure) : 1,
    discountPercentage: r.discountPercentage ? parseFloat(String(r.discountPercentage)) : 0,
    startDate: r.startDate ? Number(r.startDate) : null,
    endDate: r.endDate ? Number(r.endDate) : null,
    active: typeof r.active === "boolean" ? r.active : true,
    createdAt: r.createdAt ? Number(r.createdAt) : null,
    updatedAt: r.updatedAt ? Number(r.updatedAt) : null,
  };
}

@ApiTags("Loyalty Program")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class LoyaltyMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Post("/enable/loyalty-program")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Enable loyalty program features for a customer" })
  @ApiBody({ type: EnableLoyaltyProgramDto })
  @ApiResponse({ status: 201, description: "Loyalty program enabled" })
  async post_enable_loyalty_program(@Body() body: EnableLoyaltyProgramDto) {
    try {
      const customerId = BigInt(body.customerId || 50934301);
      const currency = body.currency || "EUR";
      const minOrderVal = body.minOrderValue ? String(body.minOrderValue) : "1000.00";
      const discount = body.discountPercentage ? String(body.discountPercentage) : "12.00";
      const tenure = body.tenure ? Number(body.tenure) : 1;
      const now = Date.now();
      const endDate = now + tenure * 30 * 24 * 60 * 60 * 1000;

      // Check if already exists
      const existing = await (this.db as any)
        .select()
        .from(schema.loyaltyProgramConfig)
        .where(eq(schema.loyaltyProgramConfig.customerId, customerId))
        .limit(1);

      let resultRecord: any;
      if (existing && existing.length > 0) {
        const [updated] = await (this.db as any)
          .update(schema.loyaltyProgramConfig)
          .set({
            minOrderValueCurrency: currency,
            minOrderValue: minOrderVal,
            discountPercentage: discount,
            tenure: tenure,
            active: true,
            updatedAt: BigInt(now),
          })
          .where(eq(schema.loyaltyProgramConfig.id, existing[0].id))
          .returning();
        resultRecord = updated;
      } else {
        const [inserted] = await (this.db as any)
          .insert(schema.loyaltyProgramConfig)
          .values({
            customerId: customerId,
            minOrderValueCurrency: currency,
            minOrderValue: minOrderVal,
            minOrderValueInr: minOrderVal,
            exchangeRate: "1.0000",
            tenure: tenure,
            discountPercentage: discount,
            startDate: BigInt(now),
            endDate: BigInt(endDate),
            active: true,
            createdAt: BigInt(now),
          })
          .returning();
        resultRecord = inserted;
      }

      return keyedResponse("data", resultRecord ? [formatLoyaltyConfig(resultRecord)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }
}
