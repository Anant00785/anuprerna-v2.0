import React from "react";
import { cookies } from "next/headers";
import { getArtisanList, getSkillList } from "@/lib/artisans-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { ArtisansClient } from "./ArtisansClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function ArtisansPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value ?? (await getServiceToken());
  const [artisans, skills] = await Promise.all([
    getArtisanList(token),
    getSkillList(token),
  ]);
  return <ArtisansClient artisans={artisans} skills={skills} />;
}
