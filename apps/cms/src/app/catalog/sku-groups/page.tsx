import React from "react";
import { cookies } from "next/headers";
import { getSkuGroupList } from "@/lib/catalog-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { SimpleItemCrud } from "@/components/catalog/SimpleItemCrud";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function SkuGroupsPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? await getServiceToken();
  return loadOrBanner(
    () => getSkuGroupList(token),
    items => (
      <SimpleItemCrud
        title="SKU Groups"
        description="Group related SKUs under a shared name for consistent catalogue navigation."
        entitySingular="SKU Group"
        breadcrumbSection="SKU Groups"
        breadcrumbHref="/catalog/sku-groups"
        items={items}
        writeEndpoint="/add/sku-group"
        updateEndpoint="/update/sku-group"
        deleteEndpoint="/delete/sku-group"
      />
    ),
  );
}
