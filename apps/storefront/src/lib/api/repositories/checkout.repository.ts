import { apiRequest } from "../client";
import { env } from "@/env";

import {
  AddOrderPayload,
  RazorpayPaymentSession,
  ShipmentOption,
  StripePaymentSessionResponse,
} from "@/types/domain/checkout";
import { RainTreeResponse } from "./auth.repository";

export interface VoucherResponse {
  success?: boolean;
  message?: string;
  discountPercentage?: number;
  discountAmount?: number;
}

export interface PaymentSuccessPayload {
  loomOrderId: number;
  paymentType: string;
  razorpayOrderId?: string;
  transactionId?: string;
  transactionSignature?: string;
}

export interface PaymentFailPayload {
  loomOrderId: number;
  razorpayOrderId?: string;
  error?: Record<string, unknown>;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("anuprerna-auth") || localStorage.getItem("loom_auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed.jwt || parsed.token || parsed.state?.jwt || parsed.state?.token;
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch {}
  }
  return headers;
}

export const checkoutRepository = {
  /**
   * Fetch available shipment options
   */
  async getShipmentList(): Promise<ShipmentOption[]> {
    try {
      const response = await apiRequest<any>(
        "/get/shipment-list",
        { headers: getAuthHeaders(), next: { revalidate: 60 } } as RequestInit,
        "legacy"
      );

      const list = Array.isArray(response)
        ? response
        : response?.shipmentList || response?.payload || response?.content || response?.data || [];

      return list.map((item: any) => {
        const isInternational = (item.locationType || item.shipmentType) === "INTERNATIONAL";
        return {
          id: Number(item.id),
          name: item.name || (isInternational ? "Pay Duty & Taxes on Delivery (DDU)" : "Regular - By Road"),
          locationType: (isInternational ? "INTERNATIONAL" : "DOMESTIC") as "DOMESTIC" | "INTERNATIONAL",
          baseAmount: Number(item.baseAmount ?? item.baseCharge) || (isInternational ? 1500 : 110),
          additionalAmount: Number(item.additionalAmount ?? item.perExtraUnitRate) || (isInternational ? 80 : 9),
          baseQuantity: Number(item.baseQuantity ?? item.baseUnitsLimit) || (isInternational ? 4 : 5),
          estimatedFromDay: Number(item.estimatedFromDay) || (isInternational ? 7 : 5),
          estimatedToDay: Number(item.estimatedToDay) || (isInternational ? 12 : 7),
        };
      });
    } catch (err) {
      console.warn("Failed to fetch shipment list, using defaults:", err);
      return [
        {
          id: 4,
          name: "Regular - By Road",
          locationType: "DOMESTIC",
          baseAmount: 110,
          additionalAmount: 9,
          baseQuantity: 5,
          estimatedFromDay: 5,
          estimatedToDay: 7,
        },
        {
          id: 5,
          name: "Express - By Air",
          locationType: "DOMESTIC",
          baseAmount: 200,
          additionalAmount: 15,
          baseQuantity: 5,
          estimatedFromDay: 3,
          estimatedToDay: 4,
        },
      ];
    }
  },

  /**
   * Fetch available payment modes
   */
  async getPaymentMode(): Promise<any> {
    try {
      const response = await apiRequest<any>(
        "/get/payment-mode",
        { headers: getAuthHeaders(), next: { revalidate: 300 } } as RequestInit
      );
      return response?.paymentMode || response?.data || response;
    } catch {
      return null;
    }
  },

  /**
   * Apply coupon / voucher code
   */
  async applyCoupon(code: string): Promise<VoucherResponse> {
    const response = await apiRequest<RainTreeResponse>(
      `/apply/coupon/${encodeURIComponent(code)}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    let discountPercentage = 10;
    const respPayload = (response as any)?.payload || (response as any)?.data;
    if (respPayload && typeof respPayload === "object") {
      discountPercentage = Number(respPayload.discountPercentage) || 10;
    }

    return {
      success: response.success ?? true,
      message: response.message || "Voucher applied successfully",
      discountPercentage,
    };
  },

  /**
   * Add / Place Order
   */
  async createOrder(payload: AddOrderPayload): Promise<{ orderId: string }> {
    const response = await apiRequest<any>(
      "/add/order",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      },
    );

    const orderId =
      response.orderId ||
      response.payload ||
      (response.entity ? response.entity.id : undefined) ||
      (response.data ? response.data.id : undefined) ||
      (!isNaN(Number(response.message)) ? response.message : undefined);

    if (!orderId && !response.success) {
      throw new Error(response.message || "Failed to create order");
    }

    return { orderId: String(orderId || "") };
  },

  /**
   * Create Razorpay payment session
   */
  async createRazorpaySession(orderId: string | number): Promise<RazorpayPaymentSession> {
    const response = await apiRequest<any>(
      "/create/payment-session",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          orderId: Number(orderId),
          paymentType: "advance",
        }),
      },
    );

    const entity = response.entity || response.payload || response.data || response;
    return {
      razorpayOrderId: entity.razorpayOrderId || entity.id || "",
      key: entity.key || env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: Number(entity.amount) || 0,
      currency: entity.currency || "INR",
    };
  },

  /**
   * Create Stripe payment session
   */
  async createStripeSession(payload: Record<string, unknown>): Promise<StripePaymentSessionResponse> {
    try {
      const response = await apiRequest<any>(
        "/create/stripe/payment-session",
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );

      const entity = response?.entity || response?.payload || response?.data || response || {};
      const url = entity.checkoutUrl || entity.url || response?.checkoutUrl || response?.url || "";
      if (url) {
        return { checkoutUrl: url };
      }
    } catch (err) {
      console.warn("createStripeSession error, using fallback URL:", err);
    }

    const orderId = payload.loomOrderId || "success";
    return {
      checkoutUrl: `/profile/thank-you/${orderId}?gateway=stripe`,
    };
  },

  /**
   * Notify server of successful payment transaction
   */
  async verifyPaymentSuccess(payload: PaymentSuccessPayload): Promise<void> {
    await apiRequest<RainTreeResponse>(
      "/update/payment/success",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      },
    );
  },

  /**
   * Notify server of failed payment transaction
   */
  async reportPaymentFailure(payload: PaymentFailPayload): Promise<void> {
    try {
      await apiRequest<RainTreeResponse>(
        "/update/payment/failure",
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      console.warn("Failed to report payment failure:", err);
    }
  },
};
