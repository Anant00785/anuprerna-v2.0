import React from "react";
import { cookies } from "next/headers";
import { getMaterialList, getColorList, getPatternList } from "@/lib/catalog-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { FiltersClient } from "./FiltersClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function FiltersPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? await getServiceToken();
  const [materials, colors, patterns] = await Promise.all([
    getMaterialList(token),
    getColorList(token),
    getPatternList(token),
  ]);
  return (
    <FiltersClient
      materials={materials}
      colors={colors}
      patterns={patterns}
    />
  );
}
