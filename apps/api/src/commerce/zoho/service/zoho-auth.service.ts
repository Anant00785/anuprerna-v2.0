import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ZohoTokenResponse } from "../types/zoho.types.js";
import type { EnvironmentVariables } from "../../../common/config/env.schema.js";

@Injectable()
export class ZohoAuthTokenService {
  private readonly logger = new Logger(ZohoAuthTokenService.name);
  private cachedAccessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  async getAccessToken(): Promise<string> {
    if (this.cachedAccessToken && Date.now() < this.tokenExpiry) {
      return this.cachedAccessToken;
    }

    const clientId = this.config.get("ZOHO_CLIENT_ID", { infer: true });
    const clientSecret = this.config.get("ZOHO_CLIENT_SECRET", { infer: true });
    const refreshToken = this.config.get("ZOHO_REFRESH_TOKEN", { infer: true });

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
