import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceUnavailableException } from "@nestjs/common";
import { Auth0ValidationService } from "./auth0-validation.service.js";

const original = process.env.AUTH0_ISSUER;

describe("Auth0ValidationService", () => {
  beforeEach(() => {
    delete process.env.AUTH0_ISSUER;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.AUTH0_ISSUER;
    else process.env.AUTH0_ISSUER = original;
  });

  it("THROWS rather than answering false when Auth0 is not configured", async () => {
    // The regression this guards: a validator stuck on `false` looks
    // identical to a working one until someone "fixes" it by inverting it.
    await expect(new Auth0ValidationService().validateToken("t", "a@b.com")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("rejects a malformed token without reaching the network", async () => {
    process.env.AUTH0_ISSUER = "https://example.us.auth0.com/";
    expect(await new Auth0ValidationService().validateToken("not-a-jwt", "a@b.com")).toBe(false);
  });

  it("rejects an empty token/email pair before any JWKS fetch", async () => {
    process.env.AUTH0_ISSUER = "https://example.us.auth0.com/";
    expect(await new Auth0ValidationService().validateToken("", "a@b.com")).toBe(false);
    expect(await new Auth0ValidationService().validateToken("t", "")).toBe(false);
  });

  it("getUserFromToken returns the `sub` claim, and '' for junk", async () => {
    const service = new Auth0ValidationService();
    const payload = Buffer.from(JSON.stringify({ sub: "google-oauth2|42" })).toString("base64url");
    const token = `${Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url")}.${payload}.sig`;

    expect(await service.getUserFromToken(token)).toBe("google-oauth2|42");
    expect(await service.getUserFromToken("junk")).toBe("");
  });
});
