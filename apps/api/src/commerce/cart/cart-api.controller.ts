import { Controller, Get, Inject, Logger, Param, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { CartService } from "./cart.service.js";
import { cartItem } from "../../database/schema/index.js";

export class CartPaginationQueryDto {
  @ApiPropertyOptional({ default: 100, minimum: 1, maximum: 100, description: "Optional page size; defaults to 100 if omitted." })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 100;

  @ApiPropertyOptional({ default: 0, minimum: 0, description: "Optional starting offset for pagination." })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}

export class CartIdParamDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class CartItemResponseDto {
  @ApiProperty({ example: "123" }) id!: string;
  @ApiProperty({ example: "1" }) version!: string;
  @ApiProperty({ example: 42 }) tenantId!: number;
  @ApiPropertyOptional({ example: 1001, nullable: true }) fabricProductId!: number | null;
  @ApiPropertyOptional({ example: 2001, nullable: true }) finishedProductId!: number | null;
  @ApiPropertyOptional({ nullable: true }) selectedFabricId!: number | null;
  @ApiPropertyOptional({ nullable: true }) selectedSizeOptionId!: number | null;
  @ApiProperty({ example: "" }) selectedFinishId!: string;
  @ApiProperty({ type: Object }) customSize!: unknown;
  @ApiProperty() productGroup!: string;
  @ApiProperty({ enum: ["CART", "ORDER"] }) orderType!: string;
  @ApiProperty({ example: "1.00" }) quantity!: string;
  @ApiProperty({ example: "0.00" }) makingCharge!: string;
  @ApiProperty() lastUpdatedAt!: number;
  @ApiProperty({ enum: ["METER", "UNIT"] }) unit!: string;
  @ApiPropertyOptional({ nullable: true }) clickId!: string | null;
  @ApiPropertyOptional({ nullable: true }) clickIdType!: string | null;
  @ApiPropertyOptional({ nullable: true }) clickCapturedAt!: number | null;
  @ApiPropertyOptional({ nullable: true }) utmSource!: string | null;
  @ApiPropertyOptional({ nullable: true }) utmMedium!: string | null;
  @ApiPropertyOptional({ nullable: true }) utmCampaign!: string | null;
}

export class CartPageResponseDto {
  @ApiProperty({ example: "ok" }) status!: "ok";
  @ApiProperty({ type: [CartItemResponseDto] }) data!: CartItemResponseDto[];
  @ApiProperty({ example: 12916 }) total!: number;
  @ApiProperty({ example: 100 }) limit!: number;
  @ApiProperty({ example: 0 }) offset!: number;
}

export class CartSingleResponseDto {
  @ApiProperty({ example: "ok" }) status!: "ok";
  @ApiProperty({ type: CartItemResponseDto }) data!: CartItemResponseDto;
}

@ApiTags("Cart")
@Controller("cart")
export class CartApiController {
  private readonly logger = new Logger(CartApiController.name);

  constructor(private readonly service: CartService) {}

  @Get()
  @ApiOperation({ summary: "List cart items with pagination" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 100, minimum: 1, maximum: 100, description: "Optional page size; defaults to 100 if omitted." })
  @ApiQuery({ name: "offset", required: false, type: Number, example: 0, minimum: 0, description: "Optional starting offset for pagination." })
  @ApiOkResponse({ type: CartPageResponseDto })
  @ApiBadRequestResponse({ description: "Invalid pagination values." })
  async findAll(@Query() query: CartPaginationQueryDto): Promise<CartPageResponseDto> {
    const { rows, total } = await this.service.findAll(query.limit, query.offset);
    const data = rows.map(toCartResponse);
    this.logger.log(`Returning ${data.length} cart items (total=${total}, limit=${query.limit}, offset=${query.offset}).`);
    return { status: "ok", data, total, limit: query.limit, offset: query.offset };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a cart item by id" })
  @ApiParam({ name: "id", type: Number, description: "Cart item ID" })
  @ApiOkResponse({ type: CartSingleResponseDto })
  @ApiBadRequestResponse({ description: "id must be a positive integer." })
  @ApiNotFoundResponse({ description: "Cart item was not found." })
  async findOne(@Param() params: CartIdParamDto): Promise<CartSingleResponseDto> {
    const row = await this.service.findOne(params.id);
    const data = toCartResponse(row);
    this.logger.log(`Returning cart item id=${params.id}.`);
    return { status: "ok", data };
  }
}

function toCartResponse(row: typeof cartItem.$inferSelect): CartItemResponseDto {
  return {
    id: row.id.toString(),
    version: row.version.toString(),
    tenantId: row.tenantId,
    fabricProductId: row.fabricProductId,
    finishedProductId: row.finishedProductId,
    selectedFabricId: row.selectedFabricId,
    selectedSizeOptionId: row.selectedSizeOptionId,
    selectedFinishId: row.selectedFinishId ?? "",
    customSize: row.customSize,
    productGroup: row.productGroup,
    orderType: row.orderType,
    quantity: row.quantity,
    makingCharge: row.makingCharge,
    lastUpdatedAt: row.lastUpdatedAt,
    unit: row.unit,
    clickId: row.clickId,
    clickIdType: row.clickIdType,
    clickCapturedAt: row.clickCapturedAt,
    utmSource: row.utmSource,
    utmMedium: row.utmMedium,
    utmCampaign: row.utmCampaign,
  };
}
