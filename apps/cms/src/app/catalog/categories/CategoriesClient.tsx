"use client";

/**
 * CategoriesClient — list + create/edit drawer for Product Categories.
 *
 * Fields (from Angular manage-product-category template):
 *   name (required), icon (image URL), socialImage (image URL),
 *   metaTitle, metaDescription.
 *
 * Save -> POST /api/crud add/category (create) or PATCH update/category/{id}
 * (edit); Delete -> DELETE /api/crud delete/category/{id}. Every target
 * endpoint writes ONLY to the sandbox pg copy (never live Loom).
 */

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import {
  DataList,
  DataListColumn,
  FormField,
  TextInput,
  Textarea,
  Button,
  Badge,
  ConfirmDialog,
  InlineImageUploadButton,
} from "@/components/ui";
import type { CatalogCategory } from "@/types/catalog";

interface CategoryForm {
  name: string;
  icon: string;
  socialImage: string;
  metaTitle: string;
  metaDescription: string;
}

interface DrawerState {
  mode: "create" | "edit";
  id?: number;
  form: CategoryForm;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  icon: "",
  socialImage: "",
  metaTitle: "",
  metaDescription: "",
};

const PAGE_SIZE = 50;

interface CategoriesClientProps {
  items: CatalogCategory[];
}

export function CategoriesClient({ items }: CategoriesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.metaTitle ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = useCallback(() => {
    setDrawer({ mode: "create", form: { ...EMPTY_FORM } });
    setSaveError(null);
  }, []);

  const openEdit = useCallback((item: CatalogCategory) => {
    setDrawer({
      mode: "edit",
      id: item.id,
      form: {
        name: item.name ?? "",
        icon: item.icon ?? "",
        socialImage: item.socialImage ?? "",
        metaTitle: item.metaTitle ?? "",
        metaDescription: item.metaDescription ?? "",
      },
    });
    setSaveError(null);
  }, []);

  const closeDrawer = () => {
    setDrawer(null);
    setSaveError(null);
  };

  const updateForm = (patch: Partial<CategoryForm>) => {
    setDrawer((d) => (d ? { ...d, form: { ...d.form, ...patch } } : null));
  };

  const buildBody = () => {
    if (!drawer) return {};
    return {
      ...(drawer.mode === "edit" ? { id: drawer.id } : {}),
      name: drawer.form.name,
      icon: drawer.form.icon,
      socialImage: drawer.form.socialImage,
      metaTitle: drawer.form.metaTitle,
      metaDescription: drawer.form.metaDescription,
    };
  };

  // Real sandbox save. create -> POST add/category; edit -> PATCH
  // update/category/{id}. Writes ONLY to sandbox pg via /api/crud.
  const doSave = useCallback(async () => {
    if (!drawer || !drawer.form.name.trim()) return;
    const isEdit = drawer.mode === "edit";
    const path = isEdit ? `update/category/${drawer.id}` : "add/category";
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method: isEdit ? "PATCH" : "POST", body: buildBody() }),
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

  const doDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `delete/category/${confirmDelete.id}`, method: "DELETE" }),
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
  }, [confirmDelete, router]);

  const columns = useMemo<DataListColumn<CatalogCategory>[]>(
    () => [
      {
        key: "icon",
        label: "Icon",
        headerClassName: "w-14",
        render: (row) =>
          row.icon ? (
            <Image
              src={row.icon}
              alt={row.name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
              unoptimized
            />
          ) : (
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: "#F3F1ED", color: "#AAA39E" }}
            >
              {row.name.slice(0, 2)}
            </div>
          ),
      },
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
        key: "metaTitle",
        label: "Meta Title",
        render: (row) =>
          row.metaTitle ? (
            <span className="text-sm truncate max-w-xs" style={{ color: "#635D58" }}>
              {row.metaTitle}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "#D1CCC6" }}>No SEO title</span>
          ),
      },
      {
        key: "socialImage",
        label: "Social Image",
        render: (row) => (
          <Badge variant={row.socialImage ? "green" : "stone"}>
            {row.socialImage ? "Set" : "Missing"}
          </Badge>
        ),
      },
      {
        key: "actions",
        label: "",
        headerClassName: "w-12",
        cellClassName: "text-right",
        render: (row) => (
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-red-50 transition-colors"
            style={{ color: "#AAA39E" }}
            title="Delete category"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete({ id: row.id, name: row.name });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
          <Link href="/catalog/categories" style={{ color: "#847D77" }}>
            Catalog
          </Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            Categories
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
              Product Categories
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Top-level catalog taxonomy — the root of every product on the
              storefront.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Category
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
          searchPlaceholder="Search categories by name or meta title…"
          emptyMessage={
            search
              ? `No categories match "${search}"`
              : "No categories found."
          }
        />

        {/* Edit / create drawer */}
        {drawer && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={closeDrawer} />
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
                    ? "New Category"
                    : `Edit Category #${drawer.id}`}
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
                <FormField label="Category Name" required>
                  <TextInput
                    value={drawer.form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="e.g. Sarees"
                    autoFocus
                  />
                </FormField>

                <FormField
                  label="Icon URL"
                  required
                  hint="Direct URL to the category icon (square image), or upload one below."
                >
                  <TextInput
                    value={drawer.form.icon}
                    onChange={(e) => updateForm({ icon: e.target.value })}
                    placeholder="https://cdn.anuprerna.com/…"
                  />
                  <div className="mt-1.5">
                    <InlineImageUploadButton label="Upload icon" onUploaded={(url) => updateForm({ icon: url })} />
                  </div>
                  {drawer.form.icon && (
                    <Image
                      src={drawer.form.icon}
                      alt="icon preview"
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-lg object-cover mt-1 border"
                      style={{ borderColor: "#E8E4DE" }}
                      unoptimized
                    />
                  )}
                </FormField>

                <FormField
                  label="Social Image URL"
                  required
                  hint="OG image for sharing. Landscape 1200×630, or upload one below."
                >
                  <TextInput
                    value={drawer.form.socialImage}
                    onChange={(e) => updateForm({ socialImage: e.target.value })}
                    placeholder="https://cdn.anuprerna.com/…"
                  />
                  <div className="mt-1.5">
                    <InlineImageUploadButton label="Upload social image" onUploaded={(url) => updateForm({ socialImage: url })} />
                  </div>
                </FormField>

                <FormField label="Meta Title">
                  <TextInput
                    value={drawer.form.metaTitle}
                    onChange={(e) => updateForm({ metaTitle: e.target.value })}
                    placeholder="e.g. Buy Handloom Sarees Online"
                  />
                </FormField>

                <FormField label="Meta Description">
                  <Textarea
                    value={drawer.form.metaDescription}
                    onChange={(e) =>
                      updateForm({ metaDescription: e.target.value })
                    }
                    placeholder="160-character SEO description…"
                    rows={3}
                  />
                </FormField>
              </div>

              <div
                className="flex items-center justify-between gap-3 border-t px-5 py-3"
                style={{ borderColor: "#E8E4DE" }}
              >
                {drawer.mode === "edit" && drawer.id != null ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete({ id: drawer.id as number, name: drawer.form.name })}
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
                    disabled={saving || !drawer.form.name.trim()}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete category?"
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
    </WeaveShell>
  );
}
