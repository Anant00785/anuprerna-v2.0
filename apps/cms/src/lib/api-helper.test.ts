import { describe, it, expect } from "vitest";
import { unwrapResponseData } from "./api-helper";

// unwrapResponseData() is the single choke point every CMS response passes
// through (docs/DATA-FLOW.md §3). It picks the payload key by heuristic, not
// schema, so every branch is characterized here.
describe("unwrapResponseData", () => {
  it("returns [] for null/undefined data", () => {
    expect(unwrapResponseData(null)).toEqual([]);
    expect(unwrapResponseData(undefined)).toEqual([]);
  });

  it("returns [] for falsy non-object data (0, empty string)", () => {
    // `!data` is true for 0 and "" too, not just null/undefined.
    expect(unwrapResponseData(0)).toEqual([]);
    expect(unwrapResponseData("")).toEqual([]);
  });

  it("passes an array response through unchanged", () => {
    const arr = [{ id: 1 }, { id: 2 }];
    expect(unwrapResponseData(arr)).toBe(arr);
  });

  it("throws when success is false, using the message", () => {
    expect(() => unwrapResponseData({ success: false, message: "nope" })).toThrow("nope");
  });

  it("throws a default message when success is false and message is missing", () => {
    expect(() => unwrapResponseData({ success: false })).toThrow("Backend request rejected.");
  });

  it("prefers the caller-supplied preferredKey when present, even over other array keys", () => {
    const data = { success: true, catalogList: [1, 2], otherArray: [9, 9, 9] };
    expect(unwrapResponseData(data, "catalogList")).toEqual([1, 2]);
  });

  it("returns the preferredKey's value even when it is not an array", () => {
    const data = { success: true, catalog: { id: 1, name: "x" } };
    expect(unwrapResponseData(data, "catalog")).toEqual({ id: 1, name: "x" });
  });

  it("falls through to auto-detection when preferredKey is absent from the payload", () => {
    const data = { success: true, message: "", warehouseList: [{ id: 1 }] };
    expect(unwrapResponseData(data, "notPresentKey")).toEqual([{ id: 1 }]);
  });

  it("auto-detects the single array-valued property, ignoring metadata keys", () => {
    const data = { success: true, message: "ok", status: 200, statusCode: 200, timestamp: 123, items: [1, 2, 3] };
    expect(unwrapResponseData(data)).toEqual([1, 2, 3]);
  });

  it("ambiguity: with multiple array-valued keys, the FIRST one in object key order wins (undocumented, order-dependent)", () => {
    const data = { success: true, firstArray: ["a"], secondArray: ["b", "c"] };
    // Pinning actual behavior: iteration is Object.keys() insertion order, so
    // whichever array key was declared first on the backend response wins.
    // This is a silent, order-dependent heuristic with no tie-break by name.
    expect(unwrapResponseData(data)).toEqual(["a"]);
  });

  it("unwraps the sole non-metadata object key when no array key exists", () => {
    const data = { success: true, message: "", catalog: { id: 5, name: "solo" } };
    expect(unwrapResponseData(data)).toEqual({ id: 5, name: "solo" });
  });

  it("does NOT unwrap a sole non-metadata key when its value is a primitive, not an object", () => {
    const data = { success: true, count: 42 };
    // keys.length === 1 but typeof data[keys[0]] !== 'object', so the guard
    // fails and the raw envelope is returned instead of the primitive.
    expect(unwrapResponseData(data)).toEqual(data);
  });

  it("returns the raw object when there are multiple non-metadata keys and none are arrays", () => {
    const data = { success: true, id: 1, name: "x" };
    expect(unwrapResponseData(data)).toEqual(data);
  });

  it("returns the object unchanged for an empty object payload", () => {
    expect(unwrapResponseData({})).toEqual({});
  });

  it("returns metadata-only payloads (all keys filtered out) as-is", () => {
    const data = { success: true, message: "ok", status: 200 };
    expect(unwrapResponseData(data)).toEqual(data);
  });

  it("characterizes non-object primitive responses: a number falls through to the raw-return branch", () => {
    // Object.keys(5) === [], so keys.length is 0 (not 1) -> raw data returned.
    expect(unwrapResponseData(5 as any)).toBe(5);
  });

  it("characterizes non-object primitive responses: a truthy string is indexed like an array-of-chars and returned as-is", () => {
    // Object.keys("ab") === ['0','1']; neither char is an array, keys.length
    // is 2 (not 1), so it falls through to the final `return data as T`.
    expect(unwrapResponseData("ab" as any)).toBe("ab");
  });
});
