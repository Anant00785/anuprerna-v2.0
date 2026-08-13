/**
 * Maps Loom's profile/order payloads onto the local domain types.
 *
 * Field names come from the legacy Angular storefront's interfaces, which are the
 * authoritative description of what production actually returns:
 *   fabric-master/src/app/profile/interface/{order-list,order-details,ordered-item,
 *   order-fulfillment,wholesale-program-membership-info,wholesale-program-order-info}.ts
 *
 * Previously each page inlined its own ad-hoc mapping against invented field names
 * (`o.orderDate`, `o.totalAmount`, `o.items`) that Loom never sends, then silently
 * fell back to `dummy-data.ts` when the result looked empty — which is why the
 * profile rendered fabricated orders for accounts that have none.
 */
import type {
  AddressItem,
  OrderDetails,
  OrderFulfillment,
  OrderItem,
  OrderListItem,
  OrderStatus,
  UserProfile,
  WholesaleMembershipInfo,
  WholesaleOrderInfo,
} from "@/types/domain/profile";

type Raw = Record<string, any>;

const ORDER_STATUSES: OrderStatus[] = [
  "INITIATED",
  "PROCESSING",
  "READY",
  "DISPATCHED",
  "IN_TRANSIT",
  "PARTIALLY_DISPATCHED",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
];

/** Loom sends `orderStatus` as a string enum; anything unrecognised stays PROCESSING. */
export function toOrderStatus(value: unknown): OrderStatus {
  const candidate = String(value ?? "").toUpperCase();
  return (ORDER_STATUSES as string[]).includes(candidate)
    ? (candidate as OrderStatus)
    : "PROCESSING";
}

export function toOrderListItem(raw: Raw): OrderListItem {
  return {
    orderId: raw.id,
    orderType: raw.orderType === "CUSTOM_ORDER" ? "CUSTOM_ORDER" : "ORDER",
    loyaltyOrder: Boolean(raw.loyaltyOrder),
    status: toOrderStatus(raw.orderStatus),
    createdAt: raw.createdAt,
    estimatedDeliveryDate: raw.estimatedDeliveryTo ?? raw.estimatedDeliveryFrom ?? 0,
    totalItemCount: Number(raw.itemCount ?? 0),
    dispatchedOn: raw.dispatchedOn,
    trackingUrl: raw.trackingUrl,
    currency: raw.currency ?? "INR",
    // `total`, not `totalAmount` — an explicit 0 must survive, so no `||` here.
    totalAmount: Number(raw.total ?? 0),
  };
}

export function toOrderItem(raw: Raw): OrderItem {
  const customisation = raw.customization ?? {};
  return {
    id: raw.id,
    productId: customisation.productId ?? raw.productId ?? 0,
    productName: customisation.productName ?? raw.productName ?? "Item",
    heroImage: customisation.heroImage ?? raw.heroImage ?? "",
    quantity: Number(raw.quantity ?? 0),
    unit: raw.unit ?? "",
    price: Number(raw.price ?? 0),
    orderCategory: raw.orderType === "MADE_TO_ORDER" ? "MADE_TO_ORDER" : "IN_STOCK",
    orderStatus: toOrderStatus(raw.orderStatus),
    paymentStatus: raw.paymentStatus ?? "",
    dispatchedOn: raw.dispatchedOn,
    estimatedDeliveryTo: raw.estimatedDeliveryTo,
    shippingCode: raw.shippingCode,
    trackingUrl: raw.trackingUrl,
    reviewId: raw.reviewId,
  };
}

export function toOrderFulfillment(raw: Raw): OrderFulfillment {
  return {
    id: raw.id,
    shippingCode: raw.shippingCode,
    trackingUrl: raw.trackingUrl,
    dispatchedOn: raw.dispatchedOn,
    estimatedDeliveryFrom: raw.estimatedDeliveryFrom,
    estimatedDeliveryTo: raw.estimatedDeliveryTo,
    note: raw.note,
    fulfilledItems: (raw.orderItemFulfillmentList ?? []).map((item: Raw) => ({
      id: item.id,
      productName: item.productName ?? item.customization?.productName ?? "Item",
      sku: item.sku,
      quantity: Number(item.quantity ?? 0),
      unit: item.unit ?? "",
      heroImage: item.heroImage,
    })),
  };
}

export function toOrderDetails(raw: Raw): OrderDetails {
  return {
    id: raw.id,
    orderId: raw.id,
    createdAt: raw.createdAt,
    currency: raw.currency ?? "INR",
    subTotal: Number(raw.subTotal ?? 0),
    shippingCost: Number(raw.shippingCost ?? 0),
    loyaltyOrder: Boolean(raw.loyaltyOrder),
    loyaltyDiscountAmount: Number(raw.loyaltyDiscountAmount ?? 0),
    total: Number(raw.total ?? 0),
    adjustedTotal: raw.adjustedTotal === undefined ? undefined : Number(raw.adjustedTotal),
    shippingMode: { name: raw.shippingMode?.name ?? "" },
    address: {
      shippingAddress: raw.address?.shippingAddress as AddressItem,
      billingAddress: raw.address?.billingAddress as AddressItem,
    },
    adjustments: raw.adjustments ?? [],
    // `orderItems` on both order and custom-order payloads.
    items: (raw.orderItems ?? []).map(toOrderItem),
    fulfillments: (raw.orderFulfillmentList ?? raw.fulfillments ?? []).map(toOrderFulfillment),
  };
}

/** `/get/customer/profile` → `{customer: {tenant: {...}}}`, verified live. */
export function toUserProfile(raw: Raw): UserProfile {
  const tenant = raw?.customer?.tenant ?? raw?.tenant ?? {};
  return {
    tenant: {
      id: tenant.id ?? tenant.uid ?? 0,
      name: tenant.name ?? "",
      email: tenant.email ?? "",
      avatarUrl: tenant.profileImageUrl,
    },
  };
}

export function toWholesaleMembershipInfo(raw: Raw | null): WholesaleMembershipInfo | null {
  if (!raw) return null;
  return {
    active: Boolean(raw.active),
    programEnrollmentDateEpochMS: Number(raw.programEnrollmentDateEpochMS ?? 0),
    currentCycleStartDateEpochMS: Number(raw.currentCycleStartDateEpochMS ?? 0),
    currentCycleEndDateEpochMS: Number(raw.currentCycleEndDateEpochMS ?? 0),
    percentileDiscount: Number(raw.percentileDiscount ?? 0),
    minimumOrderValue: Number(raw.minimumOrderValue ?? 0),
    minimumOrderValueCurrency: raw.minimumOrderValueCurrency ?? "INR",
  };
}

export function toWholesaleOrderInfo(raw: Raw | null): WholesaleOrderInfo {
  return {
    totalAbsoluteDiscount: Number(raw?.totalAbsoluteDiscount ?? 0),
    totalOrderCount: Number(raw?.totalOrderCount ?? 0),
    averageOrderValue: Number(raw?.averageOrderValue ?? 0),
    percentileUtilization: Number(raw?.percentileUtilization ?? 0),
  };
}
