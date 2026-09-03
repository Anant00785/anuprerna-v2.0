import { Injectable } from '@nestjs/common';

export interface CurrencyCountryInfo {
  country: string;
  continent: string;
  currency: string;
  ip?: string;
}

@Injectable()
export class IPLocationService {
  async getCurrencyCountryFromIPAddress(ip: string): Promise<CurrencyCountryInfo> {
    let cleanIp = ip || "";
    if (cleanIp.includes(",")) {
      cleanIp = cleanIp.split(",")[0].trim();
    }
    if (cleanIp.startsWith("::ffff:")) {
      cleanIp = cleanIp.substring(7);
    }

    let country = "India";
    let continent = "Asia";
    let currency = "inr";

    const isPrivate =
      !cleanIp ||
      cleanIp === "127.0.0.1" ||
      cleanIp === "::1" ||
      cleanIp === "localhost" ||
      cleanIp.startsWith("192.168.") ||
      cleanIp.startsWith("10.") ||
      cleanIp.startsWith("172.");

    if (!isPrivate) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(
          `http://ip-api.com/json/${cleanIp}?fields=status,message,country,continent`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (res.ok) {
          const json: any = await res.json();
          if (json && json.status === "success") {
            country = json.country || "";
            continent = json.continent || "";
          }
        }
      } catch (err) {
        // network or timeout fallback
      }
    }

    if (continent === "Europe" && country === "United Kingdom") {
      currency = "gbp";
    } else if (continent === "Europe") {
      currency = "eur";
    } else if (country === "India") {
      currency = "inr";
    } else if (country) {
      currency = "usd";
    }

    return {
      country,
      continent,
      currency,
      ip: cleanIp
    };
  }
}
