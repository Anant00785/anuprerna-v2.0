/**
 * GET /api/artisans/[id]
 *
 * Single-artisan detail (normalized), plus its relational context — the workers
 * in a master's cluster, or the master a worker belongs to. Read-only proxy over
 * Loom /get/artisan/{id} (+ /get/artisan/{id}/workers). No writes.
 *
 * Response: { artisan: ArtisanRow | null, workers?: ArtisanRow[], master?: ArtisanRow | null }
 * A bogus id resolves to { artisan: null } with 404. The server page renders its
 * own view; this route exists as the standalone client-accessible endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getArtisanById,
  getWorkersOfMaster,
  getMasterArtisan,
} from "@/lib/artisans-api";
import { getBackendCallToken } from "@/lib/backend-call-token";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json(
      { error: "Invalid artisan id.", artisan: null },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);

  try {
    const artisan = await getArtisanById(numericId, token);
    if (!artisan) {
      return NextResponse.json({ artisan: null }, { status: 404 });
    }

    if (artisan.artisanRole === "MASTER") {
      const workers = await getWorkersOfMaster(artisan.id, token);
      return NextResponse.json({
        artisan,
        workers: workers.ok ? workers.data : [],
        workersError: workers.ok ? undefined : workers.error,
      });
    }

    if (artisan.artisanRole === "WORKER" && artisan.masterArtisanId != null) {
      const master = await getMasterArtisan(artisan.masterArtisanId, token);
      return NextResponse.json({
        artisan,
        master: master.ok ? master.data : null,
        masterError: master.ok ? undefined : master.error,
      });
    }

    return NextResponse.json({ artisan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, artisan: null }, { status: 500 });
  }
}
