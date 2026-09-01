import React from "react";
import { cookies } from "next/headers";
import { getTableSummaries } from "@/lib/admin-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { TableExplorerClient } from "./TableExplorerClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function TableExplorerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value ?? (await getServiceToken());
  const tables = await getTableSummaries(token);
  return <TableExplorerClient tables={tables} />;
}
