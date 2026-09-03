import { UpdateCustomerProfileDto } from '../types/tenant.types.js';

export function validateUpdateCustomerProfile(dto: UpdateCustomerProfileDto): string[] {
  const errors: string[] = [];
  if (dto.name !== undefined && typeof dto.name !== 'string') errors.push('Name must be a string');
  return errors;
}
