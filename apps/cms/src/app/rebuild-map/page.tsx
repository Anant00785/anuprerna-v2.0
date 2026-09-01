/**
 * /rebuild-map — the Loom (SpringBoot/Java) → NestJS rebuild coverage board.
 *
 * 100% generated from real code by the backend scanners (backend/rebuild-map/*).
 * Nothing here is hand-written, so it cannot go stale: every endpoint count is
 * the actual Loom REST surface, and every "converted" flag is a NestJS route we
 * really serve — the test-green ones are proven by `npm test`.
 *
 * Server component: fetches the generated JSON via our own /api/rebuild-map
 * route (which reads the on-disk JSON by absolute path) so the KPI numbers are
 * in the SSR HTML. The collapsible module list is a client child.
 */
import React from "react";
import { headers } from "next/headers";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { KpiStrip, KpiItem } from "@/components/ui";
import { Layers, GitBranch, CheckCircle, Boxes } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { RebuildMapModules, type RebuildModule } from "./RebuildMapClient";

export const dynamic = "force-dynamic";

interface MapData {
  generatedAt: string;
  test: { passed: number; failed: number; ok: boolean };
  totals: {
    loomEndpoints: number;
    native: number;
    passthrough: number;
    testGreen?: number;
    nativeInGreenSuite?: number;
    tested?: number;
    nativeRoutesServed: number;
  };
  moduleCount: number;
  modules: RebuildModule[];
  error?: string;
  message?: string;
}

async function loadMap(): Promise<MapData | { error: string; message: string }> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3010";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${proto}://${host}/api/rebuild-map`, {
    cache: "no-store",
    // Forward the caller's session cookie: this is a server→self fetch and the
    // middleware gates /api/* — without the cookie it 401s ("Session required").
    headers: { cookie: h.get("cookie") ?? "" },
  });
  return res.json();
}

export default async function RebuildMapPage() {
  const data = (await loadMap()) as MapData;

  if (!data || data.error || !data.totals) {
    return (
      <WeaveShell breadcrumb={<span>Rebuild Map</span>}>
        <div className="rounded-xl border bg-white p-8" style={{ borderColor: "#E8E4DE" }}>
          <h1 className="font-serif text-xl font-semibold" style={{ color: "#1A1714" }}>
            Rebuild Map unavailable
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#847D77" }}>
            The generated coverage JSON could not be read. Run the scanners:
            <code className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-xs">
              node backend/rebuild-map/refresh.mjs
            </code>
          </p>
          {data?.message && (
            <p className="mt-2 font-mono text-xs text-red-600">{data.message}</p>
          )}
        </div>
      </WeaveShell>
    );
  }

  const t = data.totals;
  const kpis: KpiItem[] = [
    { label: "Loom endpoints", value: (t.loomEndpoints ?? 0).toLocaleString("en-IN"), icon: <Layers className="h-4 w-4" /> },
    { label: "Converted to NestJS", value: (t.native ?? 0).toLocaleString("en-IN"), icon: <GitBranch className="h-4 w-4" /> },
    { label: "Parity-verified", value: (t.testGreen ?? t.nativeInGreenSuite ?? t.tested ?? 0).toLocaleString("en-IN"), icon: <CheckCircle className="h-4 w-4" /> },
    { label: "Modules", value: (data.moduleCount ?? 0).toLocaleString("en-IN"), icon: <Boxes className="h-4 w-4" /> },
  ];

  const pct = t.loomEndpoints > 0 ? (t.native / t.loomEndpoints) * 100 : 0;

  return (
    <WeaveShell breadcrumb={<span>Rebuild Map</span>}>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
            Loom → NestJS Rebuild Map
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Every endpoint below is read straight from the Loom Java source and our
            NestJS wrapper — generated, never hand-written, so it can&apos;t go stale.
            Regenerate with{" "}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">node backend/rebuild-map/refresh.mjs</code>.
          </p>
        </div>

        <KpiStrip items={kpis} />

        {/* overall coverage bar */}
        <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E4DE" }}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium" style={{ color: "#4A4540" }}>
              Overall conversion coverage
            </span>
            <span style={{ color: "#847D77" }}>
              {t.native} / {t.loomEndpoints} endpoints ({pct.toFixed(1)}%)
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#F1EEE9" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#10B981" }} />
          </div>
          <p className="mt-3 text-xs" style={{ color: "#AAA39E" }}>
            Generated {formatDate(data.generatedAt)} · tests {data.test.passed} passed
            {data.test.failed ? `, ${data.test.failed} failed` : ""} ·{" "}
            {t.passthrough} still proxied to live Loom · {t.nativeRoutesServed} native NestJS routes served
          </p>
        </div>

        <RebuildMapModules modules={data.modules} />
      </div>
    </WeaveShell>
  );
}
