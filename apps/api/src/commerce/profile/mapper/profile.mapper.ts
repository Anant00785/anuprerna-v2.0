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
  const fullName = row.name ?? row.userName ?? row.user_name ?? "";
  const [firstName, ...rest] = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    id: typeof row.id === "bigint" ? Number(row.id) : row.id,
    name: fullName,
    userName: fullName,
    firstName: firstName || "",
    lastName: rest.join(" ") || "",
    email: row.email ?? "",
    phone: row.contactNumber ?? row.phone ?? "",
    contactNumber: row.contactNumber ?? row.phone ?? "",
  };
}
