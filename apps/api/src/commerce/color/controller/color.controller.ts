/**
 * apps/api/src/commerce/color/controller/color.controller.ts
 *
 * LOOM-style controller for Color.
 * Route: GET /get/color-list
 */
import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import { color } from "../../../database/schema/schema.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../../database/schema/schema.js";
import { keyedResponse } from "../../../common/response/rain-response.js";

@Controller()
@ApiTags("Color")
export class ColorLoomController {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  @Get("/get/color-list")
  @ApiOperation({ summary: "Get the full list of colors." })
  async getColorList() {
    const results = await this.db.select({
      id: color.id,
      name: color.name,
      hex: color.hex,
    }).from(color).orderBy(color.name);

    return keyedResponse("entityList", results);
  }
}
