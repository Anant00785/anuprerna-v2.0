import { describe, it, expect } from "vitest";
import { mapSkill, mapArtisanSkillMapping } from "./skill.mapper.js";

describe("mapSkill", () => {
  it("maps id/name/description straight through, dropping other fields", () => {
    const out = mapSkill({ id: 1, name: "Weaving", description: "Hand weaving", extra: "ignored" });
    expect(out).toEqual({ id: 1, name: "Weaving", description: "Hand weaving" });
  });
});

describe("mapArtisanSkillMapping", () => {
  it("maps id/artisanId/skillId/level straight through", () => {
    const out = mapArtisanSkillMapping({ id: 1, artisanId: 2, skillId: 3, level: "EXPERT" });
    expect(out).toEqual({ id: 1, artisanId: 2, skillId: 3, level: "EXPERT" });
  });
});
