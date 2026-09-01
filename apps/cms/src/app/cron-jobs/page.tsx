import React from "react";
import { cookies } from "next/headers";
import { getCronLogs } from "@/lib/admin-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { CronJobsClient } from "./CronJobsClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function CronJobsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value ?? (await getServiceToken());
  const logs = await getCronLogs(token);
  return <CronJobsClient logs={logs} />;
}
