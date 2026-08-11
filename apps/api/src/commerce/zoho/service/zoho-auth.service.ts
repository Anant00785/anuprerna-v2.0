// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { ZohoTokenResponse } from "../types/zoho.types.js";

@Injectable()
export class ZohoAuthTokenService {
  private readonly logger = new Logger(ZohoAuthTokenService.name);
  private cachedAccessToken: string | null = null;
  private tokenExpiry: number = 0;

  async getAccessToken(): Promise<string> {
    if (this.cachedAccessToken && Date.now() < this.tokenExpiry) {
      return this.cachedAccessToken;
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      this.logger.warn("Zoho API credentials missing from environment variables");
      return "MOCK_ZOHO_ACCESS_TOKEN";
    }

    try {
      const url = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`;
      const res = await fetch(url, { method: "POST" });
      const data = (await res.json()) as ZohoTokenResponse;

      this.cachedAccessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      return this.cachedAccessToken;
    } catch (err: any) {
      this.logger.error("Failed to refresh Zoho OAuth token", err);
      throw err;
    }
  }
}
// @ts-nocheck
