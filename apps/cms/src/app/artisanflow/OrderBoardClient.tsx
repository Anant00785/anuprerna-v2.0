"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { formatEpoch, formatCount } from "@/lib/utils";
import type { OrderBoardCard, BoardItem, AttentionKind, WorkflowInstancePreview } from "@/lib/artisanflow-api";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import {
  Clock, MessageSquare, MessageCircle, UserX, PauseCircle, CheckCircle2,
  ChevronDown, ChevronRight, Package, ArrowRight, User, Search,
} from "lucide-react";

type WorkflowTypeFilter = "ALL" | "ORDER" | "CUSTOM_ORDER";

const PAGE_SIZE = 15;

function TypeFilterBar({ value, onChange }: { value: WorkflowTypeFilter; onChange: (v: WorkflowTypeFilter) => void }) {
  const opts: { v: WorkflowTypeFilter; label: string }[] = [
    { v: "ALL", label: "All" },
    { v: "ORDER", label: "Order" },
    { v: "CUSTOM_ORDER", label: "Custom Order" },
  ];
  return (
    <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: "#E8E4DE", background: "white" }}>
      {opts.map((o) => (
        <ToggleBtn key={o.v} active={value === o.v} onClick={() => onChange(o.v)}>{o.label}</ToggleBtn>
      ))}
    </div>
  );
}

// Attention-reason visual vocabulary — one tone per reason kind.
const KIND: Record<AttentionKind, { fg: string; bg: string; ring: string; icon: React.ReactNode; label: string }> = {
  late:       { fg: "#B91C1C", bg: "#FEF2F2", ring: "#DC2626", icon: <Clock className="h-3.5 w-3.5" />,        label: "Late" },
  feedback:   { fg: "#6D28D9", bg: "#F5F3FF", ring: "#7C3AED", icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Feedback" },
  unassigned: { fg: "#92400E", bg: "#FFFBEB", ring: "#D97706", icon: <UserX className="h-3.5 w-3.5" />,         label: "Unassigned" },
  stalled:    { fg: "#9A3412", bg: "#FFF7ED", ring: "#EA580C", icon: <PauseCircle className="h-3.5 w-3.5" />,    label: "Stalled" },
};

// The single accent colour for a card = its most-urgent reason.
function accentFor(card: OrderBoardCard): string {
  if (card.maxLateDays > 0) return KIND.late.ring;
  if (card.pendingFeedback > 0) return KIND.feedback.ring;
  if (card.stalledItems > 0) return KIND.stalled.ring;
  if (card.unassignedItems > 0) return KIND.unassigned.ring;
  return "#10B981";
}

function Bar({ pct, tone }: { pct: number; tone: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#EDEAE4" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(3, pct)}%`, background: tone }} />
    </div>
  );
}

function ReasonChip({ kind, text }: { kind: AttentionKind; text: string }) {
  const k = KIND[kind];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium" style={{ background: k.bg, color: k.fg }}>
      {k.icon}
      {text}
    </span>
  );
}

