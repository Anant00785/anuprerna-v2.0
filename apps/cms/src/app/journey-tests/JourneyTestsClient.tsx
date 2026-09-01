"use client";

/**
 * QA Center — one place for all testing of the Anuprerna rebuild.
 *
 * Four tabs:
 *   1. User Journeys — the Layer-3 witness layer. Run history → suites → tests
 *      with PASS/FAIL chips; open a test to see its numbered step FILMSTRIP,
 *      the VIDEO of the run, and (on failure) a plain-English explanation +
 *      the browser console errors. Runs are backgrounded (nice/ionice) and the
 *      page polls; it never blocks the box.
 *   2. Data Parity — read-only render of parity-harness/data-parity/report.json.
 *   3. API Health  — read-only render of backend/rebuild-map/status.json.
 *   4. Open Issues — journey-test-filed page feedback that is still open.
 *
 * A health strip across the top summarises all four in five seconds; a red dot
 * marks any tab with failures.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  FlaskConical, PlayCircle, ChevronDown, ChevronRight, CheckCircle2,
  AlertTriangle, XCircle, RefreshCw, MessageSquare, Clock, Users, User,
  Film, Camera, Database, ServerCog, ListChecks, ExternalLink, X,
  Wrench, History, GitCommit, Sparkles,
} from "lucide-react";
import {
  fetchRuns, fetchRun, fetchSuites, fetchParity, fetchApiHealth, fetchOpenIssues,
  fetchRunStatus, triggerQaRun, fetchFixLog, evidenceUrl,
  type RunIndexEntry, type RunSnapshot, type EvCase, type EvStep,
  type ParityPayload, type ParityRow, type ApiHealthPayload, type IssueRow,
  type FixLogPayload, type FixLogEntry, type FixLogCommit,
} from "@/lib/journey-tests-api";
import {
  StepLightbox, GapCard, GapSummary, classifyParityGap, classifyJourneyGap,
  RefreshFromLiveButton,
  type LightboxState, type GapView,
} from "./qa-extras";

type Tab = "findings" | "journeys" | "parity" | "api" | "issues" | "fixlog";

const COL = {
  ink: "#1A1714", body: "#4A4540", mute: "#847D77", faint: "#AAA39E",
  brand: "#A86120", brandHover: "#8A4C19", green: "#059669", red: "#B4241C", amber: "#B4720F",
  line: "#EDE9E3", line2: "#F1EDE7", card: "#E8E4DE",
};

// ── helpers ──────────────────────────────────────────────────────────────
function timeAgo(iso?: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtDur(ms?: number): string {
  if (!ms || ms < 0) return "";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s - m * 60)}s`;
}
function shortRunId(runId: string): string {
  // 20260717-053512-kgof -> 07-17 05:35
  const m = runId.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
  if (!m) return runId;
  return `${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
}

/**
 * The headline health strip and the default run selection must reflect a
 * FULL run (scope:"all"), not merely the newest run — a scoped single-journey
 * re-run (e.g. triggered from a suite/journey Run button) would otherwise
 * make the whole dashboard look red/broken off one flake in one journey.
 * `runs` is newest-first (index.json contract); falls back to runs[0] if no
 * full run exists at all (e.g. fresh install, nothing has run yet).
 */
function latestFullRun(runs: RunIndexEntry[]): RunIndexEntry | null {
  return runs.find((r) => r.scope === "all") ?? runs[0] ?? null;
}
function isPartialRun(r: RunIndexEntry): boolean {
  return r.scope !== "all";
}

function StepIcon({ status }: { status: EvStep["status"] }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: COL.green }} />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: COL.amber }} />;
  return <XCircle className="h-4 w-4 shrink-0" style={{ color: COL.red }} />;
}
function PersonaBadge({ persona }: { persona: string }) {
  const team = persona === "team";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: team ? "#1D4ED8" : "#7C3AED" }}>
      {team ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />} {persona}
    </span>
  );
}

// ── main ───────────────────────────────────────────────────────────────────
// Mirrors journeys/lib/feedback.mjs slugify() so a route's journey segment can
// be matched back to a run case's journey name.
function slugifyJourney(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "step";
}

