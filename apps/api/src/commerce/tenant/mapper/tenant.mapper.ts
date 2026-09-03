export function mapTenantProfile(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    type: row.type,
  };
}

export function mapUserRole(row: any) {
  return {
    id: row.id,
    roleName: row.roleName,
    tenantId: row.tenantId,
  };
}
