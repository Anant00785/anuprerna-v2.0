import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ImageService } from "./image.service.js";

@ApiTags("image")
@Controller({ path: ["image", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