export function JourneyTestsClient() {
  const [tab, setTab] = useState<Tab>("findings");

  const [runs, setRuns] = useState<RunIndexEntry[]>([]);
  const [suites, setSuites] = useState<string[]>([]);
  const [selRunId, setSelRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunSnapshot | null>(null);
  const [parity, setParity] = useState<ParityPayload | null>(null);
  const [apiHealth, setApiHealth] = useState<ApiHealthPayload | null>(null);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [newestRun, setNewestRun] = useState<RunSnapshot | null>(null);
  const [fixlog, setFixlog] = useState<FixLogPayload | null>(null);

  const [running, setRunning] = useState(false);
  const [runLabel, setRunLabel] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRun = useCallback(async (runId: string) => {
    const r = await fetchRun(runId);
    if (r.ok) setRun(r.data);
  }, []);

  const loadAll = useCallback(async () => {
    const [rs, sui, par, api, iss, fx, st] = await Promise.all([
      fetchRuns(), fetchSuites(), fetchParity(), fetchApiHealth(), fetchOpenIssues(), fetchFixLog(), fetchRunStatus(),
    ]);
    if (rs.ok) {
      setRuns(rs.data.runs);
      setError(null);
      // Default selection is the latest FULL run (scope:"all"), not merely
      // the newest run — see latestFullRun() above.
      const full = latestFullRun(rs.data.runs);
      const newest = full?.runId ?? null;
      setSelRunId((cur) => cur && rs.data.runs.some((x) => x.runId === cur) ? cur : newest);
      if (newest) {
        await loadRun(newest);
        const nr = await fetchRun(newest);
        setNewestRun(nr.ok ? nr.data : null);
      } else {
        setNewestRun(null);
      }
    } else {
      setError(rs.error);
    }
    if (sui.ok) setSuites(sui.data.suites);
    if (par.ok) setParity(par.data);
    if (api.ok) setApiHealth(api.data);
    if (iss.ok) setIssues(iss.data.issues);
    if (fx.ok) setFixlog(fx.data);
    if (st.ok) setRunning(st.data.running);
    setLoading(false);
  }, [loadRun]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  // Re-fetch just the parity numbers (used after a Refresh-from-live completes).
  const reloadParity = useCallback(async () => {
    const par = await fetchParity();
    if (par.ok) setParity(par.data);
  }, []);

  // Poll while a run is live; refresh everything when it clears.
  useEffect(() => {
    if (!running) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(async () => {
      const st = await fetchRunStatus();
      if (st.ok && !st.data.running) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        setRunning(false);
        void loadAll();
      }
    }, 3000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [running, loadAll]);

  // When the run selection changes (manual), load its snapshot.
  useEffect(() => { if (selRunId) void loadRun(selRunId); }, [selRunId, loadRun]);

  const trigger = useCallback(async (opts: { journey?: string; suite?: string }, label: string) => {
    setActionError(null);
    const r = await triggerQaRun(opts);
    if (!r.ok) { setActionError(r.error); return; }
    setRunLabel(label);
    setRunning(true);
  }, []);

  // ── derived health ──────────────────────────────────────────────────────
  // Latest FULL run (scope:"all") drives the headline "N/M passed" + the red
  // health dot — a scoped single-journey run must never do that (it would
  // read as "0/1 passed" off one flaky journey while the real suite is green).
  const newest = useMemo(() => latestFullRun(runs), [runs]);
  const jTotals = newest?.totals;
  const journeysBad = (jTotals?.journeys.fail ?? 0) > 0;
  const parityRows = parity?.rows ?? [];
  const paritySync = parityRows.filter((r) => /match|in.?sync|^ok$|pass/i.test(r.verdict)).length;
  // Triage, not a blanket verdict scan: WARN rows are benign-by-definition
  // (classifyParityGap always returns them EXPECTED/"Known gap"); a FAIL row
  // is only real ("OPEN") if its reason/note carries no expected-drift
  // annotation. See classifyParityGap in qa-extras.tsx for the shared rule.
  const parityGapRows = useMemo(() => parityRows.filter((r) => r.verdict === "WARN" || r.verdict === "FAIL"), [parityRows]);
  const parityGapsClassified = useMemo(() => parityGapRows.map(classifyParityGap), [parityGapRows]);
  const parityKnownCount = parityGapsClassified.filter((g) => g.status === "EXPECTED").length;
  const parityRealCount = parityGapsClassified.filter((g) => g.status === "OPEN").length;
  const parityBad = parityRealCount > 0;
  const apiSuites = apiHealth?.suites ?? [];
  // (2026-07-21 correction) backend/rebuild-map/scan-status.mjs now DETECTS
  // the real "Sandbox isolated: live Loom is disabled" 503 marker per failing
  // test (never a hardcoded guess-list) and splits each suite's `failed` into
  // isolationFailed (expected -- this sandbox deliberately blocks live-Loom
  // passthrough, LOOM_PROXY_ENABLED=false) vs realFailed (genuine). Curled +
  // re-ran the 3 previously-failing suites to confirm: all 5 auth/loyalty
  // failures ARE the 503 isolation body; the original "stale 401-vs-200" read
  // was wrong. apiIsolationFailed is informational-only and must never drive
  // the red dot / tab badge / "flagged for you" count -- only apiRealFailed
  // does. Falls back to the raw `failed` count for pre-2026-07-21 status.json
  // snapshots that predate this split (isolationFailed undefined).
  const apiIsolationFailed = apiHealth?.isolationFailed ?? 0;
  const apiRealFailed = apiHealth?.realFailed ?? (apiHealth?.failed ?? 0);
  const apiBad = apiRealFailed > 0;
  // Defensive filter (belt-and-suspenders on top of the store's own
  // auto-resolve): a journey-test issue is only "open" if its journey is NOT
  // green in the newest run. Non-journey routes (e.g. journey-test/harness/*)
  // match no journey slug and therefore always remain visible.
  const passingJourneySlugs = useMemo(() => {
    const set = new Set<string>();
    for (const c of newestRun?.cases ?? []) {
      if (c.status === "pass") set.add(slugifyJourney(c.name));
    }
    return set;
  }, [newestRun]);
  const visibleIssues = useMemo(
    () => issues.filter((i) => !passingJourneySlugs.has(String(i.route || "").split("/")[1] || "")),
    [issues, passingJourneySlugs],
  );
  const issuesBad = visibleIssues.length > 0;
  const fixEntries = fixlog?.entries ?? [];
  const fixRegressed = fixEntries.filter((e) => e.laterRegressed).length;
  const fixlogBad = fixRegressed > 0;

  // ── verdict-first presentation (frontend-only; same underlying data) ──────
  // Total gap count (WARN + FAIL) kept only as an informational figure for
  // the Data Parity tile subline -- it must NEVER drive the dot color or the
  // "flagged for you" count; only parityRealCount (genuine, non-expected
  // FAILs) does that. This is the fix for the 2026-07-21 "verdict cries wolf"
  // correction: known/expected drift must never read as an alarm.
  const parityGapCount = parityGapRows.length;
  // "Fixed today" hid real recent fixes whenever the clock had rolled past
  // midnight since they landed -- widen to a rolling 7-day window instead.
  const fixedRecentCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return fixEntries.filter((e) => e.greenAt && new Date(e.greenAt).getTime() >= cutoff).length;
  }, [fixEntries]);
  // Only REAL, non-expected items count as "flagged for you" — known/expected
  // gaps (parity WARN + annotated FAIL) are excluded so they never inflate
  // this number or the tab badges. API failures remain counted as real per
  // the no-isolation-marker note above (nothing to safely exclude yet).
  const flaggedCount = (jTotals?.journeys.fail ?? 0) + apiRealFailed + visibleIssues.length + parityRealCount;
  const verdict: "green" | "amber" | "red" = journeysBad || apiBad || parityBad ? "red" : issuesBad ? "amber" : "green";
  const verdictHeadline = !jTotals ? "No runs yet" : verdict === "green" ? "Platform healthy" : verdict === "amber" ? "A few things to look at" : "Something needs fixing";
  const totalKnownGaps = parityKnownCount + apiIsolationFailed;
  const verdictSub = !jTotals
    ? "Hit Run auto-fix to walk every screen as a real user and capture the evidence."
    : `${jTotals.journeys.pass} of ${jTotals.journeys.total} journeys pass · ${fixedRecentCount} fixed this week · ${flaggedCount} flagged for you`;
  // Shown only in the GREEN state -- a transparent, deliberately unalarming
  // note about known/expected gaps that were excluded from "flagged for you".
  const verdictKnownNote = verdict === "green" && totalKnownGaps > 0
    ? `${totalKnownGaps} known gap${totalKnownGaps === 1 ? "" : "s"} (expected, no action needed)`
    : null;

  return (
    <WeaveShell breadcrumb={<span className="text-sm" style={{ color: COL.mute }}>Operations / QA Center</span>}>
      <div className="mx-auto max-w-6xl px-5 py-6">
        {/* ── VERDICT HERO ───────────────────────────────────────────── */}
        <div className="mb-5 overflow-hidden rounded-xl border" style={{ borderColor: COL.card, background: "#fff" }}>
          <div className="flex flex-wrap items-start justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ background: verdict === "green" ? COL.green : verdict === "amber" ? COL.amber : COL.red,
                  boxShadow: `0 0 0 4px ${verdict === "green" ? "#E7F6EE" : verdict === "amber" ? "#FBF0DC" : "#FBE3E1"}` }} />
              <div className="min-w-0">
                <h1 className="font-serif text-2xl font-semibold leading-tight" style={{ color: COL.ink }}>{verdictHeadline}</h1>
                <p className="mt-1 text-sm" style={{ color: COL.mute }}>{verdictSub}</p>
                {verdictKnownNote && <p className="mt-0.5 text-xs" style={{ color: COL.faint }}>{verdictKnownNote}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void loadAll()} disabled={running} title="Reload the numbers"
                className="rounded-lg border p-2 transition hover:bg-stone-50 disabled:opacity-50"
                style={{ borderColor: COL.card, color: COL.mute }}>
                <RefreshCw className={"h-4 w-4" + (loading ? " animate-spin" : "")} />
              </button>
              <RefreshFromLiveButton onComplete={() => void loadAll()} />
              {/* PRIMARY action. Stage-1 scope: this RUNS the existing QA suite
                  (reuses POST /api/journey-tests/run, scope "all" — the exact
                  mechanism behind "Run all") and refreshes the verdict/tiles/
                  findings on completion. The auto-FIX loop (diagnose -> edit
                  code -> verify) is a separate Mac-side engine and is NOT wired
                  to this button yet. */}
              <button type="button" onClick={() => trigger({}, "all")} disabled={running}
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                style={{ background: COL.brand }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = COL.brandHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = COL.brand; }}>
                <Sparkles className="h-4 w-4" /> {running ? "Running…" : "Run auto-fix"}
              </button>
            </div>
          </div>

          {/* METRIC TILES — 1px gap over the border-colored bg */}
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: COL.card }}>
            <MetricTile label="User journeys" dot={journeysBad ? "red" : "green"}
              value={jTotals ? `${jTotals.journeys.pass}/${jTotals.journeys.total}` : "—"}
              sub={jTotals ? `${jTotals.steps.pass}/${jTotals.steps.total} checks pass` : "no runs yet"}
              onClick={() => setTab("journeys")} />
            <MetricTile label="Data parity" dot={parityRealCount > 0 ? "red" : "green"}
              value={parity?.present ? String(parityRealCount) : "—"}
              sub={parity?.present
                ? (parityRealCount > 0
                    ? `need review · ${parityKnownCount} known gap${parityKnownCount === 1 ? "" : "s"}`
                    : `${parityKnownCount} known gap${parityKnownCount === 1 ? "" : "s"} (expected) · ${paritySync}/${parityRows.length} in sync`)
                : "no parity run"}
              onClick={() => setTab("parity")} />
            <MetricTile label="API health" dot={apiRealFailed > 0 ? "red" : "green"}
              value={apiHealth?.present ? `${apiHealth.passed ?? 0}/${apiRealFailed}` : "—"}
              sub={apiHealth?.present
                ? (apiRealFailed > 0
                    ? `${apiRealFailed} real fail${apiRealFailed === 1 ? "" : "s"}${apiIsolationFailed > 0 ? ` · ${apiIsolationFailed} sandbox-only` : ""}`
                    : `${apiHealth.passed ?? 0} pass${apiIsolationFailed > 0 ? ` · ${apiIsolationFailed} known-isolation` : ""}`)
                : "no scorecard"}
              onClick={() => setTab("api")} />
            <MetricTile label="Open issues" dot={issuesBad ? "amber" : "green"}
              value={String(visibleIssues.length)} sub="auto-filed by tests"
              onClick={() => setTab("issues")} />
          </div>
        </div>

        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
        {actionError && <div className="mb-4"><ErrorBanner message={actionError} /></div>}

        {running && <RunConsole runLabel={runLabel} />}

        {/* Tab bar */}
        <div className="mb-4 flex flex-wrap gap-1 border-b" style={{ borderColor: COL.line }}>
          <TabButton active={tab === "findings"} onClick={() => setTab("findings")} count={flaggedCount} icon={<Sparkles className="h-4 w-4" />} label="Findings" />
          <TabButton active={tab === "journeys"} onClick={() => setTab("journeys")} count={jTotals?.journeys.fail ?? 0} icon={<FlaskConical className="h-4 w-4" />} label="User Journeys" />
          <TabButton active={tab === "parity"} onClick={() => setTab("parity")} count={parityRealCount} icon={<Database className="h-4 w-4" />} label="Data Parity" />
          <TabButton active={tab === "api"} onClick={() => setTab("api")} count={apiRealFailed} icon={<ServerCog className="h-4 w-4" />} label="API Health" />
          <TabButton active={tab === "issues"} onClick={() => setTab("issues")} count={visibleIssues.length} icon={<MessageSquare className="h-4 w-4" />} label="Open Issues" />
          <TabButton active={tab === "fixlog"} onClick={() => setTab("fixlog")} count={fixRegressed} icon={<Wrench className="h-4 w-4" />} label="Fix Log" />
        </div>

        {loading && !newest && (tab === "findings" || tab === "journeys") ? (
          <div className="flex items-center gap-2 py-16 text-sm" style={{ color: COL.mute }}>
            <RefreshCw className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {tab === "findings" && (
              <FindingsTab
                newestRun={newestRun} parity={parity} apiHealth={apiHealth}
                issues={visibleIssues} fixlog={fixEntries} setTab={setTab}
              />
            )}
            {tab === "journeys" && (
              <JourneysTab
                runs={runs} suites={suites} selRunId={selRunId} setSelRunId={setSelRunId}
                run={run} running={running} onTrigger={trigger} fixlog={fixlog?.entries ?? []}
              />
            )}
            {tab === "parity" && <ParityTab parity={parity} onRefreshed={() => void reloadParity()} />}
            {tab === "api" && <ApiHealthTab api={apiHealth} />}
            {tab === "issues" && <IssuesTab issues={visibleIssues} />}
            {tab === "fixlog" && <FixLogTab fixlog={fixlog} />}
          </>
        )}

        <footer className="mt-8 border-t pt-4 text-xs" style={{ borderColor: COL.line, color: COL.faint }}>
          Evidence (per-step screenshots + failure recordings) is kept for the <strong>last 5 runs (max 14 days)</strong>, then auto-pruned to save disk. The latest all-green run is kept indefinitely as a working reference. Full test plan: <code>journeys/QA-PLAN.md</code>.
        </footer>
      </div>
    </WeaveShell>
  );
}

