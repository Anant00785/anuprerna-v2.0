import { describe, it, expect } from "vitest";
import { mapMaterialEntityToOutput } from "./material.mapper.js";

describe("mapMaterialEntityToOutput", () => {
  it("stringifies the numeric id and passes through name/timeOfCreation", () => {
    const result = mapMaterialEntityToOutput({ id: 42, name: "Cotton", timeOfCreation: 1700000000000 });
    expect(result).toEqual({ id: "42", name: "Cotton", timeOfCreation: 1700000000000 });
  });

  it("stringifies a bigint id via toString()", () => {
    const result = mapMaterialEntityToOutput({ id: 999n, name: "Silk", timeOfCreation: 1 });
    expect(result.id).toBe("999");
  });
});
