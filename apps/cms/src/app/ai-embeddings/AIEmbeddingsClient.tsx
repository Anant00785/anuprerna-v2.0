"use client";

import React from "react";
import { Brain, RefreshCw } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { formatEpoch, formatCount } from "@/lib/utils";
import type { AIEmbeddingStats } from "@/lib/admin-api";

type Tone = "healthy" | "watch" | "warn" | "neutral";

interface StatCardProps {
  label: string;
  value: string;
  tone?: Tone;
}

function StatCard({ label, value, tone = "neutral" }: StatCardProps) {
  const styles: Record<Tone, { bg: string; color: string }> = {
    healthy: { bg: "#F0FDF4", color: "#15803D" },
    watch:   { bg: "#FFFBEB", color: "#92400E" },
    warn:    { bg: "#FEF2F2", color: "#DC2626" },
    neutral: { bg: "#FAF9F7", color: "#1A1714" },
  };
  const s = styles[tone];
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "#E8E4DE", background: s.bg }}>
      <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "#847D77" }}>{label}</div>
      <div className="text-2xl font-semibold" style={{ color: s.color }}>{value}</div>
    </div>
  );
}

interface AIEmbeddingsClientProps {
  stats: AIEmbeddingStats | null;
}

export function AIEmbeddingsClient({ stats }: AIEmbeddingsClientProps) {
  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Operations</span><span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>AI Embeddings</span>
    </div>
  );

  if (!stats) {
    return (
      <WeaveShell breadcrumb={breadcrumb}>
        <div className="py-12 text-center text-sm" style={{ color: "#847D77" }}>
          Could not load embedding stats. The backend may be unavailable.
        </div>
      </WeaveShell>
    );
  }

  const coverageTone: Tone = stats.coveragePercent >= 99 ? "healthy" : stats.coveragePercent >= 90 ? "watch" : "warn";
  const cleanupTone: Tone = stats.orphanVectors === 0 && stats.disabledStaleVectors === 0 ? "healthy" : "watch";
  const metaTone: Tone = stats.productsWithIncompleteMetadata === 0 ? "healthy" : stats.productsWithIncompleteMetadata < 50 ? "watch" : "warn";

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>AI Embeddings</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Vector index health · last reindex {stats.lastSuccessfulReindexTime ? formatEpoch(stats.lastSuccessfulReindexTime) : "unknown"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => window.location.reload()}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors hover:bg-stone-50"
              style={{ borderColor: "#E8E4DE", color: "#635D58" }}
            >
              <RefreshCw className="h-3.5 w-3.5" />Refresh
            </button>
            <Brain className="h-6 w-6" style={{ color: "#A86120" }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            coverageTone === "healthy" ? "bg-emerald-50 text-emerald-700" :
            coverageTone === "watch" ? "bg-amber-100 text-amber-800" : "bg-red-50 text-red-700"
          }`}>
            Coverage {coverageTone === "healthy" ? "✓ healthy" : coverageTone === "watch" ? "⚠ watch" : "✗ gap"}
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            cleanupTone === "healthy" ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"
          }`}>
            Cleanup {cleanupTone === "healthy" ? "✓ clean" : "⚠ needed"}
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            metaTone === "healthy" ? "bg-emerald-50 text-emerald-700" :
            metaTone === "watch" ? "bg-amber-100 text-amber-800" : "bg-red-50 text-red-700"
          }`}>
            Metadata {metaTone === "healthy" ? "✓ strong" : metaTone === "watch" ? "⚠ watch" : "✗ weak"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Embeddings" value={formatCount(stats.totalEmbeddings)} />
          <StatCard label="Enabled Products" value={formatCount(stats.enabledProducts)} />
          <StatCard label="Missing" value={formatCount(stats.missingEmbeddings)} tone={stats.missingEmbeddings === 0 ? "healthy" : "warn"} />
          <StatCard label="Coverage %" value={`${stats.coveragePercent.toFixed(1)}%`} tone={coverageTone} />
          <StatCard label="Stale Disabled" value={formatCount(stats.disabledStaleVectors)} tone={stats.disabledStaleVectors === 0 ? "healthy" : "watch"} />
          <StatCard label="Orphan Vectors" value={formatCount(stats.orphanVectors)} tone={stats.orphanVectors === 0 ? "healthy" : "watch"} />
        </div>

        <div>
          <h2 className="font-semibold text-base mb-3" style={{ color: "#1A1714" }}>Readiness</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Without Tags" value={formatCount(stats.productsWithoutTags)} tone={stats.productsWithoutTags === 0 ? "healthy" : "watch"} />
            <StatCard label="Missing Meta Desc" value={formatCount(stats.productsMissingMetaDescription)} tone={stats.productsMissingMetaDescription === 0 ? "healthy" : stats.productsMissingMetaDescription < 50 ? "watch" : "warn"} />
            <StatCard label="Missing Taxonomy" value={formatCount(stats.productsMissingTaxonomyOrFilters)} tone={stats.productsMissingTaxonomyOrFilters === 0 ? "healthy" : "warn"} />
            <StatCard label="Incomplete Metadata" value={formatCount(stats.productsWithIncompleteMetadata)} tone={metaTone} />
            <StatCard label="Tag Coverage %" value={`${stats.tagCoveragePercent.toFixed(1)}%`} tone={stats.tagCoveragePercent >= 70 ? "healthy" : stats.tagCoveragePercent >= 50 ? "watch" : "warn"} />
          </div>
        </div>

        {stats.groupStats.length > 0 && (
          <div>
            <h2 className="font-semibold text-base mb-3" style={{ color: "#1A1714" }}>Coverage by Product Group</h2>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#E8E4DE" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "#FAF9F7" }}>
                    {["Group", "Enabled", "Embeddings", "Missing", "Coverage%", "Tag Coverage%", "Missing Meta"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "#847D77" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.groupStats.map((g, i) => (
                    <tr key={g.productGroup} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FAF9F7" }}>
                      <td className="px-3 py-2 font-medium" style={{ color: "#1A1714" }}>{g.productGroup}</td>
                      <td className="px-3 py-2" style={{ color: "#635D58" }}>{formatCount(g.enabledProducts)}</td>
                      <td className="px-3 py-2" style={{ color: "#635D58" }}>{formatCount(g.embeddings)}</td>
                      <td className="px-3 py-2" style={{ color: g.missingEmbeddings > 0 ? "#DC2626" : "#635D58" }}>{formatCount(g.missingEmbeddings)}</td>
                      <td className="px-3 py-2" style={{ color: "#635D58" }}>{g.coveragePercent.toFixed(1)}%</td>
                      <td className="px-3 py-2" style={{ color: "#635D58" }}>{g.tagCoveragePercent.toFixed(1)}%</td>
                      <td className="px-3 py-2" style={{ color: g.productsMissingMetaDescription > 0 ? "#92400E" : "#635D58" }}>{formatCount(g.productsMissingMetaDescription)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stats.issueProducts.length > 0 ? (
          <div>
            <h2 className="font-semibold text-base mb-3" style={{ color: "#1A1714" }}>Issue Candidates</h2>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#E8E4DE" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "#FAF9F7" }}>
                    {["SKU", "Name", "Group", "Issues", "Summary"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "#847D77" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.issueProducts.map((p, i) => (
                    <tr key={p.productId} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FAF9F7" }}>
                      <td className="px-3 py-2 font-mono" style={{ color: "#635D58" }}>{p.sku}</td>
                      <td className="px-3 py-2 max-w-xs truncate" style={{ color: "#1A1714" }} title={p.name}>{p.name}</td>
                      <td className="px-3 py-2" style={{ color: "#635D58" }}>{p.productGroup}</td>
                      <td className="px-3 py-2 text-center font-semibold" style={{ color: "#DC2626" }}>{p.issueCount}</td>
                      <td className="px-3 py-2 max-w-sm truncate" style={{ color: "#635D58" }} title={p.issueSummary}>{p.issueSummary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "#BBF7D0", background: "#F0FDF4", color: "#15803D" }}>
            ✓ No issue products — embedding health is clean.
          </div>
        )}
      </div>
    </WeaveShell>
  );
}
