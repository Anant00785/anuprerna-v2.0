import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface OrderTenantProfile {
  id?: number;
  name?: string;
  email?: string;
  contactNumber?: string;
  [key: string]: any;
}

export interface OrderFeedbackDetailItem {
  id: number;
  serialNo?: string;
  total?: number;
  totalPrice?: number;
  subTotal?: number;
  shippingCost?: number;
  currency?: string;
  couponApplied?: boolean;
  couponCode?: string;
  couponDiscountAmount?: number;
  paymentMode?: string;
  cancellationReason?: string;
  deleted?: boolean;
  createdAt?: number;
  tenant?: OrderTenantProfile;
  [key: string]: any;
}

export interface OrderFeedback {
  id: number;
  order: OrderFeedbackDetailItem;
  question1?: string;
  question1Answer: number;
  question2?: string;
  question2Answer?: boolean;
  question2Negative?: string;
  question2NegativeAnswer?: string;
  question3?: string;
  question3Answer?: string;
  createdAt?: number;
  updatedAt?: number;
  isBlank?: boolean;
}

export class FeedbackService {
  public static async getOrderFeedbackList(): Promise<OrderFeedback[]> {
    const response = await apiClient.get('/get/order/feedback-list');
    const list = unwrapResponseData<OrderFeedback[]>(response.data, 'orderFeedbackList');
    return Array.isArray(list) ? list : [];
  }

  public static async getOrderFeedbackById(id: number): Promise<OrderFeedback> {
    const response = await apiClient.get(`/get/super-user/order/feedback/${id}`);
    return unwrapResponseData<OrderFeedback>(response.data, 'orderFeedback');
  }
}
