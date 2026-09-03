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
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiProperty,
} from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import * as schema from "../../database/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

// Field names mirror Loom's LoyaltyProgramConfig entity (what the CMS
// wholesale screen actually posts). LoyaltyProgramConfigValidator requires
// every one of them (> 0, percentage <= 100) — no defaults are invented.
export class EnableLoyaltyProgramDto {
  @ApiProperty({ example: 50934301, description: "Customer ID to enroll into loyalty program" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  customerId!: number;

  @ApiProperty({ example: "EUR", description: "Currency (EUR, GBP, USD, INR)" })
  @IsNotEmpty()
  @IsString()
  minimumOrderValueCurrency!: string;

  @ApiProperty({ example: 1000, description: "Minimum order value in the given currency" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  minimumOrderValue!: number;

  @ApiProperty({ example: 90000, description: "Minimum order value converted to INR" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  minimumOrderValueINR!: number;

  @ApiProperty({ example: 90.5, description: "Exchange rate used for the INR conversion" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  exchangeRate!: number;

  @ApiProperty({ example: 12, description: "Discount percentage" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  discountPercentage!: number;

  @ApiProperty({ example: 1, description: "Tenure in months" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  tenure!: number;
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
    // Mirrors Loom's LoyaltyProgramConfigValidator: every field is required
    // and positive; percentage capped at 100. A missing value is a 400, never
    // an enrollment of customer 50934301 on invented EUR/1000/12% terms.
    if (!body || !(Number(body.customerId) > 0)) {
      throw new BadRequestException("customerId is required");
    }
    if (!body.minimumOrderValueCurrency) {
      throw new BadRequestException("minimumOrderValueCurrency is required");
    }
    if (!(Number(body.minimumOrderValue) > 0)) {
      throw new BadRequestException("minimumOrderValue must be a positive number");
    }
    if (!(Number(body.minimumOrderValueINR) > 0)) {
      throw new BadRequestException("minimumOrderValueINR must be a positive number");
    }
    if (!(Number(body.exchangeRate) > 0)) {
      throw new BadRequestException("exchangeRate must be a positive number");
    }
    if (!(Number(body.discountPercentage) > 0) || Number(body.discountPercentage) > 100) {
      throw new BadRequestException("discountPercentage must be between 0 and 100");
    }
    if (!(Number(body.tenure) > 0)) {
      throw new BadRequestException("tenure must be a positive number");
    }

    const customerId = Number(body.customerId);
    const currency = body.minimumOrderValueCurrency;
    const minOrderVal = String(body.minimumOrderValue);
    const minOrderValInr = String(body.minimumOrderValueINR);
    const exchangeRate = String(body.exchangeRate);
    const discount = String(body.discountPercentage);
    const tenure = Number(body.tenure);
    const now = Date.now();
    const endDate = now + tenure * 30 * 24 * 60 * 60 * 1000;

    // Check if already exists
    const existing = await this.db
      .select()
      .from(schema.loyaltyProgramConfig)
      .where(eq(schema.loyaltyProgramConfig.customerId, customerId))
      .limit(1);

    let resultRecord: typeof schema.loyaltyProgramConfig.$inferSelect | undefined;
    if (existing && existing.length > 0) {
      const [updated] = await this.db
        .update(schema.loyaltyProgramConfig)
        .set({
          minOrderValueCurrency: currency,
          minOrderValue: minOrderVal,
          minOrderValueInr: minOrderValInr,
          exchangeRate: exchangeRate,
          discountPercentage: discount,
          tenure: tenure,
          active: true,
          updatedAt: now,
        })
        .where(eq(schema.loyaltyProgramConfig.id, existing[0].id))
        .returning();
      resultRecord = updated;
    } else {
      const [inserted] = await this.db
        .insert(schema.loyaltyProgramConfig)
        .values({
          customerId: customerId,
          minOrderValueCurrency: currency,
          minOrderValue: minOrderVal,
          minOrderValueInr: minOrderValInr,
          exchangeRate: exchangeRate,
          tenure: tenure,
          discountPercentage: discount,
          startDate: now,
          endDate: Number(endDate),
          active: true,
          createdAt: now,
        })
        .returning();
      resultRecord = inserted;
    }

    return keyedResponse("data", resultRecord ? [formatLoyaltyConfig(resultRecord)] : []);
  }
}
