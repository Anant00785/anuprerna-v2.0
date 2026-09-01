"use client";

/**
 * StoryCategoriesClient — list + create/edit drawer for Story Categories.
 *
 * Fields: name (required), storyContentType (Select: CRAFTS | ARTISTS | COLLABORATIONS | CLUSTERS).
 *
 * Save -> POST /api/crud add/story-content-category (create, no url param) or
 * PATCH update/story-content-category (edit, id in BODY — story categories are
 * flat, not nested under a type entity, unlike blog categories). Writes ONLY
 * to the sandbox pg copy (never live Loom). No delete endpoint exists for
 * story categories in the backend controller, so no delete UI is offered.
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
  Select,
  Button,
  Badge,
} from "@/components/ui";
import type { StoryCategory } from "@/types/content";

// ── Constants ──────────────────────────────────────────────────────────────

const STORY_TYPE_OPTIONS = [
  { value: "CRAFTS", label: "Crafts" },
  { value: "ARTISTS", label: "Artists" },
  { value: "COLLABORATIONS", label: "Collaborations" },
  { value: "CLUSTERS", label: "Clusters" },
];

const TYPE_BADGE_MAP: Record<string, "stone" | "amber" | "blue" | "purple" | "green"> = {
  CRAFTS: "amber",
  ARTISTS: "blue",
  COLLABORATIONS: "purple",
  CLUSTERS: "green",
};

// ── Form shape ─────────────────────────────────────────────────────────────

interface CategoryForm {
  name: string;
  storyContentType: string;
}

interface DrawerState {
  mode: "create" | "edit";
  id?: number;
  form: CategoryForm;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  storyContentType: "",
};

const PAGE_SIZE = 50;

// ── Component ──────────────────────────────────────────────────────────────

interface StoryCategoriesClientProps {
  categories: StoryCategory[];
}

export function StoryCategoriesClient({
  categories,
}: StoryCategoriesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = useCallback(() => {
    setDrawer({ mode: "create", form: { ...EMPTY_FORM } });
    setSaveError(null);
  }, []);

  const openEdit = useCallback((item: StoryCategory) => {
    setDrawer({
      mode: "edit",
      id: item.id,
      form: {
        name: item.name ?? "",
        storyContentType: item.storyContentType ?? "",
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
      storyContentType: drawer.form.storyContentType,
    };
  };

  // Real sandbox save. create -> POST add/story-content-category (no url
  // param); edit -> PATCH update/story-content-category with id IN BODY (no
  // url param — story categories are flat, unlike nested blog categories).
  const doSave = useCallback(async () => {
    if (!drawer || !drawer.form.name.trim() || !drawer.form.storyContentType) return;
    const isEdit = drawer.mode === "edit";
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: isEdit ? "update/story-content-category" : "add/story-content-category",
          method: isEdit ? "PATCH" : "POST",
          body: buildBody(),
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

  const columns = useMemo<DataListColumn<StoryCategory>[]>(
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
        key: "type",
        label: "Type",
        render: (row) => (
          <Badge
            variant={TYPE_BADGE_MAP[row.storyContentType] ?? "stone"}
          >
            {row.storyContentType || "—"}
          </Badge>
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
          <Link href="/content/stories" style={{ color: "#847D77" }}>
            Stories
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
              Story Categories
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Top-level taxonomy for story articles on the storefront.
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
          searchPlaceholder="Search categories by name…"
          emptyMessage={
            search
              ? `No categories match "${search}"`
              : "No story categories found."
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
                    ? "New Story Category"
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
                    placeholder="e.g. Weaving Traditions"
                    autoFocus
                  />
                </FormField>
                <FormField label="Story Content Type" required>
                  <Select
                    options={STORY_TYPE_OPTIONS}
                    placeholder="Select type"
                    value={drawer.form.storyContentType}
                    onChange={(e) =>
                      updateForm({ storyContentType: e.target.value })
                    }
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
                  disabled={
                    saving ||
                    !drawer.form.name.trim() ||
                    !drawer.form.storyContentType
                  }
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
