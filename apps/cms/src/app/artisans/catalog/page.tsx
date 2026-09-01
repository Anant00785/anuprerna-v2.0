import React from "react";
import { cookies } from "next/headers";
import { getCatalogList } from "@/lib/artisans-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { CatalogClient } from "./CatalogClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function ArtisanCatalogPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value ?? (await getServiceToken());
  const catalogs = await getCatalogList(token);
  return <CatalogClient catalogs={catalogs} />;
}
