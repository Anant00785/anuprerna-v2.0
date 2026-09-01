"use client";

/**
 * CatalogClient — per-artisan catalogs with item galleries + PDF generation.
 *
 * Each catalog belongs to an artisan and holds catalog items, each with an
 * image gallery (catalogItemMediaList). Clicking a catalog opens a detail
 * drawer showing every item and its images.
 *
 * Catalog PDF generation is a READ/TRIGGER-only action (no data write): the
 * "Generate PDF" button previews the exact POST the server would receive and
 * documents the QUEUED -> RUNNING -> READY polling flow. Nothing is sent to
 * Loom in this build — generation runs on click at launch.
 *
 * Delete is REAL (writes to the sandbox pg copy only, never live Loom):
 *   catalog       -> DELETE delete/catalog/{catalogId}
 *   catalog item  -> DELETE delete/catalog-item/{catalogItemId}
 *   item media    -> DELETE delete/catalog-item-media/{catalogItemMediaId}
 */

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Image as ImageIcon, FileDown, Star, Trash2 } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import {
  DataList,
  DataListColumn,
  KpiStrip,
  Button,
  Badge,
  ConfirmDialog,
} from "@/components/ui";
import { CatalogPayloadDrawer } from "@/components/catalog/CatalogPayloadDrawer";
import { formatCount, formatEpoch, formatPrice } from "@/lib/utils";
import type { ArtisanCatalogRow, CatalogItemRow, CatalogItemMedia } from "@/types/artisan";

const PAGE_SIZE = 25;

interface CatalogClientProps {
  catalogs: ArtisanCatalogRow[];
}

interface ConfirmDeleteState {
  kind: "catalog" | "item" | "media";
  id: number;
  label: string;
}

