import React from "react";
import { cookies } from "next/headers";
import { getBlogTypeList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { BlogTypesClient } from "./BlogTypesClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function BlogTypesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = await getBackendCallToken(cookieToken);
  return loadOrBanner(
    () => getBlogTypeList(token),
    types => (<BlogTypesClient types={types} />),
  );
}
