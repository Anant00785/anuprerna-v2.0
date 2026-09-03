/**
 * WhatsApp API — the SENT-message log plus the per-customer consent list.
 *
 * Read-only: proxies Loom table-explorer / customer GETs through the :8090
 * wrapper; nothing is ever POSTed / mutated from here. Fetchers return a
 * discriminated Result so a Loom outage renders an error banner rather than a
 * silent "no customers found" / empty history.
 *
 * Source endpoints (live, GET):
 *   /get/table-explorer/data/whatsapp-notification-history -> { whatsappNotificationHistoryList }
 *   /get/customers/whatsapp-status                         -> { customerWhatsAppStatusList }
 */

import { loomGetJson } from "@/lib/backend-fetch-error";

import type { Result } from "./result";
import type { WhatsAppRow, WhatsAppPreference } from "./admin-api";


/** Single backend GET for this module. All failure handling — network,
 *  HTTP, and the `{success:false}` envelope — lives in loomGetJson. */
const waGet = <T,>(path: string, token?: string): Promise<T> =>
  loomGetJson<T>("whatsapp-api", path, token);

// -- Marketing vs Transactional classification --------------------------------
//
// Grounded in a LIVE 106-row pull (2026-07-01). Observed triggerTypes:
//   ORDER_CONFIRMATION (order_confirmation_1)        -- Transactional
//   ORDER_FULFILLMENT_DISPATCH (order_dispatch_2)    -- Transactional
//   ORDER_DISPATCH (order_dispatch_1)                -- Transactional
//   ORDER_CANCELLED (payment_failure)                -- Transactional
//   PRE_ORDER_READY_TO_SHIP (pre_order_ready_to_ship_1) -- Transactional
//   CUSTOMER_BTS_UPDATE (bts_production_update_1)    -- Transactional (behind-the-scenes
//       production update tied to an ORDER entity -- a service/order notification, not a promo)
// Every send in current data is a system/order event -> Transactional. No marketing
// (campaign/promotional) sends exist yet, but the surface must split them the moment
// one appears -- hence explicit map + keyword fallback below.
export type WhatsAppClass = "MARKETING" | "TRANSACTIONAL";

const TRIGGER_CLASS: Record<string, WhatsAppClass> = {
  ORDER_CONFIRMATION: "TRANSACTIONAL",
  ORDER_FULFILLMENT_DISPATCH: "TRANSACTIONAL",
  ORDER_DISPATCH: "TRANSACTIONAL",
  ORDER_CANCELLED: "TRANSACTIONAL",
  PRE_ORDER_READY_TO_SHIP: "TRANSACTIONAL",
  CUSTOMER_BTS_UPDATE: "TRANSACTIONAL",
};

// Fallback keyword lists for triggerTypes not yet seen. Marketing wins first so a
// promotional campaign is never buried, then order/system patterns.
const MARKETING_HINTS = [
  "CAMPAIGN", "PROMO", "MARKETING", "OFFER", "NEWSLETTER", "WINBACK", "WIN_BACK",
  "REENGAGE", "RE_ENGAGE", "ABANDON", "DISCOUNT", "SALE", "BROADCAST", "FESTIVE",
];
const TRANSACTIONAL_HINTS = [
  "ORDER", "DISPATCH", "DELIVER", "FULFILL", "SHIP", "OTP", "VERIF", "CONFIRM",
  "CANCEL", "PAYMENT", "REFUND", "RETURN", "INVOICE", "PRE_ORDER", "BTS",
];

export function classifyTrigger(triggerType?: string): WhatsAppClass {
  const t = (triggerType ?? "").toUpperCase();
  if (TRIGGER_CLASS[t]) return TRIGGER_CLASS[t];
  if (MARKETING_HINTS.some((k) => t.includes(k))) return "MARKETING";
  if (TRANSACTIONAL_HINTS.some((k) => t.includes(k))) return "TRANSACTIONAL";
  // Sensible default: an unknown, non-order trigger is treated as Transactional --
  // conservative so a genuine order/system message is never mislabeled as marketing.
  return "TRANSACTIONAL";
}

// -- Notification-history rows -------------------------------------------------

