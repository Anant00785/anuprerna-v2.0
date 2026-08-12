import { describe, it, expect } from "vitest";
import { AuthService } from "./auth-service";

// Per docs/STATE-INVENTORY.md: storeJWT writes plain `token`/`jwt` keys AND
// splits the token into 5 obfuscated chunk keys mirroring the legacy Angular
// JWTService. destroySession must clear all 7 keys or a logout leaves a
// readable token behind.
const CHUNK_KEYS = ["nkbgUGFbfYHbJh", "nkftrVHdretgvNjug", "bfdtBVNHGYkjbg", "bFTGVFyvgHUIBH", "BHNFGtyhjjiGGGDSRj"];

describe("AuthService.storeJWT / retrieveJWT", () => {
  it("stores the token under plain 'token' and 'jwt' keys", () => {
    AuthService.storeJWT("abcdefghij");
    expect(localStorage.getItem("token")).toBe("abcdefghij");
    expect(localStorage.getItem("jwt")).toBe("abcdefghij");
  });

  it("also shatters the token into 5 obfuscated chunk keys that reconstruct it", () => {
    const token = "abcdefghij"; // length 10 -> chunkSize 2 -> 5 chunks of 2
    AuthService.storeJWT(token);
    const reconstructed = CHUNK_KEYS.map((k) => localStorage.getItem(k) ?? "").join("");
    expect(reconstructed).toBe(token);
  });

  it("retrieveJWT prefers the plain jwt/token key over the chunks", () => {
    AuthService.storeJWT("plain-preferred");
    // Corrupt a chunk directly; retrieveJWT must still return the plain value.
    localStorage.setItem(CHUNK_KEYS[0], "corrupted");
    expect(AuthService.retrieveJWT()).toBe("plain-preferred");
  });

  it("retrieveJWT reconstructs from chunks alone when the plain keys are absent", () => {
    AuthService.storeJWT("chunk-only-token");
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
    expect(AuthService.retrieveJWT()).toBe("chunk-only-token");
  });

  it("retrieveJWT returns null when nothing is stored", () => {
    expect(AuthService.retrieveJWT()).toBeNull();
  });
});

describe("AuthService.destroySession", () => {
  it("clears all 9 localStorage keys written across login: token, jwt, authority, user_email, and all 5 chunk keys", () => {
    AuthService.storeJWT("full-token-value");
    localStorage.setItem("user_email", "a@b.com");
    localStorage.setItem("authority", JSON.stringify({ admin: true }));

    AuthService.destroySession();

    const allKeys = ["token", "jwt", "authority", "user_email", ...CHUNK_KEYS];
    for (const key of allKeys) {
      expect(localStorage.getItem(key)).toBeNull();
    }
    expect(AuthService.retrieveJWT()).toBeNull();
  });
});

describe("AuthService.hasValidJWT / isTokenExpired", () => {
  it("hasValidJWT is true whenever a non-empty token string is present, regardless of expiry", () => {
    expect(AuthService.hasValidJWT()).toBe(false);
    AuthService.storeJWT("any-non-empty-string");
    expect(AuthService.hasValidJWT()).toBe(true);
  });

  it("hasValidJWT does not call isTokenExpired: an expired-looking JWT still counts as valid", () => {
    // header.payload.signature with exp in the past.
    const expiredPayload = btoa(JSON.stringify({ exp: 1 })); // epoch seconds, long expired
    const expiredJwt = `h.${expiredPayload}.s`;
    AuthService.storeJWT(expiredJwt);
    // hasValidJWT only checks non-empty string length -- it has no expiry awareness.
    expect(AuthService.hasValidJWT()).toBe(true);
  });

  it("isTokenExpired is dead code (zero callers in the app) but is characterized here: true for an expired exp claim", () => {
    const expiredPayload = btoa(JSON.stringify({ exp: 1 }));
    const expiredJwt = `h.${expiredPayload}.s`;
    expect(AuthService.isTokenExpired(expiredJwt)).toBe(true);
  });

  it("isTokenExpired returns false for a well-formed token with a future exp", () => {
    const futurePayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    const jwt = `h.${futurePayload}.s`;
    expect(AuthService.isTokenExpired(jwt)).toBe(false);
  });

  it("isTokenExpired returns true for a too-short or garbage token", () => {
    expect(AuthService.isTokenExpired("ab")).toBe(true);
    expect(AuthService.isTokenExpired("")).toBe(true);
  });
});
