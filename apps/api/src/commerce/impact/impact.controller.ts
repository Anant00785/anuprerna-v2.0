import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { GateCode } from "../../auth/types/auth.types.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ImpactService } from "./impact.service.js";

@ApiTags("Impact")
@Controller()
@UseGuards(RolesGuard)
export class ImpactController {
  constructor(private readonly service: ImpactService) {}

  @Get("get/impact")
  @ApiOperation({ summary: "Get all impact records" })
  @RequireGate(GateCode.CODE_SU)
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/impact")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a impact record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  @RequireGate(GateCode.CODE_SU)
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

