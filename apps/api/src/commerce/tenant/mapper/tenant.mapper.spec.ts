import { describe, it, expect } from "vitest";
import { mapTenantProfile, mapUserRole } from "./tenant.mapper.js";

// No documented contract for this module (docs/backend/commerce/02-api-documentation.md
// has no Tenant section) — characterization per docs/TESTING.md §4 "Everything else".

describe("mapTenantProfile", () => {
  it("projects only id/name/email/phone/type, dropping extra row fields", () => {
    const row = { id: 1, name: "A", email: "a@b.com", phone: "123", type: "customer", secret: "x" };
    expect(mapTenantProfile(row)).toEqual({ id: 1, name: "A", email: "a@b.com", phone: "123", type: "customer" });
  });
});

describe("mapUserRole", () => {
  it("projects only id/roleName/tenantId", () => {
    const row = { id: 2, roleName: "admin", tenantId: 9, extra: true };
    expect(mapUserRole(row)).toEqual({ id: 2, roleName: "admin", tenantId: 9 });
  });
});