// ── metric tile (inside the verdict hero) ──────────────────────────────────
function MetricTile({ label, dot, value, sub, onClick }: {
  label: string; dot: "green" | "amber" | "red"; value: string; sub: string; onClick: () => void;
}) {
  const dc = dot === "green" ? COL.green : dot === "amber" ? COL.amber : COL.red;
  return (
    <button type="button" onClick={onClick} className="bg-white px-4 py-3 text-left transition hover:bg-stone-50">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: dc }} />
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COL.mute }}>{label}</span>
      </div>
      <div className="mt-1 font-serif text-2xl font-semibold tabular-nums" style={{ color: COL.ink }}>{value}</div>
      <div className="mt-0.5 text-xs" style={{ color: COL.faint }}>{sub}</div>
    </button>
  );
}

// ── live run console (shown while "Run auto-fix" is in flight) ──────────────
// Reuses the EXISTING run trigger (POST /api/journey-tests/run, scope "all").
// The lines below are progress HEURISTICS from elapsed time + the parent's real
// running/!running poll — NOT raw runner stdout (streaming that would need a new
// log-tail route, out of the frontend-only scope). The AUTO-FIX loop (diagnose
// -> edit code -> verify) is NOT wired here; that is a separate Mac-side engine.
function RunConsole({ runLabel }: { runLabel: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(iv);
  }, []);
  const phases = [
    "Booting the QA runner (nice/ionice, background)…",
    "Walking user journeys as real personas…",
    "Capturing per-step screenshots + recordings…",
    "Checking data parity (sandbox vs live)…",
    "Scoring API health…",
    "Reconciling findings + open issues…",
  ];
  const phaseIdx = Math.min(phases.length - 1, Math.floor(elapsed / 20));
  const lines = phases.slice(0, phaseIdx + 1);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return (
    <div className="mb-5 overflow-hidden rounded-xl border" style={{ borderColor: COL.card, background: "#fff" }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#FFF8F0" }}>
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: COL.brandHover }}>
          <Sparkles className="h-4 w-4 animate-pulse" /> Running QA suite ({runLabel})
        </div>
        <span className="font-mono text-xs tabular-nums" style={{ color: COL.brand }}>{mm}:{ss}</span>
      </div>
      <div className="h-1 w-full overflow-hidden" style={{ background: "#F3E8DA" }}>
        <div className="h-full" style={{ width: `${Math.min(95, 8 + phaseIdx * 16)}%`, background: COL.brand, transition: "width 600ms ease" }} />
      </div>
      <div className="max-h-48 overflow-auto bg-stone-950 px-4 py-3 font-mono text-xs leading-relaxed" style={{ color: "#D7D3CC" }}>
        {lines.map((l, idx) => (
          <div key={idx}><span style={{ color: COL.brand }}>{String(idx * 20).padStart(3, " ")}s+ </span>{l}</div>
        ))}
        <div style={{ color: "#7B7469" }}>journeys run in the background; this page refreshes itself when the run finishes.</div>
      </div>
    </div>
  );
}

