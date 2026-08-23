// @ts-nocheck
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";

import { InventoryService } from "../service/inventory.service.js";
import { 
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateInventoryAdjustmentReasonDto,
  CreateInventoryAdjustmentDto,
  CreateInventoryRestockRequestDto,
  UpdateRestockRequestQuantityDto,
  UpdateRestockRequestStatusDto,
  parseWarehouseInput, 
  parseInventoryAdjustmentReasonInput, 
  parseInventoryAdjustmentInput, 
  parseInventoryRestockRequestInput,
  parseUpdateRestockRequestQuantityInput,
  parseUpdateRestockRequestStatusInput
} from "../dto/inventory.dto.js";
import { 
  validateWarehouse, 
  validateInventoryAdjustmentReason, 
  validateInventoryAdjustment, 
  validateInventoryRestockRequest, 
  validateUpdateRestockRequestQuantity,
  validateUpdateRestockRequestStatus
} from "../validators/inventory.validator.js";
import { 
  sanitizeWarehouse, 
  sanitizeInventoryAdjustmentReason, 
  sanitizeInventoryAdjustment, 
  sanitizeInventoryRestockRequest 
} from "../validators/inventory.sanitizer.js";

@ApiBearerAuth()
@ApiTags("Inventory")
@Controller()
@UseGuards(RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- Warehouse ---

  @Get("/get/warehouse/:warehouseId")
  async getWarehouseById(@Param("warehouseId") warehouseId: string) {
    const warehouse = await this.inventoryService.getWarehouseById(BigInt(warehouseId));
    return keyedResponse("warehouse", warehouse);
  }

  @Get("/get/warehouse")
  async getWarehouse(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    const warehouses = await this.inventoryService.getWarehouses(page, size);
    return keyedResponse("warehouseList", warehouses);
  }

  @Post("/add/warehouse")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add a new warehouse." })
  @ApiBody({ type: CreateWarehouseDto })
  @ApiResponse({ status: 201, description: "Warehouse created." })
  async addWarehouse(@Body() raw: CreateWarehouseDto) {
    const input = parseWarehouseInput(raw);
    const sanitized = sanitizeWarehouse(input);
    const error = validateWarehouse(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.addWarehouse(sanitized);
    return simpleResponse(success, success ? "Warehouse added." : "Failed to add warehouse.");
  }

  @Patch("/update/warehouse")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update warehouse details." })
  @ApiBody({ type: UpdateWarehouseDto })
  @ApiResponse({ status: 200, description: "Warehouse updated." })
  async updateWarehouse(@Body() raw: UpdateWarehouseDto) {
    const input = parseWarehouseInput(raw);
    const sanitized = sanitizeWarehouse(input);
    const error = validateWarehouse(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.updateWarehouse(sanitized);
    return simpleResponse(success, success ? "Warehouse updated." : "Failed to update warehouse.");
  }

  // --- Inventory Adjustment Reason ---

  @Get("/get/inventory-adjustment-reason/:reasonId")
  async getReasonById(@Param("reasonId") reasonId: string) {
    const reason = await this.inventoryService.getReasonById(BigInt(reasonId));
    return keyedResponse("reason", reason);
  }

  @Get("/get/inventory-adjustment-reason")
  async getReasons(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    const reasons = await this.inventoryService.getReasons(page, size);
    return keyedResponse("reasonList", reasons);
  }

  @Post("/add/inventory-adjustment-reason")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add a new inventory adjustment reason." })
  @ApiBody({ type: CreateInventoryAdjustmentReasonDto })
  @ApiResponse({ status: 201, description: "Reason added." })
  async addReason(@Body() raw: CreateInventoryAdjustmentReasonDto) {
    const input = parseInventoryAdjustmentReasonInput(raw);
    const sanitized = sanitizeInventoryAdjustmentReason(input);
    const error = validateInventoryAdjustmentReason(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.addReason(sanitized);
    return simpleResponse(success, success ? "Reason added." : "Failed to add reason.");
  }

  // --- Inventory Adjustment ---

  @Get("/get/inventory-adjustment/:adjustmentId")
  async getAdjustmentById(@Param("adjustmentId") adjustmentId: string) {
    const adjustment = await this.inventoryService.getAdjustmentById(BigInt(adjustmentId));
    return keyedResponse("adjustment", adjustment);
  }

  @Get("/get/inventory-adjustment")
  async getAdjustments(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    const adjustments = await this.inventoryService.getAdjustments(page, size);
    return keyedResponse("adjustmentList", adjustments);
  }

  @Get("/get/inventory-adjustment/:adjustmentId")
  @ApiOperation({ summary: "Get inventory adjustment by ID." })
  @ApiParam({ name: "adjustmentId", type: Number, description: "Adjustment identifier", example: 1 })
  @ApiResponse({ status: 200, description: "Adjustment details." })
  async getAdjustmentById(@Param("adjustmentId") adjustmentId: string) {
    const adjustment = await this.inventoryService.getAdjustmentById(BigInt(adjustmentId));
    return keyedResponse("adjustment", adjustment);
  }

  @Post("/add/inventory-adjustment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Add a new inventory adjustment." })
  @ApiBody({ type: CreateInventoryAdjustmentDto })
  @ApiResponse({ status: 201, description: "Adjustment recorded." })
  async addAdjustment(@Body() raw: CreateInventoryAdjustmentDto, @CurrentTenant() tenant: any) {
    const input = parseInventoryAdjustmentInput(raw);
    input.userId = tenant?.id || 1;
    const sanitized = sanitizeInventoryAdjustment(input);
    const error = validateInventoryAdjustment(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.addAdjustment(sanitized);
    return simpleResponse(success, success ? "Adjustment recorded." : "Failed to record adjustment.");
  }

  // --- Inventory Restock Request ---

  @Get("/get/inventory-restock-request")
  async getRestockRequests(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    const requests = await this.inventoryService.getRestockRequests(page, size);
    return keyedResponse("requestList", requests);
  }

  @Post("/add/inventory-restock-request")
  @RequireGate(GateCode.CODE_SUCU)
  @ApiOperation({ summary: "Submit a new inventory restock request." })
  @ApiBody({ type: CreateInventoryRestockRequestDto })
  @ApiResponse({ status: 201, description: "Restock request submitted." })
  async addRestockRequest(@Body() raw: CreateInventoryRestockRequestDto, @CurrentTenant() tenant: any) {
    const input = parseInventoryRestockRequestInput(raw);
    input.tenantId = tenant?.id || 1;
    const sanitized = sanitizeInventoryRestockRequest(input);
    const error = validateInventoryRestockRequest(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.addRestockRequest(sanitized);
    return simpleResponse(success, success ? "Restock request added." : "Failed to add restock request.");
  }

  @Patch("/update/inventory-restock-request/quantity")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update quantity for an inventory restock request." })
  @ApiBody({ type: UpdateRestockRequestQuantityDto })
  @ApiResponse({ status: 200, description: "Restock request quantity updated." })
  async updateRestockRequestQuantity(@Body() raw: UpdateRestockRequestQuantityDto) {
    const input = parseUpdateRestockRequestQuantityInput(raw);
    const error = validateUpdateRestockRequestQuantity(input);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.updateRestockRequestQuantity(input.requestId, input.quantity);
    return simpleResponse(success, success ? "Quantity updated." : "Failed to update quantity.");
  }

  @Patch("/update/inventory-restock-request/status")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update status for an inventory restock request (e.g. APPROVED, REJECTED)." })
  @ApiBody({ type: UpdateRestockRequestStatusDto })
  @ApiResponse({ status: 200, description: "Restock request status updated." })
  async updateRestockRequestStatus(@Body() raw: UpdateRestockRequestStatusDto) {
    const input = parseUpdateRestockRequestStatusInput(raw);
    const error = validateUpdateRestockRequestStatus(input);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.updateRestockRequestStatus(input.requestId, input.status);
    return simpleResponse(success, success ? "Status updated." : "Failed to update status.");
  }

  @Delete("/delete/inventory-restock-request/:requestId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete an inventory restock request by ID." })
  @ApiParam({ name: "requestId", type: Number, description: "Restock request identifier", example: 1 })
  @ApiResponse({ status: 200, description: "Restock request deleted." })
  async deleteRestockRequest(@Param("requestId") requestId: string) {
    const success = await this.inventoryService.deleteRestockRequest(BigInt(requestId));
    return simpleResponse(success, success ? "Request deleted." : "Failed to delete request.");
  }

  // --- Table Explorer endpoints (alias mapping) ---

  @Get("/get/table-explorer/data/warehouse")
  async getTableExplorerWarehouse(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    return this.getWarehouse(page, size);
  }

  @Get("/get/table-explorer/data/inventory-adjustment")
  async getTableExplorerAdjustment(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    return this.getAdjustments(page, size);
  }

  @Get("/get/table-explorer/data/inventory-adjustment-reason")
  async getTableExplorerReason(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    return this.getReasons(page, size);
  }

  @Get("/get/table-explorer/data/inventory-restock-request")
  async getTableExplorerRestockRequest(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    return this.getRestockRequests(page, size);
  }
}
