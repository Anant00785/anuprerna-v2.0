// @ts-nocheck
export function mapTenantProfile(row: any) {
  if (!row) return null;
  return {
    id: typeof row.id === "bigint" ? Number(row.id) : row.id,
    loomId: row.loomId ?? row.loom_id ?? "",
    userName: row.userName ?? row.user_name ?? "",
    email: row.email ?? "",
    contactNumber: row.contactNumber ?? row.contact_number ?? "",
    dob: row.dob ? Number(row.dob) : 0,
    gender: row.gender ?? "UNDEFINED",
    userType: row.userType ?? row.user_type ?? "registered",
    profileImageUrl: row.profileImageUrl ?? row.profile_image_url ?? "default-display-picture.svg",
    active: row.active ?? true,
  };
}

export function mapUserRole(row: any) {
  if (!row) return null;
  return {
    id: typeof row.id === "bigint" ? Number(row.id) : row.id,
    roleName: row.roleName ?? row.role_name ?? row.role ?? "",
    tenantId: typeof row.tenantId === "bigint" ? Number(row.tenantId) : row.tenantId,
  };
}
