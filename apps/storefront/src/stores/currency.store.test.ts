import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, PROXY_BASE, envelope } from "@/test/msw";
import { useCurrencyStore, type SupportedCurrency } from "./currency.store";

// currency.store initializes `selectedCurrency` from localStorage at module
// load (getInitialCurrency()). To observe different localStorage states we
// have to reset the module registry and re-import, same pattern as
// apps/cms/src/lib/config.test.ts.
describe("getInitialCurrency (module-load behaviour)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("defaults to inr when nothing is stored", async () => {
    const { useCurrencyStore: freshStore } = await import("./currency.store");
    expect(freshStore.getState().selectedCurrency).toBe("inr");
  });

  it("uses a valid stored currency", async () => {
    localStorage.setItem("selectedCurrency", "usd");
    const { useCurrencyStore: freshStore } = await import("./currency.store");
    expect(freshStore.getState().selectedCurrency).toBe("usd");
  });

  it("is case-insensitive on the stored value", async () => {
    localStorage.setItem("selectedCurrency", "GBP");
    const { useCurrencyStore: freshStore } = await import("./currency.store");
    expect(freshStore.getState().selectedCurrency).toBe("gbp");
  });

  it("falls back to inr for an invalid/garbage stored value", async () => {
    localStorage.setItem("selectedCurrency", "not-a-currency");
    const { useCurrencyStore: freshStore } = await import("./currency.store");
    expect(freshStore.getState().selectedCurrency).toBe("inr");
  });
});

