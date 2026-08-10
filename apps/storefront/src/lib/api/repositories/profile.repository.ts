import { apiRequest } from "../client";

export interface Address {
  id?: number | string;
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
  type?: string;
}

export interface UserProfileData {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  companyName?: string;
  gstin?: string;
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

export interface Order {
  id: number | string;
  orderNumber?: string;
  orderDate?: string;
  status?: string;
  totalAmount?: number;
  currency?: string;
  items?: OrderItem[];
  shippingAddress?: Address;
}

export interface WholesaleInfo {
  tier?: string;
  points?: number;
  discountPercentage?: number;
  memberSince?: string;
  nextTierProgress?: number;
}

export const profileRepository = {
  /**
   * Get current authenticated user profile
   */
  async getCustomerProfile(jwtToken?: string): Promise<UserProfileData> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    return apiRequest<UserProfileData>("get/customer/profile", { headers });
  },

  /**
   * Update current user profile
   */
  async updateCustomerProfile(data: UserProfileData, jwtToken?: string): Promise<UserProfileData> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    return apiRequest<UserProfileData>("update/customer/profile", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  },

  /**
   * Get user address list
   */
  async getAddressList(jwtToken?: string): Promise<Address[]> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    return apiRequest<Address[]>("get/address-list", { headers });
  },

  /**
   * Add a new address
   */
  async addAddress(address: Address, jwtToken?: string): Promise<Address> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
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
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
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
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    return apiRequest<{ success: boolean }>(`delete/address/${id}`, {
      method: "DELETE",
      headers,
    });
  },

  /**
   * Get user order list
   */
  async getOrderList(jwtToken?: string): Promise<Order[]> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    return apiRequest<Order[]>("get/customer/order-list/all", { headers });
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
};
