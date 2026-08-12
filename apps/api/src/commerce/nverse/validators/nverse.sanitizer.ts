// @ts-nocheck
export function sanitizeEmail(email?: string): string | undefined {
  return email ? email.trim().toLowerCase() : undefined;
}

export function sanitizeContactNumber(contactNumber?: string): string | undefined {
  return contactNumber ? contactNumber.replace(/\D/g, '') : undefined;
}
// @ts-nocheck
// @ts-nocheck
