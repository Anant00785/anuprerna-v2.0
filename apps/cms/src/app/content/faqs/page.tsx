import React from "react";
import { cookies } from "next/headers";
import { getFaqList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { FAQClient } from "./FAQClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function FAQsPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  const faqs = await getFaqList(token);
  return <FAQClient faqs={faqs} />;
}
