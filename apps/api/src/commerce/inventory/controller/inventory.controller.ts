// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";

import { InventoryService } from "../service/inventory.service.js";
import { 
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
@Controller()
@UseGuards(RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- Warehouse ---

  @Get("/get/warehouse/:warehouseId")
  @RequireGate(GateCode.CODE_SU)
  async getWarehouseById(@Param("warehouseId") warehouseId: string) {
    const warehouse = await this.inventoryService.getWarehouseById(BigInt(warehouseId));
    return keyedResponse("warehouse", warehouse);
  }

  @Get("/get/warehouse")
  @RequireGate(GateCode.CODE_SU)
  async getWarehouse(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    const warehouses = await this.inventoryService.getWarehouses(page, size);
    return keyedResponse("warehouseList", warehouses);
  }

  @Post("/add/warehouse")
  @RequireGate(GateCode.CODE_SU)
  async addWarehouse(@Body() raw: unknown) {
    const input = parseWarehouseInput(raw);
    const sanitized = sanitizeWarehouse(input);
    const error = validateWarehouse(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.addWarehouse(sanitized);
    return simpleResponse(success, success ? "Warehouse added." : "Failed to add warehouse.");
  }

  @Patch("/update/warehouse")
  @RequireGate(GateCode.CODE_SU)
  async updateWarehouse(@Body() raw: unknown) {
    const input = parseWarehouseInput(raw);
    const sanitized = sanitizeWarehouse(input);
    const error = validateWarehouse(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.updateWarehouse(sanitized);
    return simpleResponse(success, success ? "Warehouse updated." : "Failed to update warehouse.");
  }

  // --- Inventory Adjustment Reason ---

  @Get("/get/inventory-adjustment-reason/:reasonId")
  @RequireGate(GateCode.CODE_SU)
  async getReasonById(@Param("reasonId") reasonId: string) {
    const reason = await this.inventoryService.getReasonById(BigInt(reasonId));
    return keyedResponse("reason", reason);
  }

  @Get("/get/inventory-adjustment-reason")
  @RequireGate(GateCode.CODE_SU)
  async getReasons(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    const reasons = await this.inventoryService.getReasons(page, size);
    return keyedResponse("reasonList", reasons);
  }

  @Post("/add/inventory-adjustment-reason")
  @RequireGate(GateCode.CODE_SU)
  async addReason(@Body() raw: unknown) {
    const input = parseInventoryAdjustmentReasonInput(raw);
    const sanitized = sanitizeInventoryAdjustmentReason(input);
    const error = validateInventoryAdjustmentReason(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.addReason(sanitized);
    return simpleResponse(success, success ? "Reason added." : "Failed to add reason.");
  }

  @Patch("/update/inventory-adjustment-reason")
  @RequireGate(GateCode.CODE_SU)
  async updateReason(@Body() raw: unknown) {
    const input = parseInventoryAdjustmentReasonInput(raw);
    const sanitized = sanitizeInventoryAdjustmentReason(input);
    const error = validateInventoryAdjustmentReason(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.updateReason(sanitized);
    return simpleResponse(success, success ? "Reason updated." : "Failed to update reason.");
  }

  // --- Inventory Adjustment ---

  @Get("/get/inventory-adjustment/:adjustmentId")
  @RequireGate(GateCode.CODE_SU)
  async getAdjustmentById(@Param("adjustmentId") adjustmentId: string) {
    const adjustment = await this.inventoryService.getAdjustmentById(BigInt(adjustmentId));
    return keyedResponse("adjustment", adjustment);
  }

  @Get("/get/inventory-adjustment")
  @RequireGate(GateCode.CODE_SU)
  async getAdjustments(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    const adjustments = await this.inventoryService.getAdjustments(page, size);
    return keyedResponse("adjustmentList", adjustments);
  }

  @Post("/add/inventory-adjustment")
  @RequireGate(GateCode.CODE_SU)
  async addAdjustment(@Body() raw: unknown, @CurrentTenant() tenant: AuthenticatedTenant) {
    const input = parseInventoryAdjustmentInput(raw);
    input.userId = tenant.id;
    const sanitized = sanitizeInventoryAdjustment(input);
    const error = validateInventoryAdjustment(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.addAdjustment(sanitized);
    return simpleResponse(success, success ? "Adjustment added." : "Failed to add adjustment.");
  }

  // --- Inventory Restock Request ---

  @Get("/get/inventory-restock-request")
  @RequireGate(GateCode.CODE_SU)
  async getRestockRequests(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    const requests = await this.inventoryService.getRestockRequests(page, size);
    return keyedResponse("requestList", requests);
  }

  @Post("/add/inventory-restock-request")
  @RequireGate(GateCode.CODE_SUCU)
  async addRestockRequest(@Body() raw: unknown, @CurrentTenant() tenant: AuthenticatedTenant) {
    const input = parseInventoryRestockRequestInput(raw);
    input.tenantId = tenant.id;
    const sanitized = sanitizeInventoryRestockRequest(input);
    const error = validateInventoryRestockRequest(sanitized);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.addRestockRequest(sanitized);
    return simpleResponse(success, success ? "Restock request added." : "Failed to add restock request.");
  }

  @Patch("/update/inventory-restock-request/quantity")
  @RequireGate(GateCode.CODE_SU)
  async updateRestockRequestQuantity(@Body() raw: unknown) {
    const input = parseUpdateRestockRequestQuantityInput(raw);
    const error = validateUpdateRestockRequestQuantity(input);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.updateRestockRequestQuantity(input.requestId, input.quantity);
    return simpleResponse(success, success ? "Quantity updated." : "Failed to update quantity.");
  }

  @Patch("/update/inventory-restock-request/status")
  @RequireGate(GateCode.CODE_SU)
  async updateRestockRequestStatus(@Body() raw: unknown) {
    const input = parseUpdateRestockRequestStatusInput(raw);
    const error = validateUpdateRestockRequestStatus(input);
    if (error) return simpleResponse(false, error);

    const success = await this.inventoryService.updateRestockRequestStatus(input.requestId, input.status);
    return simpleResponse(success, success ? "Status updated." : "Failed to update status.");
  }

  @Delete("/delete/inventory-restock-request/:requestId")
  @RequireGate(GateCode.CODE_SU)
  async deleteRestockRequest(@Param("requestId") requestId: string) {
    const success = await this.inventoryService.deleteRestockRequest(BigInt(requestId));
    return simpleResponse(success, success ? "Request deleted." : "Failed to delete request.");
  }

  // --- Table Explorer endpoints (alias mapping) ---

  @Get("/get/table-explorer/data/warehouse")
  @RequireGate(GateCode.CODE_SU)
  async getTableExplorerWarehouse(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    return this.getWarehouse(page, size);
  }

  @Get("/get/table-explorer/data/inventory-adjustment")
  @RequireGate(GateCode.CODE_SU)
  async getTableExplorerAdjustment(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    return this.getAdjustments(page, size);
  }

  @Get("/get/table-explorer/data/inventory-adjustment-reason")
  @RequireGate(GateCode.CODE_SU)
  async getTableExplorerReason(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    return this.getReasons(page, size);
  }

  @Get("/get/table-explorer/data/inventory-restock-request")
  @RequireGate(GateCode.CODE_SU)
  async getTableExplorerRestockRequest(@Query("page") page: number = 0, @Query("size") size: number = 10) {
    return this.getRestockRequests(page, size);
  }
}
