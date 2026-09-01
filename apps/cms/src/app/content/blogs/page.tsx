import React from "react";
import { cookies } from "next/headers";
import { getBlogList, getBlogCategoryList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { BlogListClient } from "./BlogListClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function BlogsPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  const [blogs, categories] = await Promise.all([
    getBlogList(token),
    getBlogCategoryList(token),
  ]);
  return <BlogListClient blogs={blogs} categories={categories} />;
}
