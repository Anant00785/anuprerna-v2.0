import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { loomGetJson, assertEnvelopeOk, BackendFetchError } from "./backend-fetch-error";

/**
 * loomGetJson is the single place every `*-api.ts` module reads the backend
 * through, so the envelope contract is pinned here once rather than re-proved
 * in each module's spec.
 */
describe("loomGetJson", () => {
  it("returns the parsed envelope on a good response", async () => {
    useHandlers(
      http.get("*/get/thing-list", () =>
        HttpResponse.json(envelope("thingList", [{ id: 1, name: "Silk" }])),
      ),
    );

    const data = await loomGetJson<{ thingList: { id: number }[] }>("test", "/get/thing-list");

    expect(data.thingList).toEqual([{ id: 1, name: "Silk" }]);
  });

  it("treats {success:false} at HTTP 200 as a failure and surfaces the backend's message", async () => {
    useHandlers(
      http.get("*/get/thing-list", () => HttpResponse.json(errorEnvelope("catalog list unavailable"))),
    );

    await expect(loomGetJson("test", "/get/thing-list")).rejects.toThrow("catalog list unavailable");
  });

  it("classifies an envelope rejection as 'rejected', NOT as a systemic fault", async () => {
    useHandlers(http.get("*/get/thing-list", () => HttpResponse.json(errorEnvelope("nope"))));

    const err = await loomGetJson("test", "/get/thing-list").catch((e) => e);

    expect(err).toBeInstanceOf(BackendFetchError);
    expect((err as BackendFetchError).kind).toBe("rejected");
    expect((err as BackendFetchError).status).toBe(200);
  });

  it("distinguishes an HTTP failure from a business rejection", async () => {
    useHandlers(http.get("*/get/thing-list", () => new HttpResponse(null, { status: 500 })));

    const err = await loomGetJson("test", "/get/thing-list").catch((e) => e);

    expect(err).toBeInstanceOf(BackendFetchError);
    expect((err as BackendFetchError).kind).toBe("server");
    expect((err as BackendFetchError).status).toBe(500);
  });

  it("classifies 401/403 as an auth fault", async () => {
    useHandlers(http.get("*/get/thing-list", () => new HttpResponse(null, { status: 403 })));

    const err = await loomGetJson("test", "/get/thing-list").catch((e) => e);

    expect((err as BackendFetchError).kind).toBe("auth");
  });

  it("names the calling module in the message so a log points at the right file", async () => {
    useHandlers(http.get("*/get/thing-list", () => HttpResponse.json(errorEnvelope("denied"))));

    await expect(loomGetJson("catalog-api", "/get/thing-list")).rejects.toThrow("[catalog-api] denied");
  });
});

describe("assertEnvelopeOk", () => {
  it("passes a success envelope through", () => {
    expect(() => assertEnvelopeOk("test", "/x", envelope("list", []))).not.toThrow();
  });

  it("passes a bare array through (some endpoints answer unwrapped)", () => {
    expect(() => assertEnvelopeOk("test", "/x", [1, 2])).not.toThrow();
  });

  it("falls back to a generic message when the backend sends success:false with no message", () => {
    expect(() => assertEnvelopeOk("test", "/x", { success: false })).toThrow(
      "Backend rejected the request.",
    );
  });

  it("does not treat success:true or a missing success key as a failure", () => {
    expect(() => assertEnvelopeOk("test", "/x", { success: true })).not.toThrow();
    expect(() => assertEnvelopeOk("test", "/x", { rows: [] })).not.toThrow();
  });
});
