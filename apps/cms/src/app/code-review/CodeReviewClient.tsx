"use client";

/**
 * CodeReviewClient.tsx — the Code Review dashboard table.
 *
 * Lists open GitHub PRs (server-fetched, refreshable), their AI-review
 * confidence / security verdict, and lets the owner enqueue a review ("Run
 * review") or MANUALLY squash-merge a green PR. All mutations go through the
 * same-origin /api/pr-review/* proxy routes (admin token injected server-side).
 *
 * Uses the shared DataList (expandable rows for the findings drawer), Badge,
 * Button, and the shared ErrorBanner (a backend/gh/DB outage renders the banner,
 * never a misleading empty "no open PRs" table).
 */

import React, { useMemo, useState } from "react";
import { RefreshCw, ExternalLink, GitPullRequest } from "lucide-react";
import { DataList, type DataListColumn } from "@/components/ui/DataList";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { PrReviewRow } from "@/lib/pr-review-api";

interface Props {
  initialRows: PrReviewRow[];
  initialError: string | null;
  initialSyncErrors: { repo: string; error: string }[];
}

const shortRepo = (repo: string) => repo.replace(/^anuprerna-/, "");

function confidenceBadge(conf: number | null): React.ReactNode {
  if (conf == null) return <Badge variant="stone">—</Badge>;
  if (conf >= 4) return <Badge variant="green">{conf}/5</Badge>;
  if (conf === 3) return <Badge variant="amber">{conf}/5</Badge>;
  return <Badge variant="red">{conf}/5</Badge>;
}

function securityCell(verdict: string | null): React.ReactNode {
  if (verdict === "clean") return <span title="clean" style={{ color: "#059669" }}>✅ clean</span>;
  if (verdict === "flagged") return <span title="flagged" style={{ color: "#B45309" }}>⚠️ flagged</span>;
  return <span style={{ color: "#AAA39E" }}>—</span>;
}

function statusBadge(status: string): React.ReactNode {
  switch (status) {
    case "reviewed":  return <Badge variant="green">Reviewed</Badge>;
    case "reviewing": return <Badge variant="blue">Reviewing</Badge>;
    case "pending":   return <Badge variant="amber">Pending</Badge>;
    default:          return <Badge variant="stone">Not reviewed</Badge>;
  }
}

