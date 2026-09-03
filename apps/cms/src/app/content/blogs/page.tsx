import React from "react";
import { cookies } from "next/headers";
import { getBlogList, getBlogCategoryList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { BlogListClient } from "./BlogListClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function BlogsPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  return loadOrBanner(
    () => Promise.all([
      getBlogList(token),
      getBlogCategoryList(token),
    ]),
    ([blogs, categories]) => (<BlogListClient blogs={blogs} categories={categories} />),
  );
}
