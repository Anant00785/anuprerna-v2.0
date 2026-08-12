import { describe, it, expect } from "vitest";
import { validateAddMaterial } from "./material.validator.js";

describe("validateAddMaterial", () => {
  it("accepts a valid 1-255 char name", () => {
    expect(() => validateAddMaterial({ name: "Cotton" })).not.toThrow();
  });

  it("rejects a missing name", () => {
    expect(() => validateAddMaterial({})).toThrow("Invalid name");
  });

  it("rejects an empty-string name", () => {
    expect(() => validateAddMaterial({ name: "" })).toThrow("Invalid name");
  });

  it("boundary: a 255-char name passes", () => {
    expect(() => validateAddMaterial({ name: "a".repeat(255) })).not.toThrow();
  });

  it("boundary: a 256-char name is rejected", () => {
    expect(() => validateAddMaterial({ name: "a".repeat(256) })).toThrow("Invalid name");
  });
});
