"use client";

/**
 * Feedback dashboard client — a cross-app triage overview.
 *
 * Fetches every feedback row across BOTH apps (weave + storefront) via the
 * same-origin /api/feedback/all proxy, groups them app -> page(route) -> items,
 * and renders each item as a compact one-liner (snippet + status chip + time +
 * image indicator). Items expand for full text/images and owner/submitter
 * edit + resolve + delete controls, wired to /api/feedback/:id (PATCH/DELETE) —
 * the same endpoints the widget uses. Each page group + item links to the page
 * where the widget lets you fix it in context (Weave = same-origin Link;
 * storefront = NEXT_PUBLIC_STOREFRONT_URL + route, new tab).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  Trash2,
  Pencil,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { isAutomated, displayName } from "@/lib/feedback-classify";

type Status = "pending" | "claude_done" | "resolved";
type AppName = "weave" | "storefront";
type StatusFilter = "open" | "pending" | "claude_done" | "resolved" | "all";

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "pending", label: "Pending" },
  { key: "claude_done", label: "✓ Claude" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

// Default filter = "open" (pending + claude_done, i.e. anything not resolved).
function matchesFilter(status: Status, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return status !== "resolved";
  return status === filter;
}

interface FeedbackRow {
  id: string;
  app: AppName;
  route: string;
  pageLabel?: string;
  text: string;
  images: string[];
  submitterName: string;
  submitterEmail: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  /** Optional resolution note set by whoever actioned the item (nullable). */
  response?: string | null;
}

interface Me {
  authenticated: boolean;
  email: string;
  name: string;
  isOwner: boolean;
}

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000";

function relTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 30) return d + "d ago";
  return new Date(ts).toLocaleDateString();
}

function snippet(text: string, n = 80): string {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > n ? one.slice(0, n).trimEnd() + "…" : one;
}

function statusChip(status: Status) {
  if (status === "resolved")
    return <Badge variant="green">resolved</Badge>;
  if (status === "claude_done")
    return <Badge variant="blue">✓ claude</Badge>;
  return <Badge variant="amber">pending</Badge>;
}

interface PageGroup {
  route: string;
  pageLabel: string;
  items: FeedbackRow[];
  openCount: number;
}

