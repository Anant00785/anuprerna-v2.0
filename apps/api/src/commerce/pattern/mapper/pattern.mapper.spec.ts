import { describe, it, expect } from "vitest";
import { mapPatternEntityToOutput } from "./pattern.mapper.js";

describe("mapPatternEntityToOutput", () => {
  it("stringifies the numeric/bigint id", () => {
    const out = mapPatternEntityToOutput({ id: 42n, name: "Stripe", timeOfCreation: 100 });
    expect(out).toEqual({ id: "42", name: "Stripe", timeOfCreation: 100 });
  });
});
