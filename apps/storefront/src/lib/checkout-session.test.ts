import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { encodeGuest, decodeGuest, EMAIL_RE } = await import("./checkout-session");

describe("guest identity cookie codec", () => {
  it("round-trips an identity", () => {
    expect(decodeGuest(encodeGuest({ email: "a@b.co", name: "Asha Rao" }))).toEqual({
      email: "a@b.co",
      name: "Asha Rao",
    });
  });

  it("survives non-ASCII names (base64url of UTF-8, not latin1)", () => {
    const encoded = encodeGuest({ email: "a@b.co", name: "Ünal Şahin" });
    expect(decodeGuest(encoded)?.name).toBe("Ünal Şahin");
  });

  it("returns null for a missing, empty or corrupt cookie instead of throwing", () => {
    expect(decodeGuest(undefined)).toBeNull();
    expect(decodeGuest("")).toBeNull();
    expect(decodeGuest("!!!not-base64!!!")).toBeNull();
    expect(decodeGuest(Buffer.from("not json").toString("base64url"))).toBeNull();
  });

  it("refuses an identity with no email — checkout has nothing to key an order on", () => {
    expect(decodeGuest(Buffer.from(JSON.stringify({ name: "Asha" })).toString("base64url"))).toBeNull();
    expect(decodeGuest(Buffer.from(JSON.stringify({ email: "" })).toString("base64url"))).toBeNull();
  });

  it("drops non-string fields rather than passing them to the backend", () => {
    const raw = Buffer.from(JSON.stringify({ email: "a@b.co", name: { $ne: null } })).toString(
      "base64url"
    );
    expect(decodeGuest(raw)).toEqual({ email: "a@b.co", name: "" });
  });

  it("decodes a JSON array to null rather than an identity", () => {
    expect(decodeGuest(Buffer.from(JSON.stringify([1, 2])).toString("base64url"))).toBeNull();
  });
});

describe("EMAIL_RE", () => {
  it("accepts ordinary addresses", () => {
    for (const ok of ["a@b.co", "first.last+tag@sub.example.co.uk"]) {
      expect(EMAIL_RE.test(ok)).toBe(true);
    }
  });

  it("rejects the shapes that would produce an unreachable order", () => {
    for (const bad of ["", "nobody", "no@domain", "no@domain.", "a b@c.co", "a@b.co ", "@b.co"]) {
      expect(EMAIL_RE.test(bad)).toBe(false);
    }
  });
});
