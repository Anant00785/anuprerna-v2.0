import React from "react";
import { cookies } from "next/headers";
import { getStoryCategoryList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { StoryCategoriesClient } from "./StoryCategoriesClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function StoryCategoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  const categories = await getStoryCategoryList(token);
  return <StoryCategoriesClient categories={categories} />;
}
