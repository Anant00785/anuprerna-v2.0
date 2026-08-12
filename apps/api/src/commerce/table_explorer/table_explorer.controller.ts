import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { TableExplorerService } from "./table_explorer.service.js";

@ApiTags("table_explorer")
@Controller()
export class TableExplorerController {
  constructor(private readonly service: TableExplorerService) {}

  @Get("get/table_explorer")
  @ApiOperation({ summary: "Get all table_explorer records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/table_explorer")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a table_explorer record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

