export type OrderStatus =
  | 'INITIATED'
  | 'PROCESSING'
  | 'READY'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'PARTIALLY_DISPATCHED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type OrderType = 'ORDER' | 'CUSTOM_ORDER';

export interface UserTenant {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface UserProfile {
  tenant: UserTenant;
}

export interface AddressItem {
  id: number;
  addressType: 'SHIPPING' | 'BILLING';
  name: string;
  country: string;
  state: string;
  city: string;
  addressLineOne: string;
  addressLineTwo?: string;
  postalCode: string;
  companyName?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  contactEmail: string;
  vatgstNumber?: string;
  eoriNumber?: string;
  primaryShippingAddress?: boolean;
  primaryBillingAddress?: boolean;
}

export interface OrderFulfillmentItem {
  id: number;
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
  heroImage?: string;
}

export interface OrderFulfillment {
  id: number;
  shippingCode?: string;
  trackingUrl?: string;
  dispatchedOn?: string;
  estimatedDeliveryFrom?: string;
  estimatedDeliveryTo?: string;
  note?: string;
  fulfilledItems: OrderFulfillmentItem[];
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  heroImage: string;
  quantity: number;
  unit: string;
  price: number;
  orderCategory: 'IN_STOCK' | 'MADE_TO_ORDER' | 'PRE_ORDER';
  orderStatus: OrderStatus;
  paymentStatus: string;
  dispatchedOn?: string;
  estimatedDeliveryTo?: string;
  shippingCode?: string;
  trackingUrl?: string;
  reviewId?: number;
}

export interface CustomAdjustment {
  particular: string;
  adjustmentType: 1 | 2; // 1 = add, 2 = subtract
  adjustmentAmount: number;
  currency: string;
}

export interface OrderListItem {
  orderId: number | string;
  orderType: OrderType;
  loyaltyOrder?: boolean;
  status: OrderStatus;
  createdAt: number | string;
  estimatedDeliveryDate: number | string;
  totalItemCount: number;
  processingItemCount?: number;
  readyItemCount?: number;
  dispatchedItemCount?: number;
  dispatchedOn?: string;
  trackingUrl?: string;
  currency: string;
  totalAmount: number;
}

export interface OrderDetails {
  id: number | string;
  orderId: number | string;
  createdAt: number | string;
  currency: string;
  subTotal: number;
  shippingCost: number;
  loyaltyOrder?: boolean;
  loyaltyDiscountAmount?: number;
  total: number;
  adjustedTotal?: number;
  shippingMode: {
    name: string;
  };
  address: {
    shippingAddress: AddressItem;
    billingAddress: AddressItem;
  };
  adjustments?: CustomAdjustment[];
  items: OrderItem[];
  fulfillments: OrderFulfillment[];
}

export interface WholesaleMembershipInfo {
  active: boolean;
  programEnrollmentDateEpochMS: number;
  currentCycleStartDateEpochMS: number;
  currentCycleEndDateEpochMS: number;
  percentileDiscount: number;
  minimumOrderValue: number;
  minimumOrderValueCurrency: string;
}

export interface WholesaleOrderInfo {
  totalAbsoluteDiscount: number;
  totalOrderCount: number;
  averageOrderValue: number;
  percentileUtilization: number;
}

export type WhatsAppConsentStatus = 'ACTIVE' | 'EXPIRED' | 'NOT_OPTED_IN';

export interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface NotificationActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}
