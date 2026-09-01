import React from "react";
import { cookies } from "next/headers";
import { getCategoryList } from "@/lib/catalog-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { CategoriesClient } from "./CategoriesClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function CategoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? await getServiceToken();
  const items = await getCategoryList(token);
  return <CategoriesClient items={items} />;
}
