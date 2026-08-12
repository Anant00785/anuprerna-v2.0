import { describe, it, expect } from "vitest";
import { sanitizeUpdateCustomerProfile } from "./tenant.sanitizer.js";

describe("sanitizeUpdateCustomerProfile", () => {
  it("trims name and phone", () => {
    const out = sanitizeUpdateCustomerProfile({ name: "  Jane  ", phone: " 123 " });
    expect(out.name).toBe("Jane");
    expect(out.phone).toBe("123");
  });

  it("leaves missing name/phone as undefined", () => {
    const out = sanitizeUpdateCustomerProfile({});
    expect(out.name).toBeUndefined();
    expect(out.phone).toBeUndefined();
  });
});
