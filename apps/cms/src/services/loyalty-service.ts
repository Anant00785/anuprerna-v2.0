import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export enum LoyaltyConfigAuditLogTypeEnum {
  ONBOARDING = 'ONBOARDING',
  RENEWAL_AUTO = 'RENEWAL_AUTO',
  RENEWAL_MANUAL = 'RENEWAL_MANUAL',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface ILoyaltyProgramEligibleCustomerFilter {
  tenureMonths: number;
  minimumRequiredValueRs: number;
  email: string;
}

export interface ILoyaltyProgramEligibleCustomer {
  tenantId: number;
  customerId: number;
  userName: string;
  email: string;
  orderCount: number;
  totalOrderValueRs: number;
  lastOrderValueRs: number;
  lastOrderDate: number;
  membershipStatus: string;
}

export interface MembershipConfig {
  id: number;
  tenure: number;
  active: boolean;
  discountPercentage: number;
  minimumOrderValueCurrency: string;
  minimumOrderValue: number;
  minimumOrderValueINR: number;
  exchangeRate: number;
  startDate: number;
  endDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface ILoyaltyProgramCustomerMetrics {
  tenantId: number;
  customerId: number;
  userName: string;
  email: string;
  totalOrderCount: number;
  totalOrderValue: number;
  totalLoyaltyOrderCount: number;
  totalLoyaltyOrderValue: number;
  totalLoyaltyDiscountValue: number;
  cycleTotalOrderCount: number;
  cycleTotalOrderValue: number;
  cycleLoyaltyOrderCount: number;
  cycleLoyaltyOrderValue: number;
  cycleLoyaltyDiscountValue: number;
  membershipConfig: MembershipConfig;
}

export interface ILoyaltyProgramConfigPayload {
  id: number;
  customerId: number;
  tenure: number;
  discountPercentage: number;
  minimumOrderValueCurrency: string;
  minimumOrderValue: number;
  minimumOrderValueINR: number;
  exchangeRate: number;
  type: LoyaltyConfigAuditLogTypeEnum;
}

export class LoyaltyProgramValidationService {
  public static validate(payload: ILoyaltyProgramConfigPayload): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (!payload.minimumOrderValueCurrency || payload.minimumOrderValueCurrency.trim().length === 0) {
      errors['minimumOrderValueCurrency'] = 'Currency is required';
    }

    if (!payload.minimumOrderValue || payload.minimumOrderValue <= 0) {
      errors['minimumOrderValue'] = 'Amount must be greater than 0';
    }

    if (!payload.tenure || payload.tenure <= 0) {
      errors['tenure'] = 'Tenure must be greater than 0';
    }

    if (
      payload.discountPercentage === null ||
      payload.discountPercentage === undefined ||
      payload.discountPercentage <= 0
    ) {
      errors['discountPercentage'] = 'Discount must be greater than 0';
    } else if (payload.discountPercentage > 100) {
      errors['discountPercentage'] = 'Discount must not exceed 100%';
    }

    if (!payload.type) {
      errors['type'] = 'Type of action is required';
    }

    return errors;
  }
}

export class LoyaltyService {
  public static async getLoyaltyProgramEligibleCustomers(
    filter: ILoyaltyProgramEligibleCustomerFilter
  ): Promise<ILoyaltyProgramEligibleCustomer[]> {
    let queryParams = '';

    if (filter.email) {
      queryParams = `?email=${encodeURIComponent(filter.email)}`;
    } else if (filter.tenureMonths && filter.minimumRequiredValueRs) {
      queryParams = `?tenure=${filter.tenureMonths}&minimumTotalAmount=${filter.minimumRequiredValueRs}`;
    }

    const response = await apiClient.get(`/get/loyalty-eligible/customers${queryParams}`);
    return unwrapResponseData<ILoyaltyProgramEligibleCustomer[]>(response.data, 'customerList');
  }

  public static async getLoyaltyProgramCustomerMetrics(
    active: boolean
  ): Promise<ILoyaltyProgramCustomerMetrics[]> {
    const response = await apiClient.get(`/get/loyalty-program/customers/metrics?active=${active}`);
    return unwrapResponseData<ILoyaltyProgramCustomerMetrics[]>(response.data, 'customerList');
  }

  public static async enableLoyaltyProgramCustomers(
    payload: ILoyaltyProgramConfigPayload
  ): Promise<any> {
    const response = await apiClient.post('/enable/loyalty-program', payload);
    return response.data;
  }
}
