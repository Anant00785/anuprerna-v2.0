import { describe, it, expect } from "vitest";
import { validateCreateSkill, validateUpdateSkill } from "./skill.validator.js";

describe("validateCreateSkill", () => {
  it("returns no errors for a valid name", () => {
    expect(validateCreateSkill({ name: "Weaving" })).toEqual([]);
  });

  it("returns an error when name is missing", () => {
    expect(validateCreateSkill({})).toEqual(["Name is required and must be a string"]);
  });
});

describe("validateUpdateSkill", () => {
  it("returns no errors for a valid id", () => {
    expect(validateUpdateSkill({ id: "1" })).toEqual([]);
  });

  it("returns an error when id is missing", () => {
    expect(validateUpdateSkill({})).toEqual(["Id is required and must be a string"]);
  });
});
