/**
 * whatsapp-api.ts is the only *-api.ts module that returns a Result envelope
 * instead of throwing, so a Loom outage here has to be caught by the CALLER
 * branching on `ok` — a page that ignores it renders "no customers found" on a
 * 500. These tests pin that the failure actually arrives as ok:false with the
 * classified message, not as an empty success.
 *
 * The other thing worth protecting is classifyTrigger. Every send in the live
 * data today is transactional, so the marketing branch has no production
 * evidence behind it — which is exactly why it needs a test: the first
 * promotional campaign must not be filed as an order notification.
 */
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import {
  classifyTrigger,
  getWhatsAppConsent,
  getWhatsAppNotificationHistory,
} from "./whatsapp-api";

const HISTORY = "*/get/table-explorer/data/whatsapp-notification-history";
const CONSENT = "*/get/customers/whatsapp-status";

describe("classifyTrigger", () => {
  it("classifies every trigger type present in the live data as transactional", () => {
    for (const t of [
      "ORDER_CONFIRMATION",
      "ORDER_FULFILLMENT_DISPATCH",
      "ORDER_DISPATCH",
      "ORDER_CANCELLED",
      "PRE_ORDER_READY_TO_SHIP",
      "CUSTOMER_BTS_UPDATE",
    ]) {
      expect(classifyTrigger(t)).toBe("TRANSACTIONAL");
    }
  });

  it("files an unseen promotional trigger as MARKETING via the keyword fallback", () => {
    expect(classifyTrigger("FESTIVE_CAMPAIGN_2026")).toBe("MARKETING");
    expect(classifyTrigger("winback_offer")).toBe("MARKETING");
  });

  it("lets marketing win a keyword tie, so a promo is never buried as an order message", () => {
    // Contains both ABANDON (marketing) and ORDER (transactional).
    expect(classifyTrigger("ABANDONED_ORDER_NUDGE")).toBe("MARKETING");
  });

  it("defaults an unknown, non-order trigger to TRANSACTIONAL rather than mislabelling it", () => {
    expect(classifyTrigger("SOMETHING_NEW")).toBe("TRANSACTIONAL");
    expect(classifyTrigger(undefined)).toBe("TRANSACTIONAL");
  });
});

describe("getWhatsAppNotificationHistory", () => {
  it("maps the row, taking the recipient name from tenantName and classifying the trigger", async () => {
    useHandlers(
      http.get(HISTORY, () =>
        HttpResponse.json(
          envelope("whatsappNotificationHistoryList", [
            {
              id: 5,
              tenantName: "Meera",
              recipientMobile: "9999",
              triggerType: "ORDER_DISPATCH",
              status: "SENT",
              createdAt: 1000,
            },
          ]),
        ),
      ),
    );

    const res = await getWhatsAppNotificationHistory("tok");

    expect(res.ok).toBe(true);
    expect(res.ok && res.data[0]).toMatchObject({
      id: 5,
      recipientName: "Meera",
      messageClass: "TRANSACTIONAL",
      // sentAt falls back to createdAt when the send timestamp is absent.
      sentAt: 1000,
    });
  });

  it("sorts newest first, falling back to createdAt for rows with no sentAt", async () => {
    useHandlers(
      http.get(HISTORY, () =>
        HttpResponse.json(
          envelope("whatsappNotificationHistoryList", [
            { id: 1, sentAt: 100 },
            { id: 2, createdAt: 900 },
            { id: 3, sentAt: 500 },
          ]),
        ),
      ),
    );

    const res = await getWhatsAppNotificationHistory();

    expect(res.ok && res.data.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it("returns ok:false with the backend's message on a rejection, NOT an empty history", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get(HISTORY, () => HttpResponse.json(errorEnvelope("history unavailable"))));

    const res = await getWhatsAppNotificationHistory();

    expect(res).toMatchObject({ ok: false });
    expect(res.ok === false && res.error).toContain("history unavailable");
  });

  it("returns ok:false on a 500 and on an unreachable backend", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    useHandlers(http.get(HISTORY, () => new HttpResponse(null, { status: 500 })));
    expect((await getWhatsAppNotificationHistory()).ok).toBe(false);

    useHandlers(http.get(HISTORY, () => HttpResponse.error()));
    expect((await getWhatsAppNotificationHistory()).ok).toBe(false);
  });

  it("returns ok:true with an empty list when the backend genuinely has no sends", async () => {
    // The distinction the Result type exists for: this is NOT the same as the
    // failures above, and the page must be able to tell them apart.
    useHandlers(
      http.get(HISTORY, () => HttpResponse.json(envelope("whatsappNotificationHistoryList", []))),
    );

    expect(await getWhatsAppNotificationHistory()).toEqual({ ok: true, data: [] });
  });
});

describe("getWhatsAppConsent", () => {
  it("parses the stored preference JSON and keeps the opt-in status binary", async () => {
    useHandlers(
      http.get(CONSENT, () =>
        HttpResponse.json(
          envelope("customerWhatsAppStatusList", [
            {
              tenantId: 1,
              customerId: 2,
              userName: "Meera",
              whatsappNumber: "9999",
              whatsappOptInStatus: "OPTED_IN",
              whatsappPreferences: '[{"type":"ORDER"}]',
            },
          ]),
        ),
      ),
    );

    const res = await getWhatsAppConsent();

    expect(res.ok && res.data[0]).toMatchObject({
      optInStatus: "OPTED_IN",
      preferences: [{ type: "ORDER" }],
    });
  });

  it("treats a missing opt-in flag as OPTED_OUT — never assume consent", async () => {
    useHandlers(
      http.get(CONSENT, () =>
        HttpResponse.json(envelope("customerWhatsAppStatusList", [{ customerId: 3 }])),
      ),
    );

    const res = await getWhatsAppConsent();

    expect(res.ok && res.data[0].optInStatus).toBe("OPTED_OUT");
  });

  it("survives malformed preference JSON on one row instead of failing the whole list", async () => {
    useHandlers(
      http.get(CONSENT, () =>
        HttpResponse.json(
          envelope("customerWhatsAppStatusList", [
            { customerId: 1, whatsappPreferences: "{not json" },
            { customerId: 2, whatsappPreferences: '[{"type":"ORDER"}]' },
          ]),
        ),
      ),
    );

    const res = await getWhatsAppConsent();

    expect(res.ok).toBe(true);
    expect(res.ok && res.data.map((r) => r.preferences.length)).toEqual([0, 1]);
  });

  it("returns ok:false rather than an empty consent list when the backend refuses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get(CONSENT, () => new HttpResponse(null, { status: 403 })));

    const res = await getWhatsAppConsent();

    expect(res.ok).toBe(false);
    expect(res.ok === false && res.error).toMatch(/403/);
  });
});
