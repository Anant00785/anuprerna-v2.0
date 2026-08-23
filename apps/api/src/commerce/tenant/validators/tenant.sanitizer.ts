// @ts-nocheck
export function sanitizeUpdateCustomerProfile(dto: any): any {
  return {
    userName: dto.userName !== undefined ? String(dto.userName).trim() : undefined,
    contactNumber: dto.contactNumber !== undefined ? String(dto.contactNumber).trim() : undefined,
    dob: dto.dob,
    gender: dto.gender,
  };
}
