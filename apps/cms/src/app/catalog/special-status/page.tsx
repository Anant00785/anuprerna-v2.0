import React from "react";
import { cookies } from "next/headers";
import { getSpecialStatusList } from "@/lib/catalog-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { SimpleItemCrud } from "@/components/catalog/SimpleItemCrud";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function SpecialStatusPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? await getServiceToken();
  return loadOrBanner(
    () => getSpecialStatusList(token),
    items => (
      <SimpleItemCrud
        title="Special Status"
        description="Labels that mark products with a promotional or editorial distinction (e.g. New Arrival, Bestseller, Limited Edition)."
        entitySingular="Special Status"
        breadcrumbSection="Special Status"
        breadcrumbHref="/catalog/special-status"
        items={items}
        writeEndpoint="/add/special-status"
        updateEndpoint="/update/special-status"
        deleteEndpoint="/delete/special-status"
      />
    ),
  );
}
