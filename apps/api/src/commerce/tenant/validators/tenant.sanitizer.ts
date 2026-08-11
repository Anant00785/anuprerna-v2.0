import { UpdateCustomerProfileDto } from '../types/tenant.types.js';

export function sanitizeUpdateCustomerProfile(dto: UpdateCustomerProfileDto): UpdateCustomerProfileDto {
  return {
    ...dto,
    name: dto.name?.trim(),
    phone: dto.phone?.trim(),
  };
}
