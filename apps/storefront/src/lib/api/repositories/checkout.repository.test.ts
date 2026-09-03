import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { checkoutRepository } from "./checkout.repository";
import { useHandlers, PROXY_BASE } from "@/test/msw";

// getShipmentList goes through apiRequest, which under jsdom resolves to the
// Next proxy base (see lib/api/client.ts getBaseUrl).
const URL_ = `${PROXY_BASE}/get/shipment-list`;

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("checkoutRepository.getShipmentList", () => {
  it("maps the backend's shipping options", async () => {
    useHandlers(
      http.get(URL_, () =>
        HttpResponse.json({
          shipmentList: [
            {
              id: 21209,
              name: "Regular - By Road",
              locationType: "DOMESTIC",
              baseAmount: 150,
              additionalAmount: 50,
              baseQuantity: 1,
            },
          ],
        })
      )
    );

    await expect(checkoutRepository.getShipmentList()).resolves.toEqual([
      {
        id: 21209,
        name: "Regular - By Road",
        locationType: "DOMESTIC",
        baseAmount: 150,
        additionalAmount: 50,
        baseQuantity: 1,
        estimatedFromDay: 5,
        estimatedToDay: 7,
      },
    ]);
  });

  // The falsy-zero class of bug already fixed twice in the cart adapters:
  // `Number(0) || 110` silently overcharges a free shipping option.
  it("keeps a genuine 0 instead of substituting a default charge", async () => {
    useHandlers(
      http.get(URL_, () =>
        HttpResponse.json({
          shipmentList: [
            {
              id: 1,
              name: "Free shipping",
              locationType: "DOMESTIC",
              baseAmount: 0,
              additionalAmount: 0,
              baseQuantity: 0,
            },
          ],
        })
      )
    );

    const [option] = await checkoutRepository.getShipmentList();

    expect(option.baseAmount).toBe(0);
    expect(option.additionalAmount).toBe(0);
    expect(option.baseQuantity).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // This method used to answer a backend failure with a hardcoded two-option
  // list (₹110 / ₹200) that the caller could not distinguish from a live quote.
  // ---------------------------------------------------------------------------
  it("throws — never a fabricated quote — when the backend fails", async () => {
    useHandlers(http.get(URL_, () => HttpResponse.error()));
    await expect(checkoutRepository.getShipmentList()).rejects.toThrow();
  });

  it("throws on a 500 rather than falling back to invented prices", async () => {
    useHandlers(http.get(URL_, () => HttpResponse.json({}, { status: 500 })));
    await expect(checkoutRepository.getShipmentList()).rejects.toThrow();
  });

  it("treats an empty list as no quote available", async () => {
    useHandlers(http.get(URL_, () => HttpResponse.json({ shipmentList: [] })));
    await expect(checkoutRepository.getShipmentList()).rejects.toThrow(/no shipping options/i);
  });

  it("refuses an option the backend sent with no price at all", async () => {
    useHandlers(
      http.get(URL_, () =>
        HttpResponse.json({ shipmentList: [{ id: 7, name: "Mystery", locationType: "DOMESTIC" }] })
      )
    );
    await expect(checkoutRepository.getShipmentList()).rejects.toThrow(/no usable price/i);
  });
});