// ── FINDINGS FEED (default view) ────────────────────────────────────────────
// Presentation over the SAME data: one card per failure/finding, framed as
// gap -> status -> fix so a non-coder sees what broke, whether it is fixed, and
// the proof. Reuses the existing StepLightbox for evidence.
type FindStatus = "FIXED" | "FIXING" | "OPEN" | "EXPECTED";
interface Finding {
  key: string;
  severity: "high" | "med" | "ok";
  status: FindStatus;
  title: string;
  meta: string;
  whatBroke: string;
  theFix?: string;
  whyNot?: string;
  commits?: FixLogCommit[];
  consoleErrors?: string[];
  link?: string;
  ev?: { runId: string; c: EvCase };
  expectedLabel?: string;
}

function buildFindings(
  newestRun: RunSnapshot | null,
  parity: ParityPayload | null,
  apiHealth: ApiHealthPayload | null,
  issues: IssueRow[],
  fixlog: FixLogEntry[],
): Finding[] {
  const out: Finding[] = [];

  // 1) Failing journeys in the newest FULL run — with per-step evidence.
  if (newestRun) {
    for (const c of newestRun.cases) {
      if (c.status !== "fail") continue;
      const g = classifyJourneyGap(c, newestRun, fixlog);
      out.push({
        key: g.key,
        severity: g.status === "OPEN" ? "high" : g.status === "EXPECTED" ? "med" : "ok",
        status: g.status,
        title: c.name,
        meta: `${c.suite} · ${c.persona} · ${timeAgo(newestRun.run_at)}`,
        whatBroke: g.gap,
        whyNot: g.status === "OPEN"
          ? "Not auto-fixed yet — the diagnose -> edit -> verify loop isn't wired to this button yet (separate engine). Needs your call."
          : g.status === "EXPECTED"
          ? `Accepted difference — no fix needed${g.expectedLabel ? ` (${g.expectedLabel})` : ""}.`
          : undefined,
        commits: g.status === "FIXED" ? g.commits : undefined,
        theFix: g.status === "FIXED" ? "Went red -> green; the commits that landed in the fix window are below." : undefined,
        consoleErrors: c.failure?.consoleErrors ?? [],
        expectedLabel: g.expectedLabel,
        ev: { runId: newestRun.runId, c },
      });
    }
  }

  // 1b) Recently FIXED journeys (red -> green) from the fix log — the proof.
  const dayMs = 86400000;
  for (const e of fixlog) {
    if (e.laterRegressed || !e.greenAt) continue;
    if (Date.now() - new Date(e.greenAt).getTime() > 3 * dayMs) continue;
    if (out.some((f) => f.title === e.journeyName)) continue;
    out.push({
      key: "fixed:" + e.journeyId + ":" + e.greenAt,
      severity: "ok",
      status: "FIXED",
      title: e.journeyName,
      meta: [e.suite, e.persona, `fixed ${timeAgo(e.greenAt)}`].filter(Boolean).join(" · "),
      whatBroke: e.failure?.plainEnglish || (e.failure?.stepTitle ? `Failed: ${e.failure.stepTitle}` : "Was failing."),
      theFix: e.commits.length ? `${e.commits.length} commit${e.commits.length === 1 ? "" : "s"} landed in the fix window.` : "Went green again.",
      commits: e.commits,
    });
  }

  // 2) Data-parity warn/fail rows.
  // WARN rows are benign-by-definition (classifyParityGap always returns
  // them EXPECTED/"Known gap"); only an un-annotated FAIL is a real gap. See
  // the 2026-07-21 "verdict must not cry wolf" correction.
  for (const r of parity?.rows ?? []) {
    if (r.verdict !== "WARN" && r.verdict !== "FAIL") continue;
    const g = classifyParityGap(r);
    out.push({
      key: g.key,
      severity: g.status === "OPEN" ? "high" : "ok",
      status: g.status,
      title: g.title,
      meta: `Data parity · checked ${timeAgo(parity?.generatedAt)}`,
      whatBroke: g.gap,
      whyNot: g.status === "EXPECTED"
        ? `Accepted difference — no fix needed${g.expectedLabel ? ` (${g.expectedLabel})` : ""}.`
        : "Real parity FAIL with no expected-drift annotation — review the counts; a sandbox refresh from live may close it.",
      expectedLabel: g.expectedLabel,
    });
  }

  // 3) API health — failing suites, split real vs sandbox-isolation.
  // isolationFailed/realFailed come from scan-status.mjs detecting the actual
  // "Sandbox isolated: live Loom is disabled" 503 body per failing test (see
  // detectIsolationFailures() there) -- never a hardcoded guess. A suite with
  // ONLY isolation failures is a Known gap; any realFailed makes it OPEN.
  for (const st of apiHealth?.suites ?? []) {
    if (st.ok) continue;
    const realFailed = st.realFailed ?? st.failed;
    const isolationFailed = st.isolationFailed ?? 0;
    if (realFailed > 0) {
      out.push({
        key: "api:" + st.name,
        severity: "high",
        status: "OPEN",
        title: `${st.name} API failing`,
        meta: `API health · ${realFailed} real failing · checked ${timeAgo(apiHealth?.generatedAt)}`,
        whatBroke: `${realFailed} of ${st.passed + st.failed} route checks failed in the ${st.name} suite (not sandbox-isolation).`,
        whyNot: "Not auto-fixed yet — a backend route needs a look. Needs your call.",
      });
    }
    if (isolationFailed > 0) {
      out.push({
        key: "api-iso:" + st.name,
        severity: "ok",
        status: "EXPECTED",
        title: `${st.name} API — sandbox-only`,
        meta: `API health · ${isolationFailed} sandbox-isolated · checked ${timeAgo(apiHealth?.generatedAt)}`,
        whatBroke: (st.isolationTests?.length
          ? `${st.isolationTests.length} test(s) hit live-Loom passthrough routes this sandbox deliberately blocks: ${st.isolationTests.join("; ")}.`
          : `${isolationFailed} test(s) hit live-Loom passthrough routes this sandbox deliberately blocks.`),
        whyNot: "Accepted difference — no fix needed (sandbox has LOOM_PROXY_ENABLED=false, so these return 503 by design; would pass 401 against live Loom).",
        expectedLabel: "sandbox-isolation",
      });
    }
  }

  // 4) Open issues (auto-filed page feedback still open).
  for (const it of issues) {
    const label = it.pageLabel || (it.text || "").split("\n")[0] || it.route;
    out.push({
      key: "issue:" + it.id,
      severity: "med",
      status: "OPEN",
      title: label,
      meta: `Open issue · ${it.app} · ${it.route}`,
      whatBroke: it.text || "A journey auto-filed this page for review.",
      whyNot: "Tracked in Page Feedback — open it to triage.",
      link: "/feedback",
    });
  }

  const sevRank: Record<Finding["severity"], number> = { high: 0, med: 1, ok: 2 };
  return out.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
}