function ItemRow({ item }: { item: BoardItem }) {
  const pct = item.progressPct;
  const barTone = item.lateDays > 0 ? KIND.late.ring : item.stalled ? KIND.stalled.ring : "#10B981";
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: "#FAF9F6" }}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md" style={{ background: "#EDEAE4" }}>
        {item.productImage
          ? // eslint-disable-next-line @next/next/no-img-element
            <img src={item.productImage} alt="" className="h-full w-full object-cover" />
          : <Package className="h-4 w-4" style={{ color: "#AAA39E" }} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium" style={{ color: "#1A1714" }}>{item.productName}</p>
        <p className="truncate text-[11px]" style={{ color: "#AAA39E" }}>
          {item.productSku || "—"}
          {item.detailAvailable ? ` · Stage ${item.stageNum} of ${item.stepsTotal || "?"}${item.stageName ? ` — ${item.stageName}` : ""}` : ""}
        </p>
      </div>
      <div className="hidden w-28 flex-shrink-0 sm:block">
        {item.detailAvailable ? (
          <>
            <Bar pct={pct} tone={barTone} />
            <p className="mt-1 text-[10px] tabular-nums" style={{ color: "#AAA39E" }}>{item.stepsDone}/{item.stepsTotal} steps</p>
          </>
        ) : (
          <p className="text-[10px]" style={{ color: "#C4BDB6" }}>detail syncing</p>
        )}
      </div>
      <div className="flex w-40 flex-shrink-0 flex-wrap items-center justify-end gap-1">
        {item.lateDays > 0 && <MiniFlag kind="late" text={`${item.lateDays}d late`} />}
        {item.pendingFeedback > 0 && <MiniFlag kind="feedback" text={`${item.pendingFeedback} fb`} />}
        {item.unassigned && <MiniFlag kind="unassigned" text="unassigned" />}
        {item.stalled && <MiniFlag kind="stalled" text={`stalled ${item.stalledDays}d`} />}
        {item.lateDays === 0 && !item.pendingFeedback && !item.unassigned && !item.stalled &&
          (item.detailAvailable ? (
            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "#10B981" }}>
              <CheckCircle2 className="h-3 w-3" /> on track
            </span>
          ) : (
            <span className="text-[11px]" style={{ color: "#C4BDB6" }}>detail syncing</span>
          ))}
      </div>
      {!!item.commentCount && (
        <span
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium"
          style={{ background: "#F5F3FF", color: "#6D28D9" }}
          title={`${item.commentCount} discussion comment${item.commentCount === 1 ? "" : "s"}`}
        >
          <MessageCircle className="h-3 w-3" /> {item.commentCount}
        </span>
      )}
      <Link
        href={`/artisanflow/workflow/instance/${item.workflowId}`}
        className="flex flex-shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-stone-100"
        style={{ color: "#A86120" }}
      >
        View <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function MiniFlag({ kind, text }: { kind: AttentionKind; text: string }) {
  const k = KIND[kind];
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: k.bg, color: k.fg }}>
      {text}
    </span>
  );
}

function OrderCard({ card, defaultOpen }: { card: OrderBoardCard; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const accent = accentFor(card);
  const barTone = card.needsAttention ? accent : "#10B981";

  return (
    <div
      className="overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-card"
      style={{ borderColor: card.needsAttention ? accent + "55" : "#E8E4DE", borderLeft: `4px solid ${accent}` }}
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="flex-shrink-0" style={{ color: "#AAA39E" }}>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: "#EDEAE4" }}>
          {card.heroImage
            ? // eslint-disable-next-line @next/next/no-img-element
              <img src={card.heroImage} alt="" className="h-full w-full object-cover" />
            : <Package className="h-4 w-4" style={{ color: "#AAA39E" }} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold" style={{ color: "#1A1714" }}>{card.customer}</span>
            <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums" style={{ background: "#F5F5F4", color: "#847D77" }}>#{card.orderId}</span>
          </div>
          <p className="truncate text-xs" style={{ color: "#847D77" }}>
            {card.productSummary} · {card.itemCount} item{card.itemCount === 1 ? "" : "s"}
            {card.deliveryDateTo ? ` · due ${formatEpoch(card.deliveryDateTo)}` : ""}
          </p>
        </div>

        {/* attention reasons OR on-track */}
        <div className="hidden max-w-[46%] flex-wrap items-center justify-end gap-1.5 md:flex">
          {card.needsAttention
            ? card.reasons.map((r) => <ReasonChip key={r.kind} kind={r.kind} text={r.text} />)
            : <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium" style={{ background: "#ECFDF5", color: "#047857" }}><CheckCircle2 className="h-3.5 w-3.5" /> On track</span>}
        </div>

        <div className="ml-1 hidden w-24 flex-shrink-0 lg:block">
          {card.detailAvailable ? (
            <>
              <Bar pct={card.progressPct} tone={barTone} />
              <p className="mt-1 text-right text-[10px] tabular-nums" style={{ color: "#AAA39E" }}>{card.progressPct}%</p>
            </>
          ) : (
            <p className="mt-1 text-right text-[10px]" style={{ color: "#C4BDB6" }}>detail syncing</p>
          )}
        </div>
      </button>

      {/* mobile reasons row */}
      {card.needsAttention && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3 md:hidden">
          {card.reasons.map((r) => <ReasonChip key={r.kind} kind={r.kind} text={r.text} />)}
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-1.5 border-t px-3 py-3" style={{ borderColor: "#F0EDE7", background: "#FDFCFA" }}>
          {card.items.map((it) => <ItemRow key={it.workflowId} item={it} />)}
        </div>
      )}
    </div>
  );
}

/** Filter a card's items down to the chosen workflow type; drops cards left with no items. */
function filterCardsByType(cards: OrderBoardCard[], type: WorkflowTypeFilter): OrderBoardCard[] {
  if (type === "ALL") return cards;
  return cards
    .map((c) => ({ ...c, items: c.items.filter((it) => it.workflowType === type) }))
    .filter((c) => c.items.length > 0);
}

