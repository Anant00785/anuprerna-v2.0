import { Controller, Get, Inject, Logger, Param, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { CatalogService } from "./catalog.service.js";
import { catalog } from "../../database/schema/index.js";

class CatalogPaginationQueryDto {
  @ApiPropertyOptional({ default: 100, minimum: 1, maximum: 1000, description: "Optional page size; defaults to 100 if omitted." })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit = 100;

  @ApiPropertyOptional({ default: 0, minimum: 0, description: "Optional starting offset for pagination." })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}

class CatalogIdParamDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

class CatalogResponseDto {
  @ApiProperty({ example: "123" }) id!: string;
  @ApiProperty({ example: "123" }) version!: string;
  @ApiProperty({ example: "Spring Catalog" }) name!: string;
  @ApiProperty({ example: "A product catalog." }) description!: string;
  @ApiProperty({ example: 1 }) artisanId!: number;
  @ApiProperty({ example: false }) defaultCatalog!: boolean;
  @ApiProperty({ example: 1690000000000 }) createdAt!: number;
  @ApiProperty({ example: 1690000000000 }) updatedAt!: number;
}

class CatalogPaginationDto {
  @ApiProperty({ example: 100 }) limit!: number;
  @ApiProperty({ example: 0 }) offset!: number;
  @ApiProperty({ example: 13 }) total!: number;
}

class CatalogPageResponseDto {
  @ApiProperty({ example: "ok" }) status!: "ok";
  @ApiProperty({ type: [CatalogResponseDto] }) data!: CatalogResponseDto[];
  @ApiProperty({ type: CatalogPaginationDto }) pagination!: CatalogPaginationDto;
}

class CatalogSingleResponseDto {
  @ApiProperty({ example: "ok" }) status!: "ok";
  @ApiProperty({ type: CatalogResponseDto }) data!: CatalogResponseDto;
}

@ApiTags("Catalog")
@Controller("catalog")
export class CatalogController {
  private readonly logger = new Logger(CatalogController.name);

  constructor(private readonly service: CatalogService) {}

  @Get()
  @ApiOperation({ summary: "List catalogs with pagination" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 100, minimum: 1, maximum: 1000, description: "Optional page size; defaults to 100 if omitted." })
  @ApiQuery({ name: "offset", required: false, type: Number, example: 0, minimum: 0, description: "Optional starting offset for pagination." })
  @ApiOkResponse({ type: CatalogPageResponseDto })
  @ApiBadRequestResponse({ description: "Invalid pagination values." })
  async findAll(@Query() query: CatalogPaginationQueryDto): Promise<CatalogPageResponseDto> {
    const { rows, total } = await this.service.findAll(query.limit, query.offset);
    const data = rows.map(toCatalogResponse);
    this.logger.log(`Returning ${data.length} catalogs (total=${total}, limit=${query.limit}, offset=${query.offset}).`);
    return { status: "ok", data, pagination: { limit: query.limit, offset: query.offset, total } };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a catalog by id" })
  @ApiParam({ name: "id", type: Number, description: "Catalog ID" })
  @ApiOkResponse({ type: CatalogSingleResponseDto })
  @ApiBadRequestResponse({ description: "id must be a positive integer." })
  @ApiNotFoundResponse({ description: "Catalog was not found." })
  async findOne(@Param() params: CatalogIdParamDto): Promise<CatalogSingleResponseDto> {
    const row = await this.service.findById(params.id);
    const data = toCatalogResponse(row);
    this.logger.log(`Returning catalog id=${params.id}.`);
    return { status: "ok", data };
  }
}

function toCatalogResponse(row: any): CatalogResponseDto {
  return {
    id: String(row.id),
    version: String(row.version),
    name: row.name,
    description: row.description ?? "",
    artisanId: row.artisanId ? Number(row.artisanId) : 0,
    defaultCatalog: Boolean(row.defaultCatalog),
    createdAt: Number(row.createdAt || 0),
    updatedAt: Number(row.updatedAt || 0),
  };
}


