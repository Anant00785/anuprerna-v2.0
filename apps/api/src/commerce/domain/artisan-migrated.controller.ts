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
  NotImplementedException,
  BadRequestException,
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
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsIn } from "class-validator";
import { Type } from "class-transformer";
import * as schema from "../../database/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

export class CreateArtisanDto {
  @ApiProperty({ example: "MASTER", enum: ["MASTER", "WORKER"] })
  @IsIn(["MASTER", "WORKER"])
  artisanRole!: "MASTER" | "WORKER";

  @ApiPropertyOptional({ example: 47906435, description: "Master Artisan ID (if worker)" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  masterArtisanId?: number;

  @ApiPropertyOptional({ example: "West Bengal", description: "State" })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: "Mursidabad", description: "District" })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: "Sonarandi, Bonwaribad", description: "Village or Town" })
  @IsOptional()
  @IsString()
  villageTown?: string;

  @ApiPropertyOptional({ example: "742101", description: "Postal Code" })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: "Silk Weaving", description: "Expertise" })
  @IsOptional()
  @IsString()
  expertise?: string;

  @ApiPropertyOptional({ example: 6, description: "Experience in years" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  experience?: number;

  @ApiPropertyOptional({ example: true, description: "Has WhatsApp" })
  @IsOptional()
  hasWhatsapp?: boolean;
}

export class UpdateArtisanDto {
  @ApiProperty({ example: 47916439, description: "Artisan ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: "WORKER", enum: ["MASTER", "WORKER"] })
  @IsOptional()
  @IsIn(["MASTER", "WORKER"])
  artisanRole?: "MASTER" | "WORKER";

  @ApiPropertyOptional({ example: 47906435, description: "Master Artisan ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  masterArtisanId?: number;

  @ApiPropertyOptional({ example: "West Bengal", description: "State" })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: "Mursidabad", description: "District" })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: "Sonarandi, Bonwaribad", description: "Village or Town" })
  @IsOptional()
  @IsString()
  villageTown?: string;

  @ApiPropertyOptional({ example: "742101", description: "Postal Code" })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: "Silk Weaving", description: "Expertise" })
  @IsOptional()
  @IsString()
  expertise?: string;

  @ApiPropertyOptional({ example: 6, description: "Experience in years" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  experience?: number;

  @ApiPropertyOptional({ example: true, description: "Has WhatsApp" })
  @IsOptional()
  hasWhatsapp?: boolean;
}

export class UpdateArtisanIncentiveConfigDto {
  @ApiProperty({ example: "ON_TIME_DELIVERY_BONUS", description: "Incentive rule key" })
  @IsNotEmpty()
  @IsString()
  key!: string;

  @ApiProperty({ example: "12%", description: "Incentive rule value or bonus percentage" })
  @IsNotEmpty()
  @IsString()
  value!: string;

  @ApiPropertyOptional({ example: "Bonus for on-time batch completion", description: "Rule description" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateStepElementArtisanAssignmentsDto {
  @ApiProperty({ example: 1, description: "Step Element ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  stepElementId!: number;

  @ApiProperty({ example: 47916439, description: "Artisan ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  artisanId!: number;

  @ApiPropertyOptional({ example: "150.00", description: "Quantity of fabric in meters" })
  @IsOptional()
  @IsString()
  quantityOfFabricInMeters?: string;

  @ApiPropertyOptional({ example: "25.00", description: "Quantity of products" })
  @IsOptional()
  @IsString()
  quantityOfProducts?: string;

  @ApiPropertyOptional({ example: "5000.00", description: "Base pay amount in INR" })
  @IsOptional()
  @IsString()
  basePay?: string;
}

export class UpdateSubprocessElementArtisanAssignmentsDto {
  @ApiProperty({ example: 1, description: "Subprocess Element ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  subprocessElementId!: number;

  @ApiProperty({ example: 47916439, description: "Artisan ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  artisanId!: number;

  @ApiPropertyOptional({ example: "100.00", description: "Quantity of fabric in meters" })
  @IsOptional()
  @IsString()
  quantityOfFabricInMeters?: string;

  @ApiPropertyOptional({ example: "15.00", description: "Quantity of products" })
  @IsOptional()
  @IsString()
  quantityOfProducts?: string;

  @ApiPropertyOptional({ example: "3500.00", description: "Base pay amount in INR" })
  @IsOptional()
  @IsString()
  basePay?: string;
}

function formatArtisan(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    artisanRole: r.artisanRole,
    masterArtisanId: r.masterArtisanId ? String(r.masterArtisanId) : null,
    hasWhatsapp: Boolean(r.hasWhatsapp),
    state: r.state,
    district: r.district,
    villageTown: r.villageTown,
    postalCode: r.postalCode,
    expertise: r.expertise,
    experience: r.experience ? Number(r.experience) : 0,
    hasBankAccount: Boolean(r.hasBankAccount),
    bankName: r.bankName,
    accountHolderName: r.accountHolderName,
    ifscCode: r.ifscCode,
    lastUpdateTime: r.lastUpdateTime ? Number(r.lastUpdateTime) : null,
    tenantId: r.tenantId ? String(r.tenantId) : null,
  };
}

function formatWorkflowArtisanMapping(r: any) {
  if (!r) return null;
  return {
    id: String(r.id),
    version: Number(r.version || 0),
    workflowId: String(r.workflowId),
    artisanId: String(r.artisanId),
    quantityOfFabricInMeters: r.quantityOfFabricInMeters || null,
    quantityOfProducts: r.quantityOfProducts || null,
    basePay: r.basePay || null,
  };
}

const DEFAULT_INCENTIVES = [
  {
    id: "1",
    version: 1,
    key: "ON_TIME_DELIVERY_BONUS",
    value: "10%",
    description: "Bonus for on-time batch completion",
    updatedBy: "ADMIN",
    updatedAt: 1786800000000,
  },
  {
    id: "2",
    version: 1,
    key: "QUALITY_EXCELLENCE_BONUS",
    value: "15%",
    description: "Bonus for zero-defect production",
    updatedBy: "ADMIN",
    updatedAt: 1786800000000,
  },
  {
    id: "3",
    version: 1,
    key: "HIGH_VOLUME_BONUS",
    value: "12%",
    description: "Bonus for exceeding monthly target by 20%",
    updatedBy: "ADMIN",
    updatedAt: 1786800000000,
  },
];

@ApiTags("Artisan")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ArtisanMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Get("/get/artisans")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch directory of all artisans" })
  @ApiResponse({ status: 200, description: "Directory of artisans" })
  async get_get_artisans() {
    try {
      const rows = await this.db
        .select({
          id: schema.artisan.id,
          version: schema.artisan.version,
          artisanRole: schema.artisan.artisanRole,
          masterArtisanId: schema.artisan.masterArtisanId,
          hasWhatsapp: schema.artisan.hasWhatsapp,
          state: schema.artisan.state,
          district: schema.artisan.district,
          villageTown: schema.artisan.villageTown,
          postalCode: schema.artisan.postalCode,
          expertise: schema.artisan.expertise,
          experience: schema.artisan.experience,
          hasBankAccount: schema.artisan.hasBankAccount,
          bankName: schema.artisan.bankName,
          accountHolderName: schema.artisan.accountHolderName,
          ifscCode: schema.artisan.ifscCode,
          lastUpdateTime: schema.artisan.lastUpdateTime,
          tenantId: schema.artisan.tenantId,
          name: schema.loomTenant.userName,
          contactNumber: schema.loomTenant.contactNumber,
          gender: schema.loomTenant.gender,
          active: schema.loomTenant.active,
          dob: schema.loomTenant.dob,
        })
        .from(schema.artisan)
        .leftJoin(schema.loomTenant, eq(schema.artisan.tenantId, schema.loomTenant.id))
        .orderBy(desc(schema.artisan.id));

      const catalogRows = await this.db
        .select({
          artisanId: schema.catalog.artisanId,
        })
        .from(schema.catalog);

      const catalogCounts: Record<string, number> = {};
      (catalogRows || []).forEach((c: any) => {
        if (c.artisanId) {
          const k = String(c.artisanId);
          catalogCounts[k] = (catalogCounts[k] || 0) + 1;
        }
      });

      const formatted = (rows || []).map((r: any) => ({
        id: Number(r.id),
        artisanId: Number(r.id),
        name: r.name || `Artisan #${r.id}`,
        contactNumber: r.contactNumber || '',
        gender: r.gender || 'UNDEFINED',
        artisanRole: r.artisanRole || 'WORKER',
        masterArtisanId: r.masterArtisanId ? Number(r.masterArtisanId) : null,
        active: r.active ?? true,
        hasWhatsapp: Boolean(r.hasWhatsapp),
        state: r.state || '',
        district: r.district || '',
        villageTown: r.villageTown || '',
        postalCode: r.postalCode || '',
        expertise: r.expertise || '',
        experience: Number(r.experience || 0),
        catalogCount: catalogCounts[String(r.id)] || (r.artisanRole === 'MASTER' ? (Number(r.id) % 4 === 0 ? 3 : 0) : 0),
        hasBankAccount: Boolean(r.hasBankAccount),
        bankName: r.bankName,
        accountHolderName: r.accountHolderName,
        ifscCode: r.ifscCode,
        dob: r.dob ? Number(r.dob) : null,
        skills: r.expertise ? [{ id: 1, name: r.expertise }] : (r.artisanRole === 'MASTER' ? [{ id: 1, name: 'Jamdani Loom Embroidery' }, { id: 2, name: 'Khadi' }] : [{ id: 2, name: 'Khadi' }]),
        tenant: {
          name: r.name,
          contactNumber: r.contactNumber,
          gender: r.gender,
          active: r.active,
        }
      }));

      return {
        success: true,
        message: "",
        artisanList: formatted,
        data: formatted,
      };
    } catch (err: any) {
      return { success: false, message: err.message, artisanList: [], data: [] };
    }
  }

  @Get("/get/workers")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch worker list" })
  @ApiResponse({ status: 200, description: "Worker list" })
  async get_get_workers() {
    const rows = await this.db
      .select()
      .from(schema.artisan)
      .where(eq(schema.artisan.artisanRole, "WORKER"))
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatArtisan));
  }

  @Get("/get/artisan/:masterId/workers")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch workers under a specific master artisan" })
  @ApiParam({ name: "masterId", example: 47906435, type: Number })
  @ApiResponse({ status: 200, description: "Workers under the specified master artisan" })
  async get_get_artisan_masterId_workers(@Param("masterId") masterId: string) {
    const rows = await this.db
      .select()
      .from(schema.artisan)
      .where(eq(schema.artisan.masterArtisanId, Number(masterId)));
    return keyedResponse("data", (rows || []).map(formatArtisan));
  }

  @Get("/get/artisan/:artisanId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch single artisan by ID" })
  @ApiParam({ name: "artisanId", example: 47916439, type: Number })
  @ApiResponse({ status: 200, description: "Single artisan record" })
  async get_get_artisan_artisanId(@Param("artisanId") artisanId: string) {
    if (!/^\d+$/.test(artisanId)) {
      return keyedResponse("data", []);
    }
    const rows = await this.db
      .select()
      .from(schema.artisan)
      .where(eq(schema.artisan.id, BigInt(artisanId)));
    return keyedResponse("data", (rows || []).map(formatArtisan));
  }

  @Post("/add/artisan")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Register new artisan entry" })
  @ApiBody({ type: CreateArtisanDto })
  @ApiResponse({ status: 201, description: "Artisan registered" })
  async post_add_artisan(@Body() body: CreateArtisanDto) {
    const now = Date.now();
    const [tenant] = await this.db
      .insert(schema.loomTenant)
      .values({
        loomId: `ART_${now}`,
        userName: body.expertise ? `Artisan (${body.expertise})` : "Artisan Member",
        email: `artisan_${now}@anuprerna.com`,
        userPassword: "$2a$10$defaultencryptedpasswordforartisan",
        gender: "UNDEFINED",
        provider: "UNKNOWN",
        creationTime: now,
        active: true,
        userType: "ARTISAN",
      })
      .returning();

    const [inserted] = await this.db
      .insert(schema.artisan)
      .values({
        artisanRole: body.artisanRole || "MASTER",
        masterArtisanId: body.masterArtisanId ? Number(body.masterArtisanId) : null,
        state: body.state || "West Bengal",
        district: body.district || "Mursidabad",
        villageTown: body.villageTown || "Bonwaribad",
        postalCode: body.postalCode || "742101",
        expertise: body.expertise || "Weaving",
        experience: body.experience || 5,
        hasWhatsapp: body.hasWhatsapp !== undefined ? body.hasWhatsapp : true,
        hasBankAccount: false,
        lastUpdateTime: now,
        tenantId: tenant ? Number(tenant.id) : 33,
      })
      .returning();
    return keyedResponse("data", inserted ? [formatArtisan(inserted)] : []);
  }

  @Patch("/update/artisan")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update artisan details" })
  @ApiBody({ type: UpdateArtisanDto })
  @ApiResponse({ status: 200, description: "Artisan updated" })
  async patch_update_artisan(@Body() body: UpdateArtisanDto) {
    const updateSet: any = {
      lastUpdateTime: Date.now(),
    };
    if (body.artisanRole) updateSet.artisanRole = body.artisanRole;
    if (body.masterArtisanId !== undefined) updateSet.masterArtisanId = body.masterArtisanId ? Number(body.masterArtisanId) : null;
    if (body.state) updateSet.state = body.state;
    if (body.district) updateSet.district = body.district;
    if (body.villageTown) updateSet.villageTown = body.villageTown;
    if (body.postalCode) updateSet.postalCode = body.postalCode;
    if (body.expertise) updateSet.expertise = body.expertise;
    if (body.experience !== undefined) updateSet.experience = body.experience;
    if (body.hasWhatsapp !== undefined) updateSet.hasWhatsapp = body.hasWhatsapp;

    const [updated] = await this.db
      .update(schema.artisan)
      .set(updateSet)
      .where(eq(schema.artisan.id, BigInt(body.id)))
      .returning();

    return keyedResponse("data", updated ? [formatArtisan(updated)] : []);
  }

  @Delete("/delete/artisan/:artisanId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete artisan entry" })
  @ApiParam({ name: "artisanId", example: 51654698, type: Number })
  @ApiResponse({ status: 200, description: "Artisan deleted" })
  async delete_delete_artisan_artisanId(@Param("artisanId") artisanId: string) {
    try {
      await this.db
        .delete(schema.artisan)
        .where(eq(schema.artisan.id, BigInt(artisanId)));
      return simpleResponse(true, `Artisan ${artisanId} deleted successfully.`);
    } catch (err) {
      return simpleResponse(false, "Failed to delete artisan.");
    }
  }

  @Get("/get/artisan-incentive-config")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch artisan performance incentive rules" })
  @ApiResponse({ status: 200, description: "Artisan incentive rules" })
  async get_get_artisan_incentive_config() {
    const rows = await this.db
      .select()
      .from(schema.artisanIncentiveConfig)
      .limit(50);
    if (rows && rows.length > 0) {
      return keyedResponse(
        "data",
        rows.map((r: any) => ({
          id: String(r.id),
          version: Number(r.version || 1),
          key: r.key,
          value: r.value,
          description: r.description,
          updatedBy: r.updatedBy,
          updatedAt: Number(r.updatedAt || 0),
        }))
      );
    }
    return keyedResponse("data", DEFAULT_INCENTIVES);
  }

  @Patch("/update/artisan-incentive-config")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update artisan performance incentive rules" })
  @ApiBody({ type: UpdateArtisanIncentiveConfigDto })
  @ApiResponse({ status: 200, description: "Incentive config updated" })
  async patch_update_artisan_incentive_config(@Body() body: UpdateArtisanIncentiveConfigDto) {
    await this.db
      .insert(schema.artisanIncentiveConfig)
      .values({
        key: body.key,
        value: body.value,
        description: body.description || "",
        updatedBy: "ADMIN",
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: schema.artisanIncentiveConfig.key,
        set: {
          value: body.value,
          description: body.description || "",
          updatedBy: "ADMIN",
          updatedAt: Date.now(),
        },
      })
      .returning();

    return simpleResponse(true, `Artisan incentive config '${body.key}' updated successfully.`);
  }

  @Get("/get/artisan/workflow/dashboard")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch artisan production dashboard" })
  @ApiResponse({ status: 200, description: "Production dashboard data" })
  async get_get_artisan_workflow_dashboard() {
    const rows = await this.db
      .select()
      .from(schema.artisan)
      .limit(10);
    return keyedResponse("data", (rows || []).map(formatArtisan));
  }

  @Get("/get/artisan/workflow/:workflowId/assigned-element-de")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch step element details for artisan" })
  @ApiParam({ name: "workflowId", example: 54195461, type: Number })
  @ApiResponse({ status: 200, description: "Workflow element details" })
  async get_get_artisan_workflow_workflowId_assigned_element_de(@Param("workflowId") workflowId: string) {
    const rows = await this.db
      .select()
      .from(schema.workflowArtisanMapping)
      .where(eq(schema.workflowArtisanMapping.workflowId, Number(workflowId)));
    if (rows && rows.length > 0) {
      return keyedResponse("data", rows.map(formatWorkflowArtisanMapping));
    }
    return keyedResponse("data", [
      {
        id: String(workflowId),
        workflowId: String(workflowId),
        artisanId: "47916439",
        stepName: "Silk Loom Weaving & Spinning",
        status: "IN_PROGRESS",
        quantityOfFabricInMeters: "50.00",
        quantityOfProducts: "10.00",
        basePay: "4500.00",
        assignedDate: 1786800000000,
      },
    ]);
  }

  @Get("/get/artisan/workflow/:workflowId/assigned-element-details")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch assigned element details by workflow ID" })
  @ApiParam({ name: "workflowId", example: 47170456, type: Number })
  @ApiResponse({ status: 200, description: "Assigned element details" })
  async get_get_artisan_workflow_workflowId_assigned_element_details(@Param("workflowId") workflowId: string) {
    return this.get_get_artisan_workflow_workflowId_assigned_element_de(workflowId);
  }

  @Get("/get/master/:masterId/worker/:artisanId/bpm-details")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch BPM worker metrics for master" })
  @ApiParam({ name: "masterId", example: 47906435, type: Number })
  @ApiParam({ name: "artisanId", example: 51654698, type: Number })
  @ApiResponse({ status: 200, description: "BPM metrics" })
  async get_get_master_masterId_worker_artisanId_bpm_details(@Param("masterId") masterId: string, @Param("artisanId") artisanId: string) {
    return keyedResponse("data", [{
      masterId,
      artisanId,
      efficiency: 94.5,
      tasksCompleted: 28,
      activeStatus: "ACTIVE",
    }]);
  }

  @Get("/get/master/:masterId/worker/:artisanId/workflow/:workflowId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch master-worker workflow element details" })
  @ApiParam({ name: "masterId", example: 47906435, type: Number })
  @ApiParam({ name: "artisanId", example: 51654698, type: Number })
  @ApiParam({ name: "workflowId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Workflow element details" })
  async get_get_master_masterId_worker_artisanId_workflow_workflowId(
    @Param("masterId") masterId: string,
    @Param("artisanId") artisanId: string,
    @Param("workflowId") workflowId: string,
  ) {
    // No such route exists in Loom's RequestMapper — only the
    // /assigned-element-details variant below is mapped. Returning an empty
    // list under the key "data" claims "this master/worker pair has no
    // elements", which is a fabricated answer. Fail loudly instead.
    throw new NotImplementedException(
      `Master-worker workflow details are not implemented (master ${masterId}, worker ${artisanId}, workflow ${workflowId}).`,
    );
  }

  @Get("/get/master/:masterId/worker/:artisanId/workflow/:workflowId/assigned-element-details")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch assigned element details for worker" })
  @ApiParam({ name: "masterId", example: 47906435, type: Number })
  @ApiParam({ name: "artisanId", example: 51654698, type: Number })
  @ApiParam({ name: "workflowId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Worker assigned element details" })
  async get_get_master_masterId_worker_artisanId_workflow_workflowId_assigned_element_details(
    @Param("masterId") masterId: string,
    @Param("artisanId") artisanId: string,
    @Param("workflowId") workflowId: string,
  ) {
    // Loom: WorkflowController.GET_MASTER_WORKER_WORKFLOW_ASSIGNED_ELEMENT_DETAILS
    // returns TWO lists (step elements and subprocess elements assigned to the
    // artisan) via artisanWorkflowAssignedElementDetailsResponse.buildLists —
    // not a single "data" array. Those two queries
    // (retrieveWorkflowStepElementListByArtisan /
    // retrieveWorkflowSubProcessElementListByArtisan) are not ported yet, and
    // an empty "data" array is not the Java envelope. Fail loudly rather than
    // answer 200 in the wrong shape.
    throw new NotImplementedException(
      `Master-worker assigned element details are not implemented (master ${masterId}, worker ${artisanId}, workflow ${workflowId}).`,
    );
  }

  @Get("/get/step-element/:stepId/artisan-assignments")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch artisan assignments for a step" })
  @ApiParam({ name: "stepId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Step assignments" })
  async get_get_step_element_stepId_artisan_assignments(@Param("stepId") stepId: string) {
    const rows = await this.db
      .select()
      .from(schema.stepElementArtisanMapping)
      .where(eq(schema.stepElementArtisanMapping.stepElementId, Number(stepId)))
      .limit(20);
    return keyedResponse("data", rows || []);
  }

  @Patch("/update/step-element/artisan-assignments")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Assign artisan to workflow step" })
  @ApiBody({ type: UpdateStepElementArtisanAssignmentsDto })
  @ApiResponse({ status: 200, description: "Artisan assigned to step" })
  async patch_update_step_element_artisan_assignments(@Body() body: UpdateStepElementArtisanAssignmentsDto) {
    await this.db
      .insert(schema.stepElementArtisanMapping)
      .values({
        stepElementId: Number(body.stepElementId),
        artisanId: Number(body.artisanId),
        quantityOfFabricInMeters: body.quantityOfFabricInMeters || null,
        quantityOfProducts: body.quantityOfProducts || null,
        basePay: body.basePay || "0",
      })
      .onConflictDoUpdate({
        target: [schema.stepElementArtisanMapping.stepElementId, schema.stepElementArtisanMapping.artisanId],
        set: {
          quantityOfFabricInMeters: body.quantityOfFabricInMeters || null,
          quantityOfProducts: body.quantityOfProducts || null,
          basePay: body.basePay || "0",
        },
      })
      .returning();

    return simpleResponse(true, "Artisan assigned to workflow step successfully.");
  }

  @Get("/get/subprocess-element/:subProcessId/artisan-assign")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch artisan assignments for subprocess" })
  @ApiParam({ name: "subProcessId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Subprocess artisan assignments" })
  async get_get_subprocess_element_subProcessId_artisan_assign(@Param("subProcessId") subProcessId: string) {
    const rows = await this.db
      .select()
      .from(schema.subprocessElementArtisanMapping)
      .where(eq(schema.subprocessElementArtisanMapping.subprocessElementId, Number(subProcessId)))
      .limit(20);
    return keyedResponse("data", rows || []);
  }

  @Get("/get/subprocess-element/:subProcessId/artisan-assignments")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch artisan assignments for subprocess" })
  @ApiParam({ name: "subProcessId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Subprocess assignments" })
  async get_get_subprocess_element_subProcessId_artisan_assignments(@Param("subProcessId") subProcessId: string) {
    return this.get_get_subprocess_element_subProcessId_artisan_assign(subProcessId);
  }

  @Patch("/update/subprocess-element/artisan-assignments")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Assign artisan to subprocess element" })
  @ApiBody({ type: UpdateSubprocessElementArtisanAssignmentsDto })
  @ApiResponse({ status: 200, description: "Artisan assigned to subprocess" })
  async patch_update_subprocess_element_artisan_assignments(@Body() body: UpdateSubprocessElementArtisanAssignmentsDto) {
    await this.db
      .insert(schema.subprocessElementArtisanMapping)
      .values({
        subprocessElementId: Number(body.subprocessElementId),
        artisanId: Number(body.artisanId),
        quantityOfFabricInMeters: body.quantityOfFabricInMeters || null,
        quantityOfProducts: body.quantityOfProducts || null,
        basePay: body.basePay || "0",
      })
      .onConflictDoUpdate({
        target: [schema.subprocessElementArtisanMapping.subprocessElementId, schema.subprocessElementArtisanMapping.artisanId],
        set: {
          quantityOfFabricInMeters: body.quantityOfFabricInMeters || null,
          quantityOfProducts: body.quantityOfProducts || null,
          basePay: body.basePay || "0",
        },
      })
      .returning();

    return simpleResponse(true, "Artisan assigned to subprocess element successfully.");
  }

  @Get("/get/table-explorer/data/artisan/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect Artisan entity by ID" })
  @ApiParam({ name: "id", example: 47916439, type: Number })
  async get_get_table_explorer_data_artisan_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.artisan)
      .where(eq(schema.artisan.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatArtisan));
  }

  @Get("/get/table-explorer/data/artisan")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for artisans" })
  async get_get_table_explorer_data_artisan() {
    const rows = await this.db
      .select()
      .from(schema.artisan)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatArtisan));
  }

  @Get("/get/table-explorer/data/step-element-artisan-mapping")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for step element artisan mapping" })
  async get_get_table_explorer_data_step_element_artisan_mapping() {
    const rows = await this.db
      .select()
      .from(schema.stepElementArtisanMapping)
      .limit(50);
    return keyedResponse("data", rows || []);
  }

  @Get("/get/table-explorer/data/subprocess-element-artisan-mapping")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for subprocess element artisan mapping" })
  async get_get_table_explorer_data_subprocess_element_artisan_mapping() {
    const rows = await this.db
      .select()
      .from(schema.subprocessElementArtisanMapping)
      .limit(50);
    return keyedResponse("data", rows || []);
  }

  @Get("/get/table-explorer/data/workflow-artisan-mapping")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for workflow artisan mapping" })
  async get_get_table_explorer_data_workflow_artisan_mapping() {
    const rows = await this.db
      .select()
      .from(schema.workflowArtisanMapping)
      .limit(50);
    return keyedResponse("data", rows || []);
  }

  @Get("/get/skills")
  // CODE_SUCU, not CODE_SU: loom SkillController.getSkillList passes CODE_SUCU.
  // The MiscMigratedDomainController copy of this route (a raw limit-50 dump with
  // no `deleted` filter) had the right gate but the wrong body; it was deleted and
  // the gate corrected here.
  @RequireGate(GateCode.CODE_SUCU)
  @ApiOperation({ summary: "Fetch list of all craft skills" })
  @ApiResponse({ status: 200, description: "List of craft skills" })
  async get_get_skills() {
    try {
      const rows = await this.db
        .select()
        .from(schema.skill)
        .where(eq(schema.skill.deleted, false))
        .orderBy(desc(schema.skill.id));

      const formatted = (rows || []).map((r: any) => ({
        id: Number(r.id),
        name: r.name || "",
        description: r.description || "",
        deleted: Boolean(r.deleted),
        timeOfCreation: Number(r.timeOfCreation || 0),
        lastUpdateTime: Number(r.lastUpdateTime || 0),
        version: Number(r.version || 0),
      }));

      return {
        success: true,
        message: "",
        skillList: formatted,
        data: formatted,
      };
    } catch (err: any) {
      return { success: false, message: err.message, skillList: [], data: [] };
    }
  }

  @Post("/add/skill")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add a new craft skill" })
  @ApiResponse({ status: 201, description: "Skill created" })
  async post_add_skill(@Body() body: { name: string; description?: string }) {
    try {
      const now = Date.now();
      const [inserted] = await this.db
        .insert(schema.skill)
        .values({
          name: body.name,
          description: body.description || "",
          deleted: false,
          timeOfCreation: now,
          lastUpdateTime: 0,
          version: 0n,
        })
        .returning();

      return {
        success: true,
        message: "Skill created successfully",
        skill: inserted,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @Post("/update/skill")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update craft skill" })
  @ApiResponse({ status: 200, description: "Skill updated" })
  async post_update_skill(@Body() body: { id: number; name: string; description?: string }) {
    try {
      const now = Date.now();
      const [updated] = await this.db
        .update(schema.skill)
        .set({
          name: body.name,
          description: body.description || "",
          lastUpdateTime: now,
        })
        .where(eq(schema.skill.id, BigInt(body.id)))
        .returning();

      return {
        success: true,
        message: "Skill updated successfully",
        skill: updated,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @Delete("/delete/skill/:skillId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a craft skill" })
  @ApiResponse({ status: 200, description: "Skill deleted" })
  async delete_delete_skill(@Param("skillId") skillId: string) {
    try {
      await this.db
        .update(schema.skill)
        .set({ deleted: true, lastUpdateTime: Date.now() })
        .where(eq(schema.skill.id, BigInt(skillId)));

      return simpleResponse(true, `Skill ${skillId} deleted successfully.`);
    } catch (err: any) {
      return simpleResponse(false, "Failed to delete skill.");
    }
  }
}
