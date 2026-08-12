import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export enum OrderStatus {
  PROCESSING = 'PROCESSING',
  PARTIALLY_DISPATCHED = 'PARTIALLY_DISPATCHED',
  IN_TRANSIT = 'IN_TRANSIT',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
}

export interface ImpactTotals {
  orderCount: number;
  completeItems: number;
  partialItems: number;
  fabricMeters: number;
  co2OffsetKg: number;
  waterSavedLitres: number;
  artisanHours: number;
  womenArtisanHours: number;
  stitchingHours: number;
  womenStitchingHours: number;
  totalWorkHours: number;
}

export interface ImpactItem {
  workflowId: number | null;
  orderItemId: number;
  productType: 'FABRIC' | 'APPAREL' | string;
  calculationStatus: 'PARTIAL' | 'COMPLETE' | string;
  pendingReason: string | null;
  fabricMeters: number | null;
  co2OffsetKg: number | null;
  waterSavedLitres: number | null;
  artisanHours: number | null;
  womenArtisanHours: number | null;
  stitchingHours: number | null;
  womenStitchingHours: number | null;
  totalWorkHours: number | null;
  assumptionVersion: number;
  updatedAt: number;
}

export interface ImpactSummary {
  orderId: number;
  configurationError: string | null;
  completeItems: number;
  partialItems: number;
  fabricMeters: number;
  co2OffsetKg: number;
  waterSavedLitres: number;
  artisanHours: number;
  womenArtisanHours: number;
  stitchingHours: number;
  womenStitchingHours: number;
  totalWorkHours: number;
  items: ImpactItem[];
}

export interface ImpactSkippedItem {
  workflowId?: number;
  orderItemId?: number;
  reason: string;
}

export interface ImpactCalculationResult {
  orderId: number;
  created: number;
  updated: number;
  skipped: number;
  complete: number;
  partial: number;
  configurationError: string | null;
  skippedItems: ImpactSkippedItem[];
}

export interface OrderImpactRow {
  orderId: number;
  customerName: string;
  orderStatus: string;
  createdAt: number;
  custom: boolean;
  summary: ImpactSummary | null;
  state: 'loading' | 'loaded' | 'error';
}

export class ImpactService {
  public static async getOrderImpact(orderId: number): Promise<ImpactSummary> {
    const response = await apiClient.get(`/get/impact/order/${orderId}`);
    return unwrapResponseData<ImpactSummary>(response.data, 'impact');
  }

  public static async triggerOrderImpact(orderId: number): Promise<ImpactCalculationResult> {
    const response = await apiClient.post(`/trigger/impact/order/${orderId}`);
    return unwrapResponseData<ImpactCalculationResult>(response.data, 'impactCalculation');
  }

  public static async getCustomOrderImpact(customOrderId: number): Promise<ImpactSummary> {
    const response = await apiClient.get(`/get/impact/custom-order/${customOrderId}`);
    return unwrapResponseData<ImpactSummary>(response.data, 'impact');
  }

  public static async triggerCustomOrderImpact(customOrderId: number): Promise<ImpactCalculationResult> {
    const response = await apiClient.post(`/trigger/impact/custom-order/${customOrderId}`);
    return unwrapResponseData<ImpactCalculationResult>(response.data, 'impactCalculation');
  }

  public static async getOrderPreviewList(
    pageNo: number = 0,
    pageSize: number = 20,
    status: OrderStatus = OrderStatus.PROCESSING
  ): Promise<any[]> {
    const response = await apiClient.get(
      `/get/super-user/order-list?pageNumber=${pageNo}&pageSize=${pageSize}&status=${status}`
    );
    return unwrapResponseData<any[]>(response.data, 'orderList');
  }

  public static async getCustomOrderPreviewList(
    pageNo: number = 0,
    pageSize: number = 20
  ): Promise<any[]> {
    const response = await apiClient.get(
      `/get/super-user/custom-order-list?pageNumber=${pageNo}&pageSize=${pageSize}`
    );
    return unwrapResponseData<any[]>(response.data, 'customOrderList');
  }
}
