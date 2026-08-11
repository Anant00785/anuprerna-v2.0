import { describe, it, expect } from "vitest";
import { validateAddPattern } from "./pattern.validator.js";

describe("validateAddPattern", () => {
  it("accepts a valid name", () => {
    expect(() => validateAddPattern({ name: "Stripe" })).not.toThrow();
  });

  it("throws when name is missing", () => {
    expect(() => validateAddPattern({})).toThrow("Invalid name");
  });

  it("throws when name exceeds 255 characters", () => {
    expect(() => validateAddPattern({ name: "a".repeat(256) })).toThrow("Invalid name");
  });

  it("accepts the 255-char boundary", () => {
    expect(() => validateAddPattern({ name: "a".repeat(255) })).not.toThrow();
  });
});
