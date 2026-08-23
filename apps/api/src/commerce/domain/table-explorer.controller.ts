// @ts-nocheck
import * as schema from "../../database/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
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
} from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

function formatEntity(r: any) {
  if (!r) return null;
  const result: any = {};
  for (const [k, v] of Object.entries(r)) {
    if (typeof v === "bigint") {
      result[k] = String(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

@ApiTags("Table Explorer")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class TableExplorerDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Get("/get/data-dump/tenant")
  @ApiOperation({ summary: "Export JSON data dump of tenant records" })
  async get_get_data_dump_tenant(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.loomTenant);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/loom-tenant/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect LoomTenant entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_loom_tenant_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.loomTenant)
        .where(eq(schema.loomTenant.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/color/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Color entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_color_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.color)
        .where(eq(schema.color.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/element/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Element entity by ID" })
  @ApiParam({ name: "id", example: 525131, type: Number })
  async get_get_table_explorer_data_element_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.element)
        .where(eq(schema.element.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/authentication-log/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect AuthenticationLog entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_authentication_log_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.authenticationLog)
        .where(eq(schema.authenticationLog.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/log/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect LoomLog entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_log_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.log)
        .where(eq(schema.log.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/verification-token/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect VerificationToken entity by ID" })
  @ApiParam({ name: "id", example: 15662, type: Number })
  async get_get_table_explorer_data_verification_token_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.verificationToken)
        .where(eq(schema.verificationToken.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/warehouse/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Warehouse entity by ID" })
  @ApiParam({ name: "id", example: 306145, type: Number })
  async get_get_table_explorer_data_warehouse_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.warehouse)
        .where(eq(schema.warehouse.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/authentication-log")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for authentication-log" })
  async get_get_table_explorer_data_authentication_log(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.authenticationLog).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/color")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for color" })
  async get_get_table_explorer_data_color(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.color).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/cron-job-log/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect CronJobLog entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_cron_job_log_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.cronJobLog)
        .where(eq(schema.cronJobLog.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/cron-job-log")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for cron-job-log" })
  async get_get_table_explorer_data_cron_job_log(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.cronJobLog).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/element")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for element" })
  async get_get_table_explorer_data_element(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.element).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/inventory-adjustment-item")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for inventory-adjustment-item" })
  async get_get_table_explorer_data_inventory_adjustment_item(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.inventoryAdjustmentItem).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/inventory-adjustment-reason/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect InventoryAdjustmentReason entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_inventory_adjustment_reason_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.inventoryAdjustmentReason)
        .where(eq(schema.inventoryAdjustmentReason.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/inventory-restock-request/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect InventoryRestockRequest entity by ID" })
  @ApiParam({ name: "id", example: 625760, type: Number })
  async get_get_table_explorer_data_inventory_restock_request_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.inventoryRestockRequest)
        .where(eq(schema.inventoryRestockRequest.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/log")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for log" })
  async get_get_table_explorer_data_log(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.log).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/loom-tenant")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for loom-tenant" })
  async get_get_table_explorer_data_loom_tenant(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.loomTenant).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/purchase-order-feedback/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect PurchaseOrderFeedback entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_purchase_order_feedback_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.purchaseOrderFeedback)
        .where(eq(schema.purchaseOrderFeedback.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/purchase-order-feedback")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for purchase-order-feedback" })
  async get_get_table_explorer_data_purchase_order_feedback(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.purchaseOrderFeedback).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/skill/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Skill entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_skill_id(@Param("id") id: string) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.skill)
        .where(eq(schema.skill.id, BigInt(id)));
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/skill")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for skill" })
  async get_get_table_explorer_data_skill(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.skill).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/sub-process-element")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for sub-process-element" })
  async get_get_table_explorer_data_sub_process_element(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.subprocessElement).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/data/verification-token")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for verification-token" })
  async get_get_table_explorer_data_verification_token(@Query() query: any) {
    try {
      const result = await (this.db as any).select().from(schema.verificationToken).limit(50);
      return keyedResponse("data", (result || []).map(formatEntity));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/table-explorer/tables")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "List table explorer tables" })
  async get_get_table_explorer_tables(@Query() query: any) {
    try {
      const tables = [
        "loom_tenant",
        "color",
        "element",
        "authentication_log",
        "log",
        "verification_token",
        "warehouse",
        "cron_job_log",
        "inventory_adjustment_reason",
        "inventory_restock_request",
        "purchase_order_feedback",
        "skill",
        "sub_process_element",
      ];
      return keyedResponse("data", tables);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }
}
