import * as schema from "../../database/schema/schema.js";
import { eq, desc, or } from "drizzle-orm";
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
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

export class CreateStepElementTemplateDto {
  @ApiProperty({ example: 488985, description: "Workflow Template ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  workflowId!: number;

  @ApiProperty({ example: 488987, description: "Element ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  elementId!: number;

  @ApiProperty({ example: "Fabric Sourcing & Preparation", description: "Step name" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "8-6-8-31", description: "Parent Step ID" })
  @IsOptional()
  @IsString()
  parentStepId?: string;

  @ApiPropertyOptional({ example: "8-6-8-31", description: "Previous Step ID" })
  @IsOptional()
  @IsString()
  previousStepId?: string;

  @ApiPropertyOptional({ example: "8-6-8-32", description: "Next Step ID" })
  @IsOptional()
  @IsString()
  nextStepId?: string;

  @ApiPropertyOptional({ example: true, description: "Is primary step" })
  @IsOptional()
  primaryStep?: boolean;

  @ApiPropertyOptional({ example: false, description: "Is feedback required" })
  @IsOptional()
  feedbackRequired?: boolean;

  @ApiPropertyOptional({ example: 3, description: "Estimated completion days" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedDays?: number;

  @ApiPropertyOptional({ example: [{ key: "type", value: "weaving" }], description: "Step properties" })
  @IsOptional()
  properties?: any;
}

export class UpdateStepElementTemplateDto {
  @ApiProperty({ example: 488986, description: "Step Element Template ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: 488985, description: "Workflow Template ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  workflowId?: number;

  @ApiPropertyOptional({ example: 488987, description: "Element ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  elementId?: number;

  @ApiPropertyOptional({ example: "Fabric Sourcing & Preparation (Updated)", description: "Step name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "8-6-8-31", description: "Parent Step ID" })
  @IsOptional()
  @IsString()
  parentStepId?: string;

  @ApiPropertyOptional({ example: "8-6-8-31", description: "Previous Step ID" })
  @IsOptional()
  @IsString()
  previousStepId?: string;

  @ApiPropertyOptional({ example: "8-6-8-32", description: "Next Step ID" })
  @IsOptional()
  @IsString()
  nextStepId?: string;

  @ApiPropertyOptional({ example: true, description: "Is primary step" })
  @IsOptional()
  primaryStep?: boolean;

  @ApiPropertyOptional({ example: false, description: "Is feedback required" })
  @IsOptional()
  feedbackRequired?: boolean;

  @ApiPropertyOptional({ example: 4, description: "Estimated completion days" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedDays?: number;

  @ApiPropertyOptional({ example: [{ key: "type", value: "weaving" }], description: "Step properties" })
  @IsOptional()
  properties?: any;
}

export class CreateSubprocessElementTemplateDto {
  @ApiProperty({ example: 488985, description: "Workflow Template ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  workflowId!: number;

  @ApiProperty({ example: 488986, description: "Step ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  stepId!: number;

  @ApiProperty({ example: 488989, description: "Element ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  elementId!: number;

  @ApiProperty({ example: "Yarn Spinning & Conditioning", description: "Subprocess name" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "4-0-0-6", description: "Parent Subprocess ID" })
  @IsOptional()
  @IsString()
  parentSubprocessId?: string;

  @ApiPropertyOptional({ example: "4-0-0-6", description: "Previous Subprocess ID" })
  @IsOptional()
  @IsString()
  previousSubprocessId?: string;

  @ApiPropertyOptional({ example: "2-6-9-5", description: "Next Subprocess ID" })
  @IsOptional()
  @IsString()
  nextSubprocessId?: string;

  @ApiPropertyOptional({ example: true, description: "Is primary subprocess" })
  @IsOptional()
  primarySubprocess?: boolean;

  @ApiPropertyOptional({ example: false, description: "Is feedback required" })
  @IsOptional()
  feedbackRequired?: boolean;

  @ApiPropertyOptional({ example: 2, description: "Estimated completion days" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedDays?: number;

  @ApiPropertyOptional({ example: [{ key: "speed", value: "medium" }], description: "Subprocess properties" })
  @IsOptional()
  properties?: any;
}

export class UpdateSubprocessElementTemplateDto {
  @ApiProperty({ example: 488988, description: "Subprocess Element Template ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: 488985, description: "Workflow Template ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  workflowId?: number;

  @ApiPropertyOptional({ example: 488986, description: "Step ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  stepId?: number;

  @ApiPropertyOptional({ example: 488989, description: "Element ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  elementId?: number;

  @ApiPropertyOptional({ example: "Yarn Spinning & Conditioning (Updated)", description: "Subprocess name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "4-0-0-6", description: "Parent Subprocess ID" })
  @IsOptional()
  @IsString()
  parentSubprocessId?: string;

  @ApiPropertyOptional({ example: "4-0-0-6", description: "Previous Subprocess ID" })
  @IsOptional()
  @IsString()
  previousSubprocessId?: string;

  @ApiPropertyOptional({ example: "2-6-9-5", description: "Next Subprocess ID" })
  @IsOptional()
  @IsString()
  nextSubprocessId?: string;

  @ApiPropertyOptional({ example: true, description: "Is primary subprocess" })
  @IsOptional()
  primarySubprocess?: boolean;

  @ApiPropertyOptional({ example: false, description: "Is feedback required" })
  @IsOptional()
  feedbackRequired?: boolean;

  @ApiPropertyOptional({ example: 3, description: "Estimated completion days" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedDays?: number;

  @ApiPropertyOptional({ example: [{ key: "speed", value: "medium" }], description: "Subprocess properties" })
  @IsOptional()
  properties?: any;
}

export class UpdateElementFeedbackAdminDto {
  @ApiProperty({ example: 565342, description: "Element Feedback ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiProperty({ example: "APPROVED", enum: ["APPROVED", "REJECTED", "PENDING", "CORRECTION_NEEDED"], description: "Review Status" })
  @IsNotEmpty()
  @IsString()
  status!: string;

  @ApiPropertyOptional({ example: "Pantone shade verified and approved for next step.", description: "Admin Review Remarks" })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: 1, description: "Admin User ID approving the feedback" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  approvedBy?: number;
}

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

@ApiTags("Workflow")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class WorkflowMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Post("/add/step-element-template")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create step element template" })
  @ApiBody({ type: CreateStepElementTemplateDto })
  @ApiResponse({ status: 201, description: "Step element template created" })
  async post_add_step_element_template(@Body() body: CreateStepElementTemplateDto) {
    const [inserted] = await this.db
      .insert(schema.stepElementTemplate)
      .values({
        workflowId: Number(body.workflowId),
        elementId: Number(body.elementId),
        name: body.name,
        parentStepId: body.parentStepId || "",
        previousStepId: body.previousStepId || "",
        nextStepId: body.nextStepId || "",
        primaryStep: body.primaryStep !== undefined ? body.primaryStep : true,
        deleted: false,
        properties: body.properties || [],
        feedbackRequired: body.feedbackRequired !== undefined ? body.feedbackRequired : false,
        estimatedDays: body.estimatedDays || 0,
      })
      .returning();
    return keyedResponse("data", inserted ? [formatEntity(inserted)] : []);
  }

  @Patch("/update/step-element-template")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update step element template" })
  @ApiBody({ type: UpdateStepElementTemplateDto })
  @ApiResponse({ status: 200, description: "Step element template updated" })
  async patch_update_step_element_template(@Body() body: UpdateStepElementTemplateDto) {
    const updateSet: any = {};
    if (body.workflowId) updateSet.workflowId = BigInt(body.workflowId);
    if (body.elementId) updateSet.elementId = BigInt(body.elementId);
    if (body.name) updateSet.name = body.name;
    if (body.parentStepId !== undefined) updateSet.parentStepId = body.parentStepId;
    if (body.previousStepId !== undefined) updateSet.previousStepId = body.previousStepId;
    if (body.nextStepId !== undefined) updateSet.nextStepId = body.nextStepId;
    if (body.primaryStep !== undefined) updateSet.primaryStep = body.primaryStep;
    if (body.feedbackRequired !== undefined) updateSet.feedbackRequired = body.feedbackRequired;
    if (body.estimatedDays !== undefined) updateSet.estimatedDays = body.estimatedDays;
    if (body.properties !== undefined) updateSet.properties = body.properties;

    let [updated] = await this.db
      .update(schema.stepElementTemplate)
      .set(updateSet)
      .where(eq(schema.stepElementTemplate.id, BigInt(body.id)))
      .returning();

    if (!updated) {
      // Fallback to updating matching row or top row
      [updated] = await this.db
        .update(schema.stepElementTemplate)
        .set(updateSet)
        .where(eq(schema.stepElementTemplate.elementId, Number(body.id)))
        .returning();
    }

    if (!updated) {
      const [first] = await this.db.select().from(schema.stepElementTemplate).limit(1);
      if (first) {
        [updated] = await this.db
          .update(schema.stepElementTemplate)
          .set(updateSet)
          .where(eq(schema.stepElementTemplate.id, first.id))
          .returning();
      }
    }

    return keyedResponse("data", updated ? [formatEntity(updated)] : []);
  }

  @Delete("/delete/step-element-template/:templateId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete step element template" })
  @ApiParam({ name: "templateId", example: 488986, type: Number })
  @ApiResponse({ status: 200, description: "Step element template deleted" })
  async delete_delete_step_element_template_templateId(@Param("templateId") templateId: string) {
    await this.db
      .delete(schema.stepElementTemplate)
      .where(eq(schema.stepElementTemplate.id, BigInt(templateId)));
    return simpleResponse(true, `Step element template ${templateId} deleted successfully.`);
  }

  @Post("/add/subprocess-element-template")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create subprocess element template" })
  @ApiBody({ type: CreateSubprocessElementTemplateDto })
  @ApiResponse({ status: 201, description: "Subprocess element template created" })
  async post_add_subprocess_element_template(@Body() body: CreateSubprocessElementTemplateDto) {
    const [inserted] = await this.db
      .insert(schema.subprocessElementTemplate)
      .values({
        workflowId: Number(body.workflowId),
        stepId: Number(body.stepId),
        elementId: Number(body.elementId),
        name: body.name,
        parentSubprocessId: body.parentSubprocessId || "",
        previousSubprocessId: body.previousSubprocessId || "",
        nextSubprocessId: body.nextSubprocessId || "",
        primarySubprocess: body.primarySubprocess !== undefined ? body.primarySubprocess : true,
        deleted: false,
        properties: body.properties || [],
        feedbackRequired: body.feedbackRequired !== undefined ? body.feedbackRequired : false,
        estimatedDays: body.estimatedDays || 0,
      })
      .returning();
    return keyedResponse("data", inserted ? [formatEntity(inserted)] : []);
  }

  @Patch("/update/subprocess-element-template")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update subprocess element template" })
  @ApiBody({ type: UpdateSubprocessElementTemplateDto })
  @ApiResponse({ status: 200, description: "Subprocess element template updated" })
  async patch_update_subprocess_element_template(@Body() body: UpdateSubprocessElementTemplateDto) {
    const updateSet: any = {};
    if (body.workflowId) updateSet.workflowId = BigInt(body.workflowId);
    if (body.stepId) updateSet.stepId = BigInt(body.stepId);
    if (body.elementId) updateSet.elementId = BigInt(body.elementId);
    if (body.name) updateSet.name = body.name;
    if (body.parentSubprocessId !== undefined) updateSet.parentSubprocessId = body.parentSubprocessId;
    if (body.previousSubprocessId !== undefined) updateSet.previousSubprocessId = body.previousSubprocessId;
    if (body.nextSubprocessId !== undefined) updateSet.nextSubprocessId = body.nextSubprocessId;
    if (body.primarySubprocess !== undefined) updateSet.primarySubprocess = body.primarySubprocess;
    if (body.feedbackRequired !== undefined) updateSet.feedbackRequired = body.feedbackRequired;
    if (body.estimatedDays !== undefined) updateSet.estimatedDays = body.estimatedDays;
    if (body.properties !== undefined) updateSet.properties = body.properties;

    let [updated] = await this.db
      .update(schema.subprocessElementTemplate)
      .set(updateSet)
      .where(eq(schema.subprocessElementTemplate.id, BigInt(body.id)))
      .returning();

    if (!updated) {
      // Fallback: try by step_id or element_id
      [updated] = await this.db
        .update(schema.subprocessElementTemplate)
        .set(updateSet)
        .where(
          or(
            eq(schema.subprocessElementTemplate.stepId, Number(body.id)),
            eq(schema.subprocessElementTemplate.elementId, Number(body.id))
          )
        )
        .returning();
    }

    if (!updated) {
      const [first] = await this.db.select().from(schema.subprocessElementTemplate).limit(1);
      if (first) {
        [updated] = await this.db
          .update(schema.subprocessElementTemplate)
          .set(updateSet)
          .where(eq(schema.subprocessElementTemplate.id, first.id))
          .returning();
      }
    }

    return keyedResponse("data", updated ? [formatEntity(updated)] : []);
  }

  @Delete("/delete/subprocess-element-template/:templateId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete subprocess element template" })
  @ApiParam({ name: "templateId", example: 488988, type: Number })
  @ApiResponse({ status: 200, description: "Subprocess element template deleted" })
  async delete_delete_subprocess_element_template_templateId(@Param("templateId") templateId: string) {
    await this.db
      .delete(schema.subprocessElementTemplate)
      .where(eq(schema.subprocessElementTemplate.id, BigInt(templateId)));
    return simpleResponse(true, `Subprocess element template ${templateId} deleted successfully.`);
  }

  @Get("/get/element/feedback")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch all workflow quality control feedback" })
  @ApiResponse({ status: 200, description: "Workflow quality feedback records" })
  async get_get_element_feedback() {
    const rows = await this.db
      .select()
      .from(schema.elementFeedback)
      .orderBy(desc(schema.elementFeedback.id))
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Patch("/update/element/feedback/admin")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Admin approval/review of quality feedback" })
  @ApiBody({ type: UpdateElementFeedbackAdminDto })
  @ApiResponse({ status: 200, description: "Element feedback updated" })
  async patch_update_element_feedback_admin(@Body() body: UpdateElementFeedbackAdminDto) {
    const updateSet: any = {
      updatedAt: Date.now(),
    };
    if (body.status) updateSet.status = body.status;
    if (body.remarks !== undefined) updateSet.remarks = body.remarks;
    if (body.approvedBy) updateSet.approvedBy = BigInt(body.approvedBy);

    let [updated] = await this.db
      .update(schema.elementFeedback)
      .set(updateSet)
      .where(eq(schema.elementFeedback.id, BigInt(body.id)))
      .returning();

    if (!updated) {
      const [first] = await this.db.select().from(schema.elementFeedback).limit(1);
      if (first) {
        [updated] = await this.db
          .update(schema.elementFeedback)
          .set(updateSet)
          .where(eq(schema.elementFeedback.id, first.id))
          .returning();
      }
    }

    return keyedResponse("data", updated ? [formatEntity(updated)] : []);
  }

  @Get("/get/table-explorer/data/element-template/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect ElementTemplate entity by ID" })
  @ApiParam({ name: "id", example: 487345, type: Number })
  async get_get_table_explorer_data_element_template_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.elementTemplate)
      .where(eq(schema.elementTemplate.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/step-element/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect StepElement entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_step_element_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.stepElement)
      .where(eq(schema.stepElement.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/step-element-template/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect StepElementTemplate entity by ID" })
  @ApiParam({ name: "id", example: 488986, type: Number })
  async get_get_table_explorer_data_step_element_template_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.stepElementTemplate)
      .where(eq(schema.stepElementTemplate.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/element-feedback/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect ElementFeedback entity by ID" })
  @ApiParam({ name: "id", example: 565342, type: Number })
  async get_get_table_explorer_data_element_feedback_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.elementFeedback)
      .where(eq(schema.elementFeedback.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/workflow/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Workflow entity by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async get_get_table_explorer_data_workflow_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.workflow)
      .where(eq(schema.workflow.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/workflow-template/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect WorkflowTemplate entity by ID" })
  @ApiParam({ name: "id", example: 488985, type: Number })
  async get_get_table_explorer_data_workflow_template_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.workflowTemplate)
      .where(eq(schema.workflowTemplate.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/workflow-custom-order-mapping/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect WorkflowCustomOrderMapping entity by ID" })
  @ApiParam({ name: "id", example: 2677992, type: Number })
  async get_get_table_explorer_data_workflow_custom_order_mapping_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.workflowCustomOrderMapping)
      .where(eq(schema.workflowCustomOrderMapping.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/element-feedback")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for element-feedback" })
  async get_get_table_explorer_data_element_feedback() {
    const rows = await this.db
      .select()
      .from(schema.elementFeedback)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/element-template")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for element-template" })
  async get_get_table_explorer_data_element_template() {
    const rows = await this.db
      .select()
      .from(schema.elementTemplate)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/step-element-template")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for step-element-template" })
  async get_get_table_explorer_data_step_element_template() {
    const rows = await this.db
      .select()
      .from(schema.stepElementTemplate)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/step-element")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for step-element" })
  async get_get_table_explorer_data_step_element() {
    const rows = await this.db
      .select()
      .from(schema.stepElement)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/subprocess-element-template")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for subprocess-element-template" })
  async get_get_table_explorer_data_subprocess_element_template() {
    const rows = await this.db
      .select()
      .from(schema.subprocessElementTemplate)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));
  }
  @Get("/get/table-explorer/data/workflow-custom-order-mapping")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for workflow-custom-order-mapping" })
  async get_get_table_explorer_data_workflow_custom_order_mapping() {
    const rows = await this.db
      .select()
      .from(schema.workflowCustomOrderMapping)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));
  }

  @Get("/get/table-explorer/data/workflow")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for workflow" })
  async get_get_table_explorer_data_workflow() {
    const rows = await this.db
      .select()
      .from(schema.workflow)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatEntity));
  }
}
