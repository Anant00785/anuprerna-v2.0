// @ts-nocheck
export interface AddSizeProfileInput {
  profileName: string;
  displayName?: string;
  disclaimer: string;
  options: SizeProfileOptionInput[];
}

export interface SizeProfileOptionInput {
  label: string;
  keyFeature?: string;
  sortOrder?: number;
  consumedFabric?: number;
  guides: SizeProfileGuideInput[];
}

export interface SizeProfileGuideInput {
  guide: string;
  value: number;
  sortOrder?: number;
}

export interface UpdateSizeProfileInput {
  profileName?: string;
  displayName?: string;
  disclaimer?: string;
}

export interface AddBadgeProfileInput {
  name: string;
  items: BadgeProfileItemInput[];
}

export interface BadgeProfileItemInput {
  label: string;
  icon: string;
  sortOrder?: number;
}

export interface UpdateBadgeProfileInput {
  name?: string;
  items?: BadgeProfileItemInput[];
}

export interface AddMadeToOrderProfileInput {
  profileName: string;
  minimumOrderQuantity: number;
  deliveryFromDays: number;
  deliveryToDays: number;
  consumedFabric?: number;
}

export interface UpdateMadeToOrderProfileInput {
  id: number;
  profileName?: string;
  minimumOrderQuantity?: number;
  deliveryFromDays?: number;
  deliveryToDays?: number;
  consumedFabric?: number;
}

export interface UpdateCustomerProfileInput {
  name?: string;
  phone?: string;
}
// @ts-nocheck
// @ts-nocheck
