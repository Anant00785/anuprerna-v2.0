// @ts-nocheck
import { UpdateCustomerProfileDto, UserRoleFilterDto } from '../types/tenant.types.js';

export function parseUpdateCustomerProfileInput(data: any): UpdateCustomerProfileDto {
  return {
    name: data?.name,
    phone: data?.phone,
    address: data?.address,
  };
}

export function parseUserRoleFilterInput(query: any): UserRoleFilterDto {
  return {
    page: query?.page ? parseInt(query.page, 10) : 1,
    limit: query?.limit ? parseInt(query.limit, 10) : 10,
  };
}
// @ts-nocheck
// @ts-nocheck
