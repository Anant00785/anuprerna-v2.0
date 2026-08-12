import { Controller, Get, Inject, Logger, Param } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiProperty, ApiTags } from "@nestjs/swagger";
import { CatalogItemService } from "../service/catalog-item.service.js";
import { catalogItem } from "../../../database/schema/index.js";

class CatalogItemResponseDto {
  @ApiProperty({ example: "123" }) id!: string;
  @ApiProperty({ example: "123" }) version!: string;
  @ApiProperty({ example: "Handmade Vase" }) name!: string;
  @ApiProperty({ example: "12.50" }) price!: string;
  @ApiProperty({ example: "INR" }) currency!: string;
  @ApiProperty({ example: 10 }) quantity!: number;
  @ApiProperty({ example: "A ceramic vase." }) description!: string;
  @ApiProperty({ example: 1 }) catalogId!: number;
  @ApiProperty({ example: 1690000000000 }) createdAt!: number;
  @ApiProperty({ example: 1690000000000 }) updatedAt!: number;
}

class CatalogItemSingleResponseDto {
  @ApiProperty({ example: "ok" }) status!: "ok";
  @ApiProperty({ type: CatalogItemResponseDto }) data!: CatalogItemResponseDto;
}

class CatalogItemListResponseDto {
  @ApiProperty({ example: "ok" }) status!: "ok";
  @ApiProperty({ type: [CatalogItemResponseDto] }) data!: CatalogItemResponseDto[];
}

@ApiTags("Catalog")
@Controller("catalog-item")
export class CatalogItemController {
  private readonly logger = new Logger(CatalogItemController.name);

  constructor(private readonly catalogItemService: CatalogItemService) {}

  @Get()
  @ApiOperation({ summary: "List catalog items" })
  @ApiOkResponse({ type: CatalogItemListResponseDto })
  async findAll(): Promise<CatalogItemListResponseDto> {
    const rows = await this.catalogItemService.findAll();
    const data = rows.map(toCatalogItemResponse);
    this.logger.log(`Returning ${data.length} catalog items.`);
    return { status: "ok", data };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a catalog item by id" })
  @ApiParam({ name: "id", type: Number, description: "Catalog item ID" })
  @ApiOkResponse({ type: CatalogItemSingleResponseDto })
  @ApiNotFoundResponse({ description: "Catalog item was not found." })
  async findOne(@Param("id") id: string): Promise<CatalogItemSingleResponseDto> {
    const row = await this.catalogItemService.findById(BigInt(id));
    const data = toCatalogItemResponse(row);
    this.logger.log(`Returning catalog item id=${id}.`);
    return { status: "ok", data };
  }
}

function toCatalogItemResponse(row: typeof catalogItem.$inferSelect): CatalogItemResponseDto {
  return {
    id: row.id.toString(),
    version: row.version.toString(),
    name: row.name,
    price: row.price,
    currency: row.currency,
    quantity: row.quantity,
    description: row.description ?? "",
    catalogId: row.catalogId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
