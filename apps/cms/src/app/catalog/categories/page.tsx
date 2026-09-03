import React from "react";
import { cookies } from "next/headers";
import { getCategoryList } from "@/lib/catalog-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { CategoriesClient } from "./CategoriesClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function CategoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = await getBackendCallToken(cookieToken);
  return loadOrBanner(
    () => getCategoryList(token),
    items => (<CategoriesClient items={items} />),
  );
}
