export function sanitizeString(val?: string): string | undefined {
  if (val === undefined || val === null) return undefined;
  return val.trim();
}

export function sanitizeAddSizeProfileInput(input: any): any {
  return {
    ...input,
    profileName: sanitizeString(input.profileName),
    displayName: sanitizeString(input.displayName),
    disclaimer: sanitizeString(input.disclaimer),
  };
}

export function sanitizeUpdateSizeProfileInput(input: any): any {
  return {
    ...input,
    profileName: sanitizeString(input.profileName),
    displayName: sanitizeString(input.displayName),
    disclaimer: sanitizeString(input.disclaimer),
  };
}

export function sanitizeAddBadgeProfileInput(input: any): any {
  return {
    ...input,
    name: sanitizeString(input.name),
  };
}

export function sanitizeUpdateBadgeProfileInput(input: any): any {
  return {
    ...input,
    name: sanitizeString(input.name),
  };
}

export function sanitizeAddMadeToOrderProfileInput(input: any): any {
  return {
    ...input,
    profileName: sanitizeString(input.profileName),
  };
}

export function sanitizeUpdateMadeToOrderProfileInput(input: any): any {
  return {
    ...input,
    profileName: sanitizeString(input.profileName),
  };
}

export function sanitizeUpdateCustomerProfileInput(input: any): any {
  return {
    ...input,
    name: sanitizeString(input.name),
    phone: sanitizeString(input.phone),
  };
}
