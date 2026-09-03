import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
} from "@nestjs/swagger";
import { BadRequestException, Controller, Get, Patch, Query, UseGuards, Body, Param, UnauthorizedException } from "@nestjs/common";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { IsOptional, IsString, IsNumber, IsBoolean, IsInt, IsEnum, IsPositive, Min, Max } from "class-validator";
import { LoyaltyConfigAuditLogType, parsePageInput } from "../types/loyaltyprogram.types.js";
import { Type } from "class-transformer";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { keyedResponse } from "../../../common/response/rain-response.js";
import { LoyaltyprogramService } from "../service/loyaltyprogram.service.js";

/**
 * Ports the LoyaltyProgramConfig body of POST /enable/loyalty-program plus
 * LoyaltyProgramConfigValidator.
 *
 * Every money-bearing field is REQUIRED. They used to be optional and the
 * repository substituted 50000.00 / 10.00 / 1.0000 / customer 50934301 for
 * anything missing, so a partial request fabricated a discount program.
 */
export class UpdateLoyaltyProgramConfigDto {
  @ApiPropertyOptional({ example: 50935568, description: "Existing config id; omit to onboard a new program" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id?: number;

  @ApiProperty({ example: 50934301, description: "Customer ID" })
  @IsNumber()
  @Type(() => Number)
  customerId!: number;

  @ApiProperty({ example: "INR", description: "Currency (EUR, GBP, USD, INR)" })
  @IsString()
  minOrderValueCurrency!: string;

  @ApiProperty({ example: 50000, description: "Minimum order value" })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minOrderValue!: number;

  @ApiProperty({ example: 50000, description: "Minimum order value in INR" })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minOrderValueInr!: number;

  @ApiProperty({ example: 1, description: "Exchange rate used for minOrderValueInr" })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  exchangeRate!: number;

  @ApiProperty({ example: 1, description: "Tenure in months" })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  tenure!: number;

  @ApiProperty({ example: 10, description: "Discount percentage" })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercentage!: number;

  @ApiProperty({ example: true, description: "false deactivates the program (Loom soft-expires; nothing is deleted)" })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ enum: LoyaltyConfigAuditLogType, example: LoyaltyConfigAuditLogType.ADJUSTMENT })
  @IsEnum(LoyaltyConfigAuditLogType)
  type!: LoyaltyConfigAuditLogType;
}

@ApiBearerAuth()
@ApiTags("Loyalty Program")
@Controller()
@UseGuards(RolesGuard)
export class LoyaltyprogramController {
  constructor(private readonly service: LoyaltyprogramService) {}

  /**
   * Loom has no "current active loyalty config" route; the closest counterpart
   * is retrieveLoyaltyProgramConfigDataById, which is always addressed by a
   * customer. The previous implementation returned "the newest active row in
   * the table" — i.e. some arbitrary customer's discount terms — so this now
   * requires the customer whose config is being read.
   */
  @Get("/get/loyalty-program/config")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get a customer's loyalty program configuration" })
  @ApiQuery({ name: "customerId", required: true, type: Number })
  @ApiResponse({ status: 200, description: "Loyalty config for the customer" })
  async getConfig(@Query("customerId") customerId?: string) {
    if (!customerId || !/^\d+$/.test(customerId)) {
      throw new BadRequestException("customerId is required");
    }
    return keyedResponse("config", await this.service.getConfigForCustomer(Number(customerId)));
  }