export function CodeReviewClient({ initialRows, initialError, initialSyncErrors }: Props) {
  const [rows, setRows] = useState<PrReviewRow[]>(initialRows);
  const [error, setError] = useState<string | null>(initialError);
  const [syncErrors, setSyncErrors] = useState<{ repo: string; error: string }[]>(initialSyncErrors);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const rowKey = (r: PrReviewRow) => `${r.repo}#${r.prNumber}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.title, r.repo, r.author ?? "", String(r.prNumber)].some((s) => s.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  async function refresh() {
    setRefreshing(true);
    setNotice(null);
    try {
      const res = await fetch("/api/pr-review/list", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setError(data?.error ?? `Refresh failed (${res.status})`);
      } else {
        setError(null);
        setRows(Array.isArray(data.prReviews) ? data.prReviews.map(normalize) : []);
        setSyncErrors(Array.isArray(data.syncErrors) ? data.syncErrors : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function runReview(r: PrReviewRow) {
    const k = rowKey(r);
    setBusy((b) => ({ ...b, [k]: true }));
    setNotice(null);
    try {
      const res = await fetch("/api/pr-review/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: r.repo, pr_number: r.prNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(`Could not queue review: ${data?.message ?? res.status}`);
      } else {
        setRows((prev) => prev.map((x) => (rowKey(x) === k ? { ...x, status: "pending" } : x)));
        setNotice(`Queued PR #${r.prNumber} (${shortRepo(r.repo)}) for review.`);
      }
    } catch {
      setNotice("Could not queue review: backend unreachable.");
    } finally {
      setBusy((b) => ({ ...b, [k]: false }));
    }
  }

  async function merge(r: PrReviewRow) {
    const k = rowKey(r);
    if (!confirm(`Squash-merge PR #${r.prNumber} in ${shortRepo(r.repo)}?\n\n${r.title}`)) return;
    setBusy((b) => ({ ...b, [k]: true }));
    setNotice(null);
    try {
      const res = await fetch("/api/pr-review/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: r.repo, pr_number: r.prNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(`Merge failed: ${data?.message ?? res.status}`);
      } else {
        setNotice(`Merged PR #${r.prNumber} (${shortRepo(r.repo)}). Refreshing…`);
        await refresh();
      }
    } catch {
      setNotice("Merge failed: backend unreachable.");
    } finally {
      setBusy((b) => ({ ...b, [k]: false }));
    }
  }

  const columns: DataListColumn<PrReviewRow>[] = [
    {
      key: "pr",
      label: "PR",
      render: (r) =>
        r.url ? (
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium hover:underline"
            style={{ color: "#A86120" }}
          >
            #{r.prNumber}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="font-medium">#{r.prNumber}</span>
        ),
    },
    {
      key: "title",
      label: "Title",
      render: (r) => <span className="text-stone-800">{r.title || "—"}</span>,
      cellClassName: "max-w-sm truncate",
    },
    { key: "repo", label: "Repo", render: (r) => <span className="text-stone-600">{shortRepo(r.repo)}</span> },
    { key: "author", label: "Author", render: (r) => <span className="text-stone-600">{r.author ?? "—"}</span> },
    {
      key: "size",
      label: "Size",
      render: (r) => (
        <span className="whitespace-nowrap text-xs">
          <span style={{ color: "#059669" }}>+{r.additions}</span>{" "}
          <span style={{ color: "#DC2626" }}>−{r.deletions}</span>{" "}
          <span style={{ color: "#847D77" }}>· {r.changedFiles}f</span>
        </span>
      ),
    },
    { key: "confidence", label: "Confidence", render: (r) => confidenceBadge(r.confidence) },
    { key: "security", label: "Security", render: (r) => securityCell(r.securityVerdict) },
    { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
    {
      key: "actions",
      label: "Actions",
      render: (r) => {
        const k = rowKey(r);
        const isBusy = !!busy[k];
        const canMerge = r.status === "reviewed" && r.confidence != null;
        const reviewing = r.status === "pending" || r.status === "reviewing";
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              loading={isBusy}
              disabled={isBusy || reviewing}
              onClick={() => runReview(r)}
            >
              {reviewing ? "Queued" : "Run review"}
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={isBusy}
              disabled={isBusy || !canMerge}
              title={canMerge ? "Squash-merge this PR" : "Merge unlocks once the review is complete"}
              onClick={() => merge(r)}
            >
              Merge
            </Button>
          </div>
        );
      },
    },
  ];

  const renderFindings = (r: PrReviewRow): React.ReactNode => {
    if (r.status !== "reviewed") {
      return (
        <div className="py-4 text-sm" style={{ color: "#847D77" }}>
          No review yet. Click <span className="font-medium">Run review</span> to queue this PR for the AI reviewer.
        </div>
      );
    }
    const findings = r.findings ?? [];
    return (
      <div className="py-4">
        <div className="mb-2 flex items-center gap-3 text-sm">
          <span className="font-semibold text-stone-700">AI review</span>
          {confidenceBadge(r.confidence)}
          {securityCell(r.securityVerdict)}
          {r.reviewedAt ? (
            <span className="text-xs" style={{ color: "#AAA39E" }}>
              reviewed {new Date(r.reviewedAt).toLocaleString("en-IN")}
            </span>
          ) : null}
        </div>
        {findings.length === 0 ? (
          <div className="text-sm" style={{ color: "#847D77" }}>No findings recorded.</div>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            {findings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitPullRequest className="h-5 w-5" style={{ color: "#A86120" }} />
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Code Review</h1>
            <p className="text-sm" style={{ color: "#847D77" }}>
              Open pull requests across cms · backend · storefront
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" loading={refreshing} onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Outage banner (never render an error as an empty table) */}
      {error ? <ErrorBanner message={error} /> : null}

      {/* Partial-sync warning (some repos synced, some failed) */}
      {!error && syncErrors.length > 0 ? (
        <div
          role="alert"
          className="rounded-lg border px-4 py-2 text-sm"
          style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
        >
          Some repos could not sync: {syncErrors.map((e) => `${shortRepo(e.repo)} (${e.error})`).join("; ")}
        </div>
      ) : null}

      {/* Action notice */}
      {notice ? (
        <div className="rounded-lg border px-4 py-2 text-sm" style={{ background: "#F4FAF6", borderColor: "#CDEBD8", color: "#1F7A44" }}>
          {notice}
        </div>
      ) : null}

      <DataList<PrReviewRow>
        data={filtered}
        columns={columns}
        getId={rowKey}
        total={filtered.length}
        page={1}
        pageSize={200}
        onSearch={setSearch}
        searchPlaceholder="Search PRs by title, repo, author…"
        emptyMessage={error ? "Could not load pull requests." : "No open pull requests right now."}
        expandable={renderFindings}
      />
    </div>
  );
}

/** Normalize a raw backend row (camelCase already) to PrReviewRow shape. */
function normalize(r: Record<string, unknown>): PrReviewRow {
  const rec = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
  const o = rec(r);
  return {
    id: String(o.id ?? ""),
    repo: String(o.repo ?? ""),
    prNumber: Number(o.prNumber ?? 0),
    title: String(o.title ?? ""),
    author: o.author == null ? null : String(o.author),
    additions: Number(o.additions ?? 0),
    deletions: Number(o.deletions ?? 0),
    changedFiles: Number(o.changedFiles ?? 0),
    url: o.url == null ? null : String(o.url),
    status: String(o.status ?? "new"),
    confidence: o.confidence == null ? null : Number(o.confidence),
    securityVerdict: o.securityVerdict == null ? null : String(o.securityVerdict),
    findings: Array.isArray(o.findings) ? (o.findings as unknown[]).map(String) : null,
    reviewedAt: o.reviewedAt == null ? null : new Date(String(o.reviewedAt)).getTime(),
  };
}
