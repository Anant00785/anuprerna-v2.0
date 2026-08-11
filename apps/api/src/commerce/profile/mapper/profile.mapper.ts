// @ts-nocheck
export function mapSizeProfile(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    profileName: row.profileName,
    displayName: row.displayName,
    disclaimer: row.disclaimer,
    image: row.image,
    timeOfCreation: row.timeOfCreation,
  };
}

export function mapSizeProfileOption(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    profileId: row.profileId,
    label: row.label,
    keyFeature: row.keyFeature,
    sortOrder: row.sortOrder,
    consumedFabric: row.consumedFabric,
  };
}

export function mapSizeProfileGuide(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    profileId: row.profileId,
    optionId: row.optionId,
    guide: row.guide,
    value: row.value,
    sortOrder: row.sortOrder,
  };
}

export function mapBadgeProfile(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    timeOfCreation: row.timeOfCreation,
  };
}

export function mapBadgeProfileItem(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    profileId: row.profileId,
    label: row.label,
    icon: row.icon,
    sortOrder: row.sortOrder,
  };
}

export function mapMadeToOrderProfile(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    profileName: row.profileName,
    minimumOrderQuantity: row.minimumOrderQuantity,
    deliveryFromDays: row.deliveryFromDays,
    deliveryToDays: row.deliveryToDays,
    timeOfCreation: row.timeOfCreation,
    consumedFabric: row.consumedFabric,
  };
}

export function mapTenantProfile(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
  };
}
// @ts-nocheck
// @ts-nocheck
