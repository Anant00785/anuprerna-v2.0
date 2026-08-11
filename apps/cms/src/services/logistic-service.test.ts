import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope } from "@/test/msw";
import { LogisticService } from "./logistic-service";

describe("LogisticService.getOrders", () => {
  it("maps a UI tab status through ORDER_API_STATUS_MAP and sends it as the query param", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get("*/get/super-user/order-list", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(envelope("orderList", []));
      })
    );

    await LogisticService.getOrders("AWAITING", 0, 100);

    // AWAITING (UI) -> PROCESSING (backend), per ORDER_API_STATUS_MAP
    expect(capturedUrl?.searchParams.get("status")).toBe("PROCESSING");
    expect(capturedUrl?.searchParams.get("pageNumber")).toBe("0");
    expect(capturedUrl?.searchParams.get("pageSize")).toBe("100");
  });

  it("normalizes a raw backend order into the CustomerOrder shape", async () => {
    useHandlers(
      http.get("*/get/super-user/order-list", () =>
        HttpResponse.json(
          envelope("orderList", [
            {
              id: 42,
              name: "Priya Shah",
              email: "priya@example.com",
              total: 15000,
              orderStatus: "FULFILLED",
              itemCount: 3,
              hasOverdueSubProcess: true,
            },
          ])
        )
      )
    );

    const [order] = await LogisticService.getOrders();

    expect(order).toMatchObject({
      id: 42,
      buyerName: "Priya Shah",
      customerEmail: "priya@example.com",
      totalAmount: 15000,
      status: "FULFILLED",
      itemsCount: 3,
      isOverdue: true,
    });
  });

  it("swallows request failures and returns an empty array (unlike deleteOrder, which has no try/catch)", async () => {
    useHandlers(
      http.get("*/get/super-user/order-list", () => HttpResponse.json({ success: false, message: "boom" }, { status: 500 }))
    );

    await expect(LogisticService.getOrders()).resolves.toEqual([]);
  });
});

describe("LogisticService.searchOrders", () => {
  it("URL-encodes the keyword and sends offset/pageSize as pageNumber/pageSize", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get("*/get/super-user/order-list/search", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(envelope("orderList", []));
      })
    );

    await LogisticService.searchOrders("silk & cotton", 1, 20);

    expect(capturedUrl?.searchParams.get("keyword")).toBe("silk & cotton");
    expect(capturedUrl?.searchParams.get("pageNumber")).toBe("1");
    expect(capturedUrl?.searchParams.get("pageSize")).toBe("20");
  });
});

describe("LogisticService.deleteOrder", () => {
  it("has no try/catch: an errored DELETE propagates to the caller", async () => {
    useHandlers(
      http.delete("*/delete/order/7", () => HttpResponse.json({ success: false, message: "cannot delete" }, { status: 400 }))
    );

    await expect(LogisticService.deleteOrder(7)).rejects.toBeTruthy();
  });
});

describe("LogisticService.getShipments", () => {
  it("falls back to DEFAULT_SHIPMENTS when the backend returns an empty list", async () => {
    useHandlers(http.get("*/get/shipment-list", () => HttpResponse.json(envelope("shipmentList", []))));

    const result = await LogisticService.getShipments();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("shipmentType");
  });

  it("falls back to DEFAULT_SHIPMENTS on a request failure (caught and hidden)", async () => {
    useHandlers(http.get("*/get/shipment-list", () => HttpResponse.error()));

    const result = await LogisticService.getShipments();

    expect(result.length).toBeGreaterThan(0);
  });
});

describe("LogisticService.createShipment", () => {
  it("posts the payload to /add/shipment, but a failure is caught and silently reported as success", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post("*/add/shipment", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.error();
      })
    );

    const payload = { shipmentType: "DOMESTIC" as const, name: "Test", baseCharge: 100, baseUnitsLimit: 5, perExtraUnitRate: 5, estimatedDeliveryTimeline: "3 days" };
    const result = await LogisticService.createShipment(payload);

    // Bug: the request failed (HttpResponse.error()) but createShipment swallows it
    // and reports { success: true } to the caller regardless.
    expect(result).toEqual({ success: true });
    expect(capturedBody).toMatchObject({ name: "Test" });
  });
});

describe("LogisticService.getForexList", () => {
  it("normalizes currency/rate/markup field aliases from the backend", async () => {
    useHandlers(
      http.get("*/get/forex-list", () =>
        HttpResponse.json(
          envelope("forexList", [
            { id: 1, currency: "EUR", rate: 90.5, markup: 3, country: "Eurozone" },
          ])
        )
      )
    );

    const [rate] = await LogisticService.getForexList();

    expect(rate).toMatchObject({
      id: 1,
      currencyCode: "EUR",
      currencySymbol: "€",
      exchangeRateToInr: 90.5,
      markupPercentage: 3,
    });
  });
});
