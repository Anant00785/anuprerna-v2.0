// @ts-nocheck
export function validateUpdateCustomerProfile(dto: any): string[] {
  const errors: string[] = [];
  if (dto.userName !== undefined && typeof dto.userName !== 'string') errors.push('userName must be a string');
  if (dto.contactNumber !== undefined && typeof dto.contactNumber !== 'string') errors.push('contactNumber must be a string');
  if (dto.gender !== undefined && !['MALE', 'FEMALE', 'OTHER', 'UNDEFINED'].includes(dto.gender)) {
    errors.push('gender must be MALE, FEMALE, OTHER, or UNDEFINED');
  }
  return errors;
}
