import { apiRequest } from "../client";

/**
 * Loom's address payload, verified against the legacy storefront's own interface
 * (`fabric-master/src/app/address/interface/address.ts`). The previous shape here
 * — `addressLine1`, `pincode`, `phone`, `isDefault` — named fields Loom never
 * sends, so every one of them read `undefined`.
 */
export interface Address {
  id?: number;
  version?: number;
  name: string;
  addressLineOne: string;
  addressLineTwo?: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  companyName?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  contactEmail: string;
  vatgstNumber?: string;
  eoriNumber?: string;
  addressType: string;
  primaryBillingAddress?: boolean;
  primaryShippingAddress?: boolean;
}

export interface UserProfileData {
  id?: number | string;
  name?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  companyName?: string;
  gstin?: string;
  wishlist?: string;
}

export interface OrderItem {
  id?: number | string;
  name?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  price?: number;
  image?: string;
  status?: string;
}

/**
 * Loom's order-list row (`fabric-master/.../profile/interface/order-list.ts`).
 * Note `total`/`orderStatus`/`itemCount` — NOT `totalAmount`/`status`/`items`,
 * which is what this interface used to claim. Map with
 * `toOrderListItem` from `@/lib/profile/adapters`.
 */
export interface Order {
  id: number;
  name?: string;
  email?: string;
  total: number;
  currency: string;
  createdAt: number;
  trackingUrl?: string;
  dispatchedOn?: number;
  estimatedDeliveryFrom?: number;
  estimatedDeliveryTo?: number;
  orderStatus: string;
  itemCount: number;
  loyaltyOrder?: boolean;
  orderType?: string;
}

export interface WholesaleInfo {
  tier?: string;
  points?: number;
  discountPercentage?: number;
  memberSince?: string;
  nextTierProgress?: number;
}

