"use client";

/**
 * qa-extras.tsx — additive QA-Center building blocks owned by the journey-tests
 * lane:
 *   - classifyParityGap / classifyJourneyGap : gap -> status classification
 *   - GapCard / GapSummary                   : the gap -> status -> fix narrative
 *   - StepLightbox                           : zoomable full-screen step viewer
 *                                              with captions, prev/next, and a
 *                                              side-by-side sandbox/live twin.
 *
 * NOTHING here writes; it only reads the shapes already served by
 * /lib/journey-tests-api (EvCase/EvStep/EvFailure, ParityRow, FixLogEntry).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2,
  CheckCircle2, AlertTriangle, XCircle, Wrench, GitCommit, ChevronDown, ChevronRight as ChevRight,
  RefreshCw, Database, ShieldCheck,
} from "lucide-react";
import {
  evidenceUrl,
  type EvCase, type EvStep, type EvFailure,
  type ParityRow, type RunSnapshot, type FixLogEntry, type FixLogCommit,
  triggerRefresh, fetchRefreshJob, type RefreshJob,
} from "@/lib/journey-tests-api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const COL = {
  ink: "#1A1714", body: "#4A4540", mute: "#847D77", faint: "#AAA39E",
  brand: "#A86120", green: "#059669", red: "#B4241C", amber: "#B4720F",
  blue: "#1D4ED8", line: "#EDE9E3", line2: "#F1EDE7",
};

function shortRunId(runId: string): string {
  const m = runId.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
  if (!m) return runId;
  return `${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
}

// ═══════════════════════ GAP CLASSIFICATION ════════════════════════════════
// A finding's STATUS is one of these. FIXING is wired for completeness but the
// current data exposes no in-progress marker, so it is never emitted today.
export type GapStatus = "EXPECTED" | "OPEN" | "FIXING" | "FIXED";

export interface GapView {
  key: string;
  title: string;          // where the gap is (module path / journey name)
  gap: string;            // one-line plain-English statement of what differs
  status: GapStatus;
  expectedLabel?: string; // which accepted-divergence bucket matched (EXPECTED)
  detail?: string;        // secondary note text
  commits?: FixLogCommit[];
  fixedRunId?: string | null;
  persona?: string;
}

// EXPECTED = a known / accepted divergence, NOT a real regression. report.json
// carries NO explicit `classification` field (confirmed by inspecting the live
// file 2026-07-19), so we infer EXPECTED from the row's reason + node.note text
// via this documented keyword map. Any WARN/FAIL whose text matches one of these
// accepted-divergence patterns is EXPECTED; every other WARN/FAIL is OPEN.
// Order matters: the FIRST pattern that matches becomes the row's label, so the
// more specific / more meaningful buckets are listed before the broader ones
// (e.g. a live hard-cap row also mentions "synthetic" — we want it labelled
// live-endpoint-cap, not sandbox-isolation).
const EXPECTED_PATTERNS: { label: string; re: RegExp }[] = [
  // the live endpoint caps/pages so its true count is unknowable
  { label: "live-endpoint-cap", re: /hard.?cap|caps at|page param ignored|not (?:fully )?knowable|endpoint (?:hard.?)?cap/i },
  // sandbox intentionally holds a historical superset (rows deleted on live since sync)
  { label: "superset",          re: /superset|deleted on live|deleted-on-live|since sync/i },
  // sandbox-only synthetic/seed rows that live never had
  { label: "sandbox-isolation", re: /synthetic|sandbox-native|sandbox isolation|seeded in sandbox/i },
  // known fixture drift / volatile counts that are expected to wander
  { label: "stale-fixture",     re: /stale|fixture|known data drift|drift expected|volatile/i },
];

function matchExpected(text: string): string | null {
  for (const p of EXPECTED_PATTERNS) if (p.re.test(text)) return p.label;
  return null;
}

/**
 * Classify one Data-Parity WARN/FAIL row into a gap card view.
 *
 * The parity harness itself already distinguishes WARN (small, tolerated
 * drift -- it deliberately did NOT fail the row) from FAIL (a real
 * discrepancy). A WARN is by definition a benign/expected gap -- it is
 * ALWAYS classified "Known gap", never "Needs your call", even when its
 * reason text doesn't match one of the EXPECTED_PATTERNS keywords (e.g. a
 * plain "count delta -17" with no further annotation is still just a WARN).
 * Only a FAIL with no expected-drift annotation in its reason/note is a real
 * OPEN gap needing a human decision -- see the 2026-07-21 "verdict must not
 * cry wolf" correction (Amit has repeatedly flagged this exact false-alarm
 * class).
 */
