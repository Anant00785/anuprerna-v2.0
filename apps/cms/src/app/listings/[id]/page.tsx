/**
 * /listings/[id] — Product Edit page (Server Component, Phase C)
 *
 * `id` is the top-level preview-record id (matches ListingRow.id used by the
 * Phase B listing links). An optional `?type=fabric|finished` query param
 * removes the fabric/finished id-collision ambiguity; without it we try
 * fabric first then finished.
 *
 * Loads the full product envelope (required) and the reference dropdown lists
 * (best-effort — token-gated; on a miss the form seeds selects from the
 * product's own embedded taxonomy objects). Writes persist to the sandbox
 * Postgres copy via the wrapper (never live Loom).
 */

import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Button } from "@/components/ui";
import { getProduct, loadReferenceData, getStoryMappingDetail, getStoriesByType } from "@/lib/api";
import type { StoryMappingDetail, StoryOption } from "@/lib/api";
import type { ProductType } from "@/types/product";
import { ProductEditForm } from "./ProductEditForm";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function ListingEditPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { type } = await searchParams;
  const numericId = Number(id);

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  // Caller session token: forwarded to the wrapper for the Loom-proxied
  // reference lists; public native product reads ignore it.
  const token = cookieToken;

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
    return (
      <NotFound
        id={id}
        reason="No fabric or finished product matched this id."
      />
    );
  }

  // Cluster & Craft traceability — best-effort (never fail the page on a miss).
  let storyMapping: StoryMappingDetail | null = null;
  let craftOptions: StoryOption[] = [];
  let clusterOptions: StoryOption[] = [];
  try {
    [storyMapping, craftOptions, clusterOptions] = await Promise.all([
      getStoryMappingDetail(numericId, token),
      getStoriesByType("CRAFTS", token),
      getStoriesByType("CLUSTERS", token),
    ]);
  } catch {
    // story-mapping is best-effort; leave nulls and the section renders nothing.
  }

  return (
    <ProductEditForm
      envelope={envelope}
      reference={reference}
      previewId={numericId}
      storyMapping={storyMapping}
      craftOptions={craftOptions}
      clusterOptions={clusterOptions}
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
          <span className="font-medium" style={{ color: "#1A1714" }}>#{id}</span>
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
          <Button variant="secondary" size="sm">← Back to Listings</Button>
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
