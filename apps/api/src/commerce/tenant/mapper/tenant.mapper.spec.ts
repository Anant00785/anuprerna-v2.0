import { describe, it, expect } from "vitest";
import { mapTenantProfile, mapUserRole } from "./tenant.mapper.js";

/**
 * Regression guard. This mapper read `row.name`, `row.phone` and `row.type`,
 * none of which are columns on loom_tenant (they are user_name, contact_number,
 * user_type -> userName / contactNumber / userType via Drizzle). All three came
 * back undefined, JSON.stringify dropped them, and GET /get/customer/profile
 * returned `{id, email}` for an account whose name and phone were in the
 * database:
 *
 *   DB  : user_name="Saqlain Rashid"  contact_number="9748450789"
 *   API : {"customer":{"id":"162936320","email":"saqlain@marslab.studio"}}
 */
const row = {
  id: 162936320n,
  email: "someone@example.com",
  userName: "Saqlain Rashid",
  contactNumber: "9748450789",
  userType: "registered",
};

describe("mapTenantProfile", () => {
  it("maps the REAL column names, not name/phone/type", () => {
    const out = mapTenantProfile(row);
    expect(out.name).toBe("Saqlain Rashid");
    expect(out.userName).toBe("Saqlain Rashid");
    expect(out.phone).toBe("9748450789");
    expect(out.contactNumber).toBe("9748450789");
    expect(out.email).toBe("someone@example.com");
  });

  it("splits the display name into first and last", () => {
    const out = mapTenantProfile(row);
    expect(out.firstName).toBe("Saqlain");
    expect(out.lastName).toBe("Rashid");
  });

  it("converts a bigint id to a number so it survives JSON", () => {
    expect(mapTenantProfile(row).id).toBe(162936320);
  });

  it("never silently drops the name — the exact reported failure", () => {
    const json = JSON.parse(JSON.stringify(mapTenantProfile(row)));
    expect(Object.keys(json)).toContain("name");
    expect(json.name).not.toBe("");
  });

  it("defaults buyerType to b2c and to b2b for a wholesale role", () => {
    expect(mapTenantProfile(row).buyerType).toBe("b2c");
    expect(mapTenantProfile({ ...row, roles: ["ROLE_WHOLESALE"] }).buyerType).toBe("b2b");
  });

  it("handles a single-word name and a missing name", () => {
    expect(mapTenantProfile({ ...row, userName: "Cher" }).lastName).toBe("");
    expect(mapTenantProfile({ ...row, userName: undefined }).name).toBe("");
  });

  it("returns null for no row", () => {
    expect(mapTenantProfile(null)).toBeNull();
  });
});

describe("mapUserRole", () => {
  it("maps role and user_id, which are the real columns", () => {
    expect(mapUserRole({ id: 1n, role: "ROLE_CUSTOMER", userId: 42 })).toEqual({
      id: 1,
      role: "ROLE_CUSTOMER",
      userId: 42,
    });
  });

  it("tolerates snake_case rows", () => {
    expect(mapUserRole({ id: 2, role: "ROLE_ADMIN", user_id: 7 })!.userId).toBe(7);
  });

  it("returns null for no row", () => {
    expect(mapUserRole(null)).toBeNull();
  });
});
