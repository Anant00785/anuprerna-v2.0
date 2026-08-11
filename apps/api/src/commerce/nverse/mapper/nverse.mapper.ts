// @ts-nocheck
export function mapVerificationToken(row: any) {
  if (!row) return null;
  return {
    id: Number(row.id),
    tenantId: Number(row.tenantId),
    token: row.token,
    expiryTime: row.expiryTime,
    timeOfCreation: row.timeOfCreation,
  };
}
// @ts-nocheck
// @ts-nocheck