function findStatusPill(status: FindStatus) {
  const map: Record<FindStatus, { bg: string; fg: string; icon: React.ReactNode; label: string; pulse?: boolean }> = {
    FIXED: { bg: "#F4FBF7", fg: COL.green, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Fixed" },
    FIXING: { bg: "#FFF8F0", fg: COL.brand, icon: <Sparkles className="h-3.5 w-3.5" />, label: "Auto-fixing", pulse: true },
    OPEN: { bg: "#FBF0DC", fg: COL.amber, icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "Needs your call" },
    EXPECTED: { bg: "#F1EDE7", fg: COL.mute, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Known gap" },
  };
  const sc = map[status];
  return (
    <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" + (sc.pulse ? " animate-pulse" : "")}
      style={{ background: sc.bg, color: sc.fg }}>
      {sc.icon} {sc.label}
    </span>
  );
}

function FindingsTab({ newestRun, parity, apiHealth, issues, fixlog, setTab }: {
  newestRun: RunSnapshot | null; parity: ParityPayload | null; apiHealth: ApiHealthPayload | null;
  issues: IssueRow[]; fixlog: FixLogEntry[]; setTab: (t: Tab) => void;
}) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const findings = useMemo(
    () => buildFindings(newestRun, parity, apiHealth, issues, fixlog),
    [newestRun, parity, apiHealth, issues, fixlog],
  );
  const open = findings.filter((f) => f.status === "OPEN").length;
  const fixed = findings.filter((f) => f.status === "FIXED").length;
  const expected = findings.filter((f) => f.status === "EXPECTED").length;

  if (findings.length === 0) {
    return (
      <EmptyCard icon={<CheckCircle2 className="h-5 w-5" />} title="Nothing to flag"
        body="Every journey passes, data is in parity, APIs are green, and no issues are open. When something breaks it shows up here in plain English with the evidence." />
    );
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold" style={{ color: COL.ink }}>{findings.length} finding{findings.length === 1 ? "" : "s"}</span>
        <span style={{ color: COL.faint }}>—</span>
        <span style={{ color: open ? COL.red : COL.mute }}>{open} need your call</span>
        <span style={{ color: COL.faint }}>·</span>
        <span style={{ color: fixed ? COL.green : COL.mute }}>{fixed} fixed</span>
        <span style={{ color: COL.faint }}>·</span>
        <span style={{ color: COL.mute }}>{expected} known gap{expected === 1 ? "" : "s"}</span>
        <button type="button" onClick={() => setTab("journeys")} className="ml-auto text-xs font-medium hover:underline" style={{ color: COL.brand }}>
          Full run detail →
        </button>
      </div>
      <div className="space-y-2.5">
        {findings.map((f) => (
          <FindingCard key={f.key} f={f}
            onOpenStep={(c, ix) => setLightbox({ runId: f.ev!.runId, caseName: c.name, persona: c.persona, failure: c.failure, steps: c.steps, index: ix })} />
        ))}
      </div>
      {lightbox && (
        <StepLightbox state={lightbox} onClose={() => setLightbox(null)}
          onIndex={(nx) => setLightbox((st) => (st ? { ...st, index: nx } : st))} />
      )}
    </div>
  );
}

function FindingCard({ f, onOpenStep }: { f: Finding; onOpenStep: (c: EvCase, stepIndex: number) => void }) {
  const [open, setOpen] = useState(false);
  const stripe = f.severity === "high" ? COL.red : f.severity === "med" ? COL.amber : COL.green;
  const steps = f.ev?.c.steps ?? [];
  const thumbs = steps.filter((s) => s.screenshot);
  return (
    <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: COL.card }}>
      <div className="flex items-stretch">
        <div className="w-1 shrink-0" style={{ background: stripe }} />
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex flex-1 items-start justify-between gap-3 px-4 py-3 text-left">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {findStatusPill(f.status)}
              <span className="truncate text-sm font-semibold" style={{ color: COL.ink }}>{f.title}</span>
            </div>
            <div className="mt-1 text-xs" style={{ color: COL.faint }}>{f.meta}</div>
          </div>
          {open ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COL.faint }} /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COL.faint }} />}
        </button>
      </div>
      {open && (
        <div className="border-t px-4 py-3 pl-5" style={{ borderColor: COL.line2 }}>
          <div className="mb-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COL.mute }}>What broke</div>
            <p className="mt-1 text-sm" style={{ color: COL.body }}>{f.whatBroke}</p>
            {(f.consoleErrors?.length ?? 0) > 0 && (
              <details className="mt-1.5">
                <summary className="cursor-pointer text-xs font-medium" style={{ color: COL.amber }}>{f.consoleErrors!.length} browser console error(s)</summary>
                <ul className="mt-1 space-y-0.5">
                  {f.consoleErrors!.slice(0, 8).map((e, ix) => <li key={ix} className="font-mono text-[11px]" style={{ color: COL.red }}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>

          <div className="mb-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: f.status === "FIXED" ? COL.green : COL.mute }}>
              {f.status === "FIXED" ? "The fix" : "Why not auto-fixed"}
            </div>
            {f.status === "FIXED" ? (
              <>
                {f.theFix && <p className="mt-1 text-sm" style={{ color: COL.body }}>{f.theFix}</p>}
                {(f.commits?.length ?? 0) > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {f.commits!.map((cm, ix) => (
                      <div key={cm.repo + "-" + cm.sha + "-" + ix} className="flex items-start gap-2 text-xs">
                        <GitCommit className="mt-0.5 h-3 w-3 shrink-0" style={{ color: COL.faint }} />
                        <Badge variant="stone">{cm.repo}</Badge>
                        <span className="shrink-0 font-mono" style={{ color: COL.brand }}>{cm.sha}</span>
                        <span style={{ color: COL.body }}>{cm.subject}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm" style={{ color: COL.body }}>{f.whyNot}</p>
            )}
          </div>

          {thumbs.length > 0 && f.ev && (
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: COL.mute }}>
                <Camera className="h-3.5 w-3.5" /> Proof — click to zoom
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {thumbs.map((s) => {
                  const idx = steps.indexOf(s);
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={s.n} src={evidenceUrl(f.ev!.runId, s.screenshot!)} alt={s.title}
                      onClick={() => onOpenStep(f.ev!.c, idx)}
                      className="h-24 w-36 shrink-0 cursor-zoom-in rounded-md border object-cover object-left-top"
                      style={{ borderColor: s.status === "fail" ? COL.red : COL.card }} />
                  );
                })}
              </div>
            </div>
          )}

          {f.link && (
            <Link href={f.link} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: COL.brand }}>
              Open in Page Feedback <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, count = 0, icon, label }: { active: boolean; onClick: () => void; count?: number; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className="relative -mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-sm font-medium transition"
      style={{ borderColor: active ? COL.brand : "transparent", color: active ? COL.brand : COL.mute }}>
      {icon}{label}
      {count > 0 && <span className="ml-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: COL.red }}>{count}</span>}
    </button>
  );
}

// ═══════════════════════ TAB 1 — USER JOURNEYS ═══════════════════════════════
function JourneysTab({
  runs, suites, selRunId, setSelRunId, run, running, onTrigger, fixlog,
}: {
  runs: RunIndexEntry[]; suites: string[]; selRunId: string | null; setSelRunId: (id: string) => void;
  run: RunSnapshot | null; running: boolean;
  onTrigger: (opts: { journey?: string; suite?: string }, label: string) => void;
  fixlog: FixLogEntry[];
}) {
  const [openSuites, setOpenSuites] = useState<Set<string>>(new Set());
  const [openCase, setOpenCase] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const journeyGaps = useMemo<GapView[]>(() => {
    if (!run) return [];
    return run.cases.filter((c) => c.status === "fail").map((c) => classifyJourneyGap(c, run, fixlog));
  }, [run, fixlog]);

  const bySuite = useMemo(() => {
    const m = new Map<string, EvCase[]>();
    for (const c of run?.cases ?? []) {
      const arr = m.get(c.suite) ?? [];
      arr.push(c);
      m.set(c.suite, arr);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [run]);

  const t = run?.totals;

  return (
    <div>
      {/* Run controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={() => onTrigger({}, "all")} disabled={running}>
          <PlayCircle className="h-4 w-4" /> {running ? "Running…" : "Run all"}
        </Button>
        {suites.length > 0 && (
          <select
            className="rounded-lg border bg-white px-2.5 py-1.5 text-sm" style={{ borderColor: COL.line, color: COL.body }}
            disabled={running} defaultValue=""
            onChange={(e) => { if (e.target.value) { onTrigger({ suite: e.target.value }, `suite: ${e.target.value}`); e.target.value = ""; } }}
          >
            <option value="">Run a suite…</option>
            {suites.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm" style={{ color: COL.mute }}>
          <span>Run:</span>
          <select className="rounded-lg border bg-white px-2.5 py-1.5 text-sm" style={{ borderColor: COL.line, color: COL.body }}
            value={selRunId ?? ""} onChange={(e) => setSelRunId(e.target.value)}>
            {runs.map((r) => (
              <option key={r.runId} value={r.runId}>
                {isPartialRun(r) ? `partial: ${r.scope} — ` : ""}{shortRunId(r.runId)} — {r.totals.journeys.pass}/{r.totals.journeys.total} ok{r.totals.journeys.fail ? ` · ${r.totals.journeys.fail} fail` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5-second summary header */}
      {t && (
        <div className="mb-4 rounded-xl border px-4 py-3" style={{ borderColor: COL.line, background: t.journeys.fail ? "#FEF6F5" : "#F4FBF7" }}>
          <div className="text-sm font-semibold" style={{ color: t.journeys.fail ? COL.red : COL.green }}>
            Run {selRunId ? shortRunId(selRunId) : ""} — {t.steps.pass}/{t.steps.total} checks passed across {t.journeys.total} journeys
            {t.journeys.fail > 0 ? ` — ${t.journeys.fail} journey${t.journeys.fail === 1 ? "" : "s"} failing` : " — all green"}
          </div>
          <div className="mt-0.5 text-xs" style={{ color: COL.mute }}>
            {run && timeAgo(run.run_at)} · took {fmtDur(run?.durationMs)} · scope {run?.scope}
          </div>
        </div>
      )}

      {run && journeyGaps.length > 0 && (
        <div className="mb-4">
          <GapSummary gaps={journeyGaps} />
          <div className="space-y-2">
            {journeyGaps.map((g) => <GapCard key={g.key} g={g} />)}
          </div>
        </div>
      )}

      {!run && <div className="rounded-xl border bg-white px-4 py-8 text-sm" style={{ borderColor: COL.line, color: COL.mute }}>No runs yet. Hit “Run all” to walk the app and capture evidence.</div>}

      {/* Suites → cases */}
      <div className="space-y-3">
        {bySuite.map(([suite, cases]) => {
          const fail = cases.filter((c) => c.status === "fail").length;
          const open = openSuites.has(suite);
          return (
            <div key={suite} className="rounded-xl border bg-white" style={{ borderColor: COL.line }}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => setOpenSuites((p) => { const n = new Set(p); n.has(suite) ? n.delete(suite) : n.add(suite); return n; })}>
                  {open ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: COL.faint }} /> : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: COL.faint }} />}
                  <span className="font-semibold" style={{ color: COL.ink }}>{suite}</span>
                  {fail > 0 ? <Badge variant="red">{fail} failing</Badge> : <Badge variant="green">all pass</Badge>}
                  <span className="text-xs" style={{ color: COL.faint }}>{cases.length} test{cases.length === 1 ? "" : "s"}</span>
                </button>
                <Button size="sm" variant="secondary" disabled={running} onClick={() => onTrigger({ suite }, `suite: ${suite}`)}>
                  <PlayCircle className="h-3.5 w-3.5" /> Run suite
                </Button>
              </div>
              {open && (
                <div className="border-t" style={{ borderColor: COL.line2 }}>
                  {cases.map((c) => (
                    <CaseRow key={c.caseId} runId={run!.runId} c={c}
                      open={openCase === c.caseId} onToggle={() => setOpenCase(openCase === c.caseId ? null : c.caseId)}
                      running={running} onRun={() => onTrigger({ journey: c.name }, c.name)}
                      onOpenStep={(cc, i) => setLightbox({ runId: run!.runId, caseName: cc.name, persona: cc.persona, failure: cc.failure, steps: cc.steps, index: i })} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lightbox && (
        <StepLightbox
          state={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={(nextIdx) => setLightbox((st) => (st ? { ...st, index: nextIdx } : st))}
        />
      )}
    </div>
  );
}

function CaseRow({
  runId, c, open, onToggle, running, onRun, onOpenStep,
}: {
  runId: string; c: EvCase; open: boolean; onToggle: () => void;
  running: boolean; onRun: () => void; onOpenStep: (c: EvCase, stepIndex: number) => void;
}) {
  return (
    <div className="border-t first:border-t-0" style={{ borderColor: COL.line2 }}>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={onToggle}>
          {c.status === "fail" ? <XCircle className="h-4 w-4 shrink-0" style={{ color: COL.red }} /> : <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: COL.green }} />}
          <span className="truncate text-sm font-medium" style={{ color: COL.ink }}>{c.name}</span>
          <PersonaBadge persona={c.persona} />
          {c.video && <Film className="h-3.5 w-3.5" style={{ color: COL.brand }} />}
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs sm:inline" style={{ color: COL.faint }}>{c.steps.length} steps · {fmtDur(c.durationMs)}</span>
          <Button size="sm" variant="secondary" disabled={running} onClick={onRun}><PlayCircle className="h-3.5 w-3.5" /> Run</Button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4">
          {/* On failure: plain-English + console errors */}
          {c.failure && (
            <div className="mb-3 rounded-lg border px-3.5 py-3" style={{ borderColor: "#FBD9D5", background: "#FEF6F5" }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: COL.red }}>
                <AlertTriangle className="h-3.5 w-3.5" /> Failed at step {c.failure.failedStepIndex}: {c.failure.stepTitle}
              </div>
              <p className="mt-1.5 text-sm" style={{ color: COL.body }}>{c.failure.plainEnglish}</p>
              {c.failure.consoleErrors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium" style={{ color: COL.amber }}>{c.failure.consoleErrors.length} browser console error(s)</summary>
                  <ul className="mt-1 space-y-0.5">
                    {c.failure.consoleErrors.slice(0, 8).map((e, i) => <li key={i} className="font-mono text-xs" style={{ color: COL.red }}>{e}</li>)}
                  </ul>
                </details>
              )}
              <Link href="/feedback" target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: COL.brand }}>
                <MessageSquare className="h-3 w-3" /> Open in Page Feedback
              </Link>
            </div>
          )}

          {/* Video */}
          {c.video ? (
            <div className="mb-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium" style={{ color: COL.mute }}><Film className="h-3.5 w-3.5" /> Recording of this test</div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video controls preload="metadata" className="max-h-80 w-full rounded-lg border" style={{ borderColor: COL.line }} src={evidenceUrl(runId, c.video)} />
            </div>
          ) : (
            <div className="mb-3 text-xs" style={{ color: COL.faint }}>
              <Film className="mr-1 inline h-3.5 w-3.5" /> Video kept only for failed tests and the latest all-green run (storage guard).
            </div>
          )}

          {/* Filmstrip */}
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium" style={{ color: COL.mute }}><Camera className="h-3.5 w-3.5" /> Step-by-step ({c.steps.length})</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {c.steps.map((s, idx) => {
              const hasLive = !!s.liveScreenshot;
              return (
              <div key={s.n} className={hasLive ? "w-96 shrink-0" : "w-52 shrink-0"}>
                {hasLive ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: COL.faint }}>Sandbox</div>
                      {s.screenshot ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={evidenceUrl(runId, s.screenshot)} alt={s.title + " (sandbox)"}
                          onClick={() => onOpenStep(c, idx)}
                          className="h-32 w-full cursor-zoom-in rounded-md border object-cover object-left-top"
                          style={{ borderColor: s.status === "fail" ? COL.red : COL.line }} />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center rounded-md border text-xs" style={{ borderColor: COL.line, color: COL.faint }}>no shot</div>
                      )}
                    </div>
                    <div>
                      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: COL.faint }}>Live (anuprerna.com)</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={evidenceUrl(runId, s.liveScreenshot!)} alt={s.title + " (live)"}
                        onClick={() => onOpenStep(c, idx)}
                        className="h-32 w-full cursor-zoom-in rounded-md border object-cover object-left-top"
                        style={{ borderColor: COL.line }} />
                    </div>
                  </div>
                ) : s.screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={evidenceUrl(runId, s.screenshot)} alt={s.title}
                    onClick={() => onOpenStep(c, idx)}
                    className="h-32 w-full cursor-zoom-in rounded-md border object-cover object-left-top"
                    style={{ borderColor: s.status === "fail" ? COL.red : COL.line }} />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center rounded-md border text-xs" style={{ borderColor: COL.line, color: COL.faint }}>no shot</div>
                )}
                <div className="mt-1 flex items-start gap-1">
                  <StepIcon status={s.status} />
                  <span className="text-xs leading-snug" style={{ color: COL.body }}><span style={{ color: COL.faint }}>{s.n}.</span> {s.title}</span>
                </div>
                {s.error && <p className="mt-0.5 font-mono text-[11px]" style={{ color: s.status === "warn" ? COL.amber : COL.red }}>{s.error}</p>}
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ TAB 2 — DATA PARITY ════════════════════════════════
function verdictBadge(v: string) {
  if (/match|in.?sync|^ok$|pass/i.test(v)) return <Badge variant="green">{v}</Badge>;
  if (/skip/i.test(v)) return <Badge variant="stone">{v}</Badge>;
  return <Badge variant="red">{v}</Badge>;
}
function ParityTab({ parity, onRefreshed }: { parity: ParityPayload | null; onRefreshed: () => void }) {
  if (!parity || !parity.present) {
    return <EmptyCard icon={<Database className="h-5 w-5" />} title="No parity run yet"
      body="The Data Parity harness has not produced a report.json yet. Once it runs, this tab shows live-vs-sandbox row counts for every module." />;
  }
  const rows = parity.rows ?? [];
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs" style={{ color: COL.mute }}>
          Live {parity.liveBase} vs sandbox {parity.sandboxBase} · generated {timeAgo(parity.generatedAt)}
          {parity.liveTokenOk === false && <span style={{ color: COL.red }}> · live token FAILED</span>}
        </div>
        <RefreshFromLiveButton onComplete={onRefreshed} />
      </div>
      {(() => {
        const gaps = rows.filter((r) => /warn|fail/i.test(r.verdict)).map(classifyParityGap);
        return (
          <div className="mb-4">
            <GapSummary gaps={gaps} />
            {gaps.length > 0 && <div className="space-y-2">{gaps.map((g) => <GapCard key={g.key} g={g} />)}</div>}
          </div>
        );
      })()}
      <div className="overflow-x-auto rounded-xl border bg-white" style={{ borderColor: COL.line }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: COL.mute }}>
              <th className="px-3 py-2 font-medium">Module / Tab</th>
              <th className="px-3 py-2 font-medium text-right">Live</th>
              <th className="px-3 py-2 font-medium text-right">Sandbox</th>
              <th className="px-3 py-2 font-medium text-right">Δ</th>
              <th className="px-3 py-2 font-medium">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: ParityRow, i) => {
              const delta = (r.liveCount ?? null) !== null && (r.sbCount ?? null) !== null ? (r.sbCount! - r.liveCount!) : null;
              return (
                <tr key={i} className="border-t" style={{ borderColor: COL.line2 }}>
                  <td className="px-3 py-2">
                    <div style={{ color: COL.ink }}>{r.node.module}{r.node.tab && r.node.tab !== r.node.module ? ` · ${r.node.tab}` : ""}{r.node.subtab ? ` · ${r.node.subtab}` : ""}</div>
                    {r.reason && <div className="text-xs" style={{ color: COL.faint }}>{r.reason}</div>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: COL.body }}>{r.liveCount ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: COL.body }}>{r.sbCount ?? "—"}{r.sbAdj != null && r.sbAdj !== r.sbCount ? ` (${r.sbAdj})` : ""}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: delta && delta !== 0 ? COL.amber : COL.faint }}>{delta === null ? "—" : delta > 0 ? `+${delta}` : delta}</td>
                  <td className="px-3 py-2">{verdictBadge(r.verdict)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════ TAB 3 — API HEALTH ═════════════════════════════════
function ApiHealthTab({ api }: { api: ApiHealthPayload | null }) {
  if (!api || !api.present) {
    return <EmptyCard icon={<ServerCog className="h-5 w-5" />} title="No API scorecard yet"
      body="The backend test registry (rebuild-map/status.json) has not been produced yet. Once it runs, this tab lists every backend suite/module with pass/fail counts." />;
  }
  const suites = api.suites ?? [];
  return (
    <div>
      <div className="mb-3 text-xs" style={{ color: COL.mute }}>
        {api.passed ?? 0} passed · {api.failed ?? 0} failed across {suites.length} suites · generated {timeAgo(api.generatedAt)}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white" style={{ borderColor: COL.line }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: COL.mute }}>
              <th className="px-3 py-2 font-medium">Suite / Module</th>
              <th className="px-3 py-2 font-medium text-right">Routes</th>
              <th className="px-3 py-2 font-medium text-right">Passed</th>
              <th className="px-3 py-2 font-medium text-right">Failed</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {suites.map((s) => (
              <tr key={s.name} className="border-t" style={{ borderColor: COL.line2 }}>
                <td className="px-3 py-2" style={{ color: COL.ink }}>{s.name}</td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: COL.faint }}>{s.exercisesRoutes ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: COL.green }}>{s.passed}</td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: s.failed ? COL.red : COL.faint }}>{s.failed}</td>
                <td className="px-3 py-2">{s.ok ? <Badge variant="green">pass</Badge> : <Badge variant="red">fail</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════ TAB 4 — OPEN ISSUES ════════════════════════════════
function IssuesTab({ issues }: { issues: IssueRow[] }) {
  if (issues.length === 0) {
    return <EmptyCard icon={<CheckCircle2 className="h-5 w-5" />} title="No open issues"
      body="No test-filed page feedback is currently open. When a journey fails, it auto-files an issue here linking to the affected page." />;
  }
  return (
    <div className="space-y-2">
      {issues.map((r) => {
        const label = r.pageLabel || (r.text || "").split("\n")[0] || r.route;
        return (
          <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border bg-white px-4 py-3" style={{ borderColor: COL.line }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant={r.app === "weave" ? "blue" : "purple"}>{r.app}</Badge>
                <span className="truncate text-sm font-medium" style={{ color: COL.ink }}>{label}</span>
              </div>
              <div className="mt-0.5 font-mono text-xs" style={{ color: COL.faint }}>{r.route}</div>
            </div>
            <Link href="/feedback" target="_blank" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline" style={{ color: COL.brand }}>
              View <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// TAB 5 - FIX LOG
function fmtDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " - " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

function FixLogTab({ fixlog }: { fixlog: FixLogPayload | null }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const entries = fixlog?.entries ?? [];
  if (!fixlog || !fixlog.present || entries.length === 0) {
    return (
      <EmptyCard
        icon={<Wrench className="h-5 w-5" />}
        title="No fixes recorded yet"
        body="When a journey goes from failing to passing, it is logged here with the timestamps and the commits that landed in between - a durable record of what broke and what fixed it. Nothing has been recorded yet."
      />
    );
  }
  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: COL.mute }}>
        <History className="h-3.5 w-3.5" />
        {entries.length} fix{entries.length === 1 ? "" : "es"} recorded - newest first - generated {timeAgo(fixlog.generatedAt)}
      </div>
      <div className="space-y-3">
        {entries.map((e, i) => (
          <FixLogRow key={e.journeyId + "-" + e.greenAt + "-" + i} e={e} onLightbox={setLightbox} />
        ))}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setLightbox(null)}>
          <button className="absolute right-5 top-5 text-white" onClick={() => setLightbox(null)}><X className="h-6 w-6" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="evidence" className="max-h-full max-w-full rounded-lg" onClick={(ev) => ev.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function RetentionNote() {
  return (
    <span className="text-xs italic" style={{ color: COL.faint }}>
      evidence no longer retained (5-run / 14-day window)
    </span>
  );
}

function FixLogRow({ e, onLightbox }: { e: FixLogEntry; onLightbox: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [redVideo, setRedVideo] = useState<string | null | undefined>(undefined);
  const [greenVideo, setGreenVideo] = useState<string | null | undefined>(undefined);

  const loadVideos = useCallback(async () => {
    if (e.lastRedRunId && redVideo === undefined) {
      setRedVideo(null);
      const r = await fetchRun(e.lastRedRunId);
      if (r.ok) {
        const c = r.data.cases.find((x) => x.name === e.journeyName || x.caseId === e.journeyId);
        setRedVideo(c?.video ?? null);
      }
    }
    if (e.greenRunId && greenVideo === undefined) {
      setGreenVideo(null);
      const r = await fetchRun(e.greenRunId);
      if (r.ok) {
        const c = r.data.cases.find((x) => x.name === e.journeyName || x.caseId === e.journeyId);
        setGreenVideo(c?.video ?? null);
      }
    }
  }, [e, redVideo, greenVideo]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadVideos();
  };

  const sameRedWindow = e.firstRedAt === e.lastRedAt;

  return (
    <div className="rounded-xl border bg-white" style={{ borderColor: e.laterRegressed ? "#FBD9D5" : COL.line }}>
      <button type="button" onClick={toggle} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {open ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: COL.faint }} /> : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: COL.faint }} />}
            <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: COL.green }} />
            <span className="text-sm font-semibold" style={{ color: COL.ink }}>{e.journeyName}</span>
            <PersonaBadge persona={e.persona} />
            {e.suite && <span className="text-xs" style={{ color: COL.faint }}>{e.suite}</span>}
            {e.laterRegressed && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "#FEF6F5", color: COL.red }}>
                <AlertTriangle className="h-3 w-3" /> regressed again - check Open Issues
              </span>
            )}
          </div>
          <div className="mt-1 pl-6 text-xs" style={{ color: COL.mute }}>
            Fixed {fmtDate(e.greenAt)}
          </div>
        </div>
        <div className="shrink-0 text-right text-xs" style={{ color: COL.faint }}>
          {e.commits.length > 0 && (
            <span className="inline-flex items-center gap-1"><GitCommit className="h-3.5 w-3.5" />{e.commits.length} commit{e.commits.length === 1 ? "" : "s"}</span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t px-4 py-3 pl-10" style={{ borderColor: COL.line2 }}>
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: COL.red }}>
              <XCircle className="h-3.5 w-3.5" />
              {sameRedWindow ? ("Failed " + fmtDate(e.firstRedAt)) : ("Red since " + fmtDate(e.firstRedAt) + " - last failed " + fmtDate(e.lastRedAt))}
            </div>
            {e.lastRedRunId ? (
              <div className="mt-2 rounded-lg border px-3 py-2.5" style={{ borderColor: "#FBD9D5", background: "#FEF6F5" }}>
                {e.failure ? (
                  <>
                    <div className="text-xs font-semibold" style={{ color: COL.red }}>{e.failure.stepTitle}</div>
                    <p className="mt-1 text-sm" style={{ color: COL.body }}>{e.failure.plainEnglish}</p>
                    {e.failure.assertion && <p className="mt-1 font-mono text-[11px]" style={{ color: COL.red }}>{e.failure.assertion}</p>}
                    {e.failure.screenshot && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={evidenceUrl(e.lastRedRunId, e.failure.screenshot)} alt="failure screenshot"
                        onClick={() => onLightbox(evidenceUrl(e.lastRedRunId!, e.failure!.screenshot!))}
                        className="mt-2 h-40 cursor-zoom-in rounded-md border object-cover object-left-top"
                        style={{ borderColor: COL.red }} />
                    )}
                  </>
                ) : (
                  <p className="text-sm" style={{ color: COL.body }}>Failure detail not captured for this run.</p>
                )}
                {redVideo && (
                  <a href={evidenceUrl(e.lastRedRunId, redVideo)} target="_blank" rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: COL.brand }}>
                    <Film className="h-3.5 w-3.5" /> Watch the failing run
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-1"><RetentionNote /></div>
            )}
          </div>

          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: COL.green }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Fixed {fmtDate(e.greenAt)}
            </div>
            {e.greenRunId ? (
              greenVideo ? (
                <a href={evidenceUrl(e.greenRunId, greenVideo)} target="_blank" rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: COL.brand }}>
                  <Film className="h-3.5 w-3.5" /> Watch the passing run
                </a>
              ) : (
                <div className="mt-1 text-xs" style={{ color: COL.faint }}>Passing run evidence retained.</div>
              )
            ) : (
              <div className="mt-1"><RetentionNote /></div>
            )}
          </div>

          {e.commits.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: COL.mute }}>
                <GitCommit className="h-3.5 w-3.5" /> Commits in the window
              </div>
              <div className="space-y-1">
                {e.commits.map((cm, i) => (
                  <div key={cm.repo + "-" + cm.sha + "-" + i} className="flex items-start gap-2 text-xs">
                    <Badge variant="stone">{cm.repo}</Badge>
                    <span className="font-mono shrink-0" style={{ color: COL.brand }}>{cm.sha}</span>
                    <span style={{ color: COL.body }}>{cm.subject}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] italic" style={{ color: COL.faint }}>{e.commitWindowNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-white px-5 py-10 text-center" style={{ borderColor: COL.line }}>
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#F6F3EF", color: COL.mute }}>{icon}</div>
      <div className="text-sm font-semibold" style={{ color: COL.ink }}>{title}</div>
      <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: COL.mute }}>{body}</p>
    </div>
  );
}
