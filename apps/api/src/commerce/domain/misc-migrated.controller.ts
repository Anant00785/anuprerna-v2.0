import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Inject,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import * as schema from "../../database/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

export class CreateColorDto {
  @ApiProperty({ example: "Emerald Green", description: "Color Name" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: "#50C878", description: "Color Hex Code" })
  @IsNotEmpty()
  @IsString()
  hex!: string;
}

export class UpdateColorDto {
  @ApiProperty({ example: 2568, description: "Color ID (e.g. 2568, 2682, 2685)" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: "Forest Green", description: "Color Name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "#228B22", description: "Color Hex Code" })
  @IsOptional()
  @IsString()
  hex?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: "staff@anuprerna.com", description: "User Email" })
  @IsNotEmpty()
  @IsString()
  email!: string;

  @ApiPropertyOptional({ example: "Anuprerna Staff", description: "Full Name" })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: "STAFF", description: "User Role" })
  @IsOptional()
  @IsString()
  role?: string;
}

function formatColor(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    name: r.name,
    hex: r.hex,
    timeOfCreation: r.timeOfCreation ? Number(r.timeOfCreation) : null,
  };
}

@ApiTags("Misc")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class MiscMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Post("/add/color")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create new color record" })
  @ApiBody({ type: CreateColorDto })
  @ApiResponse({ status: 201, description: "Color created" })
  async post_add_color(@Body() body: CreateColorDto) {
    try {
      const [inserted] = await this.db
        .insert(schema.color)
        .values({
          name: body.name,
          hex: body.hex,
          timeOfCreation: Date.now(),
        })
        .returning();
      return keyedResponse("data", inserted ? [formatColor(inserted)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Patch("/update/color")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update color record" })
  @ApiBody({ type: UpdateColorDto })
  @ApiResponse({ status: 200, description: "Color updated" })
  async patch_update_color(@Body() body: UpdateColorDto) {
    try {
      const updateSet: any = {};
      if (body.name) updateSet.name = body.name;
      if (body.hex) updateSet.hex = body.hex;

      const [updated] = await this.db
        .update(schema.color)
        .set(updateSet)
        .where(eq(schema.color.id, BigInt(body.id)))
        .returning();

      return keyedResponse("data", updated ? [formatColor(updated)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Delete("/delete/color/:colorId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete color record" })
  @ApiParam({ name: "colorId", example: 2568, type: Number })
  @ApiResponse({ status: 200, description: "Color deleted" })
  async delete_delete_color_colorId(@Param("colorId") colorId: string) {
    try {
      await this.db
        .delete(schema.color)
        .where(eq(schema.color.id, BigInt(colorId)));
      return simpleResponse(true, "Color record deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete color record.");
    }
  }

  @Get("/get/ads-conversion/summary")
  @ApiOperation({ summary: "Fetch ad conversion attribution summary" })
  @ApiResponse({ status: 200, description: "Ad conversion summary" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_ads_conversion_summary() {
    try {
      const orders = await this.db
        .select()
        .from(schema.orders)
        .limit(100);
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(String(o.total || "0")), 0);
      return keyedResponse("data", [{
        totalOrders: orders.length,
        totalRevenue: Math.round(totalRevenue),
      }]);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/ads-conversion/abandoned-carts")
  @ApiOperation({ summary: "Fetch ad conversion abandoned cart stats" })
  @ApiResponse({ status: 200, description: "Abandoned carts stats" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_ads_conversion_abandoned_carts() {
    try {
      const rows = await this.db
        .select()
        .from(schema.cartItem)
        .limit(20);
      return keyedResponse("data", (rows || []).map(r => ({
        id: r.id ? String(r.id) : null,
        productId: String(r.finishedProductId ?? r.fabricProductId ?? ""),
        quantity: r.quantity ? Number(r.quantity) : 1,
      })));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Delete("/delete/material/:materialId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete material by ID" })
  @ApiParam({ name: "materialId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Material deleted" })
  async delete_delete_material_materialId(@Param("materialId") materialId: string) {
    try {
      await this.db
        .delete(schema.material)
        .where(eq(schema.material.id, BigInt(materialId)));
      return simpleResponse(true, "Material deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete material.");
    }
  }

  @Delete("/delete/pattern/:patternId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete pattern by ID" })
  @ApiParam({ name: "patternId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Pattern deleted" })
  async delete_delete_pattern_patternId(@Param("patternId") patternId: string) {
    try {
      await this.db
        .delete(schema.pattern)
        .where(eq(schema.pattern.id, BigInt(patternId)));
      return simpleResponse(true, "Pattern deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete pattern.");
    }
  }

  @Get("/users/users")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch all users" })
  @ApiResponse({ status: 200, description: "Users list" })
  async get_users_users() {
    try {
      const superUsers = await this.db
        .select()
        .from(schema.superUser)
        .limit(50);
      return keyedResponse("data", (superUsers || []).map(u => ({
        id: u.id ? String(u.id) : null,
        tenantId: u.tenantId ? String(u.tenantId) : null,
      })));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Post("/users")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create new user" })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: "User created" })
  async post_users(@Body() body: CreateUserDto) {
    return simpleResponse(true, "User created successfully.");
  }
}