function getAuthHeaders(explicitToken?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  let token = explicitToken;
  if (!token && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("anuprerna-auth") || localStorage.getItem("loom_auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed.jwt || parsed.token || parsed.state?.jwt || parsed.state?.token;
      }
    } catch {}
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const profileRepository = {
  /**
   * Get current authenticated user profile
   */
  async getCustomerProfile(jwtToken?: string): Promise<UserProfileData> {
    // No try/catch: a 401 here means the session is gone and the caller has to
    // know. Swallowing it renders a logged-in header with an empty profile.
    const headers = getAuthHeaders(jwtToken);
    const response = await apiRequest<any>("get/customer/profile", { headers });

    const customer = response?.customer ?? {};
    const tenant = customer.tenant ?? response?.profile ?? response?.entity ?? response?.data ?? response ?? {};
    const name: string = tenant.name || tenant.userName || tenant.user_name || customer.name || "";
    const [firstName, ...rest] = name.trim().split(/\s+/).filter(Boolean);

    return {
      ...tenant,
      ...customer,
      id: tenant.uid ?? tenant.id,
      email: tenant.email,
      name: name || [tenant.firstName, tenant.lastName].filter(Boolean).join(" ").trim(),
      firstName: firstName || tenant.firstName || "",
      lastName: rest.join(" ") || tenant.lastName || "",
      phone: tenant.contactNumber || tenant.phone || "",
      gender: tenant.gender,
      dob: tenant.dob,
    };
  },

  /**
   * Update current user profile
   */
  async updateCustomerProfile(data: UserProfileData, jwtToken?: string): Promise<UserProfileData> {
    const headers = getAuthHeaders(jwtToken);
    return apiRequest<UserProfileData>("update/customer/profile", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  },

  /**
   * Get user profile details
   */
  async getProfile(jwtToken?: string): Promise<UserProfileData> {
    const headers = getAuthHeaders(jwtToken);
    const response = await apiRequest<{ profile?: UserProfileData; entity?: UserProfileData }>(
      "get/customer/profile",
      { headers }
    );
    return (response?.profile || response?.entity || response) as UserProfileData;
  },

  /**
   * Update user profile details
   */
  async updateProfile(data: Partial<UserProfileData>, jwtToken?: string): Promise<UserProfileData> {
    const headers = getAuthHeaders(jwtToken);
    return apiRequest<UserProfileData>("update/customer/profile", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  },

  /**
   * Get all user addresses
   */
  async getAddressList(jwtToken?: string): Promise<Address[]> {
    try {
      const res = await fetch("/api/profile/addresses", {
        headers: getAuthHeaders(jwtToken),
      });
      if (res.ok) {
        const data = await res.json();
        const list = data?.addressList || data?.payload || data?.content;
        if (Array.isArray(list)) return list;
      }
    } catch {}

    try {
      const headers = getAuthHeaders(jwtToken);
      const response = await apiRequest<{ addressList?: Address[]; payload?: Address[]; content?: Address[] } | Address[]>(
        "get/address-list",
        { headers }
      );
      if (Array.isArray(response)) return response;
      return response?.addressList || response?.payload || response?.content || [];
    } catch {
      return [];
    }
  },

  /**
   * Add a new address
   */
  async addAddress(address: Address, jwtToken?: string): Promise<Address> {
    try {
      const res = await fetch("/api/profile/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(jwtToken) },
        body: JSON.stringify(address),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          return (data?.entity || data?.address || { ...address, id: data?.id || Date.now() }) as Address;
        }
      }
    } catch {}

    const headers = getAuthHeaders(jwtToken);
    return apiRequest<Address>("add/address", {
      method: "POST",
      headers,
      body: JSON.stringify(address),
    });
  },

  /**
   * Update an existing address
   */
  async updateAddress(address: Address, jwtToken?: string): Promise<Address> {
    try {
      const res = await fetch("/api/profile/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(jwtToken) },
        body: JSON.stringify(address),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          return (data?.entity || data?.address || { ...address, id: data?.id || Date.now() }) as Address;
        }
      }
    } catch {}

    const headers = getAuthHeaders(jwtToken);
    return apiRequest<Address>("update/address", {
      method: "POST",
      headers,
      body: JSON.stringify(address),
    });
  },

  /**
   * Delete an address by ID
   */
  async deleteAddress(id: number | string, jwtToken?: string): Promise<{ success: boolean }> {
    const headers = getAuthHeaders(jwtToken);
    return apiRequest<{ success: boolean }>(`delete/address/${id}`, {
      method: "DELETE",
      headers,
    });
  },

  /**
   * Get user order list
   */
  async getOrderList(jwtToken?: string): Promise<Order[]> {
    try {
      const headers: Record<string, string> = {};
      if (jwtToken) {
        headers["Authorization"] = `Bearer ${jwtToken}`;
      }
      const response = await apiRequest<{ orderList?: Order[]; payload?: Order[]; content?: Order[] } | Order[]>(
        "get/customer/order-list/all",
        { headers }
      );
      if (Array.isArray(response)) return response;
      return response?.orderList || response?.payload || response?.content || [];
    } catch {
      return [];
    }
  },

  /**
   * Get a single order by id. Loom: `/get/customer/order/{orderId}`, the same route
   * fabric uses (`request-mapper.service.ts:181`). Envelope key is `order`.
   */
  async getOrder(orderId: string | number, jwtToken?: string): Promise<Record<string, any> | null> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    const response = await apiRequest<{ order?: Record<string, any>; entity?: Record<string, any> }>(
      `get/customer/order/${orderId}`,
      { headers }
    );
    return response?.order ?? response?.entity ?? null;
  },

  /**
   * Get a single custom order by id. Loom: `/get/customer/custom-order/{orderId}`
   * (fabric `request-mapper.service.ts:182`).
   */
  async getCustomOrder(orderId: string | number, jwtToken?: string): Promise<Record<string, any> | null> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    const response = await apiRequest<{
      customOrder?: Record<string, any>;
      order?: Record<string, any>;
      entity?: Record<string, any>;
    }>(`get/customer/custom-order/${orderId}`, { headers });
    return response?.customOrder ?? response?.order ?? response?.entity ?? null;
  },

  /**
   * Wholesale/loyalty order metrics. Loom answers
   * `{loyaltyProgramInfo: {totalOrderCount, averageOrderValue, percentileUtilization,
   * totalAbsoluteDiscount, ...}}` — verified live.
   */
  async getLoyaltyOrderInfo(jwtToken?: string): Promise<Record<string, any> | null> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    const response = await apiRequest<{ loyaltyProgramInfo?: Record<string, any> }>(
      "get/order/loyalty/info",
      { headers }
    );
    return response?.loyaltyProgramInfo ?? null;
  },

  /**
   * Orders placed under the wholesale/loyalty programme
   * (fabric `GET_CUSTOMER_WHOLESALE_PROGRAM_ORDER_LIST`).
   */
  async getLoyaltyOrderList(jwtToken?: string): Promise<Order[]> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    const response = await apiRequest<{ orderList?: Order[] } | Order[]>(
      "get/customer/order-list/loyalty",
      { headers }
    );
    if (Array.isArray(response)) return response;
    return response.orderList ?? [];
  },

  /**
   * Get customer wholesale program info
   */
  async getWholesaleInfo(jwtToken?: string): Promise<WholesaleInfo> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    return apiRequest<WholesaleInfo>("get/customer/loyalty/info", { headers });
  },

  /**
   * Update customer selected forex currency
   */
  async updateSelectedForex(currency: string, jwtToken?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    return apiRequest<any>("customer/update/selected-forex", {
      method: "POST",
      headers,
      body: JSON.stringify({ currency }),
    });
  },
};
