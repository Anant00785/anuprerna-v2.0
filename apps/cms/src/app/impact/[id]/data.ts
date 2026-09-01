/**
 * Server-only data fetcher for /impact/[id].
 *
 * Hits the :8090 wrapper's /get/impact/order/{id} DIRECTLY (no self-fetch back
 * through /api — a server-component self-fetch carries no session cookie, so
 * middleware would 401 it). Same direct-to-backend pattern as the artisan
 * detail (artisans-api.ts) and the user cart drill (users/[id]/cart/data.ts).
 *
 * Auth: getLiveLoomToken() — the /get/impact/* endpoints are transparently
 * proxied to LIVE Loom, which rejects SANDBOX_ADMIN_TOKEN ("credentials
 * tampered"). Read-only — GET only.
 */

import { getLiveLoomToken } from '@/lib/loom-service-token';
import { rewriteBloomscorpUrlsDeep } from '@/lib/media';
import type { Result } from '@/lib/result';
import type { ImpactDetail } from '@/lib/impact-api';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';

export async function getImpactDetail(id: string): Promise<Result<ImpactDetail>> {
  const token = await getLiveLoomToken();
  if (!token) {
    return { ok: false, error: 'Service token unavailable — check LOOM_SERVICE_* env vars' };
  }

  try {
    const res = await fetch(`${BACKEND}/get/impact/order/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'localhost',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const data = rewriteBloomscorpUrlsDeep(await res.json()) as {
      success?: boolean;
      impact?: ImpactDetail;
      message?: string;
    };
    if (!data.success || !data.impact) {
      return { ok: false, error: data.message ?? 'No impact data returned' };
    }
    return { ok: true, data: data.impact };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
