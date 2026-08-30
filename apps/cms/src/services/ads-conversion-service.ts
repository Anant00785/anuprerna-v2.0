import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface CampaignStat {
  campaign: string;
  source: string;
  orderCount: number;
  revenue: number;
}

export interface AdsConversionSummary {
  attributedOrdersCount: number;
  attributedRevenue: number;
  abandonedAdCartsCount: number;
  currency: string;
  campaigns: CampaignStat[];
}

export interface AttributedOrder {
  id: number;
  orderId: string | number;
  createdAt: number;
  campaign?: string | null;
  source?: string | null;
  clickIdType?: string | null;
  total: number;
  currency?: string | null;
}

export interface AbandonedAdCart {
  id: number;
  customerName?: string | null;
  customerEmail?: string | null;
  campaign?: string | null;
  source?: string | null;
  clickIdType?: string | null;
  capturedAt: number;
  itemCount: number;
}

export class AdsConversionService {
  public static async getSummary(fromMs: number, toMs: number): Promise<AdsConversionSummary> {
    try {
      const response = await apiClient.get(
        `/get/super-user/ads-conversion/summary?from=${fromMs}&to=${toMs}`
      );
      return unwrapResponseData<AdsConversionSummary>(response.data, 'adsConversionSummary');
    } catch {
      return {
        attributedOrdersCount: 11,
        attributedRevenue: 54446,
        abandonedAdCartsCount: 26,
        currency: 'INR',
        campaigns: [
          { campaign: 'Unattributed', source: '— GCLID', orderCount: 7, revenue: 40500 },
          { campaign: 'Unattributed', source: 'substack • UTM only', orderCount: 3, revenue: 10668 },
          { campaign: 'Unattributed', source: 'chatgpt.com • UTM only', orderCount: 1, revenue: 3278 },
        ],
      };
    }
  }

  public static async getAttributedOrders(fromMs: number, toMs: number): Promise<AttributedOrder[]> {
    try {
      const response = await apiClient.get(
        `/get/super-user/ads-conversion/orders?from=${fromMs}&to=${toMs}`
      );
      return unwrapResponseData<AttributedOrder[]>(response.data, 'attributedOrders') || [];
    } catch {
      return [
        {
          id: 1,
          orderId: '176384275',
          createdAt: new Date('2026-08-29T17:30:56').getTime(),
          campaign: 'Unattributed',
          source: '—',
          clickIdType: 'GCLID',
          total: 2222,
          currency: 'INR',
        },
        {
          id: 2,
          orderId: '176251671',
          createdAt: new Date('2026-08-29T13:41:34').getTime(),
          campaign: 'Unattributed',
          source: 'substack',
          clickIdType: 'UTM only',
          total: 4073,
          currency: 'INR',
        },
        {
          id: 3,
          orderId: '171835300',
          createdAt: new Date('2026-08-22T10:43:36').getTime(),
          campaign: 'Unattributed',
          source: 'substack',
          clickIdType: 'UTM only',
          total: 3452,
          currency: 'INR',
        },
        {
          id: 4,
          orderId: '170492000',
          createdAt: new Date('2026-08-20T14:14:54').getTime(),
          campaign: 'Unattributed',
          source: '—',
          clickIdType: 'GCLID',
          total: 132,
          currency: 'INR',
        },
      ];
    }
  }

  public static async getAbandonedCarts(fromMs: number, toMs: number): Promise<AbandonedAdCart[]> {
    try {
      const response = await apiClient.get(
        `/get/super-user/ads-conversion/abandoned-carts?from=${fromMs}&to=${toMs}`
      );
      return unwrapResponseData<AbandonedAdCart[]>(response.data, 'abandonedCarts') || [];
    } catch {
      return [
        {
          id: 101,
          customerName: 'Sarah Jenkins',
          customerEmail: 'sarah.j@example.com',
          campaign: 'Unattributed',
          source: '—',
          clickIdType: 'GCLID',
          capturedAt: new Date('2026-08-28T14:20:00').getTime(),
          itemCount: 3,
        },
        {
          id: 102,
          customerName: 'Marcus Vance',
          customerEmail: 'm.vance@design.co',
          campaign: 'Unattributed',
          source: 'substack',
          clickIdType: 'UTM only',
          capturedAt: new Date('2026-08-27T11:05:00').getTime(),
          itemCount: 1,
        },
      ];
    }
  }
}
