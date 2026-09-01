"use client";

/**
 * SimpleItemCrud — reusable list + create/edit drawer for catalog items
 * that have only a single "name" field (SKU Groups, Special Status, Tags,
 * and indirectly each filter type: Materials, Colors, Patterns).
 *
 * Accepts the fetched items from a server component, handles client-side
 * search + pagination, and opens a right-side drawer for create/edit.
 * On "Validate", shows CatalogPayloadDrawer with the assembled payload
 * (writes are disabled in build mode — nothing is sent to Loom).
 *
 * shell=false suppresses the WeaveShell wrapper (for embedding in tab panels).
 * hideHeader=true additionally suppresses the section heading + description
 * (used when the parent tab UI already contextualises the section).
 *
 * Row-delete: pass `deleteEndpoint` (e.g. "/delete/sku-group") to show a
 * per-row delete affordance wired through /api/crud (`DELETE {deleteEndpoint}/{id}`).
 * Omit it when the sandbox backend has no delete endpoint yet (NO-BACKEND
 * entities — colors, patterns, tags, faqs) so no dead button is shown.
 */

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import {
  DataList,
  DataListColumn,
  FormField,
  TextInput,
  Button,
  ConfirmDialog,
} from "@/components/ui";
import { CatalogPayloadDrawer } from "@/components/catalog/CatalogPayloadDrawer";
import type { CatalogSimpleItem } from "@/types/catalog";

export interface SimpleItemCrudProps {
  /** Page heading, e.g. "SKU Groups" */
  title: string;
  /** Optional subtitle shown under the heading */
  description?: string;
  /** Singular name for form labels, e.g. "SKU Group" */
  entitySingular: string;
  /** Breadcrumb label for this section, e.g. "SKU Groups" */
  breadcrumbSection: string;
  /** Href for this section's breadcrumb link */
  breadcrumbHref: string;
  /** Items fetched server-side */
  items: CatalogSimpleItem[];
  /** Loom endpoint that would receive the create payload, e.g. "/add/sku-group" */
  writeEndpoint: string;
  /** Loom endpoint base for updates, e.g. "/update/sku-group" */
  updateEndpoint?: string;
  /**
   * Loom endpoint base for deletes, e.g. "/delete/sku-group" (id appended,
   * `DELETE {deleteEndpoint}/{id}`). Omit when no backend delete endpoint
   * exists yet — the row-delete affordance is hidden entirely in that case.
   */
  deleteEndpoint?: string;
  /**
   * Whether to wrap in WeaveShell (default true).
   * Set false when embedded inside another WeaveShell page (e.g. filter tabs).
   */
  shell?: boolean;
  /**
   * When shell=false, also hide the section heading + description.
   * Useful when the parent tab UI already shows which section is active.
   */
  hideHeader?: boolean;
  /**
   * Optional second scalar field beyond "name" (e.g. Colors' required
   * "hex"). When set, the create/edit drawer shows an extra text input for
   * item[extraField.key], and it travels in the create/update payload
   * alongside name. Fixed 2026-07-06: Colors' backend addColor()/updateColor()
   * hard-require hex; the UI previously sent only {name}, so every color
   * create failed with "hex is required".
   */
  extraField?: {
    key: string;
    label: string;
    placeholder?: string;
    required?: boolean;
  };
}

type DrawerMode = "create" | "edit";

interface DrawerState {
  mode: DrawerMode;
  id?: number;
  name: string;
  /** Value of the optional extraField (e.g. Colors' hex), unused otherwise. */
  extra?: string;
}

interface DeleteTarget {
  id: number;
  name: string;
}

const PAGE_SIZE = 50;

