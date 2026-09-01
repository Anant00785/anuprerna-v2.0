import React from "react";
import { cookies } from "next/headers";
import { getSegmentList } from "@/lib/catalog-api";
import { getCategories } from "@/lib/api";
import { getServiceToken } from "@/lib/loom-service-token";
import { SegmentsClient } from "./SegmentsClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function SegmentsPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? await getServiceToken();
  const [items, categories] = await Promise.all([
    getSegmentList(token),
    getCategories(token),
  ]);
  return <SegmentsClient items={items} categories={categories} />;
}
