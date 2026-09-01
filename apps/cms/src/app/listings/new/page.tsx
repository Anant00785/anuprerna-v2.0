/**
 * /listings/new — Create a product (Server Component).
 *
 * ?type=fabric|finished (default fabric) selects the product kind — mirrors the
 * /listings/[id] edit route's ?type disambiguation. Loads the reference dropdown
 * lists (token-gated; required here since a brand-new product has no embedded
 * taxonomy to seed the selects from) and renders the SAME faithful
 * ProductEditForm used for editing, in create mode with an empty/default
 * envelope. On submit the form POSTs /api/product/create -> wrapper /add/... ->
 * sandbox Postgres (new id in the >= 1e9 band, NEVER live Loom).
 */
import React from "react";
import { cookies } from "next/headers";
import { loadReferenceData } from "@/lib/api";
import type { ProductType, ProductEnvelope } from "@/types/product";
import { ProductEditForm } from "../[id]/ProductEditForm";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

function emptyEnvelope(type: ProductType): ProductEnvelope {
  if (type === "fabric") {
    return {
      type: "fabric", id: 0, version: 0,
      gsm: 0, addToSwatch: false, width: "",
      product: { productGroup: "fabric" },
    };
  }
  return {
    type: "finished", id: 0, version: 0,
    product: { productGroup: "finished" },
  };
}

export default async function NewListingPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const productType: ProductType = type === "finished" ? "finished" : "fabric";

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Reference lists power the required Category/Segment/Sub-category/SKU-group/
  // Materials/Colors selects. Best-effort: an unauthenticated miss yields empty
  // lists (the form still renders; those required selects just have no options).
  const reference = await loadReferenceData(token);

  return (
    <ProductEditForm
      envelope={emptyEnvelope(productType)}
      reference={reference}
      previewId={0}
      mode="create"
    />
  );
}
