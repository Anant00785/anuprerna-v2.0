import React from "react";
import { cookies } from "next/headers";
import { getStoryCategoryList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { StoryCategoriesClient } from "./StoryCategoriesClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function StoryCategoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  return loadOrBanner(
    () => getStoryCategoryList(token),
    categories => (<StoryCategoriesClient categories={categories} />),
  );
}