export interface WhatsAppNotificationRow {
  id: number;
  recipientName: string;
  recipientMobile: string;
  triggerType: string;
  entityType: string;
  entityId: number;
  templateName: string;
  languageCode: string;
  messageClass: WhatsAppClass;
  status: string;
  errorMessage: string;
  sentAt: number;
  createdAt: number;
}

export async function getWhatsAppNotificationHistory(
  token?: string,
  size = 500,
): Promise<Result<WhatsAppNotificationRow[]>> {
  try {
    const raw = await waGet<{ whatsappNotificationHistoryList?: Record<string, unknown>[] }>(
      `/get/table-explorer/data/whatsapp-notification-history?page=0&size=${size}`,
      token,
    );
    const rows = (raw.whatsappNotificationHistoryList ?? []).map((r) => {
      const triggerType = String(r.triggerType ?? "");
      const createdAt = Number(r.createdAt ?? 0);
      return {
        id: Number(r.id ?? 0),
        recipientName: String(r.tenantName ?? ""),
        recipientMobile: String(r.recipientMobile ?? ""),
        triggerType,
        entityType: String(r.entityType ?? ""),
        entityId: Number(r.entityId ?? 0),
        templateName: String(r.templateName ?? ""),
        languageCode: String(r.languageCode ?? ""),
        messageClass: classifyTrigger(triggerType),
        status: String(r.status ?? ""),
        errorMessage: String(r.errorMessage ?? ""),
        sentAt: Number(r.sentAt ?? 0) || createdAt,
        createdAt,
      };
    });
    // Newest first.
    rows.sort((a, b) => (b.sentAt || b.createdAt) - (a.sentAt || a.createdAt));
    return { ok: true, data: rows };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// -- Consent list --------------------------------------------------------------
//
// Result-returning consent fetcher (mirrors the mapping in admin-api's
// getWhatsAppStatus but signals errors instead of silently returning []). Kept
// here so the WhatsApp feature owns its own error discrimination without editing
// the shared admin-api lib.

export async function getWhatsAppConsent(token?: string): Promise<Result<WhatsAppRow[]>> {
  try {
    const raw = await waGet<{ customerWhatsAppStatusList?: Record<string, unknown>[] }>(
      "/get/customers/whatsapp-status",
      token,
    );
    const rows: WhatsAppRow[] = (raw.customerWhatsAppStatusList ?? []).map((r) => {
      let prefs: WhatsAppPreference[] = [];
      try {
        if (r.whatsappPreferences) prefs = JSON.parse(String(r.whatsappPreferences));
      } catch {
        /* ignore malformed preference JSON */
      }
      return {
        tenantId: Number(r.tenantId ?? 0),
        customerId: Number(r.customerId ?? 0),
        userName: String(r.userName ?? ""),
        email: String(r.email ?? ""),
        whatsappNumber: String(r.whatsappNumber ?? ""),
        // Enum fidelity - `pending` is deliberately NOT surfaced. The canonical live
        // consent enum is 'active' | 'opted-out' | 'pending'
        // (live-weave-ref/src/app/whatsapp-manager/whatsapp-consent-manager/interface/consent-entry.ts:1),
        // but the ONLY consent field this endpoint carries is a BINARY
        // whatsappOptInStatus ('OPTED_IN' | 'OPTED_OUT') - see
        // .../interface/customer-whatsapp-status.ts:17. Live's own mapper is a strict
        // binary ternary that can never emit 'pending'
        // (.../whatsapp-consent-manager.component.ts:64:
        //   status: item.whatsappOptInStatus === 'OPTED_IN' ? 'active' : 'opted-out'),
        // its 'Pending' stat card is commented out and it exposes no 'pending' filter tab.
        // A 2026-07-03 probe of /get/customers/whatsapp-status (69 rows) returned OPTED_IN
        // only - no 'pending' value and no separate consent-state field. 'pending' is thus a
        // defined-but-unreachable placeholder in the type system; deriving a pending bucket
        // here would fabricate a state the data cannot express, so we keep it binary.
        optInStatus: String(r.whatsappOptInStatus ?? "OPTED_OUT") as "OPTED_IN" | "OPTED_OUT",
        consentExpiresAt:
          r.whatsappConsentExpiresAt != null ? Number(r.whatsappConsentExpiresAt) : null,
        dismissCount: Number(r.whatsappDismissCount ?? 0),
        preferences: prefs,
      };
    });
    return { ok: true, data: rows };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
