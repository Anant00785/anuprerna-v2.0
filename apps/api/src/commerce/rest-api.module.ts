// ============================================================================
// UNREGISTERED — DO NOT WIRE INTO ANY MODULE. Read before touching this file.
// ============================================================================
// `RestApiControllers` below is auto-generated placeholder CRUD scaffolding:
// each of the ~50 names in `resources` gets identical GET/GET:id/POST/PATCH/
// DELETE handlers that delegate to `CommerceDataService`, which resolves a
// table named `commerce_<resource>` and `CREATE TABLE IF NOT EXISTS`es a
// generic (id, name, payload jsonb) table on first use. There are zero
// `commerce_*` tables in the real schema, so every one of these would create
// an empty side table and serve nothing from the real 116-table database.
//
// 25 of the 50 names (address, ai, color, content, discount, feedback,
// filter, forex, image, impact, inventory, loyaltyprogram, material,
// navigation, order, pattern, payment, review, search, seo, settings,
// shipment, tenant, whatsapp) collide with routes a REAL registered module
// already serves at the same path (see each resource's own
// `<resource>.module.ts`, imported by `commerce.module.ts`). If this array
// were ever spread into a module's `controllers`/`imports`, it would shadow
// those real routes with the generic blob-table handlers above.
//
// As of this audit (2026-08-12, branch chore/agent-substrate) this file is
// verified dead code: `RestApiControllers` has never been imported anywhere
// (`git log --all -S"RestApiControllers"` shows only its own definition
// commit, 604761f). Neither `commerce.module.ts` nor `app.module.ts`
// reference it. So today it is already unroutable — there is nothing to
// unregister. This comment exists so nobody "fixes" that by wiring it in.
//
// Before deleting this file (see docs/KNOWN-GAPS.md, "The 116 controllers
// number is real but badly misleading"): confirm each real per-resource
// module actually has migrated logic (several, per KNOWN-GAPS, are
// themselves thin generic CommerceDataService wrappers pending a real port —
// e.g. order/), then delete this file and its `resources` list entry
// together with the real controller landing, per JC-5 in the integration
// plan. Do not delete just because it's unused; the plan is deliberate
// about a one-release grace period first.
// ============================================================================
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