describe("currency.store", () => {
  beforeEach(() => {
    useCurrencyStore.setState({
      selectedCurrency: "inr",
      forexRates: { inr: 1.0, usd: 0.0105, gbp: 0.0078, eur: 0.0091 },
      forexList: [
        { country: "India", currency: "INR", rate: 1.0 },
        { country: "United Kingdom", currency: "GBP", rate: 1.25 },
        { country: "DEFAULT", currency: "USD", rate: 1.25 },
        { country: "France", currency: "EUR", rate: 1.25 },
      ],
      isLoading: false,
    });
  });

  describe("getExchangeRate", () => {
    it("inr is always 1.0 regardless of forexRates/forexList", () => {
      expect(useCurrencyStore.getState().getExchangeRate("inr")).toBe(1.0);
    });

    it("computes usd as forexRates.usd * forexList USD multiplier", () => {
      // 0.0105 * 1.25 = 0.013125
      expect(useCurrencyStore.getState().getExchangeRate("usd")).toBeCloseTo(0.013125, 6);
    });

    it("computes gbp as forexRates.gbp * forexList GBP multiplier", () => {
      // 0.0078 * 1.25 = 0.00975
      expect(useCurrencyStore.getState().getExchangeRate("gbp")).toBeCloseTo(0.00975, 6);
    });

    it("computes eur as forexRates.eur * forexList EUR multiplier", () => {
      // 0.0091 * 1.25 = 0.011375
      expect(useCurrencyStore.getState().getExchangeRate("eur")).toBeCloseTo(0.011375, 6);
    });

    it("uses selectedCurrency when no target is passed", () => {
      useCurrencyStore.getState().setCurrency("usd");
      expect(useCurrencyStore.getState().getExchangeRate()).toBeCloseTo(0.013125, 6);
    });

    it("falls back to DEFAULT_RATES when the currency is missing from forexRates but present in the default map", () => {
      useCurrencyStore.setState({
        forexRates: { inr: 1.0 } as unknown as ReturnType<typeof useCurrencyStore.getState>["forexRates"],
      });
      // baseForexRate falls back to DEFAULT_RATES.usd (0.0105); forexList
      // still has a USD entry with rate 1.25.
      expect(useCurrencyStore.getState().getExchangeRate("usd")).toBeCloseTo(0.013125, 6);
    });

    it("falls back to 1.0 base rate and 1.25 conversion for a currency present in neither map", () => {
      const bogus = "xyz" as SupportedCurrency;
      expect(useCurrencyStore.getState().getExchangeRate(bogus)).toBeCloseTo(1.25, 6);
    });
  });

  describe("convertPrice", () => {
    it("converts to usd", () => {
      expect(useCurrencyStore.getState().convertPrice(1000, "usd")).toBeCloseTo(13.13, 2);
    });

    it("converts to gbp", () => {
      expect(useCurrencyStore.getState().convertPrice(1000, "gbp")).toBe(9.75);
    });

    it("converts to eur", () => {
      expect(useCurrencyStore.getState().convertPrice(1000, "eur")).toBeCloseTo(11.38, 2);
    });

    it("passes inr through unchanged", () => {
      expect(useCurrencyStore.getState().convertPrice(1000, "inr")).toBe(1000);
    });

    it("uses selectedCurrency as the default target when none is passed", () => {
      useCurrencyStore.getState().setCurrency("gbp");
      expect(useCurrencyStore.getState().convertPrice(1000)).toBe(9.75);
    });

    it("returns 0 for a zero price", () => {
      expect(useCurrencyStore.getState().convertPrice(0, "usd")).toBe(0);
    });

    it("returns 0 for NaN", () => {
      expect(useCurrencyStore.getState().convertPrice(NaN, "usd")).toBe(0);
    });
  });

  describe("formatPrice", () => {
    it("formats usd with symbol code and 2dp", () => {
      expect(useCurrencyStore.getState().formatPrice(1000, "usd")).toBe("USD 13.13");
    });

    it("formats gbp", () => {
      expect(useCurrencyStore.getState().formatPrice(1000, "gbp")).toBe("GBP 9.75");
    });

    it("formats eur", () => {
      expect(useCurrencyStore.getState().formatPrice(1000, "eur")).toBe("EUR 11.38");
    });

    it("formats inr with thousands separator and no decimals when whole", () => {
      expect(useCurrencyStore.getState().formatPrice(1000, "inr")).toBe("INR 1,000");
    });

    it("uses selectedCurrency as the default target when none is passed", () => {
      useCurrencyStore.getState().setCurrency("eur");
      expect(useCurrencyStore.getState().formatPrice(1000)).toBe("EUR 11.38");
    });
  });

  describe("setCurrency", () => {
    it("updates selectedCurrency state", () => {
      useCurrencyStore.getState().setCurrency("usd");
      expect(useCurrencyStore.getState().selectedCurrency).toBe("usd");
    });

    it("lowercases the currency before storing", () => {
      useCurrencyStore.getState().setCurrency("USD" as SupportedCurrency);
      expect(useCurrencyStore.getState().selectedCurrency).toBe("usd");
    });

    it("persists the selection to localStorage under the selectedCurrency key", () => {
      useCurrencyStore.getState().setCurrency("gbp");
      expect(localStorage.getItem("selectedCurrency")).toBe("gbp");
    });

    it("attaches NO client-side Authorization header — the proxy adds the session cookie", async () => {
      // The bearer is the httpOnly `loom_jwt` cookie, unreadable from JS. The
      // store must not invent an Authorization header of its own; the
      // /api/backend proxy attaches one server-side.
      let capturedAuth: string | null = null;
      const called = new Promise<void>((resolve) => {
        useHandlers(
          http.post(`${PROXY_BASE}/customer/update/selected-forex`, ({ request }) => {
            capturedAuth = request.headers.get("authorization");
            resolve();
            return HttpResponse.json({ success: true });
          })
        );
      });

      useCurrencyStore.getState().setCurrency("usd");
      await called;

      expect(capturedAuth).toBeNull();
    });

    it("syncs the selection to the profile endpoint", async () => {
      let capturedAuth: string | null = null;
      let capturedBody: unknown;
      let resolveCall: () => void;
      const called = new Promise<void>((resolve) => {
        resolveCall = resolve;
      });
      useHandlers(
        http.post(`${PROXY_BASE}/customer/update/selected-forex`, async ({ request }) => {
          capturedAuth = request.headers.get("authorization");
          capturedBody = await request.json();
          resolveCall();
          return HttpResponse.json({ success: true });
        })
      );

      useCurrencyStore.getState().setCurrency("usd");
      await called;

      expect(capturedAuth).toBeNull();
      expect(capturedBody).toEqual({ currency: "usd" });
    });

    it("silently swallows a failed profile sync (fire-and-forget, no throw)", async () => {
      let called = false;
      const failed = new Promise<void>((resolve) => {
        useHandlers(
          http.post(`${PROXY_BASE}/customer/update/selected-forex`, () => {
            called = true;
            resolve();
            return HttpResponse.json({ success: false }, { status: 500 });
          })
        );
      });

      expect(() => useCurrencyStore.getState().setCurrency("eur")).not.toThrow();
      await failed;
      expect(called).toBe(true);
      // Currency state is updated regardless of sync outcome.
      expect(useCurrencyStore.getState().selectedCurrency).toBe("eur");
    });
  });

  describe("fetchForexRates", () => {
    it("on success, merges live rates over defaults (inr pinned to 1.0) and uses the returned forexList", async () => {
      useHandlers(
        http.get(`${PROXY_BASE}/get/forex-exchange-rate/latest`, () =>
          HttpResponse.json({
            success: true,
            forexExchangeRate: { inr: 1.0, usd: 0.012, gbp: 0.009, eur: 0.011 },
          })
        ),
        http.get(`${PROXY_BASE}/get/forex-list`, () =>
          HttpResponse.json({
            success: true,
            forexList: [{ country: "United States", currency: "USD", rate: 1.3 }],
          })
        )
      );

      await useCurrencyStore.getState().fetchForexRates();

      const state = useCurrencyStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.forexRates).toEqual({ inr: 1.0, usd: 0.012, gbp: 0.009, eur: 0.011 });
      expect(state.forexList).toEqual([{ country: "United States", currency: "USD", rate: 1.3 }]);
    });

    it("falls back to DEFAULT_FOREX_LIST when the response's forexList is empty", async () => {
      useHandlers(
        http.get(`${PROXY_BASE}/get/forex-exchange-rate/latest`, () =>
          HttpResponse.json({ success: true, forexExchangeRate: { usd: 0.02 } })
        ),
        http.get(`${PROXY_BASE}/get/forex-list`, () =>
          HttpResponse.json({ success: true, forexList: [] })
        )
      );

      await useCurrencyStore.getState().fetchForexRates();

      const state = useCurrencyStore.getState();
      expect(state.forexList).toEqual([
        { country: "India", currency: "INR", rate: 1.0 },
        { country: "United Kingdom", currency: "GBP", rate: 1.25 },
        { country: "DEFAULT", currency: "USD", rate: 1.25 },
        { country: "France", currency: "EUR", rate: 1.25 },
      ]);
    });

    it("characterizes failure: both requests erroring falls back to DEFAULT_RATES/DEFAULT_FOREX_LIST, no throw, isLoading cleared", async () => {
      // Each request is individually .catch(() => null)'d inside
      // fetchForexRates, so a 500 on both endpoints does not hit the outer
      // try/catch -- it resolves as if neither endpoint returned data.
      useHandlers(
        http.get(`${PROXY_BASE}/get/forex-exchange-rate/latest`, () =>
          HttpResponse.json({ success: false }, { status: 500 })
        ),
        http.get(`${PROXY_BASE}/get/forex-list`, () =>
          HttpResponse.json({ success: false }, { status: 500 })
        )
      );

      await expect(useCurrencyStore.getState().fetchForexRates()).resolves.toBeUndefined();

      const state = useCurrencyStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.forexRates).toEqual({ inr: 1.0, usd: 0.0105, gbp: 0.0078, eur: 0.0091 });
      expect(state.forexList).toEqual([
        { country: "India", currency: "INR", rate: 1.0 },
        { country: "United Kingdom", currency: "GBP", rate: 1.25 },
        { country: "DEFAULT", currency: "USD", rate: 1.25 },
        { country: "France", currency: "EUR", rate: 1.25 },
      ]);
    });

    it("sets isLoading true synchronously while the fetch is in flight", () => {
      useHandlers(
        http.get(`${PROXY_BASE}/get/forex-exchange-rate/latest`, () =>
          HttpResponse.json({ success: true, forexExchangeRate: {} })
        ),
        http.get(`${PROXY_BASE}/get/forex-list`, () =>
          HttpResponse.json({ success: true, forexList: [] })
        )
      );

      const promise = useCurrencyStore.getState().fetchForexRates();
      expect(useCurrencyStore.getState().isLoading).toBe(true);
      return promise;
    });
  });
});