export function classifyParityGap(row: ParityRow): GapView {
  const n = row.node;
  const path = [n.module, n.tab && n.tab !== n.module ? n.tab : "", n.subtab]
    .filter(Boolean).join(" · ");
  const hay = `${row.reason || ""} ${n.note || ""} ${n.storage || ""}`;
  const keywordExpected = matchExpected(hay);
  const expected = row.verdict === "WARN" ? (keywordExpected || "benign-drift") : keywordExpected;
  const delta = row.liveCount != null && row.sbCount != null ? (row.sbCount - row.liveCount) : null;
  const deltaStr = delta == null ? "" : delta > 0 ? ` (Δ +${delta})` : delta < 0 ? ` (Δ ${delta})` : "";
  const counts = row.liveCount != null || row.sbCount != null
    ? `sandbox ${row.sbCount ?? "—"} vs live ${row.liveCount ?? "—"}${deltaStr} — `
    : "";
  return {
    key: "parity:" + n.key,
    title: path || n.module || n.key,
    gap: counts + (row.reason || row.verdict),
    status: expected ? "EXPECTED" : "OPEN",
    expectedLabel: expected || undefined,
    detail: n.note || undefined,
  };
}

/**
 * Classify one FAILING journey case in the selected run.
 * FIXED  = this journey later went red->green per fixlog.json (we show the
 *          commit subject(s) that landed in the fix window).
 * EXPECTED = its plain-English failure text matches an accepted-divergence rule.
 * OPEN   = a real, still-unresolved failure.
 */
export function classifyJourneyGap(
  c: EvCase, run: RunSnapshot, fixlog: FixLogEntry[],
): GapView {
  const f: EvFailure | null = c.failure;
  const gapText = f?.plainEnglish
    || (f ? `Failed at step ${f.failedStepIndex}: ${f.stepTitle}` : `${c.name} failed`);

  // FIXED? find a fixlog entry for this journey whose fix landed at/after this
  // run — prefer the entry whose lastRedRunId IS this run, else the earliest
  // green recorded after this run's timestamp (handles repeat red->green cycles).
  const runAt = new Date(run.run_at).getTime();
  const cands = fixlog.filter(
    (e) => e.journeyId === c.caseId || e.journeyName === c.name,
  );
  let fix: FixLogEntry | undefined = cands.find((e) => e.lastRedRunId === run.runId);
  if (!fix) {
    fix = cands
      .filter((e) => e.greenAt && new Date(e.greenAt).getTime() >= runAt)
      .sort((a, b) => new Date(a.greenAt).getTime() - new Date(b.greenAt).getTime())[0];
  }
  if (fix) {
    return {
      key: "journey:" + c.caseId,
      title: c.name,
      gap: gapText,
      status: "FIXED",
      commits: fix.commits,
      fixedRunId: fix.greenRunId,
      persona: c.persona,
      detail: f?.assertion || undefined,
    };
  }

  const expected = matchExpected(gapText);
  return {
    key: "journey:" + c.caseId,
    title: c.name,
    gap: gapText,
    status: expected ? "EXPECTED" : "OPEN",
    expectedLabel: expected || undefined,
    persona: c.persona,
    detail: f?.assertion || undefined,
  };
}

// ═══════════════════════ GAP CARD + SUMMARY ════════════════════════════════
function statusChip(status: GapStatus) {
  const map: Record<GapStatus, { bg: string; fg: string; icon: React.ReactNode; label: string }> = {
    EXPECTED: { bg: "#F1EDE7", fg: COL.mute, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "EXPECTED" },
    OPEN:     { bg: "#FEF6F5", fg: COL.red,  icon: <XCircle className="h-3.5 w-3.5" />, label: "OPEN" },
    FIXING:   { bg: "#FFF8F0", fg: COL.amber, icon: <Wrench className="h-3.5 w-3.5" />, label: "FIXING" },
    FIXED:    { bg: "#F4FBF7", fg: COL.green, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "FIXED" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}>
      {s.icon} {s.label}
    </span>
  );
}

