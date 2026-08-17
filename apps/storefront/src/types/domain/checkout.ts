import { AddressItem } from "./profile";
import { CartItem } from "./cart";

export type CheckoutStep = "cart" | "shipping" | "payment";

export type PaymentMethodId = "rp" | "st" | "card" | "cod";

export interface ShipmentOption {
  id: number;
  name: string;
  locationType: "DOMESTIC" | "INTERNATIONAL";
  baseAmount: number;
  additionalAmount: number;
  baseQuantity: number;
  estimatedFromDay: number;
  estimatedToDay: number;
}

export interface CheckoutPriceBreakdown {
  subtotal: number;
  volumeDiscountAmount: number;
  wholesaleDiscountAmount: number;
  autoDiscountAmount: number;
  autoDiscountPercentage?: number;
  couponCode?: string;
  couponDiscountAmount: number;
  couponPercentage?: number;
  shippingCost: number;
  isShippingFree: boolean;
  total: number;
  advancePay: number;
  remainingBalance: number;
  inStockItemsPrice: number;
  madeToOrderItemsPrice: number;
  preOrderItemsPrice: number;
  containsSwatch: boolean;
}

export interface AddOrderItemCustomization {
  selectedFabricId?: number;
  selectedFinishId?: string;
  finishProductId?: number;
  finishedProductId?: number;
  fabricProductId?: number;
  selectedFabricItemId?: number;
  selectedFabricProfileItemId?: number;
  selectedSizeOptionId?: number;
  selectedSizeProfileOptionId?: number;
  selectedFinishItem?: Array<{ id?: number; label?: string; price?: number }>;
  selectedFinishProfileItemList?: Array<{ id?: number; label?: string; price?: number }>;
  customSize?: Record<string, unknown>;
  sizeDisplayName?: string;
  finishDisplayName?: string;
}

export interface AddOrderItem {
  orderType: string;
  productGroup: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  estimatedDeliveryFrom: number;
  estimatedDeliveryTo: number;
  customization: AddOrderItemCustomization;
  loyaltyOrder?: boolean;
  loyaltyDiscountAmount?: number;
}

export interface AddOrderPayload {
  orderItems: AddOrderItem[];
  subTotal: number;
  shippingMode: {
    id?: number;
    name?: string;
    locationType?: string;
    baseAmount?: number;
    additionalAmount?: number;
    baseQuantity?: number;
    estimatedFromDay?: number;
    estimatedToDay?: number;
  };
  shippingCost: number;
  total: number;
  currency: string;
  advancePay: number;
  remainingPay: number;
  autoDiscount: number;
  couponApplied: boolean;
  couponCode?: string;
  couponDiscount: number;
  address: {
    billingAddress: Partial<AddressItem>;
    shippingAddress: Partial<AddressItem>;
  };
  note?: string;
  gift?: boolean;
  cancellationReason?: string;
  paymentMode: string;
  loyaltyOrder?: boolean;
  loyaltyDiscount?: number;
  loyaltyDiscountAmount?: number;
}

export interface RazorpayPaymentSession {
  razorpayOrderId: string;
  key: string;
  amount: number;
  currency: string;
}

export interface StripePaymentSessionResponse {
  checkoutUrl?: string;
}
