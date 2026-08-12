import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { RestfulService } from "./restful.service.js";

@ApiTags("restful")
@Controller()
export class RestfulController {
  constructor(private readonly service: RestfulService) {}

  @Get("get/restful")
  @ApiOperation({ summary: "Get all restful records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/restful")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a restful record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

