import { describe, it, expect } from "vitest";
import { validateUpdateSettingsRequest } from "./settings.validator.js";

describe("validateUpdateSettingsRequest", () => {
  it("accepts a valid request", () => {
    expect(validateUpdateSettingsRequest({ id: 1n, attributeValue: "10", attributeLink: "/x" })).toBeNull();
  });

  it("rejects a missing id", () => {
    expect(validateUpdateSettingsRequest({ id: 0n, attributeValue: "10", attributeLink: "/x" })).toMatch(/Settings ID/);
  });

  it("rejects a missing attributeValue", () => {
    expect(validateUpdateSettingsRequest({ id: 1n, attributeValue: undefined as any, attributeLink: "/x" })).toMatch(/Attribute Value/);
  });
});
