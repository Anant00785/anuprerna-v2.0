"use client";

/**
 * BlogTypesClient — list + create/edit drawer for Blog Types.
 *
 * Fields: name (required only).
 * Save -> POST /api/crud add/blog-content-type (create) or PATCH
 * update/blog-content-type (edit, id in body); no delete endpoint exists
 * for blog types (NO-BACKEND), so no delete UI is offered here. Writes ONLY
 * to the sandbox pg copy (never live Loom).
 */

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WeaveShell } from "@/components/weave/WeaveShell";
import {
  DataList,
  DataListColumn,
  FormField,
  TextInput,
  Button,
} from "@/components/ui";
import type { BlogTypeItem } from "@/types/content";

// ── Form shape ─────────────────────────────────────────────────────────────

interface TypeForm {
  name: string;
}

interface DrawerState {
  mode: "create" | "edit";
  id?: number;
  form: TypeForm;
}

const EMPTY_FORM: TypeForm = { name: "" };
const PAGE_SIZE = 50;

// ── Component ──────────────────────────────────────────────────────────────

interface BlogTypesClientProps {
  types: BlogTypeItem[];
}

export function BlogTypesClient({ types }: BlogTypesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return types;
    const q = search.toLowerCase();
    return types.filter((t) => t.name.toLowerCase().includes(q));
  }, [types, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = useCallback(() => {
    setDrawer({ mode: "create", form: { ...EMPTY_FORM } });
    setSaveError(null);
  }, []);

  const openEdit = useCallback((item: BlogTypeItem) => {
    setDrawer({
      mode: "edit",
      id: item.id,
      form: { name: item.name ?? "" },
    });
    setSaveError(null);
  }, []);

  const closeDrawer = () => {
    setDrawer(null);
    setSaveError(null);
  };

  const updateForm = (patch: Partial<TypeForm>) => {
    setDrawer((d) => (d ? { ...d, form: { ...d.form, ...patch } } : null));
  };

  // Real sandbox save. create -> POST add/blog-content-type; edit -> PATCH
  // update/blog-content-type (id lives in the body, not the URL). Writes
  // ONLY to sandbox pg via /api/crud.
  const doSave = useCallback(async () => {
    if (!drawer || !drawer.form.name.trim()) return;
    const isEdit = drawer.mode === "edit";
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: isEdit ? "update/blog-content-type" : "add/blog-content-type",
          method: isEdit ? "PATCH" : "POST",
          body: {
            ...(isEdit ? { id: drawer.id } : {}),
            name: drawer.form.name,
          },
        }),
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
  }, [drawer, router]);

  const columns = useMemo<DataListColumn<BlogTypeItem>[]>(
    () => [
      {
        key: "name",
        label: "Name",
        render: (row) => (
          <button
            type="button"
            className="font-medium text-sm text-left hover:underline"
            style={{ color: "#1A1714" }}
            onClick={() => openEdit(row)}
          >
            {row.name}
          </button>
        ),
      },
      {
        key: "categoryCount",
        label: "Category Count",
        render: (row) => (
          <span className="text-sm" style={{ color: "#635D58" }}>
            {row.blogContentCatogoryList?.length ?? 0}
          </span>
        ),
      },
      {
        key: "created",
        label: "Created",
        render: (row) => (
          <span className="text-sm" style={{ color: "#847D77" }}>
            {new Date(row.timeOfCreation).toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
    ],
    [openEdit],
  );

  return (
    <WeaveShell
      breadcrumb={
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "#847D77" }}
        >
          <Link href="/content" style={{ color: "#847D77" }}>
            Content
          </Link>
          <span>/</span>
          <Link href="/content/blogs" style={{ color: "#847D77" }}>
            Blogs
          </Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            Types
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="font-serif text-2xl font-semibold"
              style={{ color: "#1A1714" }}
            >
              Blog Types
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Top-level type taxonomy for blog categories.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Type
          </Button>
        </div>

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
          searchPlaceholder="Search types by name…"
          emptyMessage={
            search ? `No types match "${search}"` : "No blog types found."
          }
        />

        {/* Create / edit drawer */}
        {drawer && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div
              className="absolute inset-0 bg-black/20"
              onClick={closeDrawer}
            />
            <div
              className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl border-l"
              style={{ borderColor: "#E8E4DE" }}
            >
              <div
                className="flex items-center justify-between border-b px-5 py-3"
                style={{ borderColor: "#E8E4DE" }}
              >
                <h3
                  className="font-serif text-base font-semibold"
                  style={{ color: "#1A1714" }}
                >
                  {drawer.mode === "create"
                    ? "New Blog Type"
                    : `Edit Blog Type #${drawer.id}`}
                </h3>
                <button
                  onClick={closeDrawer}
                  className="text-xl leading-none"
                  style={{ color: "#847D77" }}
                >
                  ×
                </button>
              </div>

              <div className="px-5 pt-4">
                <div
                  className="rounded-lg border px-3 py-2 text-xs"
                  style={{
                    background: "#FFF8F0",
                    borderColor: "#FDE9C5",
                    color: "#8A4C19",
                  }}
                >
                  Preview — you can edit; saves to the sandbox test DB only (never live).
                </div>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
                <FormField label="Type Name" required>
                  <TextInput
                    value={drawer.form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="e.g. Sustainability"
                    autoFocus
                  />
                </FormField>
              </div>

              <div
                className="flex items-center justify-end gap-3 border-t px-5 py-3"
                style={{ borderColor: "#E8E4DE" }}
              >
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
                  disabled={saving || !drawer.form.name.trim()}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WeaveShell>
  );
}
