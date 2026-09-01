"use client";

/**
 * UsersClient — three read-only tabs (User Carts, Verified, Unverified), each
 * SERVER-PAGINATED via PaginatedDataList. Every tab loads only the current
 * page (25 rows) from our pg copy through the /api/admin/* routes; search runs
 * server-side. Tab counts come from a single cheap COUNT(*) call. No writes.
 *
 * Row actions (feedback cd2b008c): each row exposes a 3-dots (kebab) menu that
 * mirrors the LIVE Bloomscorp CMS user table — whose only active row action is
 * "View Cart" (→ the per-user cart drill; the live "View Details" action is
 * commented out and has no backend, so it is intentionally omitted). The menu
 * is portalled to <body> with fixed positioning so the table's overflow-x-auto
 * wrapper cannot clip it.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingCart, BadgeCheck, MailWarning, MoreVertical } from "lucide-react";
import Link from "next/link";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataListColumn, Badge, PaginatedDataList } from "@/components/ui";
import type { UserRow, CartRow } from "@/lib/admin-api";
import type { PageResult } from "@/lib/usePaginatedList";

type Tab = "carts" | "verified" | "unverified";
const PAGE_SIZE = 25;

function fmtDate(ms: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function providerBadge(p: string) {
  const v = p === "GOOGLE" ? "blue" : p === "UNKNOWN" || !p ? "stone" : "purple";
  return <Badge variant={v as "blue" | "stone" | "purple"}>{p || "—"}</Badge>;
}

// ── Row actions kebab (3-dots) ──────────────────────────────────────────────
// Portalled to <body> with fixed positioning: the DataList wraps its table in
// an `overflow-x-auto` container which would otherwise clip an in-flow dropdown.
// Closes on outside-click, Escape, scroll, or resize.

interface ActionItem {
  label: string;
  href?: string;
  newTab?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function RowActionsMenu({ items, label }: { items: ActionItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const menuW = 176;
    setPos({ top: b.bottom + 6, left: Math.max(8, b.right - menuW) });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, place]);

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        type="button"
        aria-label={label ?? "Row actions"}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="user-row-actions"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[#F3F1ED]"
        style={{ borderColor: "#E8E4DE", color: "#635D58" }}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              data-testid="user-row-menu"
              className="fixed z-50 min-w-[176px] overflow-hidden rounded-lg border bg-white py-1 shadow-lg"
              style={{ top: pos.top, left: pos.left, borderColor: "#E8E4DE" }}
            >
              {items.map((it, i) =>
                it.href ? (
                  <a
                    key={i}
                    role="menuitem"
                    href={it.href}
                    target={it.newTab ? "_blank" : undefined}
                    rel={it.newTab ? "noopener noreferrer" : undefined}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm hover:bg-[#F3F1ED]"
                    style={{ color: "#1A1714", textDecoration: "none" }}
                  >
                    {it.label}
                  </a>
                ) : (
                  <button
                    key={i}
                    type="button"
                    role="menuitem"
                    disabled={it.disabled}
                    onClick={() => {
                      it.onClick?.();
                      setOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-[#F3F1ED] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ color: "#1A1714" }}
                  >
                    {it.label}
                  </button>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

// ── Row normalizers (raw Loom object → lean row) ────────────────────────────

function toUserRow(u: Record<string, unknown>): UserRow {
  return {
    customerId: Number(u.customerId ?? 0),
    tenantId: Number(u.tenantId ?? 0),
    userName: String(u.userName ?? "—"),
    email: String(u.email ?? ""),
    emailVerified: Boolean(u.emailVerified),
    loomId: String(u.loomId ?? ""),
    provider: String(u.provider ?? "UNKNOWN"),
    userType: String(u.userType ?? ""),
    creationTime: Number(u.creationTime ?? 0),
    lastAccessTime: Number(u.lastAccessTime ?? 0),
    isActiveLoyaltyUser: Boolean(u.isActiveLoyaltyUser),
    hasEverEnrolledForLoyaltyProgram: Boolean(u.hasEverEnrolledForLoyaltyProgram),
  };
}

function toCartRow(c: Record<string, unknown>): CartRow {
  const tenant = (c.tenant ?? {}) as Record<string, unknown>;
  return {
    tenantId: Number(tenant.id ?? 0),
    uid: String(tenant.uid ?? ""),
    name: String(tenant.name ?? "—"),
    email: String(tenant.decryptedEmail ?? tenant.email ?? ""),
    emailVerified: Boolean(tenant.emailVerified),
    cartItemCount: Number(c.cartItemCount ?? 0),
    hasAbandonedItem: Boolean(c.hasAbandonedItem),
    lastUpdatedAt: Number(c.lastUpdatedAt ?? 0),
    estimatedTotalPrice: Number(c.estimatedTotalPrice ?? 0),
  };
}

export function UsersClient() {
  const [tab, setTab] = useState<Tab>("carts");
  const [counts, setCounts] = useState<{ verified: number; unverified: number; carts: number } | null>(null);

  // Cheap tab counts — one COUNT(*) round trip, loaded once on mount.
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/user-tab-counts")
      .then((r) => r.json())
      .then((j) => {
        if (alive) setCounts({ verified: j.verified ?? 0, unverified: j.unverified ?? 0, carts: j.carts ?? 0 });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const usersFetcher = useCallback(
    async ({ page, pageSize, search, signal }: { page: number; pageSize: number; search: string; signal: AbortSignal }): Promise<PageResult<UserRow>> => {
      const p = new URLSearchParams({
        pageNumber: String(page - 1),
        pageSize: String(pageSize),
        search,
        verified: String(tab === "verified"),
      });
      const res = await fetch(`/api/admin/customers?${p.toString()}`, { signal });
      const j = await res.json();
      return { rows: ((j.rows as Record<string, unknown>[]) ?? []).map(toUserRow), total: j.total ?? 0 };
    },
    [tab],
  );

  const cartsFetcher = useCallback(
    async ({ page, pageSize, search, signal }: { page: number; pageSize: number; search: string; signal: AbortSignal }): Promise<PageResult<CartRow>> => {
      const p = new URLSearchParams({
        pageNumber: String(page - 1),
        pageSize: String(pageSize),
        search,
      });
      const res = await fetch(`/api/admin/carts?${p.toString()}`, { signal });
      const j = await res.json();
      return { rows: ((j.rows as Record<string, unknown>[]) ?? []).map(toCartRow), total: j.total ?? 0 };
    },
    [],
  );

  // ── Column sets ─────────────────────────────────────────────────────────
  const userColumns = useMemo<DataListColumn<UserRow>[]>(
    () => [
      {
        key: "userName",
        label: "Name",
        render: (r) => (
          <span className="font-medium text-sm" style={{ color: "#1A1714" }}>
            {r.userName || "—"}
          </span>
        ),
      },
      {
        key: "email",
        label: "Email",
        render: (r) => (
          <span className="text-sm" style={{ color: "#635D58" }}>
            {r.email || "—"}
          </span>
        ),
      },
      { key: "provider", label: "Provider", render: (r) => providerBadge(r.provider) },
      {
        key: "userType",
        label: "Type",
        render: (r) => (
          <span className="text-xs uppercase tracking-wide" style={{ color: "#847D77" }}>
            {r.userType || "—"}
          </span>
        ),
      },
      {
        key: "loyalty",
        label: "Loyalty",
        render: (r) =>
          r.isActiveLoyaltyUser ? (
            <Badge variant="green">Active</Badge>
          ) : r.hasEverEnrolledForLoyaltyProgram ? (
            <Badge variant="amber">Lapsed</Badge>
          ) : (
            <span className="text-xs" style={{ color: "#D1CCC6" }}>—</span>
          ),
      },
      {
        key: "creationTime",
        label: "Joined",
        render: (r) => (
          <span className="text-sm" style={{ color: "#635D58" }}>
            {fmtDate(r.creationTime)}
          </span>
        ),
      },
      {
        // Row actions kebab — mirrors the live CMS (View Cart is the only
        // active live action; see file header).
        key: "actions",
        label: "",
        cellClassName: "text-right",
        render: (r) => (
          <RowActionsMenu
            label={`Actions for ${r.userName || r.email || r.loomId}`}
            items={[
              {
                label: "View Cart",
                href: `/users/${encodeURIComponent(r.loomId)}/cart`,
                newTab: true,
              },
            ]}
          />
        ),
      },
    ],
    [],
  );

  const cartColumns = useMemo<DataListColumn<CartRow>[]>(
    () => [
      {
        key: "name",
        label: "Customer",
        render: (r) => (
          <span className="font-medium text-sm" style={{ color: "#1A1714" }}>
            {r.name || "—"}
          </span>
        ),
      },
      {
        key: "email",
        label: "Email",
        render: (r) => (
          <span className="text-sm" style={{ color: "#635D58" }}>
            {r.email || "—"}
          </span>
        ),
      },
      {
        key: "cartItemCount",
        label: "Items",
        render: (r) => (
          <span className="font-semibold text-sm" style={{ color: "#1A1714" }}>
            {r.cartItemCount}
          </span>
        ),
      },
      {
        key: "estimatedTotalPrice",
        label: "Estimated Total",
        render: (r) => (
          <span className="text-sm font-medium" style={{ color: "#1A1714" }}>
            ₹{r.estimatedTotalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        key: "hasAbandonedItem",
        label: "Status",
        render: (r) =>
          r.hasAbandonedItem ? (
            <Badge variant="red">Abandoned</Badge>
          ) : (
            <Badge variant="green">Active</Badge>
          ),
      },
      {
        key: "lastUpdatedAt",
        label: "Last Updated",
        render: (r) => (
          <span className="text-sm" style={{ color: "#635D58" }}>
            {fmtDate(r.lastUpdatedAt)}
          </span>
        ),
      },
      {
        // Same 3-dots menu for cart rows (View Cart → this cart's drill).
        key: "actions",
        label: "",
        cellClassName: "text-right",
        render: (r) => (
          <RowActionsMenu
            label={`Actions for ${r.name || r.email || r.uid}`}
            items={[
              {
                label: "View Cart",
                href: `/users/${encodeURIComponent(r.uid)}/cart`,
                newTab: true,
              },
            ]}
          />
        ),
      },
    ],
    [],
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number | null }[] = [
    { id: "carts", label: "User Carts", icon: ShoppingCart, count: counts?.carts ?? null },
    { id: "verified", label: "Verified Users", icon: BadgeCheck, count: counts?.verified ?? null },
    { id: "unverified", label: "Unverified Users", icon: MailWarning, count: counts?.unverified ?? null },
  ];

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Catalog</span>
      <span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Users</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
            Users
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Registered customers and live shopping carts — read-only.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: "#E8E4DE" }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2"
                style={{
                  color: isActive ? "#A86120" : "#847D77",
                  borderColor: isActive ? "#A86120" : "transparent",
                }}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: isActive ? "#FEF3E2" : "#F3F1ED",
                    color: isActive ? "#A86120" : "#847D77",
                  }}
                >
                  {t.count == null ? "…" : t.count.toLocaleString("en-IN")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content — server-paginated per tab (key remounts on tab switch) */}
        {tab === "carts" ? (
          <PaginatedDataList<CartRow>
            key="carts"
            fetcher={cartsFetcher}
            columns={cartColumns}
            getId={(r) => String(r.tenantId || r.uid)}
            pageSize={PAGE_SIZE}
            searchPlaceholder="Search carts by customer or email…"
            emptyMessage="No carts found."
          />
        ) : (
          <PaginatedDataList<UserRow>
            key={tab}
            fetcher={usersFetcher}
            columns={userColumns}
            getId={(r) => String(r.customerId)}
            pageSize={PAGE_SIZE}
            deps={[tab]}
            searchPlaceholder="Search by name, email or Loom ID…"
            emptyMessage="No users found."
          />
        )}
      </div>
    </WeaveShell>
  );
}