function groupByPage(rows: FeedbackRow[]): PageGroup[] {
  const map = new Map<string, PageGroup>();
  for (const r of rows) {
    const key = r.route || "(no route)";
    let g = map.get(key);
    if (!g) {
      g = { route: key, pageLabel: r.pageLabel || key, items: [], openCount: 0 };
      map.set(key, g);
    }
    g.items.push(r);
    if (r.status !== "resolved") g.openCount += 1;
  }
  const groups = Array.from(map.values());
  // Sort items newest-first; groups by open count desc then most-recent activity.
  for (const g of groups) {
    g.items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  groups.sort((a, b) => b.openCount - a.openCount || b.items.length - a.items.length);
  return groups;
}

export default function FeedbackDashboard({ initialMe }: { initialMe: Me }) {
  const [me, setMe] = useState<Me>(initialMe);
  const [weave, setWeave] = useState<FeedbackRow[] | null>(null);
  const [storefront, setStorefront] = useState<FeedbackRow[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [automatedExpanded, setAutomatedExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [bulkBusy, setBulkBusy] = useState<{ done: number; total: number } | null>(null);

  const email = (me?.email || "").toLowerCase();
  const isOwner = !!me?.isOwner;

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/feedback/all", { cache: "no-store" });
      const d = (await r.json()) as {
        weave: FeedbackRow[];
        storefront: FeedbackRow[];
        me: Me;
      };
      if (d.me) setMe(d.me);
      setWeave((d.weave ?? []).map((x) => ({ ...x, app: "weave" as const })));
      setStorefront(
        (d.storefront ?? []).map((x) => ({ ...x, app: "storefront" as const })),
      );
    } catch {
      setWeave([]);
      setStorefront([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  function toggle(id: string) {
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAutomated(key: string) {
    setAutomatedExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function patchStatus(id: string, status: Status) {
    setBusy(id);
    try {
      const r = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      await load();
    } catch (e) {
      alert("Could not update: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit(row: FeedbackRow) {
    if (!editText.trim()) return;
    setBusy(row.id);
    try {
      const r = await fetch(`/api/feedback/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText.trim(), images: row.images ?? [] }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      setEditingId(null);
      setEditText("");
      await load();
    } catch (e) {
      alert("Could not save: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this feedback?")) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      await load();
    } catch (e) {
      alert("Could not delete: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  // Bulk-resolve every currently-filtered, non-resolved HUMAN row (automated
  // rows are never included — see resolvableRows below). Sequential PATCHes
  // to the same /api/feedback/:id endpoint the per-item Resolve button uses;
  // failures are tallied and surfaced as a single summary alert rather than
  // one alert per row.
  async function bulkResolveAll(ids: string[]) {
    if (ids.length === 0) return;
    if (
      !confirm(
        `Resolve ${ids.length} item(s)? This closes them and removes them from the open list.`,
      )
    )
      return;
    setBulkBusy({ done: 0, total: ids.length });
    let failed = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        const r = await fetch(`/api/feedback/${ids[i]}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "resolved" }),
        });
        if (!r.ok) failed += 1;
      } catch {
        failed += 1;
      }
      setBulkBusy({ done: i + 1, total: ids.length });
    }
    setBulkBusy(null);
    await load();
    const succeeded = ids.length - failed;
    if (failed > 0) {
      alert(
        `Resolved ${succeeded} of ${ids.length}; ${failed} failed — you may need to log out/in once.`,
      );
    }
  }

  const allRows = [...(weave ?? []), ...(storefront ?? [])];
  // Human-only open count — automated rows (e.g. Mission Control auto-posted
  // task specs) are excluded from the headline badge; see AUTOMATED_SUBMITTERS.
  const openTotal = allRows.filter(
    (r) => r.status !== "resolved" && !isAutomated(r.submitterName),
  ).length;
  const loading = weave === null || storefront === null;

  // Per-tab counts for the filter row — human rows only, across both apps.
  const humanAllRows = allRows.filter((r) => !isAutomated(r.submitterName));
  const filterCounts: Record<StatusFilter, number> = {
    open: 0,
    pending: 0,
    claude_done: 0,
    resolved: 0,
    all: humanAllRows.length,
  };
  for (const r of humanAllRows) {
    if (r.status !== "resolved") filterCounts.open += 1;
    if (r.status === "pending") filterCounts.pending += 1;
    if (r.status === "claude_done") filterCounts.claude_done += 1;
    if (r.status === "resolved") filterCounts.resolved += 1;
  }

  // Resolvable set for the bulk-resolve button: whatever human rows the
  // active filter tab currently shows, minus anything already resolved.
  // (On the "resolved" tab this is always empty, which hides the button.)
  const resolvableRows = humanAllRows.filter(
    (r) => matchesFilter(r.status, filter) && r.status !== "resolved",
  );
  const resolvableIds = resolvableRows.map((r) => r.id);

  return (
    <div className="space-y-8">
      {/* Summary header */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: "#FEF3E2", color: "#A86120" }}
        >
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="mr-auto">
          <h1 className="font-serif text-xl font-semibold" style={{ color: "#1A1714" }}>
            Page Feedback
          </h1>
          <p className="text-sm" style={{ color: "#847D77" }}>
            {loading
              ? "Loading…"
              : `${openTotal} open across ${allRows.length} total item${allRows.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {!loading && (
          <Badge variant={openTotal > 0 ? "amber" : "green"}>
            {openTotal} open
          </Badge>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter feedback by status">
        {FILTER_TABS.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-pressed={active}
              onClick={() => setFilter(t.key)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={
                active
                  ? { background: "#A86120", borderColor: "#A86120", color: "#FFFFFF" }
                  : { background: "#FFFFFF", borderColor: "#E8E4DE", color: "#4A4540" }
              }
            >
              {t.label}
              {!loading && <span className="ml-1 opacity-80">{filterCounts[t.key]}</span>}
            </button>
          );
        })}

        {!loading && isOwner && filter !== "resolved" && resolvableIds.length > 0 && (
          <button
            type="button"
            onClick={() => bulkResolveAll(resolvableIds)}
            disabled={!!bulkBusy}
            className="ml-auto flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "#FFFBF5", borderColor: "#F0D9B5", color: "#A86120" }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {bulkBusy
              ? `Resolving… ${bulkBusy.done}/${bulkBusy.total}`
              : filter === "all"
                ? `Resolve all ${resolvableIds.length} open`
                : `Resolve all ${resolvableIds.length}`}
          </button>
        )}
      </div>

      <AppSection
        title="Weave"
        subtitle="Anuprerna CMS"
        rows={weave}
        app="weave"
        loading={loading}
        filter={filter}
        expanded={expanded}
        toggle={toggle}
        editingId={editingId}
        editText={editText}
        setEditingId={setEditingId}
        setEditText={setEditText}
        patchStatus={patchStatus}
        saveEdit={saveEdit}
        onDelete={onDelete}
        setLightbox={setLightbox}
        email={email}
        isOwner={isOwner}
        busy={busy}
        automatedExpanded={automatedExpanded}
        toggleAutomated={toggleAutomated}
      />

      <AppSection
        title="Front-End"
        subtitle="Storefront"
        rows={storefront}
        app="storefront"
        loading={loading}
        filter={filter}
        expanded={expanded}
        toggle={toggle}
        editingId={editingId}
        editText={editText}
        setEditingId={setEditingId}
        setEditText={setEditText}
        patchStatus={patchStatus}
        saveEdit={saveEdit}
        onDelete={onDelete}
        setLightbox={setLightbox}
        email={email}
        isOwner={isOwner}
        busy={busy}
        automatedExpanded={automatedExpanded}
        toggleAutomated={toggleAutomated}
      />

      {lightbox && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded" />
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  subtitle: string;
  rows: FeedbackRow[] | null;
  app: AppName;
  loading: boolean;
  filter: StatusFilter;
  expanded: Set<string>;
  toggle: (id: string) => void;
  editingId: string | null;
  editText: string;
  setEditingId: (v: string | null) => void;
  setEditText: (v: string) => void;
  patchStatus: (id: string, status: Status) => void;
  saveEdit: (row: FeedbackRow) => void;
  onDelete: (id: string) => void;
  setLightbox: (v: string | null) => void;
  email: string;
  isOwner: boolean;
  busy: string | null;
  automatedExpanded: Set<string>;
  toggleAutomated: (key: string) => void;
}

function pageHref(app: AppName, route: string): { href: string; external: boolean } {
  if (app === "storefront") {
    const base = STOREFRONT_URL.replace(/\/$/, "");
    return { href: base + (route.startsWith("/") ? route : "/" + route), external: true };
  }
  return { href: route.startsWith("/") ? route : "/" + route, external: false };
}

function PageLink({
  app,
  route,
  children,
  className,
}: {
  app: AppName;
  route: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { href, external } = pageHref(app, route);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function AppSection(props: SectionProps) {
  const { title, subtitle, rows, app, loading, filter, automatedExpanded, toggleAutomated } = props;
  const allRows = rows ?? [];
  // Split human triage input from machine-generated rows (e.g. Mission
  // Control auto-posted task specs) — the default view + counts are
  // human-only; automated rows move into a separate collapsed section below.
  // Both branches also apply the active status filter tab; a page-group whose
  // items are all filtered out simply disappears (empty-state text covers it).
  const humanRows = useMemo(
    () => allRows.filter((r) => !isAutomated(r.submitterName) && matchesFilter(r.status, filter)),
    [allRows, filter],
  );
  const automatedRows = useMemo(
    () => allRows.filter((r) => isAutomated(r.submitterName) && matchesFilter(r.status, filter)),
    [allRows, filter],
  );
  const groups = useMemo(() => groupByPage(humanRows), [humanRows]);

  // Automated rows grouped by submitter — normally a single bucket (e.g. all
  // "Mission Control"), but this supports multiple automated sources per app.
  const automatedGroups = useMemo(() => {
    const map = new Map<string, FeedbackRow[]>();
    for (const r of automatedRows) {
      const name = (r.submitterName || "").trim();
      const arr = map.get(name) ?? [];
      arr.push(r);
      map.set(name, arr);
    }
    return Array.from(map.entries());
  }, [automatedRows]);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2 border-b pb-2" style={{ borderColor: "#E8E4DE" }}>
        <h2 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
          {title}
        </h2>
        <span className="text-xs uppercase tracking-wider" style={{ color: "#AAA39E" }}>
          {subtitle}
        </span>
        {!loading && (
          <span className="ml-auto text-xs" style={{ color: "#847D77" }}>
            {humanRows.length} item{humanRows.length === 1 ? "" : "s"} · {groups.length} page
            {groups.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading && (
        <p className="text-sm" style={{ color: "#AAA39E" }}>
          Loading…
        </p>
      )}

      {!loading && groups.length === 0 && (
        <div
          className="rounded-xl border border-dashed px-4 py-8 text-center text-sm"
          style={{ borderColor: "#E8E4DE", color: "#AAA39E" }}
        >
          No feedback for {title} yet.
        </div>
      )}

      {!loading &&
        groups.map((g) => (
          <PageGroupCard key={app + ":" + g.route} group={g} {...props} />
        ))}

      {!loading &&
        automatedGroups.map(([name, arows]) => {
          const key = app + ":" + name;
          return (
            <AutomatedSection
              key={key}
              submitterName={name}
              automatedRows={arows}
              isOpen={automatedExpanded.has(key)}
              onToggle={() => toggleAutomated(key)}
              {...props}
            />
          );
        })}
    </section>
  );
}

function AutomatedSection({
  submitterName,
  automatedRows,
  isOpen,
  onToggle,
  ...rest
}: SectionProps & {
  submitterName: string;
  automatedRows: FeedbackRow[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { app } = rest;
  const groups = useMemo(() => groupByPage(automatedRows), [automatedRows]);

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "#E8E4DE", background: "#FBFAF8" }}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-stone-100"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#AAA39E" }} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#AAA39E" }} />
        )}
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#847D77" }}>
          Automated · {submitterName} ({automatedRows.length})
        </span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t p-3" style={{ borderColor: "#F0EDE8" }}>
          {groups.map((g) => (
            <PageGroupCard key={app + ":auto:" + g.route} group={g} {...rest} />
          ))}
        </div>
      )}
    </div>
  );
}

function PageGroupCard({
  group,
  app,
  expanded,
  toggle,
  editingId,
  editText,
  setEditingId,
  setEditText,
  patchStatus,
  saveEdit,
  onDelete,
  setLightbox,
  email,
  isOwner,
  busy,
}: SectionProps & { group: PageGroup; app: AppName }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#E8E4DE" }}>
      {/* Page header */}
      <div
        className="flex items-center gap-2 border-b px-4 py-2.5"
        style={{ borderColor: "#F0EDE8", background: "#FBFAF8" }}
      >
        <PageLink
          app={app}
          route={group.route}
          className="group flex min-w-0 items-center gap-2 hover:underline"
        >
          <span className="truncate font-mono text-xs" style={{ color: "#4A4540" }}>
            {group.route}
          </span>
          <ExternalLink
            className="h-3 w-3 flex-shrink-0 opacity-50 group-hover:opacity-100"
            style={{ color: "#847D77" }}
          />
        </PageLink>
        <div className="ml-auto flex items-center gap-2">
          {group.openCount > 0 && (
            <Badge variant="amber">{group.openCount} open</Badge>
          )}
          <Badge variant="stone">{group.items.length}</Badge>
        </div>
      </div>

      {/* One-liner items */}
      <ul className="divide-y" style={{ borderColor: "#F0EDE8" }}>
        {group.items.map((it) => {
          const isOpen = expanded.has(it.id);
          const mine = (it.submitterEmail || "").toLowerCase() === email && !!email;
          const canControl = mine || isOwner;
          const isEditing = editingId === it.id;
          return (
            <li key={it.id} style={{ borderColor: "#F0EDE8" }}>
              {/* Compact row */}
              <button
                onClick={() => toggle(it.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-stone-50"
              >
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#AAA39E" }} />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#AAA39E" }} />
                )}
                <span className="min-w-0 flex-1 truncate text-sm" style={{ color: "#1A1714" }}>
                  {snippet(it.text)}
                </span>
                {it.images?.length > 0 && (
                  <span
                    className="flex flex-shrink-0 items-center gap-0.5 text-[11px]"
                    style={{ color: "#AAA39E" }}
                  >
                    <ImageIcon className="h-3 w-3" />
                    {it.images.length}
                  </span>
                )}
                <span className="flex-shrink-0">{statusChip(it.status)}</span>
                <span
                  className="hidden flex-shrink-0 text-[11px] sm:block"
                  style={{ color: "#AAA39E" }}
                >
                  {relTime(it.createdAt)}
                </span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="space-y-3 px-4 pb-4 pl-9">
                  {isEditing ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: "#E8E4DE", color: "#1A1714" }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm" style={{ color: "#4A4540" }}>
                      {it.text}
                    </p>
                  )}

                  {it.images?.length > 0 && (
                    <div className="flex gap-2">
                      {it.images.map((u, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={u}
                          alt=""
                          onClick={() => setLightbox(u)}
                          className="h-16 w-16 cursor-zoom-in rounded border object-cover"
                          style={{ borderColor: "#E8E4DE" }}
                        />
                      ))}
                    </div>
                  )}

                  {it.response?.trim() && (
                    <div
                      className="rounded-lg border px-3 py-2"
                      style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}
                    >
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: "#047857" }}
                      >
                        Resolution note
                      </span>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm" style={{ color: "#1A1714" }}>
                        {it.response}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]" style={{ color: "#AAA39E" }}>
                    <span>
                      {displayName(it.submitterName)} · {relTime(it.createdAt)}
                    </span>

                    <PageLink
                      app={app}
                      route={it.route}
                      className="flex items-center gap-1 font-medium hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open page
                    </PageLink>

                    {isEditing ? (
                      <span className="ml-auto flex items-center gap-3">
                        <button
                          onClick={() => saveEdit(it)}
                          disabled={busy === it.id}
                          className="font-medium disabled:opacity-40"
                          style={{ color: "#A86120" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                          className="hover:underline"
                          style={{ color: "#847D77" }}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      canControl && (
                        <span className="ml-auto flex items-center gap-3">
                          {it.status === "claude_done" && (
                            <>
                              <button
                                onClick={() => patchStatus(it.id, "resolved")}
                                disabled={busy === it.id}
                                className="flex items-center gap-1 font-medium disabled:opacity-40"
                                style={{ color: "#047857" }}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Confirm
                              </button>
                              <button
                                onClick={() => patchStatus(it.id, "pending")}
                                disabled={busy === it.id}
                                className="flex items-center gap-1 hover:underline disabled:opacity-40"
                                style={{ color: "#847D77" }}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reopen
                              </button>
                            </>
                          )}
                          {it.status === "pending" && (
                            <button
                              onClick={() => patchStatus(it.id, "resolved")}
                              disabled={busy === it.id}
                              className="flex items-center gap-1 hover:underline disabled:opacity-40"
                              style={{ color: "#047857" }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Resolve
                            </button>
                          )}
                          {it.status === "resolved" && (
                            <button
                              onClick={() => patchStatus(it.id, "pending")}
                              disabled={busy === it.id}
                              className="flex items-center gap-1 hover:underline disabled:opacity-40"
                              style={{ color: "#847D77" }}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reopen
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingId(it.id);
                              setEditText(it.text);
                            }}
                            className="flex items-center gap-1 hover:underline"
                            style={{ color: "#847D77" }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(it.id)}
                            disabled={busy === it.id}
                            className="flex items-center gap-1 hover:underline disabled:opacity-40"
                            style={{ color: "#B91C1C" }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
