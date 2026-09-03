import React from "react";
import { cookies } from "next/headers";
import { getMaterialList, getColorList, getPatternList } from "@/lib/catalog-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { FiltersClient } from "./FiltersClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function FiltersPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = await getBackendCallToken(cookieToken);
  return loadOrBanner(
    () => Promise.all([
      getMaterialList(token),
      getColorList(token),
      getPatternList(token),
    ]),
    ([materials, colors, patterns]) => (
      <FiltersClient
        materials={materials}
        colors={colors}
        patterns={patterns}
      />
    ),
  );
}