export function GapSummary({ gaps }: { gaps: GapView[] }) {
  const expected = gaps.filter((g) => g.status === "EXPECTED").length;
  const open = gaps.filter((g) => g.status === "OPEN").length;
  const fixing = gaps.filter((g) => g.status === "FIXING").length;
  const fixed = gaps.filter((g) => g.status === "FIXED").length;
  if (gaps.length === 0) {
    return (
      <div className="mb-3 flex items-center gap-1.5 text-sm font-medium" style={{ color: COL.green }}>
        <CheckCircle2 className="h-4 w-4" /> No gaps — everything in sync.
      </div>
    );
  }
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{ color: COL.body }}>
      <span className="font-semibold" style={{ color: COL.ink }}>
        {gaps.length} gap{gaps.length === 1 ? "" : "s"}
      </span>
      <span style={{ color: COL.faint }}>—</span>
      <span style={{ color: COL.mute }}>{expected} expected</span>
      <span style={{ color: COL.faint }}>·</span>
      <span style={{ color: open ? COL.red : COL.mute }}>{open} open</span>
      {fixing > 0 && (<><span style={{ color: COL.faint }}>·</span><span style={{ color: COL.amber }}>{fixing} fixing</span></>)}
      <span style={{ color: COL.faint }}>·</span>
      <span style={{ color: fixed ? COL.green : COL.mute }}>{fixed} fixed</span>
    </div>
  );
}

