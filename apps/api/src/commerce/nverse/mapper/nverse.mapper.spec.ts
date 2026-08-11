import { describe, it, expect } from "vitest";
import { mapVerificationToken } from "./nverse.mapper.js";

describe("mapVerificationToken", () => {
  it("maps a row to a verification token DTO", () => {
    const out = mapVerificationToken({ id: "1", tenantId: "2", token: "abc", expiryTime: 123, timeOfCreation: 456 });
    expect(out).toEqual({ id: 1, tenantId: 2, token: "abc", expiryTime: 123, timeOfCreation: 456 });
  });

  it("returns null for a null/undefined row", () => {
    expect(mapVerificationToken(null)).toBeNull();
    expect(mapVerificationToken(undefined)).toBeNull();
  });
});
