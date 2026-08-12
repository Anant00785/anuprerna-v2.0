// @ts-nocheck
import { Controller, Post, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../common/response/rain-response.js";
import { ZohoService } from "../service/zoho.service.js";

@Controller()
@UseGuards(RolesGuard)
export class ZohoController {
  constructor(private readonly zohoService: ZohoService) {}

  @Post("/trigger/fabric-product/zoho-workflow")
  @RequireGate(GateCode.CODE_SU)
  async triggerFabricProductWorkflow(@Body() body: { productId?: number }) {
    const success = await this.zohoService.triggerFabricProductWorkflow(body.productId ?? 0);
    return simpleResponse(success, "Fabric product Zoho workflow triggered");
  }

  @Post("/trigger/finished-product/zoho-workflow")
  @RequireGate(GateCode.CODE_SU)
  async triggerFinishedProductWorkflow(@Body() body: { productId?: number }) {
    const success = await this.zohoService.triggerFinishedProductWorkflow(body.productId ?? 0);
    return simpleResponse(success, "Finished product Zoho workflow triggered");
  }

  @Delete("/delete/product-zoho-relation/:id")
  @RequireGate(GateCode.CODE_SU)
  async deleteProductZohoRelation(@Param("id") id: string) {
    return simpleResponse(true, `Product Zoho relation ${id} deleted`);
  }

  @Post("/zoho/sync/all-product")
  @RequireGate(GateCode.CODE_SU)
  async syncAllProducts() {
    const res = await this.zohoService.syncAllProducts();
    return keyedResponse("syncResult", res);
  }

  @Post("/zoho/webhook/sales-order")
  async handleSalesOrderWebhook(@Body() payload: any) {
    await this.zohoService.processSalesOrderWebhook(payload);
    return simpleResponse(true, "Sales order webhook processed");
  }

  @Post("/zoho/webhook/bill")
  async handleBillWebhook(@Body() payload: any) {
    await this.zohoService.processBillWebhook(payload);
    return simpleResponse(true, "Bill webhook processed");
  }

  @Post("/zoho/webhook/inventory-adjustment")
  async handleInventoryAdjustmentWebhook(@Body() payload: any) {
    await this.zohoService.processInventoryAdjustmentWebhook(payload);
    return simpleResponse(true, "Inventory adjustment webhook processed");
  }

  @Post("/zoho/webhook/package")
  async handlePackageWebhook(@Body() payload: any) {
    await this.zohoService.processPackageWebhook(payload);
    return simpleResponse(true, "Package webhook processed");
  }
}
// @ts-nocheck