export function CatalogClient({ catalogs }: CatalogClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ArtisanCatalogRow | null>(null);
  const [pdfFor, setPdfFor] = useState<ArtisanCatalogRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const totalItems = useMemo(
    () => catalogs.reduce((s, c) => s + c.itemCount, 0),
    [catalogs],
  );
  const totalImages = useMemo(
    () => catalogs.reduce((s, c) => s + c.imageCount, 0),
    [catalogs],
  );
  const distinctArtisans = useMemo(
    () => new Set(catalogs.map((c) => c.artisanId)).size,
    [catalogs],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return catalogs;
    const q = search.toLowerCase();
    return catalogs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.artisanName.toLowerCase().includes(q),
    );
  }, [catalogs, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pdfPayload = useCallback((c: ArtisanCatalogRow) => {
    return {
      endpoint: `/add/catalog-pdf-generation/artisan/${c.artisanId}`,
      method: "POST",
      note:
        "Server-side trigger only. Returns a generation record with status QUEUED; " +
        "the UI then polls GET /wait/catalog-pdf-generation/{id} (long-poll) or " +
        "GET /get/catalog-pdf-generation/{id} until status becomes READY (downloadUrl set) " +
        "or FAILED. No data is written by this build — generation runs on click at launch.",
      body: {
        artisanId: c.artisanId,
        catalogId: c.id,
        catalogName: c.name,
      },
    };
  }, []);

  // Real sandbox delete. Branches by kind; writes ONLY to sandbox pg via
  // /api/crud, never live Loom. Splices local `detail` state optimistically
  // so the open drawer (a local snapshot) doesn't show a stale row after
  // router.refresh() re-renders the underlying server data.
  const doDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const { kind, id } = confirmDelete;
    setDeleting(true);
    setDeleteError(null);
    try {
      const path =
        kind === "catalog"
          ? `delete/catalog/${id}`
          : kind === "item"
            ? `delete/catalog-item/${id}`
            : `delete/catalog-item-media/${id}`;
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method: "DELETE" }),
      });
      const j = await res.json().catch(() => ({}));
      const ok = res.ok && j?.success !== false;
      if (!ok) throw new Error(j?.message || `Delete failed (${res.status})`);

      if (kind === "catalog") {
        setDetail((d) => (d && d.id === id ? null : d));
      } else if (kind === "item") {
        setDetail((d) =>
          d ? { ...d, items: d.items.filter((it) => it.id !== id) } : d,
        );
      } else {
        setDetail((d) =>
          d
            ? {
                ...d,
                items: d.items.map((it) => ({
                  ...it,
                  media: it.media.filter((m) => m.id !== id),
                })),
              }
            : d,
        );
      }

      setConfirmDelete(null);
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete, router]);

  const columns = useMemo<DataListColumn<ArtisanCatalogRow>[]>(
    () => [
      {
        key: "name",
        label: "Catalog",
        render: (c) => (
          <div className="flex flex-col">
            <button
              type="button"
              className="font-medium text-sm text-left hover:underline"
              style={{ color: "#1A1714" }}
              onClick={() => setDetail(c)}
            >
              {c.name || "Untitled catalog"}
            </button>
            {c.defaultCatalog && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-[11px]" style={{ color: "#A86120" }}>
                <Star className="h-3 w-3" /> Default
              </span>
            )}
          </div>
        ),
      },
      {
        key: "artisan",
        label: "Artisan",
        render: (c) => (
          <span className="text-sm" style={{ color: "#635D58" }}>
            {c.artisanName || "—"}
          </span>
        ),
      },
      {
        key: "items",
        label: "Items",
        headerClassName: "w-20",
        render: (c) => (
          <span className="text-sm tabular-nums" style={{ color: "#635D58" }}>
            {formatCount(c.itemCount)}
          </span>
        ),
      },
      {
        key: "images",
        label: "Images",
        headerClassName: "w-24",
        render: (c) => (
          <span className="inline-flex items-center gap-1 text-sm tabular-nums" style={{ color: "#635D58" }}>
            <ImageIcon className="h-3.5 w-3.5" style={{ color: "#AAA39E" }} />
            {formatCount(c.imageCount)}
          </span>
        ),
      },
      {
        key: "updated",
        label: "Updated",
        headerClassName: "w-28",
        render: (c) => (
          <span className="text-xs" style={{ color: "#847D77" }}>
            {formatEpoch(c.updatedAt || c.createdAt)}
          </span>
        ),
      },
      {
        key: "pdf",
        label: "",
        headerClassName: "w-32",
        render: (c) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPdfFor(c)}
          >
            <FileDown className="h-3.5 w-3.5" /> PDF
          </Button>
        ),
      },
      {
        key: "actions",
        label: "",
        headerClassName: "w-12",
        cellClassName: "text-right",
        render: (c) => (
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-red-50 transition-colors"
            style={{ color: "#AAA39E" }}
            title="Delete catalog"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete({ kind: "catalog", id: c.id, label: c.name || "Untitled catalog" });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/artisans" style={{ color: "#847D77" }}>
            Artisans
          </Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            Catalog
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              Artisan Catalog
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Per-artisan product catalogs with item galleries. Generate a
              shareable catalog PDF for any artisan.
            </p>
          </div>
        </div>

        <KpiStrip
          items={[
            { label: "Catalogs", value: formatCount(catalogs.length), icon: <FolderOpen className="h-4 w-4" /> },
            { label: "Catalog Items", value: formatCount(totalItems) },
            { label: "Images", value: formatCount(totalImages), icon: <ImageIcon className="h-4 w-4" /> },
            { label: "Artisans", value: formatCount(distinctArtisans) },
          ]}
        />

        <DataList
          data={paged}
          columns={columns}
          getId={(c) => String(c.id)}
          total={filtered.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onSearch={(q) => {
            setSearch(q);
            setPage(1);
          }}
          searchPlaceholder="Search catalogs by name or artisan…"
          emptyMessage={search ? `No catalogs match "${search}"` : "No catalogs found."}
        />

        {/* Detail drawer — items + galleries */}
        {detail && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={() => setDetail(null)} />
            <div
              className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl border-l"
              style={{ borderColor: "#E8E4DE" }}
            >
              <div
                className="flex items-start justify-between border-b px-5 py-4"
                style={{ borderColor: "#E8E4DE" }}
              >
                <div>
                  <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
                    {detail.name || "Untitled catalog"}
                  </h3>
                  <p className="mt-0.5 text-sm" style={{ color: "#847D77" }}>
                    {detail.artisanName} · {formatCount(detail.itemCount)} items ·{" "}
                    {formatCount(detail.imageCount)} images
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPdfFor(detail)}>
                    <FileDown className="h-3.5 w-3.5" /> Generate PDF
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setConfirmDelete({ kind: "catalog", id: detail.id, label: detail.name || "Untitled catalog" })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                  <button
                    onClick={() => setDetail(null)}
                    className="text-2xl leading-none"
                    style={{ color: "#847D77" }}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
                {detail.description && (
                  <p className="text-sm" style={{ color: "#635D58" }}>
                    {detail.description}
                  </p>
                )}
                {detail.items.length === 0 ? (
                  <p className="py-10 text-center text-sm" style={{ color: "#AAA39E" }}>
                    This catalog has no items yet.
                  </p>
                ) : (
                  detail.items.map((item) => (
                    <CatalogItemCard
                      key={item.id}
                      item={item}
                      onDeleteItem={(it) =>
                        setConfirmDelete({ kind: "item", id: it.id, label: it.name || "Unnamed item" })
                      }
                      onDeleteMedia={(m) => setConfirmDelete({ kind: "media", id: m.id, label: "this image" })}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PDF generation preview (read/trigger-only) */}
        {pdfFor && (
          <CatalogPayloadDrawer
            payload={pdfPayload(pdfFor)}
            onClose={() => setPdfFor(null)}
            entityName="Catalog PDF"
          />
        )}

        {/* Delete confirm — shared across catalog / item / media */}
        <ConfirmDialog
          open={!!confirmDelete}
          title={
            confirmDelete?.kind === "catalog"
              ? "Delete catalog?"
              : confirmDelete?.kind === "item"
                ? "Delete catalog item?"
                : "Delete image?"
          }
          message={
            confirmDelete ? (
              <>
                &ldquo;{confirmDelete.label}&rdquo; will be permanently removed from the sandbox
                database. This cannot be undone.
              </>
            ) : null
          }
          confirmLabel="Delete"
          danger
          loading={deleting}
          error={deleteError}
          onConfirm={doDelete}
          onCancel={() => {
            setConfirmDelete(null);
            setDeleteError(null);
          }}
        />
      </div>
    </WeaveShell>
  );
}

function CatalogItemCard({
  item,
  onDeleteItem,
  onDeleteMedia,
}: {
  item: CatalogItemRow;
  onDeleteItem: (item: CatalogItemRow) => void;
  onDeleteMedia: (media: CatalogItemMedia) => void;
}) {
  const hero = item.media.find((m) => m.hero) ?? item.media[0];
  const rest = item.media.filter((m) => m.id !== hero?.id);
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm" style={{ color: "#1A1714" }}>
            {item.name || "Unnamed item"}
          </p>
          <p className="text-xs" style={{ color: "#847D77" }}>
            {formatPrice(item.price, item.currency)} · {formatCount(item.quantity)} {item.unit.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="stone">{item.media.length} img</Badge>
          <button
            type="button"
            className="rounded-md p-1 hover:bg-red-50 transition-colors"
            style={{ color: "#AAA39E" }}
            title="Delete item"
            onClick={() => onDeleteItem(item)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {item.description && (
        <p className="mt-2 text-xs" style={{ color: "#635D58" }}>
          {item.description}
        </p>
      )}
      {item.media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hero && (
            <CatalogImage url={hero.mediaUrl} alt={item.name} hero onDelete={() => onDeleteMedia(hero)} />
          )}
          {rest.map((m) => (
            <CatalogImage key={m.id} url={m.mediaUrl} alt={item.name} onDelete={() => onDeleteMedia(m)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogImage({
  url,
  alt,
  hero,
  onDelete,
}: {
  url: string;
  alt: string;
  hero?: boolean;
  onDelete?: () => void;
}) {
  if (!url) return null;
  return (
    <div className="relative group">
      <Image
        src={url}
        alt={alt}
        width={hero ? 96 : 72}
        height={hero ? 96 : 72}
        className="rounded-lg object-cover border"
        style={{
          borderColor: hero ? "#A86120" : "#E8E4DE",
          width: hero ? 96 : 72,
          height: hero ? 96 : 72,
        }}
        unoptimized
      />
      {hero && (
        <span
          className="absolute left-1 top-1 inline-flex items-center rounded px-1 text-[9px] font-semibold"
          style={{ background: "#A86120", color: "white" }}
        >
          HERO
        </span>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Delete image"
          className="absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none group-hover:flex"
          style={{ background: "#B91C1C", color: "white" }}
        >
          ×
        </button>
      )}
    </div>
  );
}
