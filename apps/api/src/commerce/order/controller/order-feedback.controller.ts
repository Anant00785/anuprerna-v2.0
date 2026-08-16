// @ts-nocheck
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Inject } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class AddOrderFeedbackDto {
  @ApiProperty({ example: 244117, description: "Order ID" })
  @IsNotEmpty()
  @IsNumber()
  orderId!: number;

  @ApiPropertyOptional({ example: "10", description: "Rating score / answer for Question 1 (1-10)" })
  @IsOptional()
  @IsString()
  question1Answer?: string;

  @ApiPropertyOptional({ example: true, description: "Answer for Question 2 (Yes/No)" })
  @IsOptional()
  @IsBoolean()
  question2Answer?: boolean;

  @ApiPropertyOptional({ example: "", description: "Negative answer explanation for Question 2 if applicable" })
  @IsOptional()
  @IsString()
  question2NegAnswer?: string;

  @ApiPropertyOptional({ example: "Great fabric and packaging quality!", description: "Comments / suggestions for Question 3" })
  @IsOptional()
  @IsString()
  question3Answer?: string;
}

export class UpdateFeedbackQ1Dto {
  @ApiProperty({ example: 244127, description: "Feedback unique ID" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: "10", description: "Rating score (1-10)" })
  @IsNotEmpty()
  rating!: string;
}

export class UpdateFeedbackQ2Dto {
  @ApiProperty({ example: 244127, description: "Feedback unique ID" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: true, description: "Product search experience answer (true/false)" })
  @IsNotEmpty()
  @IsBoolean()
  answer!: boolean;

  @ApiPropertyOptional({ example: "", description: "Negative feedback explanation if answer is false" })
  @IsOptional()
  @IsString()
  negAnswer?: string;
}

export class UpdateFeedbackQ3Dto {
  @ApiProperty({ example: 244127, description: "Feedback unique ID" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: "Very satisfied with the quick delivery and authentic handloom weave.", description: "Additional comments / feedback" })
  @IsNotEmpty()
  @IsString()
  comment!: string;
}

function formatFeedback(row: any) {
  if (!row) return null;
  return {
    id: typeof row.id === "bigint" ? Number(row.id) : row.id,
    orderId: row.orderId,
    question1: row.question1,
    question1Answer: row.question1Answer,
    question2: row.question2,
    question2Answer: row.question2Answer,
    question2Negative: row.question2Negative,
    question2NegAnswer: row.question2NegAnswer,
    question3: row.question3,
    question3Answer: row.question3Answer,
    createdAt: row.createdAt ? Number(row.createdAt) : null,
    updatedAt: row.updatedAt ? Number(row.updatedAt) : null,
  };
}

@ApiBearerAuth()
@ApiTags("Order Feedback")
@Controller()
@UseGuards(RolesGuard)
export class OrderFeedbackController {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  @Post("/add/order/feedback")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Customer: Submit feedback for an order." })
  @ApiBody({ type: AddOrderFeedbackDto })
  async addFeedback(@Body() body: AddOrderFeedbackDto) {
    try {
      const orderId = Number(body?.orderId || 0);
      if (!orderId) return simpleResponse(false, "orderId is required.");

      await this.db.insert(schema.purchaseOrderFeedback).values({
        orderId,
        question1: "We are delighted to have you as a part of Anuprerna. We appreciate your feedback. Please Rate Your Experience With Us",
        question1Answer: String(body?.question1Answer || "10"),
        question2: "Did you find what you were looking for?",
        question2Answer: Boolean(body?.question2Answer ?? true),
        question2Negative: "",
        question2NegAnswer: body?.question2NegAnswer || "",
        question3: "Is there anything else you would like to share with us to help serve you better?",
        question3Answer: body?.question3Answer || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 0n,
      });

      return simpleResponse(true, "Feedback submitted successfully.");
    } catch (err) {
      console.error("[Add Feedback Error]:", err);
      return simpleResponse(false, "Failed to submit feedback.");
    }
  }

  @Patch("/update/order/feedback/q1")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Customer: Update feedback rating (Q1)." })
  @ApiBody({ type: UpdateFeedbackQ1Dto })
  async updateFeedbackQ1(@Body() body: UpdateFeedbackQ1Dto) {
    try {
      const id = BigInt(body?.id || 0);
      await this.db.update(schema.purchaseOrderFeedback).set({
        question1Answer: String(body?.rating || "10"),
        updatedAt: Date.now(),
      }).where(eq(schema.purchaseOrderFeedback.id, id));
      return simpleResponse(true, "Feedback updated successfully.");
    } catch {
      return simpleResponse(false, "Failed to update feedback.");
    }
  }

  @Patch("/update/order/feedback/q2")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Customer: Update feedback product search experience (Q2)." })
  @ApiBody({ type: UpdateFeedbackQ2Dto })
  async updateFeedbackQ2(@Body() body: UpdateFeedbackQ2Dto) {
    try {
      const id = BigInt(body?.id || 0);
      await this.db.update(schema.purchaseOrderFeedback).set({
        question2Answer: Boolean(body?.answer ?? true),
        question2NegAnswer: body?.negAnswer || "",
        updatedAt: Date.now(),
      }).where(eq(schema.purchaseOrderFeedback.id, id));
      return simpleResponse(true, "Feedback updated successfully.");
    } catch {
      return simpleResponse(false, "Failed to update feedback.");
    }
  }

  @Patch("/update/order/feedback/q3")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Customer: Update feedback comments (Q3)." })
  @ApiBody({ type: UpdateFeedbackQ3Dto })
  async updateFeedbackQ3(@Body() body: UpdateFeedbackQ3Dto) {
    try {
      const id = BigInt(body?.id || 0);
      await this.db.update(schema.purchaseOrderFeedback).set({
        question3Answer: body?.comment || "",
        updatedAt: Date.now(),
      }).where(eq(schema.purchaseOrderFeedback.id, id));
      return simpleResponse(true, "Feedback updated successfully.");
    } catch {
      return simpleResponse(false, "Failed to update feedback.");
    }
  }

  @Get("/get/order/feedback/:orderId")
  @ApiOperation({ summary: "Get feedback submitted for an order ID." })
  @ApiParam({ name: "orderId", description: "Order ID (e.g. 244117, 244620)", example: 244117, type: Number })
  async getFeedbackByOrder(@Param("orderId") orderId: string) {
    const rows = await this.db.select().from(schema.purchaseOrderFeedback).where(eq(schema.purchaseOrderFeedback.orderId, Number(orderId))).limit(1);
    return keyedResponse("feedback", formatFeedback(rows[0]));
  }

  @Get("/get/super-user/order/feedback/:feedbackId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Super User: Get specific feedback by feedback ID." })
  @ApiParam({ name: "feedbackId", description: "Feedback ID (e.g. 244127, 244632)", example: 244127, type: Number })
  async getFeedbackById(@Param("feedbackId") feedbackId: string) {
    const rows = await this.db.select().from(schema.purchaseOrderFeedback).where(eq(schema.purchaseOrderFeedback.id, BigInt(feedbackId))).limit(1);
    return keyedResponse("feedback", formatFeedback(rows[0]));
  }

  @Get("/get/order/feedback-list")
  @ApiOperation({ summary: "List recent customer order feedbacks." })
  async getFeedbackList() {
    const rows = await this.db.select().from(schema.purchaseOrderFeedback).orderBy(desc(schema.purchaseOrderFeedback.id)).limit(50);
    return keyedResponse("feedbackList", rows.map(formatFeedback));
  }
}