/**
 * Search by order id, workflow (job) id, or product SKU — all exact substring,
 * case-insensitive for SKU. Either id may be null when the row genuinely has
 * none; a null id matches nothing rather than being stringified (String(null)
 * is "null", so an unguarded id made every order-less row match a query like
 * "ul").
 */
function matchesQuery(q: string, orderId: number | null, workflowId: number | null, sku: string): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (orderId != null && String(orderId).includes(needle)) return true;
  if (workflowId != null && String(workflowId).includes(needle)) return true;
  if (sku.toLowerCase().includes(needle)) return true;
  return false;
}

function filterCardsByQuery(cards: OrderBoardCard[], q: string): OrderBoardCard[] {
  if (!q.trim()) return cards;
  // A CARD carries only an order id — its jobs' ids live on its items, which the
  // second clause covers. The card-level check used to pass c.orderId in the
  // workflowId slot as well, which read as "match this card's job id" but only
  // ever re-tested the order id.
  return cards.filter(
    (c) => matchesQuery(q, c.orderId, null, "") || c.items.some((it) => matchesQuery(q, c.orderId, it.workflowId, it.productSku)),
  );
}

function filterItemsByQuery(items: BoardItem[], q: string): BoardItem[] {
  if (!q.trim()) return items;
  return items.filter((it) => matchesQuery(q, it.orderId || null, it.workflowId, it.productSku));
}

function filterCompletedByQuery(list: WorkflowInstancePreview[], q: string): WorkflowInstancePreview[] {
  if (!q.trim()) return list;
  return list.filter((w) => matchesQuery(q, w.orderId || null, w.id, w.productSku || ""));
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#AAA39E" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search order id, job id, or SKU…"
        className="form-input h-9 w-full pl-8 text-xs"
      />
    </div>
  );
}

