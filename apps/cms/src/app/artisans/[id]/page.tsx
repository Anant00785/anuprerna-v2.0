/**
 * /artisans/[id] — Artisan detail (Server Component).
 *
 * Faithful read-only port of the live Angular `artisan-detail.component`
 * (manage-artisans/artisan-detail). Fetches a single artisan by numeric id via
 * `/get/artisan/{id}`, plus its relational context: the workers in a master's
 * cluster (`/get/artisan/{id}/workers`) or the master a worker reports to.
 *
 * Read-only view — the live "Edit Artisan" control is replaced by a disabled
 * Read-only badge. A bogus id renders a clean not-found (never a broken page).
 */

import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  getArtisanById,
  getWorkersOfMaster,
  getMasterArtisan,
} from "@/lib/artisans-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Button } from "@/components/ui";
import { ArtisanDetailView } from "./ArtisanDetailView";
import type { ArtisanRow } from "@/types/artisan";
import type { ArtisanDetail } from "@/lib/artisans-api";
import type { Result } from "@/lib/result";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtisanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return <NotFound id={id} reason="Invalid artisan id." />;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

  let artisan: ArtisanDetail | null;
  try {
    artisan = await getArtisanById(numericId, token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return <LoadError message={message} />;
  }

  if (!artisan) {
    return <NotFound id={id} reason="No artisan matched this id." />;
  }

  // Relational context — Result-wrapped so a Loom outage renders an ErrorBanner
  // in-section, never a misleading empty cluster.
  let workers: Result<ArtisanRow[]> | undefined;
  let master: Result<ArtisanDetail | null> | undefined;
  if (artisan.artisanRole === "MASTER") {
    workers = await getWorkersOfMaster(artisan.id, token);
  } else if (artisan.artisanRole === "WORKER" && artisan.masterArtisanId != null) {
    master = await getMasterArtisan(artisan.masterArtisanId, token);
  }

  return <ArtisanDetailView artisan={artisan} workers={workers} master={master} />;
}

function NotFound({ id, reason }: { id: string; reason: string }) {
  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/artisans" style={{ color: "#847D77" }}>Artisans</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>#{id}</span>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
          Artisan not found
        </h1>
        <div
          className="rounded-xl border px-5 py-4 text-sm"
          style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
        >
          {reason}
        </div>
        <Link href="/artisans">
          <Button variant="secondary" size="sm">← Back to Artisans</Button>
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
        <p className="font-semibold mb-1">Failed to load artisan</p>
        <p style={{ color: "#B45309" }}>{message}</p>
      </div>
    </div>
  );
}
