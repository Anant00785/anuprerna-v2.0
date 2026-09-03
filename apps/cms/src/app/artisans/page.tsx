import React from "react";
import { cookies } from "next/headers";
import { getArtisanList, getSkillList } from "@/lib/artisans-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { ArtisansClient } from "./ArtisansClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function ArtisansPage() {
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE)?.value);
  return loadOrBanner(
    () => Promise.all([
      getArtisanList(token),
      getSkillList(token),
    ]),
    ([artisans, skills]) => (<ArtisansClient artisans={artisans} skills={skills} />),
  );
}
