import React from "react";
import { cookies } from "next/headers";
import { getCronLogs } from "@/lib/admin-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { CronJobsClient } from "./CronJobsClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function CronJobsPage() {
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE)?.value);
  return loadOrBanner(
    () => getCronLogs(token),
    logs => (<CronJobsClient logs={logs} />),
  );
}
