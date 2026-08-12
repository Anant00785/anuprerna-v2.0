import { describe, it, expect } from "vitest";
import {
  validateAddSizeProfile,
  validateUpdateSizeProfile,
  validateAddBadgeProfile,
  validateUpdateBadgeProfile,
  validateAddMadeToOrderProfile,
  validateUpdateMadeToOrderProfile,
  validateUpdateCustomerProfile,
} from "./profile.validator.js";

// No documented contract for this module (docs/backend/commerce/02-api-documentation.md
// has no Profile section) — characterization per docs/TESTING.md §4 "Everything else".

describe("validateAddSizeProfile", () => {
  it("accepts a valid input", () => {
    expect(validateAddSizeProfile({ profileName: "P", disclaimer: "D", options: [] })).toBeNull();
  });

  it("rejects a missing profileName", () => {
    expect(validateAddSizeProfile({ profileName: "", disclaimer: "D", options: [] })).toBe("Profile name is required");
  });

  it("rejects a missing disclaimer", () => {
    expect(validateAddSizeProfile({ profileName: "P", disclaimer: "", options: [] })).toBe("Disclaimer is required");
  });
});

// validateUpdateSizeProfile is currently a no-op stub — always null, no field is checked.
// Characterizing current behaviour, not strengthening it.
describe("validateUpdateSizeProfile", () => {
  it("always returns null (unconditional stub)", () => {
    expect(validateUpdateSizeProfile({ profileName: "" })).toBeNull();
  });
});

describe("validateAddBadgeProfile", () => {
  it("accepts a valid input", () => {
    expect(validateAddBadgeProfile({ name: "B", items: [] })).toBeNull();
  });

  it("rejects a missing name", () => {
    expect(validateAddBadgeProfile({ name: "", items: [] })).toBe("Name is required");
  });

  it("rejects a non-array items", () => {
    expect(validateAddBadgeProfile({ name: "B", items: undefined as any })).toBe("Items must be an array");
  });
});

// validateUpdateBadgeProfile is currently a no-op stub — always null.
describe("validateUpdateBadgeProfile", () => {
  it("always returns null (unconditional stub)", () => {
    expect(validateUpdateBadgeProfile({ name: "" })).toBeNull();
  });
});

describe("validateAddMadeToOrderProfile", () => {
  const valid = { profileName: "M", minimumOrderQuantity: 1, deliveryFromDays: 1, deliveryToDays: 2 };

  it("accepts a valid input", () => {
    expect(validateAddMadeToOrderProfile(valid)).toBeNull();
  });

  it("rejects a missing profileName", () => {
    expect(validateAddMadeToOrderProfile({ ...valid, profileName: "" })).toBe("Profile name is required");
  });

  it("rejects a NaN minimumOrderQuantity", () => {
    expect(validateAddMadeToOrderProfile({ ...valid, minimumOrderQuantity: NaN })).toBe("Invalid minimum order quantity");
  });
});

describe("validateUpdateMadeToOrderProfile", () => {
  it("accepts a valid id", () => {
    expect(validateUpdateMadeToOrderProfile({ id: 1 })).toBeNull();
  });

  it("rejects a missing id", () => {
    expect(validateUpdateMadeToOrderProfile({ id: 0 })).toBe("Profile ID is required");
  });
});

// validateUpdateCustomerProfile is currently a no-op stub — always null.
describe("validateUpdateCustomerProfile", () => {
  it("always returns null (unconditional stub)", () => {
    expect(validateUpdateCustomerProfile({ name: "" })).toBeNull();
  });
});
