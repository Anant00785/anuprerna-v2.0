import { describe, it, expect } from "vitest";
import { validateUpdateCustomerProfile } from "./tenant.validator.js";

describe("validateUpdateCustomerProfile", () => {
  it("accepts a valid input with no errors", () => {
    expect(validateUpdateCustomerProfile({ name: "Jane" })).toEqual([]);
  });

  it("accepts an input with name omitted (no type check triggered)", () => {
    expect(validateUpdateCustomerProfile({})).toEqual([]);
  });

  it("rejects a non-string name", () => {
    expect(validateUpdateCustomerProfile({ name: 5 as unknown as string })).toEqual(["Name must be a string"]);
  });
});
