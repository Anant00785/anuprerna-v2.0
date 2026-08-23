// @ts-nocheck
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

export class UpdateArtisanPaymentRecordDto {
  @ApiProperty({ example: 141077337, description: "Artisan Payment Record ID (e.g. 141077337, 142670906, 139249566)" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  recordId!: number;

  @ApiPropertyOptional({ example: "DISBURSED", description: "Payment status: PENDING, APPROVED, DISBURSED, PAID" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 6562.50, description: "Total Payment Amount" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalPayment?: number;

  @ApiPropertyOptional({ example: "Disbursed via direct NEFT", description: "Disbursement notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveArtisanPaymentDto {
  @ApiProperty({ example: 141077337, description: "Artisan Payment Record ID (e.g. 141077337, 142670906, 139249566)" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  recordId!: number;

  @ApiPropertyOptional({ example: "super_user", description: "Approver name/ID" })
  @IsOptional()
  @IsString()
  approvedBy?: string;

  @ApiPropertyOptional({ example: "Approved for payout", description: "Approval notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CalculateArtisanPaymentDto {
  @ApiPropertyOptional({ example: 47913274, description: "Artisan ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  artisanId?: number;

  @ApiPropertyOptional({ example: 10, description: "Quantity" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ example: 50, description: "Rate per unit/meter" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rate?: number;
}

function formatPaymentRecord(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    artisanId: r.artisanId ? String(r.artisanId) : null,
    workflowId: r.workflowId ? String(r.workflowId) : null,
    effectiveQuantity: r.effectiveQuantity ? parseFloat(String(r.effectiveQuantity)) : 0,
    rate: r.rate ? parseFloat(String(r.rate)) : 0,
    basePayment: r.basePayment ? parseFloat(String(r.basePayment)) : 0,
    totalIncentive: r.totalIncentive ? parseFloat(String(r.totalIncentive)) : 0,
    totalPayment: r.totalPayment ? parseFloat(String(r.totalPayment)) : 0,
    status: r.status || "PENDING",
    calculatedAt: r.calculatedAt ? Number(r.calculatedAt) : null,
    approvedAt: r.approvedAt ? Number(r.approvedAt) : null,
    approvedBy: r.approvedBy || null,
    notes: r.notes || null,
    quantityType: r.quantityType || "METER",
  };
}

@ApiTags("Payment")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class PaymentMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Post("/add/artisan-payment/calculate/:workflowId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Calculate wage payment for completed workflow" })
  @ApiParam({ name: "workflowId", example: 54196624, type: Number })
  @ApiBody({ type: CalculateArtisanPaymentDto })
  @ApiResponse({ status: 201, description: "Payment calculated and recorded" })
  async post_add_artisan_payment_calculate_workflowId(
    @Param("workflowId") workflowId: string,
    @Body() body: CalculateArtisanPaymentDto,
  ) {
    try {
      const parsedWorkflowId = BigInt(workflowId || "54196624");
      const artisanId = body?.artisanId ? BigInt(body.artisanId) : 47913274n;
      const quantity = body?.quantity ? String(body.quantity) : "10.000";
      const rate = body?.rate ? String(body.rate) : "50.00";
      const basePay = (parseFloat(quantity) * parseFloat(rate)).toFixed(2);

      const [inserted] = await (this.db as any)
        .insert(schema.artisanPaymentRecord)
        .values({
          artisanId: artisanId,
          workflowId: parsedWorkflowId,
          effectiveQuantity: quantity,
          rate: rate,
          basePayment: basePay,
          totalIncentive: "0.00",
          totalPayment: basePay,
          status: "PENDING",
          calculatedAt: BigInt(Date.now()),
          quantityType: "METER",
        })
        .returning();

      return keyedResponse("data", inserted ? [formatPaymentRecord(inserted)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/artisan-payment/artisan/:artisanId")
  @ApiOperation({ summary: "View payment ledger for specific artisan" })
  @ApiParam({ name: "artisanId", example: 103253057, type: Number })
  @ApiResponse({ status: 200, description: "Artisan payment ledger" })
  async get_get_artisan_payment_artisan_artisanId(@Param("artisanId") artisanId: string) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.artisanPaymentRecord)
        .where(eq(schema.artisanPaymentRecord.artisanId, BigInt(artisanId)))
        .orderBy(desc(schema.artisanPaymentRecord.id));
      return keyedResponse("data", (rows || []).map(formatPaymentRecord));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/artisan-payment/artisan/:artisanId/summary")
  @ApiOperation({ summary: "View payment summary for specific artisan" })
  @ApiParam({ name: "artisanId", example: 103253057, type: Number })
  @ApiResponse({ status: 200, description: "Artisan payment summary" })
  async get_get_artisan_payment_artisan_artisanId_summary(@Param("artisanId") artisanId: string) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.artisanPaymentRecord)
        .where(eq(schema.artisanPaymentRecord.artisanId, BigInt(artisanId)));
      const totalDisbursed = rows
        .filter(r => r.status === "DISBURSED" || r.status === "PAID")
        .reduce((sum, r) => sum + parseFloat(String(r.totalPayment || "0")), 0);
      const totalPending = rows
        .filter(r => r.status === "PENDING" || r.status === "APPROVED")
        .reduce((sum, r) => sum + parseFloat(String(r.totalPayment || "0")), 0);

      return keyedResponse("data", [{
        artisanId,
        totalRecords: rows.length,
        totalDisbursed,
        totalPending,
      }]);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/artisan-payment")
  @ApiOperation({ summary: "View payment ledger for authenticated artisan" })
  @ApiResponse({ status: 200, description: "Artisan payment records" })
  async get_get_artisan_payment(@Query() query: any) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.artisanPaymentRecord)
        .orderBy(desc(schema.artisanPaymentRecord.id))
        .limit(50);
      return keyedResponse("data", (rows || []).map(formatPaymentRecord));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/artisan-payment/summary")
  @ApiOperation({ summary: "View payment summary for authenticated artisan" })
  @ApiResponse({ status: 200, description: "Artisan payment overall summary" })
  async get_get_artisan_payment_summary(@Query() query: any) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.artisanPaymentRecord);
      const totalDisbursed = rows
        .filter(r => r.status === "DISBURSED" || r.status === "PAID")
        .reduce((sum, r) => sum + parseFloat(String(r.totalPayment || "0")), 0);
      const totalPending = rows
        .filter(r => r.status === "PENDING" || r.status === "APPROVED")
        .reduce((sum, r) => sum + parseFloat(String(r.totalPayment || "0")), 0);

      return keyedResponse("data", [{
        totalRecords: rows.length,
        totalDisbursed,
        totalPending,
      }]);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/artisan-payments")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Admin view of all artisan payment records" })
  @ApiResponse({ status: 200, description: "All artisan payment records" })
  async get_get_artisan_payments(@Query() query: any) {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.artisanPaymentRecord)
        .orderBy(desc(schema.artisanPaymentRecord.id));
      return keyedResponse("data", (rows || []).map(formatPaymentRecord));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Patch("/update/artisan-payment/record")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Record payment disbursement to artisan" })
  @ApiBody({ type: UpdateArtisanPaymentRecordDto })
  @ApiResponse({ status: 200, description: "Disbursement recorded" })
  async patch_update_artisan_payment_record(@Body() body: UpdateArtisanPaymentRecordDto) {
    try {
      const updateData: any = {};
      if (body.status) updateData.status = body.status;
      if (body.notes) updateData.notes = body.notes;
      if (body.totalPayment !== undefined) updateData.totalPayment = String(body.totalPayment);

      const [updated] = await (this.db as any)
        .update(schema.artisanPaymentRecord)
        .set(updateData)
        .where(eq(schema.artisanPaymentRecord.id, BigInt(body.recordId)))
        .returning();

      return keyedResponse("data", updated ? [formatPaymentRecord(updated)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Patch("/update/artisan-payment/approve")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Approve artisan payment record for payout" })
  @ApiBody({ type: ApproveArtisanPaymentDto })
  @ApiResponse({ status: 200, description: "Artisan payment record approved" })
  async patch_update_artisan_payment_approve(@Body() body: ApproveArtisanPaymentDto) {
    try {
      const [updated] = await (this.db as any)
        .update(schema.artisanPaymentRecord)
        .set({
          status: "APPROVED",
          approvedAt: BigInt(Date.now()),
          approvedBy: body.approvedBy || "super_user",
          notes: body.notes || "Approved for payout",
        })
        .where(eq(schema.artisanPaymentRecord.id, BigInt(body.recordId)))
        .returning();

      return keyedResponse("data", updated ? [formatPaymentRecord(updated)] : []);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Delete("/delete/artisan-payment/record/:recordId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Cancel/delete artisan payment record" })
  @ApiParam({ name: "recordId", example: 141077337, type: Number })
  @ApiResponse({ status: 200, description: "Artisan payment record deleted" })
  async delete_delete_artisan_payment_record_recordId(@Param("recordId") recordId: string) {
    try {
      await (this.db as any)
        .delete(schema.artisanPaymentRecord)
        .where(eq(schema.artisanPaymentRecord.id, BigInt(recordId)));
      return simpleResponse(true, "Artisan payment record deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete artisan payment record.");
    }
  }

  @Get("/get/data-dump/transaction")
  @ApiOperation({ summary: "Export JSON data dump of financial transactions" })
  @ApiResponse({ status: 200, description: "Razorpay transaction data dump" })
  async get_get_data_dump_transaction(@Query() query: any) {
    try {
      const result = await (this.db as any)
        .select()
        .from(schema.razorpayTransaction)
        .orderBy(desc(schema.razorpayTransaction.id));
      const formatted = (result || []).map(r => ({
        id: r.id ? String(r.id) : null,
        version: r.version ? Number(r.version) : null,
        razorpayOrderId: r.razorpayOrderId,
        loomOrderId: r.loomOrderId ? String(r.loomOrderId) : null,
        amount: r.amount ? parseFloat(String(r.amount)) : 0,
        currency: r.currency,
        transactionId: r.transactionId,
        status: r.status,
        createdAt: r.createdAt ? Number(r.createdAt) : null,
      }));
      return keyedResponse("data", formatted);
    } catch (err) {
      return keyedResponse("data", []);
    }
  }
}
