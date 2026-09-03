import * as schema from "../../database/schema/schema.js";
import { Controller, Get, Query, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

@ApiTags("SubCategory")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class SubCategoryMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  // `get_get_featured_categoryName_sub_category` was removed: it carried no
  // @Get decorator, so it was never routed, and its body ignored the
  // categoryName param and selected from `product` instead of `sub_category`.
  // Dead, wrong, and unreachable — see git history if the landing-page
  // "featured sub-categories" idea is ever picked up for real.

  @Get("/get/sub-category-list")
  @ApiOperation({ summary: "Fetch sub-categories" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_sub_category_list(@Query() query: any) {
    // No limit: there are 98 sub_category rows and the previous limit(50)
    // silently served the CMS fewer than half of them. Errors propagate —
    // returning an empty list made a failed query look like an empty table.
    const result = await this.db.select().from(schema.subCategory);
    return keyedResponse("data", result ?? []);
  }
}
