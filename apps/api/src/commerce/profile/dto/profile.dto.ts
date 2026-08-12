// @ts-nocheck
import {
  AddSizeProfileInput,
  UpdateSizeProfileInput,
  AddBadgeProfileInput,
  UpdateBadgeProfileInput,
  AddMadeToOrderProfileInput,
  UpdateMadeToOrderProfileInput,
  UpdateCustomerProfileInput,
} from '../types/profile.types.js';

export function parseAddSizeProfileInput(body: any): AddSizeProfileInput {
  let options = [];
  try {
    options = typeof body.options === 'string' ? JSON.parse(body.options) : body.options;
  } catch (e) {
    options = [];
  }
  return {
    profileName: body.profileName,
    displayName: body.displayName || 'Size',
    disclaimer: body.disclaimer,
    options: options || [],
  };
}

export function parseUpdateSizeProfileInput(body: any): UpdateSizeProfileInput {
  return {
    profileName: body.profileName,
    displayName: body.displayName,
    disclaimer: body.disclaimer,
  };
}

export function parseAddBadgeProfileInput(body: any): AddBadgeProfileInput {
  return {
    name: body.name,
    items: body.items || [],
  };
}

export function parseUpdateBadgeProfileInput(body: any): UpdateBadgeProfileInput {
  return {
    name: body.name,
    items: body.items,
  };
}

export function parseAddMadeToOrderProfileInput(body: any): AddMadeToOrderProfileInput {
  return {
    profileName: body.profileName,
    minimumOrderQuantity: Number(body.minimumOrderQuantity),
    deliveryFromDays: Number(body.deliveryFromDays),
    deliveryToDays: Number(body.deliveryToDays),
    consumedFabric: body.consumedFabric ? Number(body.consumedFabric) : 0,
  };
}

export function parseUpdateMadeToOrderProfileInput(body: any): UpdateMadeToOrderProfileInput {
  return {
    id: Number(body.id),
    profileName: body.profileName,
    minimumOrderQuantity: body.minimumOrderQuantity !== undefined ? Number(body.minimumOrderQuantity) : undefined,
    deliveryFromDays: body.deliveryFromDays !== undefined ? Number(body.deliveryFromDays) : undefined,
    deliveryToDays: body.deliveryToDays !== undefined ? Number(body.deliveryToDays) : undefined,
    consumedFabric: body.consumedFabric !== undefined ? Number(body.consumedFabric) : undefined,
  };
}

export function parseUpdateCustomerProfileInput(body: any): UpdateCustomerProfileInput {
  return {
    name: body.name,
    phone: body.phone,
  };
}
// @ts-nocheck
// @ts-nocheck