  @Patch("/update/loyalty-program/config")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update loyalty program configuration" })
  @ApiBody({ type: UpdateLoyaltyProgramConfigDto })
  @ApiResponse({ status: 200, description: "Config updated successfully" })
  async updateConfig(@Body() body: UpdateLoyaltyProgramConfigDto) {
    const updated = await this.service.enableLoyaltyProgram({
      id: body.id === undefined ? null : BigInt(body.id),
      customerId: body.customerId,
      minOrderValueCurrency: body.minOrderValueCurrency,
      minOrderValue: body.minOrderValue,
      minOrderValueInr: body.minOrderValueInr,
      exchangeRate: body.exchangeRate,
      tenure: body.tenure,
      discountPercentage: body.discountPercentage,
      active: body.active,
      type: body.type,
    });
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
  async getCustomerInfo(@CurrentTenant() tenant: AuthenticatedTenant) {
    // Loom resolves the customer from the authorization token
    // (resolveUserInformationFromAuthorizationToken). The previous
    // implementation took no argument at all and returned the newest active
    // config in the whole table, so any logged-in customer read another
    // customer's discount terms.
    const tenantId = tenant?.tenantId ?? tenant?.id;
    if (tenantId === undefined || tenantId === null) {
      throw new UnauthorizedException("No authenticated customer on the request.");
    }
    return keyedResponse("info", await this.service.getCustomerInfo(tenantId));
  }

  /**
   * LoyaltyProgramInfoController#getCustomerLoyaltyOrderList ->
   * getEntity(request, "getCustomerLoyaltyOrderList", CODE_CU,
   * UNAUTH_ORDER_LIST_REQUEST, () -> loyaltyProgramOrderResponse.buildList(...)).
   *
   * Loom resolves the customer with
   * resolveUserInformationFromAuthorizationToken(request.getHeader(AUTHORIZATION))
   * — never from a param — so the tenant here comes from @CurrentTenant and a
   * request without one is rejected rather than falling through to the query's
   * `:tenantId IS NULL` branch, which would return every customer's orders.
   *
   * Envelope: buildList -> `{ orderList: [...] }`, which is the key
   * apps/storefront/src/lib/api/repositories/profile.repository.ts reads.
   */
  @Get("/get/customer/order-list/loyalty")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Customer's loyalty-program orders (regular + custom)." })
  @ApiResponse({ status: 200, description: "Loyalty order list." })
  async getCustomerLoyaltyOrderList(@CurrentTenant() tenant: AuthenticatedTenant) {
    const tenantId = tenant?.tenantId ?? tenant?.id;
    if (tenantId === undefined || tenantId === null) {
      throw new UnauthorizedException("No authenticated customer on the request.");
    }
    const orders = await this.service.getCustomerLoyaltyProgramOrders(BigInt(tenantId));
    return keyedResponse("orderList", orders);
  }

  @Get("/get/table-explorer/data/loyalty-program-config")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for Loyalty Program configurations" })
  @ApiResponse({ status: 200, description: "List of loyalty configs" })
  async exploreConfig(@Query() query: Record<string, unknown>) {
    const { page, size } = parsePageInput(query);
    return keyedResponse("data", await this.service.exploreConfig(page, size));
  }

  @Get("/get/table-explorer/data/loyalty-program-config/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Loyalty Program configuration by ID" })
  @ApiParam({ name: "id", example: 50935568, type: Number })
  @ApiResponse({ status: 200, description: "Loyalty config details" })
  async exploreConfigById(@Param("id") id: string) {
    if (!/^\d+$/.test(id)) throw new BadRequestException("Invalid id");
    return keyedResponse("data", await this.service.exploreConfigById(BigInt(id)));
  }

  @Get("/get/table-explorer/data/loyalty-program-config-audit-log")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for Loyalty Program audit logs" })
  @ApiResponse({ status: 200, description: "Loyalty audit logs" })
  async exploreAuditLog(@Query() query: Record<string, unknown>) {
    const { page, size } = parsePageInput(query);
    return keyedResponse("data", await this.service.exploreAuditLog(page, size));
  }

  @Get("/get/table-explorer/data/loyalty-program-config-audit-log/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Loyalty Program audit log by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Audit log details" })
  async exploreAuditLogById(@Param("id") id: string) {
    if (!/^\d+$/.test(id)) throw new BadRequestException("Invalid id");
    return keyedResponse("data", await this.service.exploreAuditLogById(BigInt(id)));
  }
}
