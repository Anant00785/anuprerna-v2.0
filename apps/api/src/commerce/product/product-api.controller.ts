import { Controller, Get, Inject, Logger, Param, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { ProductService } from "./product.service.js";
import { product } from "../../database/schema/index.js";

class ProductPaginationQueryDto {
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

class ProductIdParamDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() price!: string;
  @ApiProperty() productGroup!: string;
  @ApiProperty() disabled!: boolean;
}

class ProductPageResponseDto {
  @ApiProperty({ example: "ok" }) status!: "ok";
  @ApiProperty({ type: [ProductResponseDto] }) data!: ProductResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() offset!: number;
}

class ProductSingleResponseDto {
  @ApiProperty({ example: "ok" }) status!: "ok";
  @ApiProperty({ type: ProductResponseDto }) data!: ProductResponseDto;
}

@ApiTags("Product")
@Controller("product")
export class ProductApiController {
  private readonly logger = new Logger(ProductApiController.name);

  constructor(private readonly service: ProductService) {}

  @Get()
  @ApiOperation({ summary: "List products with pagination" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 100, minimum: 1, maximum: 100, description: "Optional page size; defaults to 100 if omitted." })
  @ApiQuery({ name: "offset", required: false, type: Number, example: 0, minimum: 0, description: "Optional starting offset for pagination." })
  @ApiOkResponse({ type: ProductPageResponseDto })
  @ApiBadRequestResponse({ description: "Invalid pagination values." })
  async findAll(@Query() query: ProductPaginationQueryDto): Promise<ProductPageResponseDto> {
    const { rows, total } = await this.service.findAll(query.limit, query.offset);
    const data = rows.map(toProductResponse);
    this.logger.log(`Returning ${data.length} products (total=${total}, limit=${query.limit}, offset=${query.offset}).`);
    return { status: "ok", data, total, limit: query.limit, offset: query.offset };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a product by id" })
  @ApiParam({ name: "id", type: Number, description: "Product ID" })
  @ApiOkResponse({ type: ProductSingleResponseDto })
  @ApiBadRequestResponse({ description: "id must be a positive integer." })
  @ApiNotFoundResponse({ description: "Product was not found." })
  async findOne(@Param() params: ProductIdParamDto): Promise<ProductSingleResponseDto> {
    const row = await this.service.findOne(params.id);
    const data = toProductResponse(row);
    this.logger.log(`Returning product id=${params.id}.`);
    return { status: "ok", data };
  }
}

function toProductResponse(row: typeof product.$inferSelect): ProductResponseDto {
  return {
    id: row.id.toString(),
    name: row.name,
    sku: row.sku,
    slug: row.slug,
    price: row.price,
    productGroup: row.productGroup,
    disabled: row.disabled,
  };
}