function CompletedRow({ w }: { w: WorkflowInstancePreview }) {
  return (
    <Link
      href={`/artisanflow/workflow/instance/${w.id}`}
      className="group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-shadow hover:shadow-card"
      style={{ borderColor: "#E8E4DE" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {w.productImage ? (
        <img src={w.productImage} alt="" className="h-11 w-11 flex-shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="h-11 w-11 flex-shrink-0 rounded-lg" style={{ background: "#F3F1ED" }} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium" style={{ color: "#1A1714" }}>{w.productName || w.name}</p>
          {w.hasAssignedArtisan && (
            <span title="Artisan assigned"><User className="h-3.5 w-3.5" style={{ color: "#047857" }} /></span>
          )}
        </div>
        <p className="truncate text-xs" style={{ color: "#847D77" }}>
          {w.productSku ? `SKU ${w.productSku} · ` : ""}Order #{w.orderId} · {w.workflowType}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs sm:block" style={{ color: "#847D77" }}>{formatEpoch(w.orderDeliveryDateFrom)}</span>
        <StatusPill status={w.status} />
        <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "#AAA39E" }} />
      </div>
    </Link>
  );
}

function OrderBoardView({
  cards,
  hiddenAbandoned = 0,
  orderless = [],
  completed = [],
  totalCompleted = 0,
}: {
  cards: OrderBoardCard[];
  hiddenAbandoned?: number;
  orderless?: BoardItem[];
  completed?: WorkflowInstancePreview[];
  totalCompleted?: number;
}) {
  const [view, setView] = useState<"live" | "orderless" | "completed">("live");
  const [onlyAttention, setOnlyAttention] = useState(false);
  const [typeFilter, setTypeFilter] = useState<WorkflowTypeFilter>("ALL");
  const [query, setQuery] = useState("");

  const typedCards = useMemo(() => filterCardsByType(cards, typeFilter), [cards, typeFilter]);
  const attentionCount = useMemo(() => typedCards.filter((c) => c.needsAttention).length, [typedCards]);
  const attentionFiltered = onlyAttention ? typedCards.filter((c) => c.needsAttention) : typedCards;
  const shown = useMemo(() => filterCardsByQuery(attentionFiltered, query), [attentionFiltered, query]);

  const typedOrderless = useMemo(
    () => (typeFilter === "ALL" ? orderless : orderless.filter((it) => it.workflowType === typeFilter)),
    [orderless, typeFilter],
  );
  const shownOrderless = useMemo(() => filterItemsByQuery(typedOrderless, query), [typedOrderless, query]);

  const shownCompleted = useMemo(() => {
    const typed = typeFilter === "ALL" ? completed : completed.filter((w) => w.workflowType === typeFilter);
    return filterCompletedByQuery(typed, query);
  }, [completed, typeFilter, query]);

  // Client-side pagination for the live board, orderless list, and completed list.
  const [livePage, setLivePage] = useState(1);
  const [orderlessPage, setOrderlessPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  // Any filter/view change resets to the first page so the pager never points
  // past the end of a freshly-filtered list.
  useEffect(() => { setLivePage(1); }, [typeFilter, onlyAttention, view, query]);
  useEffect(() => { setOrderlessPage(1); }, [typeFilter, view, query]);
  useEffect(() => { setCompletedPage(1); }, [typeFilter, view, query]);

  const liveTotalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const livePageSafe = Math.min(livePage, liveTotalPages);
  const pagedLive = shown.slice((livePageSafe - 1) * PAGE_SIZE, livePageSafe * PAGE_SIZE);

  const orderlessTotalPages = Math.max(1, Math.ceil(shownOrderless.length / PAGE_SIZE));
  const orderlessPageSafe = Math.min(orderlessPage, orderlessTotalPages);
  const pagedOrderless = shownOrderless.slice((orderlessPageSafe - 1) * PAGE_SIZE, orderlessPageSafe * PAGE_SIZE);

  const completedTotalPages = Math.max(1, Math.ceil(shownCompleted.length / PAGE_SIZE));
  const completedPageSafe = Math.min(completedPage, completedTotalPages);
  const pagedCompleted = shownCompleted.slice((completedPageSafe - 1) * PAGE_SIZE, completedPageSafe * PAGE_SIZE);

  // count reason kinds for the summary strip
  const tally = useMemo(() => {
    const t = { late: 0, feedback: 0, unassigned: 0, stalled: 0 };
    for (const c of typedCards) {
      if (c.maxLateDays > 0) t.late++;
      if (c.pendingFeedback > 0) t.feedback++;
      if (c.unassignedItems > 0) t.unassigned++;
      if (c.stalledItems > 0) t.stalled++;
    }
    return t;
  }, [typedCards]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Production</h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            {view === "live" ? (
              <>
                {shown.length} live order{shown.length === 1 ? "" : "s"} in production ·{" "}
                <span style={{ color: attentionCount ? "#B91C1C" : "#047857", fontWeight: 600 }}>
                  {attentionCount} need{attentionCount === 1 ? "s" : ""} attention
                </span>
              </>
            ) : view === "orderless" ? (
              <>{formatCount(shownOrderless.length)} job{shownOrderless.length === 1 ? "" : "s"} with no linked order</>
            ) : (
              <>{formatCount(shownCompleted.length)} completed job{shownCompleted.length === 1 ? "" : "s"}</>
            )}
          </p>
          {view === "live" && hiddenAbandoned > 0 && (
            <p className="mt-0.5 text-xs" style={{ color: "#B7B0A9" }}>
              · {hiddenAbandoned} older abandoned order{hiddenAbandoned === 1 ? "" : "s"} hidden
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchBar value={query} onChange={setQuery} />
          <TypeFilterBar value={typeFilter} onChange={setTypeFilter} />
          <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: "#E8E4DE", background: "white" }}>
            <ToggleBtn active={view === "live"} onClick={() => setView("live")}>Live</ToggleBtn>
            <ToggleBtn active={view === "orderless"} onClick={() => setView("orderless")}>
              Standalone <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: view === "orderless" ? "#FFFFFF33" : "#F3F1ED", color: view === "orderless" ? "white" : "#847D77" }}>{formatCount(orderless.length)}</span>
            </ToggleBtn>
            <ToggleBtn active={view === "completed"} onClick={() => setView("completed")}>
              Completed <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: view === "completed" ? "#FFFFFF33" : "#F3F1ED", color: view === "completed" ? "white" : "#847D77" }}>{formatCount(totalCompleted)}</span>
            </ToggleBtn>
          </div>
          {view === "live" && (
            <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: "#E8E4DE", background: "white" }}>
              <ToggleBtn active={!onlyAttention} onClick={() => setOnlyAttention(false)}>All</ToggleBtn>
              <ToggleBtn active={onlyAttention} onClick={() => setOnlyAttention(true)}>
                Needs attention
                {attentionCount > 0 && <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: onlyAttention ? "#FFFFFF33" : "#FEF2F2", color: onlyAttention ? "white" : "#B91C1C" }}>{attentionCount}</span>}
              </ToggleBtn>
            </div>
          )}
        </div>
      </div>

      {view === "live" ? (
        <>
          {/* reason tally strip */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <TallyCard kind="late" n={tally.late} label="Late orders" />
            <TallyCard kind="feedback" n={tally.feedback} label="Feedback to review" />
            <TallyCard kind="unassigned" n={tally.unassigned} label="Need an artisan" />
            <TallyCard kind="stalled" n={tally.stalled} label="Stalled" />
          </div>

          <div className="flex flex-col gap-2.5">
            {pagedLive.map((c) => <OrderCard key={`${c.workflowType}-${c.orderId}`} card={c} defaultOpen={false} />)}
            {shown.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-xl border py-16 text-center" style={{ borderColor: "#E8E4DE", background: "white" }}>
                <CheckCircle2 className="h-8 w-8" style={{ color: "#10B981" }} />
                <p className="text-sm font-medium" style={{ color: "#1A1714" }}>Nothing needs attention</p>
                <p className="text-xs" style={{ color: "#847D77" }}>Every live production order is on track.</p>
              </div>
            )}
            <Pagination page={livePageSafe} totalPages={liveTotalPages} onPageChange={setLivePage} />
          </div>
        </>
      ) : view === "orderless" ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs" style={{ color: "#AAA39E" }}>
            Jobs started without linking an order — nothing to group them by, so each shows on its own.
          </p>
          {pagedOrderless.map((it) => <ItemRow key={it.workflowId} item={it} />)}
          {shownOrderless.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border py-16 text-center" style={{ borderColor: "#E8E4DE", background: "white" }}>
              <p className="text-sm font-medium" style={{ color: "#1A1714" }}>No standalone jobs</p>
            </div>
          )}
          <Pagination page={orderlessPageSafe} totalPages={orderlessTotalPages} onPageChange={setOrderlessPage} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pagedCompleted.map((w) => <CompletedRow key={w.id} w={w} />)}
          {shownCompleted.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border py-16 text-center" style={{ borderColor: "#E8E4DE", background: "white" }}>
              <p className="text-sm font-medium" style={{ color: "#1A1714" }}>No completed jobs</p>
            </div>
          )}
          <Pagination page={completedPageSafe} totalPages={completedTotalPages} onPageChange={setCompletedPage} />
          {totalCompleted > completed.length && (
            <p className="pt-1 text-center text-xs" style={{ color: "#AAA39E" }}>
              Showing {formatCount(completed.length)} of {formatCount(totalCompleted)} (preview cap).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
      style={active ? { background: "#1A1714", color: "white" } : { background: "transparent", color: "#847D77" }}
    >
      {children}
    </button>
  );
}

