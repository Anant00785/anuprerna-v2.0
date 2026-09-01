"use client";

/**
 * ProfileCrud — generic list + create/edit drawer scaffold shared by all seven
 * profile types. Owns search, pagination, the right-side drawer and the
 * build-mode notice. Each profile type supplies its own list columns, an
 * empty-form factory, a toForm mapper, a validity check, a payload builder
 * (endpoint/method/body) and a renderForm body (which uses FormField +
 * RepeatableRows). Save POSTs/PATCHes buildPayload's output to /api/crud —
 * every target endpoint writes ONLY to the sandbox pg copy (never live
 * Loom). Row-delete is opt-in via `deleteEndpoint` (a function so callers
 * can build the per-type id-suffixed path); omit it for profile types with
 * no delete endpoint wired yet.
 */

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  DataList,
  DataListColumn,
  Button,
  ConfirmDialog,
} from "@/components/ui";

type DrawerMode = "create" | "edit";

export interface ProfilePayload {
  endpoint: string;
  method: string;
  body: Record<string, unknown>;
}

export interface ProfileCrudProps<T extends { id: number }, F> {
  title: string;
  description?: string;
  entitySingular: string;
  items: T[];
  /** String used for client-side search matching. */
  searchText: (item: T) => string;
  columns: DataListColumn<T>[];
  /** Blank form used when creating. */
  emptyForm: F;
  /** Map an existing item into editable form state. */
  toForm: (item: T) => F;
  /** Whether the form is valid enough to save. */
  isValid: (form: F) => boolean;
  /** Assemble the sandbox write-payload (endpoint/method/body). */
  buildPayload: (mode: DrawerMode, id: number | undefined, form: F) => ProfilePayload;
  /** Render the drawer body fields. */
  renderForm: (form: F, update: (patch: Partial<F>) => void) => React.ReactNode;
  /** Drawer width utility (default max-w-md). */
  drawerWidth?: string;
  /** Hide the section header (used inside a tab panel). */
  hideHeader?: boolean;
  /**
   * Builds the DELETE path (e.g. `(id) => `/delete/badge-profile/${id}`),
   * writes ONLY to sandbox pg via /api/crud. Omit to hide row/drawer delete
   * for profile types with no delete endpoint wired yet.
   */
  deleteEndpoint?: (id: number) => string;
}

const PAGE_SIZE = 50;

export function ProfileCrud<T extends { id: number }, F>({
  title,
  description,
  entitySingular,
  items,
  searchText,
  columns,
  emptyForm,
  toForm,
  isValid,
  buildPayload,
  renderForm,
  drawerWidth = "max-w-md",
  hideHeader = false,
  deleteEndpoint,
}: ProfileCrudProps<T, F>) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<{ mode: DrawerMode; id?: number; form: F } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => searchText(i).toLowerCase().includes(q));
  }, [items, search, searchText]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = useCallback(() => {
    setDrawer({ mode: "create", form: emptyForm });
    setSaveError(null);
  }, [emptyForm]);

  const openEdit = useCallback(
    (item: T) => {
      setDrawer({ mode: "edit", id: item.id, form: toForm(item) });
      setSaveError(null);
    },
    [toForm],
  );

  const closeDrawer = () => {
    setDrawer(null);
    setSaveError(null);
  };

  const update = (patch: Partial<F>) =>
    setDrawer((d) => (d ? { ...d, form: { ...d.form, ...patch } } : null));

  // Real sandbox save. buildPayload() supplies the per-type endpoint/method/
  // body (create -> POST add/…; edit -> PATCH update/… with the id in the
  // URL or body depending on the profile type). Writes ONLY to sandbox pg
  // via /api/crud.
  const doSave = useCallback(async () => {
    if (!drawer || !isValid(drawer.form)) return;
    const { endpoint, method, body } = buildPayload(drawer.mode, drawer.id, drawer.form);
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: String(endpoint).replace(/^\/+/, ""), method, body }),
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
  }, [drawer, isValid, buildPayload, router]);

  const doDelete = useCallback(async () => {
    if (!confirmDelete || !deleteEndpoint) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: deleteEndpoint(confirmDelete.id).replace(/^\/+/, ""),
          method: "DELETE",
        }),
      });
      const j = await res.json().catch(() => ({}));
      const ok = res.ok && j?.success !== false;
      if (!ok) throw new Error(j?.message || `Delete failed (${res.status})`);
      setConfirmDelete(null);
      closeDrawer();
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete, deleteEndpoint, router]);

  const allColumns = useMemo<DataListColumn<T>[]>(() => {
    const cols: DataListColumn<T>[] = [
      ...columns,
      {
        key: "__edit",
        label: "",
        headerClassName: "w-16",
        render: (row) => (
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="text-sm font-medium hover:underline"
            style={{ color: "#A86120" }}
          >
            Edit
          </button>
        ),
      },
    ];
    if (deleteEndpoint) {
      cols.push({
        key: "__delete",
        label: "",
        headerClassName: "w-12",
        cellClassName: "text-right",
        render: (row) => (
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-red-50 transition-colors"
            style={{ color: "#AAA39E" }}
            title={`Delete ${searchText(row)}`}
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete({ id: row.id, name: searchText(row) });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ),
      });
    }
    return cols;
  }, [columns, deleteEndpoint, openEdit, searchText]);

  return (
    <div className="flex flex-col gap-6">
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              {title}
            </h1>
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

      {hideHeader && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New {entitySingular}
          </Button>
        </div>
      )}

      <DataList
        data={paged}
        columns={allColumns}
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
          search ? `No ${title.toLowerCase()} match "${search}"` : `No ${title.toLowerCase()} yet.`
        }
      />

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={closeDrawer} />
          <div
            className={`relative flex h-full w-full ${drawerWidth} flex-col bg-white shadow-xl border-l`}
            style={{ borderColor: "#E8E4DE" }}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-3"
              style={{ borderColor: "#E8E4DE" }}
            >
              <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
                {drawer.mode === "create"
                  ? `New ${entitySingular}`
                  : `Edit ${entitySingular} #${drawer.id}`}
              </h3>
              <button onClick={closeDrawer} className="text-xl leading-none" style={{ color: "#847D77" }}>
                ×
              </button>
            </div>

            <div className="px-5 pt-4">
              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
              >
                Preview — you can edit; saves to the sandbox test DB only (never live).
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
              {renderForm(drawer.form, update)}
            </div>

            <div
              className="flex items-center justify-between gap-3 border-t px-5 py-3"
              style={{ borderColor: "#E8E4DE" }}
            >
              {drawer.mode === "edit" && deleteEndpoint && drawer.id != null ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setConfirmDelete({ id: drawer.id as number, name: `${entitySingular} #${drawer.id}` })
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
                  disabled={!isValid(drawer.form) || saving}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
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
}