export function GapCard({ g }: { g: GapView }) {
  const [open, setOpen] = useState(false);
  const border =
    g.status === "OPEN" ? "#FBD9D5" :
    g.status === "FIXED" ? "#CDECDC" :
    g.status === "FIXING" ? "#FDE9C5" : COL.line;
  const hasCommits = g.status === "FIXED" && (g.commits?.length ?? 0) > 0;
  return (
    <div className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: border }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {statusChip(g.status)}
            <span className="truncate text-sm font-semibold" style={{ color: COL.ink }}>{g.title}</span>
            {g.expectedLabel && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "#F6F3EF", color: COL.mute }}>
                {g.expectedLabel}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm" style={{ color: COL.body }}>{g.gap}</p>
          {g.detail && <p className="mt-1 font-mono text-[11px]" style={{ color: COL.faint }}>{g.detail}</p>}
        </div>
      </div>

      {hasCommits && (
        <div className="mt-2 border-t pt-2" style={{ borderColor: COL.line2 }}>
          <button type="button" onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COL.green }}>
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevRight className="h-3.5 w-3.5" />}
            <Wrench className="h-3.5 w-3.5" />
            Fixed{g.fixedRunId ? ` in run ${shortRunId(g.fixedRunId)}` : ""} — {g.commits!.length} commit{g.commits!.length === 1 ? "" : "s"}
          </button>
          {open && (
            <div className="mt-1.5 space-y-1 pl-5">
              {g.commits!.map((cm, i) => (
                <div key={cm.repo + "-" + cm.sha + "-" + i} className="flex items-start gap-2 text-xs">
                  <GitCommit className="mt-0.5 h-3 w-3 shrink-0" style={{ color: COL.faint }} />
                  <span className="shrink-0 font-mono" style={{ color: COL.brand }}>{cm.sha}</span>
                  <span style={{ color: COL.body }}>{cm.subject}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ STEP LIGHTBOX ══════════════════════════════════════
export interface LightboxState {
  runId: string;
  caseName: string;
  persona: string;
  failure: EvFailure | null;
  steps: EvStep[];
  index: number;
}

// One independently-zoomable image pane (sandbox OR live). Own zoom + pan state.
function ZoomPane({ url, alt, label }: { url: string; alt: string; label: string }) {
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const clamp = (z: number) => Math.min(5, Math.max(1, z));
  const zoomIn = () => setZoom((z) => clamp(z + 0.5));
  const zoomOut = () => setZoom((z) => clamp(z - 0.5));
  const reset = () => setZoom(1);
  const toggle = () => setZoom((z) => (z > 1 ? 1 : 2.5));

  // Native wheel listener so we can preventDefault (React onWheel is passive).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        // plain wheel over a zoomed pane -> let it scroll/pan the pane
        if (zoom <= 1) return;
        return;
      }
      e.preventDefault();
      setZoom((z) => clamp(z + (e.deltaY < 0 ? 0.3 : -0.3)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#D8D2CB" }}>{label}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={zoomOut} aria-label={`Zoom out ${label}`}
            className="rounded p-1 text-white/80 hover:bg-white/10"><ZoomOut className="h-3.5 w-3.5" /></button>
          <span className="w-9 text-center text-[11px] tabular-nums text-white/70">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={zoomIn} aria-label={`Zoom in ${label}`}
            className="rounded p-1 text-white/80 hover:bg-white/10"><ZoomIn className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={reset} aria-label={`Reset zoom ${label}`}
            className="rounded p-1 text-white/80 hover:bg-white/10"><Maximize2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div ref={scrollRef}
        className="flex-1 overflow-auto rounded-lg border border-white/10 bg-black/30"
        style={{ maxHeight: "72vh" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} onClick={toggle}
          className={zoom > 1 ? "cursor-zoom-out" : "cursor-zoom-in"}
          style={{
            width: `${zoom * 100}%`,
            maxWidth: zoom > 1 ? "none" : "100%",
            display: "block",
            transition: "width 120ms ease",
          }} />
      </div>
    </div>
  );
}

export function StepLightbox({
  state, onClose, onIndex,
}: {
  state: LightboxState;
  onClose: () => void;
  onIndex: (next: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const { runId, caseName, persona, failure, steps, index } = state;
  const step = steps[index];
  const hasLive = !!step?.liveScreenshot;
  const isFailedStep = !!failure && failure.failedStepIndex === step?.n;

  const prev = useCallback(() => onIndex(Math.max(0, index - 1)), [index, onIndex]);
  const next = useCallback(() => onIndex(Math.min(steps.length - 1, index + 1)), [index, steps.length, onIndex]);

  // Keyboard: Esc close, arrows navigate, focus trap on Tab.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); return; }
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const f = root.querySelectorAll<HTMLElement>(
          'button, a[href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [prev, next, onClose]);

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/85"
      role="dialog" aria-modal="true" aria-label={`Step ${step.n} of ${caseName}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      ref={dialogRef} tabIndex={-1}>
      {/* top bar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 text-white"
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{caseName}</div>
          <div className="text-xs text-white/60">{persona} · step {step.n} of {steps.length}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close viewer"
          className="rounded p-1.5 text-white/80 hover:bg-white/10"><X className="h-5 w-5" /></button>
      </div>

      {/* body: prev | image(s) | next */}
      <div className="flex flex-1 items-stretch gap-2 px-3 pb-2" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" onClick={prev} disabled={index === 0} aria-label="Previous step"
          className="flex items-center rounded-lg px-1 text-white/80 enabled:hover:bg-white/10 disabled:opacity-25">
          <ChevronLeft className="h-7 w-7" />
        </button>

        <div className={`flex min-w-0 flex-1 ${hasLive ? "gap-3" : ""}`}>
          {step.screenshot ? (
            <ZoomPane url={evidenceUrl(runId, step.screenshot)} alt={`${step.title} (sandbox)`}
              label={hasLive ? "Sandbox" : "Screenshot"} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-white/50">No screenshot for this step.</div>
          )}
          {hasLive && (
            <ZoomPane url={evidenceUrl(runId, step.liveScreenshot!)} alt={`${step.title} (live)`}
              label="Live (anuprerna.com)" />
          )}
        </div>

        <button type="button" onClick={next} disabled={index === steps.length - 1} aria-label="Next step"
          className="flex items-center rounded-lg px-1 text-white/80 enabled:hover:bg-white/10 disabled:opacity-25">
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>

      {/* caption + fix/fail note */}
      <div className="border-t border-white/10 px-6 py-3 text-white" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-2">
          {step.status === "pass" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COL.green }} />
            : step.status === "warn" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COL.amber }} />
            : <XCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COL.red }} />}
          <p className="text-sm"><span className="text-white/50">{step.n}.</span> {step.title}</p>
        </div>
        {step.error && <p className="mt-1 pl-6 font-mono text-[11px]" style={{ color: step.status === "warn" ? "#F4C77B" : "#F1A6A0" }}>{step.error}</p>}
        {failure && isFailedStep && (
          <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#F1A6A0" }}>
              <AlertTriangle className="h-3.5 w-3.5" /> Why this failed
            </div>
            <p className="mt-1 text-sm text-white/85">{failure.plainEnglish}</p>
          </div>
        )}
        {/* step-strip: quick jump across the whole case */}
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <button key={s.n} type="button" onClick={() => onIndex(i)} aria-label={`Go to step ${s.n}`}
              title={`${s.n}. ${s.title}`}
              className="h-1.5 w-7 shrink-0 rounded-full"
              style={{
                background: i === index ? COL.brand
                  : s.status === "fail" ? "#B4241C"
                  : s.status === "warn" ? "#B4720F" : "rgba(255,255,255,0.25)",
                outline: i === index ? "1px solid rgba(255,255,255,0.5)" : "none",
              }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════ REFRESH SANDBOX FROM LIVE ══════════════════════════
// A deliberate (never one-click-accidental) "Refresh sandbox from live" control
// for the Data Parity tab. Reuses the host /api/sync/* plumbing: POST /api/sync/run
// spawns the SAFE, COMPLETE `bash sync/db-refresh.sh` (snapshots first, additive
// upsert from live Loom, atomic relational re-derive, NO schema drop, never
// deletes owned data — SANDBOX pg only, zero live writes) and the job is polled.
// ~15-20 min. On completion it calls onComplete() so the parity numbers re-fetch.
export function RefreshFromLiveButton({ onComplete }: { onComplete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [job, setJob] = useState<RefreshJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = job?.status === "running";

  // Poll a running job until it finishes, then refresh the parity numbers.
  useEffect(() => {
    if (!job || job.status !== "running") return;
    const iv = setInterval(async () => {
      const r = await fetchRefreshJob(job.id);
      if (r.ok) {
        setJob(r.data);
        if (r.data.status !== "running") { clearInterval(iv); if (r.data.status === "done") setTimeout(onComplete, 400); }
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [job, onComplete]);

  const start = useCallback(async () => {
    setConfirming(false);
    setError(null);
    const r = await triggerRefresh();
    if (!r.ok) { setError(r.error); return; }
    const jr = await fetchRefreshJob(r.data.jobId);
    if (jr.ok) setJob(jr.data); else setError(jr.error);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={running} onClick={() => setConfirming(true)}>
          <RefreshCw className={"h-3.5 w-3.5" + (running ? " animate-spin" : "")} />
          {running ? "Refreshing sandbox…" : "Refresh sandbox from live"}
        </Button>
        {error && <span className="text-xs" style={{ color: COL.red }}>{error}</span>}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: COL.line }}>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" style={{ color: COL.brand }} />
                <h2 className="text-lg font-semibold" style={{ color: COL.ink }}>Refresh sandbox from live?</h2>
              </div>
              <button type="button" onClick={() => setConfirming(false)} className="rounded p-1 hover:bg-stone-100"><X className="h-4 w-4" style={{ color: COL.mute }} /></button>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm" style={{ color: COL.body }}>
              <p>This pulls <b>today&apos;s data from live Loom</b> into the sandbox and re-derives the relational tables. It takes <b>~15-20 minutes</b>.</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COL.green }} /><span>Snapshots the sandbox first (rollback point) — no schema is dropped.</span></li>
                <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COL.green }} /><span>Writes to the <b>sandbox database only</b>. Live Loom is read-only and is never modified.</span></li>
                <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COL.green }} /><span>Never deletes owned or sandbox-created data.</span></li>
              </ul>
              <p className="text-xs" style={{ color: COL.mute }}>The parity numbers below refresh automatically when it completes.</p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-5 py-3.5" style={{ borderColor: COL.line }}>
              <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => void start()}><RefreshCw className="h-4 w-4" /> Start refresh</Button>
            </div>
          </div>
        </div>
      )}

      {job && <RefreshJobPanel job={job} onClose={() => setJob(null)} />}
    </>
  );
}

function RefreshJobPanel({ job, onClose }: { job: RefreshJob; onClose: () => void }) {
  const running = job.status === "running";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: COL.line }}>
          <div className="flex items-center gap-2">
            {running ? <RefreshCw className="h-4 w-4 animate-spin" style={{ color: COL.brand }} />
              : job.status === "done" ? <CheckCircle2 className="h-4 w-4" style={{ color: COL.green }} />
              : <AlertTriangle className="h-4 w-4" style={{ color: COL.red }} />}
            <h2 className="text-lg font-semibold" style={{ color: COL.ink }}>
              {running ? "Refreshing sandbox from live…" : job.status === "done" ? "Refresh complete" : "Refresh failed"}
            </h2>
            <Badge variant={running ? "amber" : job.status === "done" ? "green" : "red"}>db-refresh</Badge>
          </div>
          {!running && <button type="button" onClick={onClose} className="rounded p-1 hover:bg-stone-100"><X className="h-4 w-4" style={{ color: COL.mute }} /></button>}
        </div>
        {running && <div className="px-5 pt-3 text-xs" style={{ color: COL.mute }}>Runs in the background (~15-20 min). Snapshots first; sandbox-only writes. Safe to leave open.</div>}
        <div className="m-4 flex-1 overflow-auto rounded-lg bg-stone-950 px-4 py-3 font-mono text-xs leading-relaxed" style={{ color: "#D7D3CC" }}>
          {job.log.length === 0 ? <div style={{ color: "#7B7469" }}>starting…</div> : job.log.slice(-200).map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3 text-xs" style={{ borderColor: COL.line, color: COL.mute }}>
          {job.finishedAt ? <span>exit {job.exitCode}</span> : <span>running…</span>}
          {!running && <Button variant="primary" size="sm" onClick={onClose}>Done</Button>}
        </div>
      </div>
    </div>
  );
}
