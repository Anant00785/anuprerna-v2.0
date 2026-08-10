import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface UserLitePreview {
  loomId?: string;
  uid?: string;
  userName?: string;
  name?: string;
  email?: string;
  provider?: string;
  creationTime?: number;
  lastAccessTime?: number | null;
  emailVerified?: boolean;
  status?: string;
  [key: string]: any;
}

export interface CartOverview {
  tenant: {
    uid: string;
    name?: string;
    email?: string;
    decryptedEmail?: string;
    [key: string]: any;
  };
  lastUpdatedAt?: number;
  cartItemCount?: number;
  hasAbandonedItem?: boolean;
  estimatedTotalPrice?: number;
  [key: string]: any;
}

export class UserService {
  public static async getCustomers(): Promise<UserLitePreview[]> {
    const response = await apiClient.get('/get/customers');
    return unwrapResponseData<UserLitePreview[]>(response.data, 'customerList');
  }

  public static async getCartOverviewList(): Promise<CartOverview[]> {
    const response = await apiClient.get('/get/tenant/cart-item/list');
    return unwrapResponseData<CartOverview[]>(response.data, 'cartOverview');
  }

  public static async getUserByUID(uid: string): Promise<any> {
    const response = await apiClient.get(`/get/tenant/profile/${uid}`);
    return unwrapResponseData(response.data, 'tenant');
  }

  public static async registerCustomer(payload: any): Promise<any> {
    const response = await apiClient.post('/customer/registration/email', payload);
    return response.data;
  }
}
