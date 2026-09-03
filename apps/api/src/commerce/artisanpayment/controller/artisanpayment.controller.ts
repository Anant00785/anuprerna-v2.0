import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ArtisanPaymentService } from "../service/artisanpayment.service.js";

@ApiTags("Artisan")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ArtisanPaymentController {
  constructor(private readonly service: ArtisanPaymentService) {}

  @Get("/get/artisan-payment/record/list")
  @ApiOperation({ summary: "Get all artisan payment records" })
  @RequireGate(GateCode.CODE_SU)
  async getPaymentRecords(
    @Query("page") page = "0",
    @Query("size") size = "50"
  ) {
    const records = await this.service.getAllRecords(parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("artisanPaymentRecordList", records);
  }

  @Get("/get/artisan-payment/record/:id")
  @ApiOperation({ summary: "Get artisan payment record by id" })
  @RequireGate(GateCode.CODE_SU)
  async getPaymentRecordById(@Param("id") id: string) {
    const record = await this.service.getRecordById(BigInt(id));
    return keyedResponse("artisanPaymentRecord", record);
  }

  @Get("/get/artisan-payment/record/artisan/:artisanId")
  @ApiOperation({ summary: "Get payment records for specific artisan" })
  @RequireGate(GateCode.CODE_SU)
  async getRecordsByArtisan(
    @Param("artisanId") artisanId: string,
    @Query("page") page = "0",
    @Query("size") size = "50"
  ) {
    const records = await this.service.getRecordsByArtisan(BigInt(artisanId), parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("artisanPaymentRecordList", records);
  }

  @Post("/add/artisan-payment/record")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create new artisan payment record" })
  async createPaymentRecord(@Body() body: any) {
    const result = await this.service.createPaymentRecord(body);
    return simpleResponse(!!result, result ? "Artisan payment record created successfully." : "Failed to create record.");
  }

  @Patch("/update/artisan-payment/record/status")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update artisan payment record status" })
  async updateStatus(@Body() body: { id: string; status: string }) {
    const result = await this.service.updateStatus(BigInt(body.id), body.status);
    return simpleResponse(!!result, result ? "Status updated successfully." : "Failed to update status.");
  }

  @Get("/get/artisan-payment/incentive-config/list")
  @ApiOperation({ summary: "Get artisan incentive configurations" })
  @RequireGate(GateCode.CODE_SU)
  async getIncentiveConfigs() {
    const configs = await this.service.getIncentiveConfigs();
    return keyedResponse("artisanIncentiveConfigList", configs);
  }
}
