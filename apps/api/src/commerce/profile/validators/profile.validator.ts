import {
  AddSizeProfileInput,
  UpdateSizeProfileInput,
  AddBadgeProfileInput,
  UpdateBadgeProfileInput,
  AddMadeToOrderProfileInput,
  UpdateMadeToOrderProfileInput,
  UpdateCustomerProfileInput,
} from '../types/profile.types.js';

export function validateAddSizeProfile(input: AddSizeProfileInput): string | null {
  if (!input.profileName) return 'Profile name is required';
  if (!input.disclaimer) return 'Disclaimer is required';
  return null;
}

export function validateUpdateSizeProfile(input: UpdateSizeProfileInput): string | null {
  return null;
}

export function validateAddBadgeProfile(input: AddBadgeProfileInput): string | null {
  if (!input.name) return 'Name is required';
  if (!Array.isArray(input.items)) return 'Items must be an array';
  return null;
}

export function validateUpdateBadgeProfile(input: UpdateBadgeProfileInput): string | null {
  return null;
}

export function validateAddMadeToOrderProfile(input: AddMadeToOrderProfileInput): string | null {
  if (!input.profileName) return 'Profile name is required';
  if (isNaN(input.minimumOrderQuantity)) return 'Invalid minimum order quantity';
  if (isNaN(input.deliveryFromDays)) return 'Invalid delivery from days';
  if (isNaN(input.deliveryToDays)) return 'Invalid delivery to days';
  return null;
}

export function validateUpdateMadeToOrderProfile(input: UpdateMadeToOrderProfileInput): string | null {
  if (!input.id || isNaN(input.id)) return 'Profile ID is required';
  return null;
}

export function validateUpdateCustomerProfile(input: UpdateCustomerProfileInput): string | null {
  return null;
}
