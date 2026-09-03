import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { parseIdParamStrict, parseSlugParamStrict, toSafeNumberId } from "./id-param.js";

describe("parseIdParamStrict", () => {
  it("accepts a well-formed id and preserves it exactly past 2^53", () => {
    expect(parseIdParamStrict("2728")).toBe(2728n);
    expect(parseIdParamStrict("162853313", "productId")).toBe(162853313n);
    // Number("9007199254740993") === 9007199254740992 — the old
    // Number()-then-BigInt() path silently queried a different row.
    expect(parseIdParamStrict("9007199254740993")).toBe(9007199254740993n);
  });

  it("accepts an integer supplied as a number (JSON body ids)", () => {
    expect(parseIdParamStrict(2728)).toBe(2728n);
  });

  it.each(["1e5", "0x10", " 5", "5 ", "", "-1", "1.0", "abc", "12,3", "+5"])(
    "rejects %p with 400",
    (bad) => {
      expect(() => parseIdParamStrict(bad)).toThrow(BadRequestException);
    },
  );

  it.each([null, undefined, {}, [], true, 1.5])("rejects non-integer %p with 400", (bad) => {
    expect(() => parseIdParamStrict(bad as unknown)).toThrow(BadRequestException);
  });

  it("rejects an id past the postgres bigint bound with 400, not a 500", () => {
    expect(() => parseIdParamStrict("12345678901234567890")).toThrow(BadRequestException);
    expect(parseIdParamStrict("9223372036854775807")).toBe(9223372036854775807n);
    expect(() => parseIdParamStrict("9223372036854775808")).toThrow(BadRequestException);
  });

  it("names the offending field in the message", () => {
    expect(() => parseIdParamStrict("nope", "productId")).toThrow("productId must be an integer.");
  });
});

describe("toSafeNumberId", () => {
  it("converts ids inside the safe range", () => {
    expect(toSafeNumberId(162853313n)).toBe(162853313);
    expect(toSafeNumberId(9007199254740991n)).toBe(9007199254740991);
  });

  it("returns null rather than a rounded id", () => {
    expect(toSafeNumberId(9007199254740993n)).toBeNull();
  });
});

describe("parseSlugParamStrict", () => {
  it("accepts a real slug", () => {
    expect(parseSlugParamStrict("mandarin-collar-dress")).toBe("mandarin-collar-dress");
  });

  it.each(["", "   ", null, undefined, 5])("rejects %p", (bad) => {
    expect(() => parseSlugParamStrict(bad as unknown)).toThrow(BadRequestException);
  });
});
