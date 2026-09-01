"use client";

/**
 * ReviewsClient — submitted product reviews, filterable by status.
 *
 * Approve / Reject -> PATCH /api/crud update/super-user/review (real sandbox
 * write; sets status APPROVED/REMOVED, matching review-preview-card.component.ts
 * onApprove/onRemove). "Add Review" -> POST /api/crud add/review with
 * adminAdded:true. Edit icon (adminAdded reviews only) -> same PATCH endpoint.
 * "View images" opens a lightbox over the comma-separated productImages list.
 */

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Check, X, Pencil, Images } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataList, DataListColumn, Badge, Button } from "@/components/ui";
import { ReviewDialog } from "./ReviewDialog";
import { ReviewImageLightbox } from "./ReviewImageLightbox";
import type { ReviewRow, ReviewStatus } from "@/lib/admin-api";

const PAGE_SIZE = 20;

function fmtDate(ms: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          style={{ color: i <= rating ? "#E0A93C" : "#E8E4DE" }}
          fill={i <= rating ? "#E0A93C" : "none"}
        />
      ))}
    </span>
  );
}

const statusVariant: Record<ReviewStatus, "amber" | "green" | "red"> = {
  PENDING: "amber",
  APPROVED: "green",
  REMOVED: "red",
};

interface ReviewsClientProps {
  reviews: Record<ReviewStatus, ReviewRow[]>;
}

export function ReviewsClient({ reviews }: ReviewsClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<ReviewStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; review?: ReviewRow } | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);

  const switchTab = (t: ReviewStatus) => {
    setTab(t);
    setSearch("");
    setPage(1);
  };

  const rows = reviews[tab] ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.reviewer.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.productSku.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Real sandbox write. Approve/Reject both PATCH the same endpoint with a
  // different target status, matching review-preview-card.component.ts.
  const setStatus = useCallback(
    async (review: ReviewRow, next: "APPROVED" | "REMOVED") => {
      setBusyId(review.id);
      setActionError(null);
      try {
        const res = await fetch("/api/crud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "update/super-user/review",
            method: "PATCH",
            body: { id: review.id, status: next },
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j?.success === false) {
          throw new Error(j?.message || `Update failed (${res.status})`);
        }
        router.refresh();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Update failed");
      } finally {
        setBusyId(null);
      }
    },
    [router],
  );

  const columns = useMemo<DataListColumn<ReviewRow>[]>(
    () => [
      {
        key: "product",
        label: "Product",
        render: (r) => (
          <div className="flex items-center gap-2.5">
            {r.productImage ? (
              <Image
                src={r.productImage}
                alt={r.productName}
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold"
                style={{ background: "#F3F1ED", color: "#AAA39E" }}
              >
                N/A
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: "#1A1714" }}>
                {r.productName}
              </span>
              <span className="text-[11px]" style={{ color: "#AAA39E" }}>{r.productSku || "—"}</span>
            </div>
          </div>
        ),
      },
      {
        key: "reviewer",
        label: "Reviewer",
        render: (r) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium" style={{ color: "#1A1714" }}>{r.reviewer}</span>
            <span className="text-[11px]" style={{ color: "#AAA39E" }}>
              {[r.city, r.country].filter(Boolean).join(", ") || "—"}
            </span>
          </div>
        ),
      },
      { key: "rating", label: "Rating", render: (r) => <Stars rating={r.rating} /> },
      {
        key: "description",
        label: "Review",
        render: (r) => (
          <span className="text-sm line-clamp-2 max-w-[320px] block" style={{ color: "#635D58" }}>
            {r.description || <span style={{ color: "#D1CCC6" }}>No text</span>}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge>,
      },
      {
        key: "createdAt",
        label: "Submitted",
        render: (r) => (
          <span className="text-sm whitespace-nowrap" style={{ color: "#635D58" }}>{fmtDate(r.createdAt)}</span>
        ),
      },
      {
        key: "actions",
        label: "",
        render: (r) => (
          <div className="flex items-center gap-1.5">
            {r.productImages && (
              <button
                type="button"
                onClick={() =>
                  setLightboxImages(
                    r.productImages
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                title="View images"
                className="rounded-md p-1.5 transition-colors hover:bg-stone-100"
                style={{ color: "#847D77" }}
              >
                <Images className="h-4 w-4" />
              </button>
            )}
            {r.adminAdded && (
              <button
                type="button"
                onClick={() => setDialog({ mode: "edit", review: r })}
                title="Edit review"
                className="rounded-md p-1.5 transition-colors hover:bg-stone-100"
                style={{ color: "#847D77" }}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {r.status !== "APPROVED" && (
              <button
                type="button"
                onClick={() => setStatus(r, "APPROVED")}
                disabled={busyId === r.id}
                title="Approve"
                className="rounded-md p-1.5 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                style={{ color: "#059669" }}
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            {r.status !== "REMOVED" && (
              <button
                type="button"
                onClick={() => setStatus(r, "REMOVED")}
                disabled={busyId === r.id}
                title="Reject / Remove"
                className="rounded-md p-1.5 transition-colors hover:bg-red-50 disabled:opacity-50"
                style={{ color: "#DC2626" }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [busyId, setStatus],
  );

  const tabs: { id: ReviewStatus; label: string }[] = [
    { id: "PENDING", label: "Pending" },
    { id: "APPROVED", label: "Approved" },
    { id: "REMOVED", label: "Removed" },
  ];

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Relationships</span>
      <span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Reviews</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              Product Reviews
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Moderate customer-submitted reviews. Approve/reject write to the
              sandbox test DB only (never live).
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setDialog({ mode: "create" })}>
            + Add Review
          </Button>
        </div>

        {actionError && (
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}
          >
            {actionError}
          </div>
        )}

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: "#E8E4DE" }}>
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2"
                style={{
                  color: isActive ? "#A86120" : "#847D77",
                  borderColor: isActive ? "#A86120" : "transparent",
                }}
              >
                {t.label}
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: isActive ? "#FEF3E2" : "#F3F1ED",
                    color: isActive ? "#A86120" : "#847D77",
                  }}
                >
                  {(reviews[t.id] ?? []).length}
                </span>
              </button>
            );
          })}
        </div>

        <DataList
          data={paged}
          columns={columns}
          getId={(r) => String(r.id)}
          total={filtered.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onSearch={(q) => { setSearch(q); setPage(1); }}
          searchPlaceholder="Search by reviewer, product or text…"
          emptyMessage={search ? `No reviews match "${search}"` : `No ${tab.toLowerCase()} reviews.`}
        />

        {dialog && (
          <ReviewDialog mode={dialog.mode} review={dialog.review} onClose={() => setDialog(null)} />
        )}

        {lightboxImages && (
          <ReviewImageLightbox images={lightboxImages} onClose={() => setLightboxImages(null)} />
        )}
      </div>
    </WeaveShell>
  );
}