export function SimpleItemCrud({
  title,
  description,
  entitySingular,
  breadcrumbSection,
  breadcrumbHref,
  items,
  writeEndpoint,
  updateEndpoint,
  deleteEndpoint,
  shell = true,
  hideHeader = false,
  extraField,
}: SimpleItemCrudProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [showPayload, setShowPayload] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = useCallback(() => {
    setDrawer({ mode: "create", name: "", extra: extraField ? "" : undefined });
    setShowPayload(false);
  }, [extraField]);

  const openEdit = useCallback((item: CatalogSimpleItem) => {
    const extra = extraField
      ? String((item as unknown as Record<string, unknown>)[extraField.key] ?? "")
      : undefined;
    setDrawer({ mode: "edit", id: item.id, name: item.name, extra });
    setShowPayload(false);
  }, [extraField]);

  const closeDrawer = useCallback(() => {
    setDrawer(null);
    setShowPayload(false);
  }, []);

  const endpoint =
    drawer?.mode === "edit" && updateEndpoint
      ? `${updateEndpoint}/${drawer.id}`
      : writeEndpoint;

  const buildPayload = useCallback(() => {
    if (!drawer) return {};
    const extraProps = extraField ? { [extraField.key]: drawer.extra ?? "" } : {};
    return drawer.mode === "create"
      ? { name: drawer.name, ...extraProps }
      : { id: drawer.id, name: drawer.name, ...extraProps };
  }, [drawer, extraField]);

  // Real sandbox save. create -> POST add/<entity>; edit -> PATCH update/<entity>
  // (id travels in the body). Every target endpoint writes to sandbox pg only.
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const doSave = useCallback(async () => {
    if (!drawer || !drawer.name.trim()) return;
    if (extraField?.required && !drawer.extra?.trim()) return;
    const isEdit = drawer.mode === "edit";
    const path = isEdit ? (updateEndpoint || writeEndpoint) : writeEndpoint;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method: isEdit ? "PATCH" : "POST", body: buildPayload() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || `Save failed (${res.status})`);
      closeDrawer();
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [drawer, updateEndpoint, writeEndpoint, buildPayload, closeDrawer, router, extraField]);

  // Row delete. DELETE {deleteEndpoint}/{id} via /api/crud. Some sandbox
  // delete endpoints (e.g. material) always answer HTTP 200 with an inner
  // `filterDeleteResult.success` flag rather than a top-level one — check
  // both shapes so a "not found" / blocked delete surfaces as an error
  // instead of silently closing the dialog.
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const doDelete = useCallback(async () => {
    if (!confirmDelete || !deleteEndpoint) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `${deleteEndpoint}/${confirmDelete.id}`, method: "DELETE" }),
      });
      const j = await res.json().catch(() => ({}));
      const inner = j?.filterDeleteResult;
      const ok = res.ok && (inner ? inner.success !== false : j?.success !== false);
      if (!ok) throw new Error(inner?.message || j?.message || `Delete failed (${res.status})`);
      setConfirmDelete(null);
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete, deleteEndpoint, router]);

  const columns = useMemo<DataListColumn<CatalogSimpleItem>[]>(() => {
    const base: DataListColumn<CatalogSimpleItem>[] = [
      {
        key: "id",
        label: "ID",
        headerClassName: "w-20",
        render: (row) => (
          <span
            className="font-mono text-xs tabular-nums"
            style={{ color: "#AAA39E" }}
          >
            #{row.id}
          </span>
        ),
      },
      {
        key: "name",
        label: "Name",
        render: (row) => (
          <button
            type="button"
            className="flex items-center gap-2 font-medium text-sm text-left hover:underline"
            style={{ color: "#1A1714" }}
            onClick={() => openEdit(row)}
          >
            {row.hex && (
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border"
                style={{ background: row.hex, borderColor: "#E8E4DE" }}
                aria-hidden
              />
            )}
            {row.name}
          </button>
        ),
      },
    ];
    if (deleteEndpoint) {
      base.push({
        key: "actions",
        label: "",
        headerClassName: "w-12",
        cellClassName: "text-right",
        render: (row) => (
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-red-50 transition-colors"
            style={{ color: "#AAA39E" }}
            title={`Delete ${entitySingular.toLowerCase()}`}
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete({ id: row.id, name: row.name });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ),
      });
    }
    return base;
  }, [openEdit, deleteEndpoint, entitySingular]);

  const content = (
    <div className="flex flex-col gap-6">
      {/* Section header — suppressed when hideHeader=true (embedded tab) */}
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* h2 when embedded (shell=false), h1 when standalone page */}
            {shell ? (
              <h1
                className="font-serif text-2xl font-semibold"
                style={{ color: "#1A1714" }}
              >
                {title}
              </h1>
            ) : (
              <h2
                className="font-serif text-xl font-semibold"
                style={{ color: "#1A1714" }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
                {description}
              </p>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New {entitySingular}
          </Button>
        </div>
      )}

      {/* When header is hidden, still show the New button in a compact row */}
      {hideHeader && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New {entitySingular}
          </Button>
        </div>
      )}

      {/* List */}
      <DataList
        data={paged}
        columns={columns}
        getId={(r) => String(r.id)}
        total={filtered.length}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
        emptyMessage={
          search
            ? `No ${title.toLowerCase()} match "${search}"`
            : `No ${title.toLowerCase()} yet.`
        }
      />

      {/* Edit / create drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={closeDrawer}
          />
          <div
            className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-xl border-l"
            style={{ borderColor: "#E8E4DE" }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between border-b px-5 py-3"
              style={{ borderColor: "#E8E4DE" }}
            >
              <h3
                className="font-serif text-base font-semibold"
                style={{ color: "#1A1714" }}
              >
                {drawer.mode === "create"
                  ? `New ${entitySingular}`
                  : `Edit ${entitySingular} #${drawer.id}`}
              </h3>
              <button
                onClick={closeDrawer}
                className="text-xl leading-none"
                style={{ color: "#847D77" }}
              >
                ×
              </button>
            </div>

            {/* Preview notice */}
            <div className="px-5 pt-4">
              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{
                  background: "#FFF8F0",
                  borderColor: "#FDE9C5",
                  color: "#8A4C19",
                }}
              >
                Preview — you can edit; saves to the sandbox test DB only (never live). "Validate" previews the payload.
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
              <FormField label="Name" required>
                <TextInput
                  value={drawer.name}
                  onChange={(e) =>
                    setDrawer((d) => (d ? { ...d, name: e.target.value } : null))
                  }
                  placeholder={`Enter ${entitySingular.toLowerCase()} name`}
                  autoFocus
                />
              </FormField>

              {extraField && (
                <FormField label={extraField.label} required={extraField.required}>
                  <div className="flex items-center gap-2">
                    <TextInput
                      value={drawer.extra ?? ""}
                      onChange={(e) =>
                        setDrawer((d) => (d ? { ...d, extra: e.target.value } : null))
                      }
                      placeholder={extraField.placeholder}
                    />
                    {extraField.key === "hex" && drawer.extra?.trim() && (
                      <span
                        className="h-8 w-8 shrink-0 rounded-md border"
                        style={{ background: drawer.extra, borderColor: "#E8E4DE" }}
                        aria-hidden
                      />
                    )}
                  </div>
                </FormField>
              )}

              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{
                  background: "#FAF9F7",
                  borderColor: "#E8E4DE",
                  color: "#635D58",
                }}
              >
                <span className="font-medium">Endpoint: </span>
                <span className="font-mono">{endpoint}</span>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex items-center justify-between gap-3 border-t px-5 py-3"
              style={{ borderColor: "#E8E4DE" }}
            >
              {drawer.mode === "edit" && deleteEndpoint && drawer.id != null ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setConfirmDelete({ id: drawer.id as number, name: drawer.name })
                  }
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={closeDrawer} size="sm">
                  Cancel
                </Button>
                {saveError && (
                  <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{saveError}</span>
                )}
                <Button
                  variant="primary"
                  onClick={doSave}
                  size="sm"
                  disabled={saving || !drawer.name.trim() || Boolean(extraField?.required && !drawer.extra?.trim())}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payload preview */}
      {showPayload && drawer && (
        <CatalogPayloadDrawer
          payload={{ endpoint, method: drawer.mode === "create" ? "POST" : "PUT", body: buildPayload() }}
          onClose={() => setShowPayload(false)}
          entityName={entitySingular}
        />
      )}

      {/* Delete confirm — shared row-delete affordance (list row trash icon + drawer Delete button) */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete ${entitySingular}?`}
        message={
          confirmDelete ? (
            <>
              &ldquo;{confirmDelete.name}&rdquo; will be permanently removed from the sandbox
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
  );

  if (!shell) return content;

  return (
    <WeaveShell
      breadcrumb={
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "#847D77" }}
        >
          <span>Catalog</span>
          <span>/</span>
          <Link href={breadcrumbHref} style={{ color: "#847D77" }}>
            {breadcrumbSection}
          </Link>
        </div>
      }
    >
      {content}
    </WeaveShell>
  );
}
