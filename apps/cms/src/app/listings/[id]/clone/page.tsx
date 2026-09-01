/**
 * /listings/[id]/clone — Clone an existing product into a NEW listing.
 *
 * Feedback a83db56c: "need the clone option to add new listing." The create
 * API already accepts a full listing payload, so cloning is pure reuse: load
 * the source product envelope (same as the edit route), STRIP the identity
 * fields that must stay unique (top-level id/version, product id, SKU, Zoho
 * item refs + per-variant SKUs, size-profile row ids, gallery image ids,
 * backward-compatible link), pre-fill the SAME ProductEditForm in `create`
 * mode, and let the user tweak + save. On submit the form POSTs
 * /api/product/create -> wrapper /add/... -> sandbox Postgres (new id >= 1e9,
 * NEVER live Loom). All copied fields (title, category, fabric, price, images,
 * materials, colours, profiles, care/overview, gsm/width...) arrive editable.
 */

import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Button } from "@/components/ui";
import { getProduct, loadReferenceData } from "@/lib/api";
import type { ProductType, ProductEnvelope, LoadedProduct } from "@/types/product";
import { ProductEditForm } from "../ProductEditForm";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

// Strip every identity/unique field so the create validator treats the copy as
// brand new. Copied VALUES (images, price, taxonomy, profiles) are preserved --
// only the identifiers that must be unique or server-allocated are cleared.
function toClonedEnvelope(env: ProductEnvelope): ProductEnvelope {
  const src = env.product;
  const clonedProduct: LoadedProduct = {
    ...src,
    id: undefined,
    version: undefined,
    sku: "",
    slug: undefined,
    backwardCompatibleLink: undefined,
    // pre-fill a distinct name (name must be unique); user edits before save
    name: src.name ? `Copy of ${src.name}` : src.name,
    // per-variant Zoho rows: keep the shape but clear the unique identifiers
    productZohoRelationList: (src.productZohoRelationList ?? []).map((r) => ({
      ...r,
      id: undefined,
      sku: "",
      zohoItemId: "",
    })),
    // size-profile rows: clear row id + per-row sku, keep option + quantity
    productSizeProfileList: (src.productSizeProfileList ?? []).map((r) => ({
      ...r,
      id: undefined,
      sizeProfileOptionSku: undefined,
    })),
    // gallery images: keep the image URL + alt, drop the persisted row id
    imageGallerySEOList: (src.imageGallerySEOList ?? []).map((g) => ({
      ...g,
      id: undefined,
    })),
  };

  if (env.type === "fabric") {
    return {
      type: "fabric",
      id: 0,
      version: 0,
      gsm: env.gsm,
      addToSwatch: env.addToSwatch,
      width: env.width,
      product: clonedProduct,
    };
  }
  return { type: "finished", id: 0, version: 0, product: clonedProduct };
}

export default async function CloneListingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { type } = await searchParams;
  const numericId = Number(id);

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  const requestedType: ProductType | undefined =
    type === "fabric" || type === "finished" ? type : undefined;

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return <NotFound id={id} reason="Invalid product id." />;
  }

  let envelope;
  let reference;
  try {
    [envelope, reference] = await Promise.all([
      getProduct(numericId, requestedType, token),
      loadReferenceData(token),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return <LoadError message={message} />;
  }

  if (!envelope) {
    return <NotFound id={id} reason="No fabric or finished product matched this id." />;
  }

  return (
    <ProductEditForm
      envelope={toClonedEnvelope(envelope)}
      reference={reference}
      previewId={0}
      mode="create"
    />
  );
}

function NotFound({ id, reason }: { id: string; reason: string }) {
  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/listings" style={{ color: "#847D77" }}>Listings</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>Clone #{id}</span>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
          Product not found
        </h1>
        <div
          className="rounded-xl border px-5 py-4 text-sm"
          style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
        >
          {reason}
        </div>
        <Link href="/listings">
          <Button variant="secondary" size="sm">Back to Listings</Button>
        </Link>
      </div>
    </WeaveShell>
  );
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div
        className="rounded-xl border px-6 py-5 max-w-lg text-sm"
        style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
      >
        <p className="font-semibold mb-1">Failed to load product</p>
        <p style={{ color: "#B45309" }}>{message}</p>
      </div>
    </div>
  );
}
