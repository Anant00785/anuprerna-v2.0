import React from "react";
import { cookies } from "next/headers";
import { getAIEmbeddingStats } from "@/lib/admin-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { AIEmbeddingsClient } from "./AIEmbeddingsClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function AIEmbeddingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value ?? (await getServiceToken());
  return loadOrBanner(
    () => getAIEmbeddingStats(token),
    stats => (<AIEmbeddingsClient stats={stats} />),
  );
}
