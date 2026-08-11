import { describe, it, expect } from "vitest";
import { sanitizeCreateSkill, sanitizeUpdateSkill } from "./skill.sanitizer.js";

describe("sanitizeCreateSkill", () => {
  it("trims name and description", () => {
    expect(sanitizeCreateSkill({ name: "  Weaving  ", description: "  desc  " })).toEqual({
      name: "Weaving",
      description: "desc",
    });
  });

  it("leaves undefined name/description as undefined", () => {
    expect(sanitizeCreateSkill({})).toEqual({ name: undefined, description: undefined });
  });
});

describe("sanitizeUpdateSkill", () => {
  it("trims name and description while preserving other fields", () => {
    expect(sanitizeUpdateSkill({ id: "1", name: "  Dyeing  " })).toEqual({
      id: "1",
      name: "Dyeing",
      description: undefined,
    });
  });
});
