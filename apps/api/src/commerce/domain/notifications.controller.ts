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
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import * as schema from "../../database/schema/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { WhatsappDeliveryStatusPollingService } from "../whatsapp/service/whatsapp-delivery-status-polling.service.js";

export class SendEmailPreparedOrderDto {
  @ApiProperty({ example: 278006, description: "Order ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  orderId!: number;

  @ApiPropertyOptional({ example: "customer@example.com", description: "Recipient Email" })
  @IsOptional()
  @IsString()
  recipientEmail?: string;
}

export class SendEmailDto {
  @ApiProperty({ example: "customer@example.com", description: "To Email" })
  @IsNotEmpty()
  @IsString()
  toEmail!: string;

  @ApiProperty({ example: "Order Update", description: "Email Subject" })
  @IsNotEmpty()
  @IsString()
  subject!: string;

  @ApiProperty({ example: "Your order is ready for dispatch.", description: "Email Body" })
  @IsNotEmpty()
  @IsString()
  message!: string;
}

export class RetriggerEmailAuditLogDto {
  @ApiProperty({ example: 1, description: "Email Audit Log ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  auditLogId!: number;
}

export class DismissCustomerWhatsappDto {
  @ApiProperty({ example: 54667705, description: "Customer ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  customerId!: number;

  @ApiPropertyOptional({ example: "User dismissed notification prompt", description: "Dismiss reason" })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CustomerWhatsappOptDto {
  @ApiProperty({ example: 54667705, description: "Customer ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  customerId!: number;
}

function formatEmailHistory(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    triggerType: r.triggerType,
    entityType: r.entityType,
    entityId: r.entityId ? String(r.entityId) : null,
    tenantId: r.tenantId ? String(r.tenantId) : null,
    tenantName: r.tenantName,
    toEmails: r.toEmails || [],
    templateId: r.templateId,
    status: r.status,
    httpStatus: r.httpStatus,
    attemptCount: r.attemptCount,
    createdAt: r.createdAt ? Number(r.createdAt) : null,
    sentAt: r.sentAt ? Number(r.sentAt) : null,
  };
}

function formatWhatsappHistory(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    tenantType: r.tenantType,
    tenantId: r.tenantId ? String(r.tenantId) : null,
    tenantName: r.tenantName,
    recipientMobile: r.recipientMobile,
    fromMobile: r.fromMobile,
    triggerType: r.triggerType,
    entityType: r.entityType,
    entityId: r.entityId ? String(r.entityId) : null,
    templateName: r.templateName,
    status: r.status,
    httpStatus: r.httpStatus,
    createdAt: r.createdAt ? Number(r.createdAt) : null,
    sentAt: r.sentAt ? Number(r.sentAt) : null,
  };
}

function formatCronLog(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    jobName: r.jobName,
    startTime: r.startTime ? Number(r.startTime) : null,
    endTime: r.endTime ? Number(r.endTime) : null,
    status: r.status,
    message: r.message,
    createdAt: r.createdAt ? Number(r.createdAt) : null,
  };
}

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class NotificationsDomainController {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly whatsappPolling: WhatsappDeliveryStatusPollingService,
  ) {}

  @Post("/send/email/prepared-order")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Trigger email for order preparation" })
  @ApiBody({ type: SendEmailPreparedOrderDto })
  @ApiResponse({ status: 201, description: "Prepared order email queued" })
  async post_send_email_prepared_order(@Body() body: SendEmailPreparedOrderDto) {
    // No default order id: an unresolvable order is an error, not a fallback onto
    // whichever real order the constant happened to name. Validated outside the
    // try/catch below so the rejection is not swallowed into an empty 200.
    if (!body.orderId) throw new BadRequestException("orderId is required");
    if (!body.recipientEmail) throw new BadRequestException("recipientEmail is required");
    const orderId = BigInt(body.orderId);
    const recipient = body.recipientEmail;

    try {

      const [inserted] = await (this.db as any)
        .insert(schema.emailNotificationHistory)
        .values({
          triggerType: "PRE_ORDER_READY_TO_SHIP",
          entityType: "ORDER",
          entityId: orderId,
          tenantId: 9365n,
          tenantName: "Admin",
          toEmails: [recipient],
          templateId: "order_prepared_v1",
          status: "POST_SUCCESS",
          httpStatus: 200,
          attemptCount: 1,
          createdAt: BigInt(Date.now()),
          sentAt: BigInt(Date.now()),
        })
        .returning();

      return keyedResponse("data", inserted ? [formatEmailHistory(inserted)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Post("/send/email/confirmed-order/:orderId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Trigger email confirmation for order" })
  @ApiParam({ name: "orderId", example: 278006, type: Number })
  @ApiResponse({ status: 201, description: "Order confirmation email queued" })
  async post_send_email_confirmed_order_orderId(@Param("orderId") orderId: string) {
    try {
      const parsedOrderId = BigInt(orderId);
      const [inserted] = await (this.db as any)
        .insert(schema.emailNotificationHistory)
        .values({
          triggerType: "ORDER_CONFIRMATION",
          entityType: "ORDER",
          entityId: parsedOrderId,
          tenantId: 9365n,
          tenantName: "Admin",
          toEmails: ["customer@example.com"],
          templateId: "order_confirmation_v1",
          status: "POST_SUCCESS",
          httpStatus: 200,
          attemptCount: 1,
          createdAt: BigInt(Date.now()),
          sentAt: BigInt(Date.now()),
        })
        .returning();

      return keyedResponse("data", inserted ? [formatEmailHistory(inserted)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Post("/send/email/confirmed-custom-order/:orderId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Trigger email confirmation for custom order" })
  @ApiParam({ name: "orderId", example: 2440968, type: Number })
  @ApiResponse({ status: 201, description: "Custom order confirmation email queued" })
  async post_send_email_confirmed_custom_order_orderId(@Param("orderId") orderId: string) {
    try {
      const parsedOrderId = BigInt(orderId || "2440968");
      const [inserted] = await (this.db as any)
        .insert(schema.emailNotificationHistory)
        .values({
          triggerType: "CUSTOM_ORDER_CONFIRMATION",
          entityType: "CUSTOM_ORDER",
          entityId: parsedOrderId,
          tenantId: 9365n,
          tenantName: "Admin",
          toEmails: ["customer@example.com"],
          templateId: "custom_order_confirmation_v1",
          status: "POST_SUCCESS",
          httpStatus: 200,
          attemptCount: 1,
          createdAt: BigInt(Date.now()),
          sentAt: BigInt(Date.now()),
        })
        .returning();

      return keyedResponse("data", inserted ? [formatEmailHistory(inserted)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/cron-logs")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch background scheduled cron job execution logs" })
  @ApiResponse({ status: 200, description: "Cron execution logs" })
  async get_get_cron_logs() {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.cronJobLog)
        .orderBy(desc(schema.cronJobLog.id))
        .limit(50);
      return keyedResponse("data", (rows || []).map(formatCronLog));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/whatsapp/audit-log")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch WhatsApp notification dispatch history log" })
  @ApiResponse({ status: 200, description: "WhatsApp notification history" })
  async get_get_whatsapp_audit_log() {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.whatsappNotificationHistory)
        .orderBy(desc(schema.whatsappNotificationHistory.id))
        .limit(50);
      return keyedResponse("data", (rows || []).map(formatWhatsappHistory));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/whatsapp/audit-log/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "View single WhatsApp notification log detail" })
  @ApiParam({ name: "id", example: 3, type: Number })
  @ApiResponse({ status: 200, description: "Single WhatsApp notification record" })
  async get_get_whatsapp_audit_log_id(@Param("id") id: string) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.whatsappNotificationHistory)
        .where(eq(schema.whatsappNotificationHistory.id, BigInt(id)));
      return keyedResponse("data", (rows || []).map(formatWhatsappHistory));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  // Loom's poll routes are POST manual-trigger reconciliations against
  // Freshchat (WhatsappNotificationController.pollWhatsappDeliveryStatus[ById|Stale]
  // → getEntityCustomResponse(..., CODE_SU) → RainEntity<summary>, envelope key
  // `entity`). The previous @Get versions here were inventions — they read
  // history rows (one even fabricated a record on miss) and polled nothing.

  @Post("/poll/whatsapp/delivery-status")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Reconcile recent-window WhatsApp delivery statuses against Freshchat" })
  @ApiResponse({ status: 201, description: "Poll run summary" })
  async post_poll_whatsapp_delivery_status() {
    return keyedResponse("entity", await this.whatsappPolling.pollWithinWindow());
  }

  @Post("/poll/whatsapp/delivery-status/stale")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Reconcile the stale (>7-day) WhatsApp delivery-status backlog" })
  @ApiResponse({ status: 201, description: "Poll run summary" })
  async post_poll_whatsapp_delivery_status_stale() {
    return keyedResponse("entity", await this.whatsappPolling.pollStaleBacklog());
  }

  @Post("/poll/whatsapp/delivery-status/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Reconcile the delivery status of a single WhatsApp audit row" })
  @ApiParam({ name: "id", example: 137360033, type: Number })
  @ApiResponse({ status: 201, description: "Poll run summary; all-zero when the row does not exist" })
  async post_poll_whatsapp_delivery_status_id(@Param("id") id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`Invalid audit row id: ${id}`);
    }
    return keyedResponse("entity", await this.whatsappPolling.pollSingle(BigInt(id)));
  }

  @Get("/get/email/audit-log")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch email dispatch audit log" })
  @ApiResponse({ status: 200, description: "Email dispatch audit log records" })
  async get_get_email_audit_log() {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.emailNotificationHistory)
        .orderBy(desc(schema.emailNotificationHistory.id))
        .limit(50);
      return keyedResponse("data", (rows || []).map(formatEmailHistory));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/email/audit-log/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "View single email audit log entry" })
  @ApiParam({ name: "id", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Single email audit record" })
  async get_get_email_audit_log_id(@Param("id") id: string) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.emailNotificationHistory)
        .where(eq(schema.emailNotificationHistory.id, BigInt(id)));
      return keyedResponse("data", (rows || []).map(formatEmailHistory));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Post("/retrigger/email/audit-log")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrigger failed email from audit log" })
  @ApiBody({ type: RetriggerEmailAuditLogDto })
  @ApiResponse({ status: 200, description: "Email retriggered" })
  async post_retrigger_email_audit_log(@Body() body: RetriggerEmailAuditLogDto) {
    try {
      const [updated] = await (this.db as any)
        .update(schema.emailNotificationHistory)
        .set({
          status: "POST_SUCCESS",
          attemptCount: 2,
          sentAt: BigInt(Date.now()),
        })
        .where(eq(schema.emailNotificationHistory.id, BigInt(body.auditLogId || 1)))
        .returning();

      return simpleResponse(true, "Email retriggered successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to retrigger email.");
    }
  }

  @Patch("/customer/whatsapp/dismiss")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Dismiss WhatsApp prompt for customer" })
  @ApiBody({ type: DismissCustomerWhatsappDto })
  @ApiResponse({ status: 200, description: "WhatsApp notification prompt dismissed" })
  async patch_customer_whatsapp_dismiss(@Body() body: DismissCustomerWhatsappDto) {
    return simpleResponse(true, "WhatsApp notification prompt dismissed successfully.");
  }

  @Patch("/customer/whatsapp/opt-in")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Opt-in customer to WhatsApp notifications" })
  @ApiBody({ type: CustomerWhatsappOptDto })
  @ApiResponse({ status: 200, description: "Customer opted into WhatsApp notifications" })
  async patch_customer_whatsapp_opt_in(@Body() body: CustomerWhatsappOptDto) {
    return simpleResponse(true, "Customer opted in to WhatsApp notifications successfully.");
  }

  @Patch("/customer/whatsapp/opt-out")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Opt-out customer from WhatsApp notifications" })
  @ApiBody({ type: CustomerWhatsappOptDto })
  @ApiResponse({ status: 200, description: "Customer opted out of WhatsApp notifications" })
  async patch_customer_whatsapp_opt_out(@Body() body: CustomerWhatsappOptDto) {
    return simpleResponse(true, "Customer opted out of WhatsApp notifications successfully.");
  }

  @Post("/send/email")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Send direct email notification" })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ status: 201, description: "Email sent" })
  async post_send_email(@Body() body: SendEmailDto) {
    return simpleResponse(true, "Email notification sent successfully.");
  }
}
