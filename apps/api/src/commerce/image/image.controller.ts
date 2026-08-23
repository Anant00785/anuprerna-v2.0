import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ImageService } from "./image.service.js";

@ApiTags("Image")
@Controller()
export class ImageController {
  constructor(private readonly service: ImageService) {}

  @Get("get/image")
  @ApiOperation({ summary: "Get all image records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/image")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a image record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

