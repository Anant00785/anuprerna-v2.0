import React from "react";
import { cookies } from "next/headers";
import { getSkillList } from "@/lib/artisans-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { SkillsClient } from "./SkillsClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function SkillsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value ?? (await getServiceToken());
  return loadOrBanner(
    () => getSkillList(token),
    skills => (<SkillsClient skills={skills} />),
  );
}
