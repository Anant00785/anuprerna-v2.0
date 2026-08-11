// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { ZohoAuthTokenService } from "./zoho-auth.service.js";
import { ZohoContactPayload, ZohoItemPayload } from "../types/zoho.types.js";

@Injectable()
export class ZohoService {
  private readonly logger = new Logger(ZohoService.name);
  private readonly orgId = process.env.ZOHO_ORG_ID ?? "";
  private readonly baseUrl = process.env.ZOHO_API_BASE_URL ?? "https://www.zohoapis.com/inventory/v1";

  constructor(private readonly authService: ZohoAuthTokenService) {}

  async createOrUpdateContact(payload: ZohoContactPayload): Promise<any> {
    const token = await this.authService.getAccessToken();
    const res = await fetch(`${this.baseUrl}/contacts?organization_id=${this.orgId}`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async syncItem(payload: ZohoItemPayload): Promise<any> {
    const token = await this.authService.getAccessToken();
    const res = await fetch(`${this.baseUrl}/items?organization_id=${this.orgId}`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async triggerFabricProductWorkflow(productId: number): Promise<boolean> {
    this.logger.log(`Triggering Zoho workflow for fabric product: ${productId}`);
    return true;
  }

  async triggerFinishedProductWorkflow(productId: number): Promise<boolean> {
    this.logger.log(`Triggering Zoho workflow for finished product: ${productId}`);
    return true;
  }

  async syncAllProducts(): Promise<{ status: string; count: number }> {
    this.logger.log("Initiated Zoho sync for all products");
    return { status: "SUCCESS", count: 0 };
  }

  async processSalesOrderWebhook(payload: any): Promise<void> {
    this.logger.log(`Received Sales Order Webhook from Zoho: ${JSON.stringify(payload)}`);
  }

  async processBillWebhook(payload: any): Promise<void> {
    this.logger.log(`Received Bill Webhook from Zoho: ${JSON.stringify(payload)}`);
  }

  async processInventoryAdjustmentWebhook(payload: any): Promise<void> {
    this.logger.log(`Received Inventory Adjustment Webhook from Zoho: ${JSON.stringify(payload)}`);
  }

  async processPackageWebhook(payload: any): Promise<void> {
    this.logger.log(`Received Package Delivery Webhook from Zoho: ${JSON.stringify(payload)}`);
  }
}
// @ts-nocheck
