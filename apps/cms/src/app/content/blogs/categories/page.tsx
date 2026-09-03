import React from "react";
import { cookies } from "next/headers";
import { getBlogCategoryList, getBlogTypeList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { BlogCategoriesClient } from "./BlogCategoriesClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function BlogCategoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  return loadOrBanner(
    () => Promise.all([
      getBlogCategoryList(token),
      getBlogTypeList(token),
    ]),
    ([categories, types]) => (<BlogCategoriesClient categories={categories} types={types} />),
  );
}