function TallyCard({ kind, n, label }: { kind: AttentionKind; n: number; label: string }) {
  const k = KIND[kind];
  const dim = n === 0;
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3" style={{ borderColor: "#E8E4DE", opacity: dim ? 0.55 : 1 }}>
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: k.bg, color: k.fg }}>{k.icon}</span>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none tabular-nums" style={{ color: "#1A1714" }}>{n}</p>
        <p className="mt-0.5 truncate text-[11px]" style={{ color: "#847D77" }}>{label}</p>
      </div>
    </div>
  );
}

interface BoardResponse {
  cards: OrderBoardCard[];
  hiddenAbandoned: number;
  orderless: BoardItem[];
  completed: WorkflowInstancePreview[];
  totalCompleted: number;
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-8 w-48 animate-pulse rounded-lg" style={{ background: "#EDEAE4" }} />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border" style={{ borderColor: "#E8E4DE", background: "#F3F1ED" }} />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border" style={{ borderColor: "#E8E4DE", background: "#F3F1ED" }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Fetches /artisanflow/api/board client-side and renders OrderBoardView once
 * loaded. The page shell (ArtisanFlowShell) renders instantly; this is the
 * only part that waits on the backend, and it shows a skeleton meanwhile
 * instead of leaving the whole route blank during SSR.
 */
export function OrderBoardClient() {
  const [data, setData] = useState<BoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/artisanflow/api/board")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load the production board.");
        return j as BoardResponse;
      })
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load the production board."); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col gap-4 max-w-xl">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Can&apos;t load the production board</h1>
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!data) return <BoardSkeleton />;

  return (
    <OrderBoardView
      cards={data.cards}
      hiddenAbandoned={data.hiddenAbandoned}
      orderless={data.orderless}
      completed={data.completed}
      totalCompleted={data.totalCompleted}
    />
  );
}
