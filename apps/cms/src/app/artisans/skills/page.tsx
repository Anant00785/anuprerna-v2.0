import React from "react";
import { cookies } from "next/headers";
import { getSkillList } from "@/lib/artisans-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { SkillsClient } from "./SkillsClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function SkillsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value ?? (await getServiceToken());
  const skills = await getSkillList(token);
  return <SkillsClient skills={skills} />;
}
