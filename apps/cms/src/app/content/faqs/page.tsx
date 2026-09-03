import React from "react";
import { cookies } from "next/headers";
import { getFaqList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { FAQClient } from "./FAQClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function FAQsPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = await getBackendCallToken(cookieToken);
  return loadOrBanner(
    () => getFaqList(token),
    faqs => (<FAQClient faqs={faqs} />),
  );
}
