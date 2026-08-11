import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, type Type } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { CommerceDataService } from "./shared/commerce-data.service.js";
import { DATABASE_CONNECTION, type Database } from "../database/database.module.js";

class CreateCommerceRecordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

class UpdateCommerceRecordDto extends CreateCommerceRecordDto {}

function commerceController(resource: string) {
  @ApiTags(resource)
  @Controller(resource)
  class CommerceController {
    private readonly service: CommerceDataService;

    constructor(@Inject(DATABASE_CONNECTION) db: Database) {
      this.service = new CommerceDataService(db, resource);
    }

    @Get()
    @ApiOperation({ summary: `List ${resource} records` })
    async findAll() {
      return { status: "ok" as const, data: await this.service.getAll() };
    }

    @Get(":id")
    @ApiOperation({ summary: `Get a ${resource} record` })
    async findOne(@Param("id") id: string) {
      return { status: "ok" as const, data: await this.service.findOne(id) };
    }

    @Post()
    @ApiOperation({ summary: `Create a ${resource} record` })
    async create(@Body() body: CreateCommerceRecordDto) {
      return { status: "ok" as const, data: await this.service.create(body) };
    }

    @Patch(":id")
    @ApiOperation({ summary: `Update a ${resource} record` })
    async update(@Param("id") id: string, @Body() body: UpdateCommerceRecordDto) {
      return { status: "ok" as const, data: await this.service.update(id, body) };
    }

    @Delete(":id")
    @HttpCode(204)
    @ApiOperation({ summary: `Delete a ${resource} record` })
    async remove(@Param("id") id: string): Promise<void> {
      await this.service.remove(id);
    }
  }

  Reflect.defineMetadata("design:paramtypes", [Object], CommerceController);
  return CommerceController;
}

const resources = [
  "address", "ads_conversion", "ai", "alfred", "artisan", "artisanpayment", "behemoth", "bloomsight",
  "color", "compatibility", "configuration", "content", "diagnostics", "discount",
  "faq", "feedback", "filter", "forex", "image", "impact", "inventory", "iplocation", "loyaltyprogram",
  "material", "misc", "msg91", "navigation", "notification", "nverse", "order", "pattern", "payment",
  "profile", "report", "restful", "review", "search", "seo", "settings", "shipment", "sitemap",
  "skill", "support", "table_explorer", "tenant", "transmission", "utility", "whatsapp", "workflow", "zoho", "zoho_adapter",
] as const;

const controllers = resources.map((resource) => commerceController(resource));

export const RestApiControllers: Type<unknown>[] = controllers;
