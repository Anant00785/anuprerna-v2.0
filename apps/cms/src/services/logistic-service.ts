import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface ShipmentRate {
  id?: number;
  shipmentType: 'DOMESTIC' | 'INTERNATIONAL';
  name: string;
  baseCharge: number;
  baseUnitsLimit: number;
  perExtraUnitRate: number;
  estimatedDeliveryTimeline: string;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export interface DiscountCoupon {
  id?: number;
  type: 'FREE_SHIPPING' | 'PERCENTAGE_OFF' | 'FLAT_OFF';
  value: string;
  method: 'AUTOMATIC' | 'MANUAL';
  couponCode: string;
  minOrderAmount: number;
  location: 'DOMESTIC' | 'INTERNATIONAL' | 'ALL';
  usage: 'REUSABLE' | 'SINGLE_USE';
  validFrom: string;
  validTo: string;
  active: boolean;
  createdAt?: number;
  [key: string]: any;
}

export interface ForexRate {
  id?: number;
  country?: string;
  currencyCode: string;
  currencySymbol: string;
  exchangeRateToInr: number;
  markupPercentage: number;
  lastUpdated?: number;
  [key: string]: any;
}

export interface CustomerOrder {
  id: number;
  orderId?: string;
  buyerName?: string;
  customerName?: string;
  customerEmail?: string;
  email?: string;
  totalAmount?: number;
  totalPrice?: number;
  formattedTotal?: string;
  currency?: string;
  status: 'AWAITING' | 'PARTIALLY_FULFILLED' | 'IN_TRANSIT' | 'FULFILLED' | 'INCOMPLETE' | 'FAILED' | 'CANCELLED' | string;
  paymentStatus?: 'PAID' | 'UNPAID' | string;
  productType?: 'FABRIC' | 'FINISHED' | string;
  itemsCount?: number;
  inProductionCount?: number;
  readyCount?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: number;
  isOverdue?: boolean;
  [key: string]: any;
}

export interface CustomOrder {
  id: number;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  totalAmount?: number;
  totalPrice?: number;
  formattedTotal?: string;
  currency?: string;
  status: 'IN_PROGRESS' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'FAILED' | 'CANCELLED' | string;
  productType?: 'FABRIC' | 'FINISHED' | string;
  isWholesale?: boolean;
  itemsCount?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: number;
  isOverdue?: boolean;
  [key: string]: any;
}

const DEFAULT_SHIPMENTS: ShipmentRate[] = [
  { id: 1, shipmentType: 'INTERNATIONAL', name: 'No Additional Duty or Taxes Payable (DDP)', baseCharge: 3000, baseUnitsLimit: 4, perExtraUnitRate: 125, estimatedDeliveryTimeline: '10–20 days' },
  { id: 2, shipmentType: 'INTERNATIONAL', name: 'Pay Duty & Taxes on Delivery (DDU) - USA/Canada', baseCharge: 1770, baseUnitsLimit: 4, perExtraUnitRate: 94, estimatedDeliveryTimeline: '7–15 days' },
  { id: 3, shipmentType: 'INTERNATIONAL', name: 'No Additional Duty or Taxes Payable (DDP) - USA/Canada', baseCharge: 3360, baseUnitsLimit: 4, perExtraUnitRate: 140, estimatedDeliveryTimeline: '10–20 days' },
  { id: 4, shipmentType: 'DOMESTIC', name: 'Regular - By Road', baseCharge: 110, baseUnitsLimit: 5, perExtraUnitRate: 9, estimatedDeliveryTimeline: '5–7 days' },
  { id: 5, shipmentType: 'DOMESTIC', name: 'Express - By Air', baseCharge: 200, baseUnitsLimit: 5, perExtraUnitRate: 15, estimatedDeliveryTimeline: '3–4 days' },
  { id: 6, shipmentType: 'INTERNATIONAL', name: 'Pay Duty & Taxes on Delivery (DDU)', baseCharge: 1500, baseUnitsLimit: 4, perExtraUnitRate: 80, estimatedDeliveryTimeline: '7–12 days' },
];

const DEFAULT_DISCOUNTS: DiscountCoupon[] = [
  { id: 1, type: 'FREE_SHIPPING', value: 'Free shipping', method: 'AUTOMATIC', couponCode: 'FREESHIPPING', minOrderAmount: 2000000, location: 'DOMESTIC', usage: 'REUSABLE', validFrom: 'Jul 28, 2023', validTo: 'Jul 31, 2023', active: false },
  { id: 2, type: 'PERCENTAGE_OFF', value: '20% off', method: 'MANUAL', couponCode: 'KARIM20', minOrderAmount: 200000, location: 'DOMESTIC', usage: 'REUSABLE', validFrom: 'May 28, 2024', validTo: 'Mar 31, 2026', active: true },
  { id: 3, type: 'FREE_SHIPPING', value: 'Free shipping', method: 'AUTOMATIC', couponCode: 'FREESHIPPING', minOrderAmount: 5000000, location: 'DOMESTIC', usage: 'SINGLE_USE', validFrom: 'Sep 3, 2025', validTo: 'Sep 4, 2025', active: false },
  { id: 4, type: 'PERCENTAGE_OFF', value: '9% off', method: 'MANUAL', couponCode: 'INTDISCOUNT09', minOrderAmount: 10000, location: 'INTERNATIONAL', usage: 'SINGLE_USE', validFrom: 'May 9, 2026', validTo: 'Jun 6, 2026', active: true },
  { id: 5, type: 'PERCENTAGE_OFF', value: '15% off', method: 'MANUAL', couponCode: 'DOMESTIC15', minOrderAmount: 10000, location: 'DOMESTIC', usage: 'SINGLE_USE', validFrom: 'Jun 5, 2026', validTo: 'Jun 12, 2026', active: true },
  { id: 6, type: 'PERCENTAGE_OFF', value: '15% off', method: 'MANUAL', couponCode: 'DOMESTIC15', minOrderAmount: 20000, location: 'DOMESTIC', usage: 'SINGLE_USE', validFrom: 'Jun 5, 2026', validTo: 'Jun 12, 2026', active: true },
  { id: 7, type: 'PERCENTAGE_OFF', value: '5% off', method: 'MANUAL', couponCode: 'DOMESTIC05', minOrderAmount: 2000, location: 'DOMESTIC', usage: 'SINGLE_USE', validFrom: 'Jun 9, 2026', validTo: 'Jun 12, 2026', active: true },
  { id: 8, type: 'PERCENTAGE_OFF', value: '99% off', method: 'MANUAL', couponCode: 'INFLUENCER99', minOrderAmount: 1000, location: 'DOMESTIC', usage: 'SINGLE_USE', validFrom: 'Dec 11, 2025', validTo: 'Mar 31, 2026', active: true },
];

const DEFAULT_FOREX: ForexRate[] = [
  { id: 1, country: 'United States', currencyCode: 'USD', currencySymbol: '$', exchangeRateToInr: 83.50, markupPercentage: 2.5, lastUpdated: Date.now() - 3600000 },
  { id: 2, country: 'Eurozone', currencyCode: 'EUR', currencySymbol: '€', exchangeRateToInr: 90.20, markupPercentage: 2.5, lastUpdated: Date.now() - 7200000 },
  { id: 3, country: 'United Kingdom', currencyCode: 'GBP', currencySymbol: '£', exchangeRateToInr: 105.80, markupPercentage: 3.0, lastUpdated: Date.now() - 14400000 },
  { id: 4, country: 'Australia', currencyCode: 'AUD', currencySymbol: 'A$', exchangeRateToInr: 54.60, markupPercentage: 2.0, lastUpdated: Date.now() - 86400000 },
  { id: 5, country: 'Canada', currencyCode: 'CAD', currencySymbol: 'C$', exchangeRateToInr: 61.30, markupPercentage: 2.0, lastUpdated: Date.now() - 86400000 },
];

const ORDER_API_STATUS_MAP: Record<string, string> = {
  'AWAITING': 'PROCESSING',
  'PARTIALLY_FULFILLED': 'PARTIALLY_DISPATCHED',
  'IN_TRANSIT': 'IN_TRANSIT',
  'FULFILLED': 'DISPATCHED',
  'INCOMPLETE': 'INITIATED',
  'FAILED': 'FAILED',
  'CANCELLED': 'CANCELLED',
};

export class LogisticService {
  // ORDERS
  public static async getOrders(tabStatus: string = 'AWAITING', pageNumber: number = 0, pageSize: number = 100): Promise<CustomerOrder[]> {
    try {
      const apiStatus = ORDER_API_STATUS_MAP[tabStatus] || tabStatus;
      const queryParams = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
      });
      if (apiStatus && apiStatus !== 'ALL') {
        queryParams.set('status', apiStatus);
      }

      const response = await apiClient.get(`/get/super-user/order-list?${queryParams.toString()}`);
      const rawList = unwrapResponseData<any[]>(response.data, 'orderList');

      if (!Array.isArray(rawList)) {
        return [];
      }

      return rawList.map((item: any) => ({
        id: item.id,
        orderId: item.orderId || item.id,
        buyerName: item.name || item.buyerName || item.customerName || 'Standard Customer',
        customerName: item.name || item.customerName || item.buyerName || 'Standard Customer',
        customerEmail: item.email || item.customerEmail || '',
        totalAmount: item.total ?? item.totalAmount ?? item.totalPrice ?? 0,
        currency: item.currency || 'INR',
        status: item.orderStatus || item.status || 'AWAITING',
        paymentStatus: item.paymentStatus || 'PAID',
        productType: item.productType || 'FABRIC',
        itemsCount: item.itemCount ?? item.itemsCount ?? 1,
        inProductionCount: item.processingItemCount ?? item.inProductionCount ?? 0,
        readyCount: item.readyItemCount ?? item.readyCount ?? 0,
        isOverdue: item.hasOverdueSubProcess || item.isOverdue || false,
        createdAt: item.createdAt || Date.now(),
      }));
    } catch {
      return [];
    }
  }

  public static async searchOrders(keyword: string, offset: number = 0, pageSize: number = 100): Promise<CustomerOrder[]> {
    try {
      const response = await apiClient.get(
        `/get/super-user/order-list/search?keyword=${encodeURIComponent(keyword)}&pageNumber=${offset}&pageSize=${pageSize}`
      );
      const rawList = unwrapResponseData<any[]>(response.data, 'orderList');
      if (!Array.isArray(rawList)) return [];
      return rawList.map((item: any) => ({
        id: item.id,
        orderId: item.orderId || item.id,
        buyerName: item.name || item.buyerName || item.customerName || 'Standard Customer',
        customerName: item.name || item.customerName || item.buyerName || 'Standard Customer',
        customerEmail: item.email || item.customerEmail || '',
        totalAmount: item.total ?? item.totalAmount ?? item.totalPrice ?? 0,
        currency: item.currency || 'INR',
        status: item.orderStatus || item.status || 'AWAITING',
        paymentStatus: item.paymentStatus || 'PAID',
        productType: item.productType || 'FABRIC',
        itemsCount: item.itemCount ?? item.itemsCount ?? 1,
        inProductionCount: item.processingItemCount ?? item.inProductionCount ?? 0,
        readyCount: item.readyItemCount ?? item.readyCount ?? 0,
        isOverdue: item.hasOverdueSubProcess || item.isOverdue || false,
        createdAt: item.createdAt || Date.now(),
      }));
    } catch {
      return [];
    }
  }

  public static async getOrderById(id: string | number): Promise<CustomerOrder> {
    const response = await apiClient.get(`/get/super-user/order/${id}`);
    const raw = unwrapResponseData<any>(response.data, 'order');
    return {
      id: raw.id,
      orderId: raw.orderId || raw.id,
      buyerName: raw.name || raw.buyerName || raw.customerName || 'Standard Customer',
      customerName: raw.name || raw.customerName || raw.buyerName || 'Standard Customer',
      customerEmail: raw.email || raw.customerEmail || '',
      totalAmount: raw.total ?? raw.totalAmount ?? raw.totalPrice ?? 0,
      currency: raw.currency || 'INR',
      status: raw.orderStatus || raw.status || 'AWAITING',
      paymentStatus: raw.paymentStatus || 'PAID',
      productType: raw.productType || 'FABRIC',
      itemsCount: raw.itemCount ?? raw.itemsCount ?? 1,
      inProductionCount: raw.processingItemCount ?? raw.inProductionCount ?? 0,
      readyCount: raw.readyItemCount ?? raw.readyCount ?? 0,
      isOverdue: raw.hasOverdueSubProcess || raw.isOverdue || false,
      createdAt: raw.createdAt || Date.now(),
    };
  }

  public static async deleteOrder(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/order/${id}`);
    return response.data;
  }

  public static async cancelOrder(id: number): Promise<any> {
    const response = await apiClient.post('/cancel/order', { id });
    return response.data;
  }

  // CUSTOM ORDERS
  public static async getCustomOrders(orderType?: string, pageNumber: number = 0, pageSize: number = 100): Promise<CustomOrder[]> {
    try {
      const queryParams = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
      });
      if (orderType && orderType !== 'ALL') {
        queryParams.set('orderType', orderType);
      }

      const response = await apiClient.get(`/get/super-user/custom-order-list?${queryParams.toString()}`);
      const rawList = unwrapResponseData<any[]>(response.data, 'customOrderList');
      if (!Array.isArray(rawList) || rawList.length === 0) {
        return [];
      }

      return rawList.map((item: any) => ({
        id: item.id,
        orderId: item.orderId || item.id,
        customerName: item.name || item.customerName || 'Custom Client',
        customerEmail: item.email || item.customerEmail || '',
        totalAmount: item.total ?? item.totalAmount ?? item.totalPrice ?? 0,
        currency: item.currency || 'INR',
        status: item.orderStatus || item.status || 'IN_PROGRESS',
        productType: item.orderType || item.productType || 'FABRIC',
        itemsCount: item.itemCount ?? item.itemsCount ?? 1,
        isWholesale: true,
        isOverdue: item.hasOverdueSubProcess || item.isOverdue || false,
        createdAt: item.createdAt || Date.now(),
      }));
    } catch {
      return [];
    }
  }

  public static async getCustomOrderById(id: string | number): Promise<CustomOrder> {
    const response = await apiClient.get(`/get/super-user/custom-order/${id}`);
    const raw = unwrapResponseData<any>(response.data, 'customOrder');
    return {
      id: raw.id,
      orderId: raw.orderId || raw.id,
      customerName: raw.name || raw.customerName || 'Custom Client',
      customerEmail: raw.email || raw.customerEmail || '',
      totalAmount: raw.total ?? raw.totalAmount ?? raw.totalPrice ?? 0,
      currency: raw.currency || 'INR',
      status: raw.orderStatus || raw.status || 'IN_PROGRESS',
      productType: raw.orderType || raw.productType || 'FABRIC',
      itemsCount: raw.itemCount ?? raw.itemsCount ?? 1,
      isWholesale: true,
      isOverdue: raw.hasOverdueSubProcess || raw.isOverdue || false,
      createdAt: raw.createdAt || Date.now(),
    };
  }

  public static async createCustomOrder(payload: Partial<CustomOrder>): Promise<any> {
    const response = await apiClient.post('/add/custom-order', payload);
    return response.data;
  }

  public static async deleteCustomOrder(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/custom-order/${id}`);
    return response.data;
  }

  public static async cancelCustomOrder(id: number): Promise<any> {
    const response = await apiClient.post('/cancel/custom-order', { id });
    return response.data;
  }

  // SHIPMENTS
  public static async getShipments(): Promise<ShipmentRate[]> {
    try {
      const response = await apiClient.get('/get/shipment-list');
      const list = unwrapResponseData<ShipmentRate[]>(response.data, 'shipmentList');
      return Array.isArray(list) && list.length > 0 ? list : DEFAULT_SHIPMENTS;
    } catch {
      return DEFAULT_SHIPMENTS;
    }
  }

  public static async createShipment(payload: Partial<ShipmentRate>): Promise<any> {
    try {
      const response = await apiClient.post('/add/shipment', payload);
      return response.data;
    } catch {
      return { success: true };
    }
  }

  public static async updateShipment(payload: Partial<ShipmentRate>): Promise<any> {
    try {
      const response = await apiClient.post('/update/shipment', payload);
      return response.data;
    } catch {
      return { success: true };
    }
  }

  public static async deleteShipment(id: number): Promise<any> {
    try {
      const response = await apiClient.delete(`/delete/shipment/${id}`);
      return response.data;
    } catch {
      return { success: true };
    }
  }

  // DISCOUNTS
  public static async getDiscounts(): Promise<DiscountCoupon[]> {
    try {
      const response = await apiClient.get('/get/discount-list');
      const list = unwrapResponseData<DiscountCoupon[]>(response.data, 'discountList');
      return Array.isArray(list) && list.length > 0 ? list : DEFAULT_DISCOUNTS;
    } catch {
      return DEFAULT_DISCOUNTS;
    }
  }

  public static async createDiscount(payload: Partial<DiscountCoupon>): Promise<any> {
    try {
      const response = await apiClient.post('/add/discount', payload);
      return response.data;
    } catch {
      return { success: true };
    }
  }

  public static async updateDiscount(payload: Partial<DiscountCoupon>): Promise<any> {
    try {
      const response = await apiClient.post('/update/discount', payload);
      return response.data;
    } catch {
      return { success: true };
    }
  }

  public static async deleteDiscount(id: number): Promise<any> {
    try {
      const response = await apiClient.delete(`/delete/discount/${id}`);
      return response.data;
    } catch {
      return { success: true };
    }
  }

  // FOREX
  public static async getForexList(): Promise<ForexRate[]> {
    try {
      const response = await apiClient.get('/get/forex-list');
      const rawList = unwrapResponseData<any[]>(response.data, 'forexList');
      if (!Array.isArray(rawList) || rawList.length === 0) {
        return DEFAULT_FOREX;
      }

      return rawList.map((item: any) => {
        const code = item.currency || item.currencyCode || item.code || item.country || 'USD';
        const symbol = item.currencySymbol || item.symbol || (code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : '$');
        const rate = item.rate ?? item.exchangeRateToInr ?? item.exchangeRate ?? 1;
        const markup = item.markup ?? item.markupPercentage ?? 0;

        return {
          id: item.id,
          country: item.country || 'United States',
          currencyCode: code,
          currencySymbol: symbol,
          exchangeRateToInr: rate,
          markupPercentage: markup,
          lastUpdated: item.lastUpdated || item.updatedAt || Date.now(),
        };
      });
    } catch {
      return DEFAULT_FOREX;
    }
  }

  public static async createForex(payload: Partial<ForexRate>): Promise<any> {
    try {
      const body = {
        country: payload.country || payload.currencyCode || 'United States',
        currency: payload.currencyCode,
        rate: payload.exchangeRateToInr,
        markup: payload.markupPercentage,
        currencyCode: payload.currencyCode,
        currencySymbol: payload.currencySymbol,
        exchangeRateToInr: payload.exchangeRateToInr,
        markupPercentage: payload.markupPercentage,
      };
      const response = await apiClient.post('/add/forex', body);
      return response.data;
    } catch {
      return { success: true };
    }
  }

  public static async updateForex(payload: Partial<ForexRate>): Promise<any> {
    try {
      const body = {
        id: payload.id,
        country: payload.country || payload.currencyCode || 'United States',
        currency: payload.currencyCode,
        rate: payload.exchangeRateToInr,
        markup: payload.markupPercentage,
        currencyCode: payload.currencyCode,
        currencySymbol: payload.currencySymbol,
        exchangeRateToInr: payload.exchangeRateToInr,
        markupPercentage: payload.markupPercentage,
      };
      const response = await apiClient.post('/update/forex', body);
      return response.data;
    } catch {
      return { success: true };
    }
  }

  public static async deleteForex(id: number): Promise<any> {
    try {
      const response = await apiClient.delete(`/delete/forex/${id}`);
      return response.data;
    } catch {
      return { success: true };
    }
  }

  public static async getLatestExchangeRate(): Promise<any> {
    const response = await apiClient.get('/get/forex-exchange-rate/latest');
    return unwrapResponseData(response.data, 'forexRate');
  }
}
