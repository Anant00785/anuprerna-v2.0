/**
 * /listings/custom — Custom Products list (Server Component).
 *
 * Read-only surface for the made-to-spec custom PRODUCT catalogue entity
 * (live: manage-product/manage-custom-product). Distinct from custom ORDERS
 * (/artisanflow/custom-orders). Fetches the full list server-side via the
 * admin-gated wrapper endpoint, then hands the rows to a client table that
 * mirrors the live list (search + paginate). All live mutations
 * (Add Product / edit) render visibly DISABLED — the sandbox is read-only.
 */

import React from "react";
import { getCustomProductList } from "@/lib/custom-products-api";
import { CustomProductsClient } from "./CustomProductsClient";

export const dynamic = "force-dynamic";

export default async function CustomProductsPage() {
  const result = await getCustomProductList();
  return (
    <CustomProductsClient
      rows={result.ok ? result.data : []}
      error={result.ok ? null : result.error}
    />
  );
}
