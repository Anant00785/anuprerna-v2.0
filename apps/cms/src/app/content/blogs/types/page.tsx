import React from "react";
import { cookies } from "next/headers";
import { getBlogTypeList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { BlogTypesClient } from "./BlogTypesClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function BlogTypesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  const types = await getBlogTypeList(token);
  return <BlogTypesClient types={types} />;
}
