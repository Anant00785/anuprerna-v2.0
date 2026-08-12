import { describe, it, expect } from "vitest";
import { simpleResponse, keyedResponse } from "./rain-response.js";

// rain-response.ts is a documented "no business logic" dummy, but it is the
// one response-envelope shape every mutating commerce endpoint returns —
// worth pinning its exact fields.
describe("simpleResponse", () => {
  it("returns exactly {success, message}", () => {
    expect(simpleResponse(true, "ok")).toEqual({ success: true, message: "ok" });
  });

  it("preserves success:false through", () => {
    expect(simpleResponse(false, "failed")).toEqual({ success: false, message: "failed" });
  });
});

describe("keyedResponse", () => {
  it("defaults success to true and message to empty string", () => {
    expect(keyedResponse("order", { id: 1 })).toEqual({ success: true, message: "", order: { id: 1 } });
  });

  it("accepts an explicit success/message override", () => {
    expect(keyedResponse("order", null, false, "not found")).toEqual({
      success: false,
      message: "not found",
      order: null,
    });
  });

  it("passes an empty-array payload through untouched", () => {
    expect(keyedResponse("orderList", [])).toEqual({ success: true, message: "", orderList: [] });
  });
});
