/**
 * /impact/[id] — Per-order impact detail (Server Component).
 *
 * Fetches the impact detail for a single order via getImpactDetail() (see
 * ./data.ts) — a direct server-side call to the wrapper's
 * /get/impact/order/{id} with getLiveLoomToken auth (the sandbox admin token
 * is rejected by this live-proxied endpoint).
 *
 * Render contract:
 *   - Invalid / non-numeric id → ErrorBanner inside WeaveShell (no crash)
 *   - Fetch error              → ErrorBanner inside WeaveShell with the message
 *   - 404 / empty impact       → Next.js notFound() (404 page)
 *   - Success                  → <ImpactDetailView> with the data
 *
 * Read-only — no mutations.
 */

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImpactDetail } from './data';
import { WeaveShell } from '@/components/weave/WeaveShell';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ImpactDetailView } from './ImpactDetailView';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function Breadcrumb({ id }: { id: string }) {
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: '#847D77' }}>
      <Link href="/impact" style={{ color: '#847D77' }} className="hover:underline">
        Impact Factor
      </Link>
      <span>/</span>
      <span className="font-medium" style={{ color: '#1A1714' }}>
        Order #{id}
      </span>
    </div>
  );
}

export default async function ImpactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  // Guard against bogus ids — renders an error banner, never crashes
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return (
      <WeaveShell breadcrumb={<Breadcrumb id={id} />}>
        <div className="max-w-2xl space-y-4">
          <ErrorBanner message={`"${id}" is not a valid order id.`} />
          <Link
            href="/impact"
            className="inline-block text-sm hover:underline"
            style={{ color: '#847D77' }}
          >
            ← Back to Impact Factor
          </Link>
        </div>
      </WeaveShell>
    );
  }

  const result = await getImpactDetail(id);

  if (!result.ok) {
    return (
      <WeaveShell breadcrumb={<Breadcrumb id={id} />}>
        <div className="max-w-2xl space-y-4">
          <ErrorBanner message={result.error} />
          <Link
            href="/impact"
            className="inline-block text-sm hover:underline"
            style={{ color: '#847D77' }}
          >
            ← Back to Impact Factor
          </Link>
        </div>
      </WeaveShell>
    );
  }

  // result.data is the ImpactDetail (items may be empty — that's valid, not 404)
  return <ImpactDetailView impact={result.data} id={id} />;
}
