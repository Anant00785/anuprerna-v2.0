import React from "react";
import { cookies } from "next/headers";
import { getBlogCategoryList, getBlogTypeList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { BlogCategoriesClient } from "./BlogCategoriesClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function BlogCategoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  const [categories, types] = await Promise.all([
    getBlogCategoryList(token),
    getBlogTypeList(token),
  ]);
  return <BlogCategoriesClient categories={categories} types={types} />;
}
