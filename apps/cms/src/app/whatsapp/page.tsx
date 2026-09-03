import React from "react";
import { cookies } from "next/headers";
import { getWhatsAppNotificationHistory, getWhatsAppConsent } from "@/lib/whatsapp-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { WhatsAppClient } from "./WhatsAppClient";

// Server-fetches consent + history, so keep force-dynamic (per-request auth token).
export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function WhatsAppPage() {
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE)?.value);

  // Catch per-fetch: a failure in one surface must not blank the other, and a
  // Loom outage must render an error banner, not an empty "no records" table.
  const [consentRes, historyRes] = await Promise.all([
    getWhatsAppConsent(token),
    getWhatsAppNotificationHistory(token),
  ]);

  const rows = consentRes.ok ? consentRes.data : [];
  const rowsError = consentRes.ok ? null : consentRes.error;
  const history = historyRes.ok ? historyRes.data : [];
  const historyError = historyRes.ok ? null : historyRes.error;

  return (
    <WhatsAppClient
      rows={rows}
      history={history}
      rowsError={rowsError}
      historyError={historyError}
    />
  );
}
